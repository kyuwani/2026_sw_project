# DevLog 데이터베이스 설계

## 1. 문서 목적

이 문서는 DevLog MVP에 실제 적용한 PostgreSQL/Prisma 데이터 모델, 관계, 제약 조건과 삭제 정책을 정의한다. `prisma/schema.prisma`를 변경할 때 이 문서도 함께 갱신한다.

## 2. 현재 구성

- ORM: Prisma ORM `7.10.0`
- Database: PostgreSQL
- Runtime driver: `pg` + `@prisma/adapter-pg`
- Prisma 설정: `prisma.config.ts`
- Schema: `prisma/schema.prisma`
- Generated Client: `src/generated/prisma` (Git 추적 제외, `prisma generate`로 생성)
- 공통 Client: `src/lib/db/prisma.ts`
- 연결 환경변수: `DATABASE_URL`

개발 환경에서는 Docker `postgres:17-alpine` 컨테이너 `devlog-postgres`를 사용한다. 포트는 `127.0.0.1:5432`에만 바인딩하고, 개발 전용 trust 인증을 사용하므로 이 설정을 Production에 재사용하지 않는다. 연결 문자열과 개발용 `AUTH_SECRET`은 Git에서 제외되는 `.env.local`에 저장한다.

2026-09-29에 인증 모델을 포함한 초기 migration `20260929071200_init`을 생성·적용했다. 2026-10-12에는 GitHub Repository 캐시와 Profile migration까지 로컬 DB에 적용했다. Prisma Client 생성, Schema validation과 실제 테이블 생성을 확인했다. GitHub OAuth 자격 증명은 로컬 `.env.local`에만 설정했으며, callback과 계정 연결을 검증했다.

DB 통합 테스트는 로컬 PostgreSQL을 기동하고 migration을 적용한 뒤 `npm run test:integration`으로 실행한다. 실행 스크립트는 Git에서 제외된 `.env.local`을 로드하고 `RUN_DB_TESTS=1`을 테스트 프로세스에만 전달한다. 각 테스트는 UUID 기반 고유 데이터를 만들고 종료 시 사용자 및 고립된 기술 데이터를 정리한다. Project와 LearningLog 생성 중 FK 실패를 의도적으로 발생시키는 테스트로 같은 transaction에서 먼저 생성된 Technology도 rollback되는지 확인한다.

## 3. 설계 원칙

- 기본 키는 PostgreSQL UUID를 사용한다.
- 시각은 `DateTime`으로 저장하고 사용자에게 표시할 때 시간대를 적용한다.
- 시작일, 종료일, 마감일, 학습일처럼 달력 날짜가 의미인 값은 PostgreSQL `date`를 사용한다.
- 사용자 소유 데이터는 User 또는 상위 Project를 통해 소유권을 추적한다.
- 집계로 계산할 수 있는 진행률과 완료율은 중복 저장하지 않는다.
- 다대다 관계는 연결 시각과 삭제 정책을 표현할 수 있도록 명시적 연결 모델로 관리한다.
- 인덱스는 사용자별·프로젝트별 목록, 상태 필터, 날짜 범위 조회에 필요한 조합만 둔다.

## 4. 관계 개요

```text
User
 ├─ Project
 │   ├─ Task
 │   ├─ ProjectTechnology ─ Technology
 │   └─ GitHubRepository
 ├─ GitHubRepository
 ├─ LearningLog
 │   └─ LearningLogTechnology ─ Technology
 └─ UserTechnology ─ Technology
```

- User는 여러 Project와 LearningLog를 가진다.
- Task의 소유자는 별도 `userId`를 중복 저장하지 않고 Project의 User 관계로 판별한다.
- Project와 Technology, LearningLog와 Technology는 각각 명시적 다대다 관계다.
- User와 Technology는 표시 순서를 가진 UserTechnology로 주 사용 기술을 관리한다.
- Day 6에서 Auth.js Prisma Adapter용 Account, Session, VerificationToken 모델을 추가했다.

## 5. Enum

DB enum 값은 UI 표시 문구와 분리한다. 예를 들어 `IN_PROGRESS`는 UI에서 `In Progress` 또는 `진행 중`으로 변환한다.

### ProjectStatus

| 값 | 의미 |
| --- | --- |
| `PLANNING` | 계획 |
| `IN_PROGRESS` | 진행 중 |
| `COMPLETED` | 완료 |
| `ARCHIVED` | 보관 |

### TaskStatus

| 값 | 의미 |
| --- | --- |
| `TODO` | 할 일 |
| `IN_PROGRESS` | 진행 중 |
| `DONE` | 완료 |

### TaskPriority

| 값 | 의미 |
| --- | --- |
| `LOW` | 낮음 |
| `MEDIUM` | 보통 |
| `HIGH` | 높음 |

### LearningCategory

| 값 | 의미 |
| --- | --- |
| `LANGUAGE` | 프로그래밍 언어 |
| `FRAMEWORK` | 프레임워크·라이브러리 |
| `ALGORITHM` | 알고리즘·자료구조 |
| `DATABASE` | 데이터베이스 |
| `DEVOPS` | 인프라·DevOps |
| `OTHER` | 기타 |

### GitHubRepositoryVisibility / GitHubRepositoryPermission

GitHub 응답에서 검증한 공개 범위는 `PRIVATE`, `PUBLIC`로, 사용자 권한은 `ADMIN`, `WRITE`, `READ`로 제한한다.

## 6. 모델

### 6.1 User

사용자 인증과 소유권의 기준 모델이다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK, 자동 생성 |
| `name` | String? | 표시 이름, OAuth 응답을 고려해 선택값 |
| `email` | String? | unique, 이메일을 제공하지 않는 OAuth 계정 허용 |
| `emailVerified` | DateTime? | Adapter 호환 이메일 인증 시각 |
| `image` | String? | 프로필 이미지 URL |
| `bio` | Text? | 자기소개, 최대 길이는 애플리케이션에서 검증 |
| `githubUrl` | String? | 검증된 GitHub 프로필 URL |
| `passwordHash` | String? | 이메일 로그인용 bcrypt 해시, OAuth 사용자는 null |
| `timezone` | String | IANA 시간대, 기본값 `Asia/Seoul` |
| `createdAt` | DateTime | 생성 시각, 기본값 `now()` |
| `updatedAt` | DateTime | Prisma `@updatedAt` |

관계: `accounts`, `sessions`, `projects`, `learningLogs`, `githubRepositories`, `primaryTechnologies`.

PostgreSQL unique 제약은 null을 여러 건 허용하므로 OAuth 사용자는 이메일 없이 생성할 수 있고, 이메일 기반 가입은 애플리케이션에서 이메일을 필수로 검증한다. 비밀번호 원문은 저장하지 않으며 bcrypt 해시만 저장한다.

### 6.2 Account, Session, VerificationToken

Auth.js Prisma Adapter가 요구하는 표준 모델이다. Account는 Provider 계정 식별자와 토큰을 저장하며, User 삭제 시 cascade 된다. MVP 세션은 JWT 방식이므로 Session 모델은 현재 런타임 세션 저장에 사용하지 않지만 Adapter 호환성을 위해 유지한다. VerificationToken은 향후 이메일 인증에 사용할 수 있다.

Account의 `(provider, providerAccountId)`와 Session의 `sessionToken`은 unique다. 각 User 관계에는 사용자 기준 인덱스를 둔다.

GitHub Repository 조회 시 Account는 `userId`와 `provider = github`를 함께 조건으로 조회하고 `access_token`만 선택한다. 토큰은 서버 내부 GitHub client 호출에만 사용하며 DTO, 브라우저 응답 또는 로그에 포함하지 않는다.

### 6.3 Project

사용자가 관리하는 개발 프로젝트다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK, 자동 생성 |
| `title` | String | 필수 |
| `description` | Text? | 프로젝트 설명 |
| `status` | ProjectStatus | 기본값 `PLANNING` |
| `startDate` | Date? | 시작일 |
| `endDate` | Date? | 종료일 |
| `repositoryUrl` | String? | 연결할 GitHub Repository URL |
| `repositoryId` | UUID? | FK → GitHubRepository, 연결 해제 시 null |
| `userId` | UUID | FK → User |
| `createdAt` | DateTime | 생성 시각 |
| `updatedAt` | DateTime | 수정 시각 |

관계: `user`, `tasks`, `technologies`, `repository`.

계획 단계에서 날짜나 Repository가 정해지지 않은 프로젝트를 저장할 수 있도록 `startDate`, `endDate`, `repositoryUrl`은 선택값으로 유지한다. `endDate >= startDate`와 Repository URL 형식은 CRUD 구현 시 서버 입력 검증에서 보장한다.

### 6.4 GitHubRepository

사용자가 프로젝트에 연결한 GitHub Repository의 기본 정보를 캐시한다. `externalId`는 GitHub Repository ID를 문자열로 보존하며 `(userId, externalId)`로 사용자별 중복을 막는다. 원격 수정·push 시각과 캐시 시각을 구분하고, access token과 최근 Commit은 저장하지 않는다.

Project는 하나의 Repository를 선택적으로 참조하고 하나의 Repository는 여러 Project에 연결될 수 있다. 연결 시 프로젝트 소유권과 사용자의 GitHub 접근 가능 목록을 검증한 뒤 캐시 upsert와 Project 연결을 transaction으로 처리한다.

### 6.5 Task

Project에 속하는 작업 단위다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK, 자동 생성 |
| `title` | String | 필수 |
| `description` | Text? | 상세 내용 |
| `status` | TaskStatus | 기본값 `TODO` |
| `priority` | TaskPriority | 기본값 `MEDIUM` |
| `dueDate` | Date? | 마감일 |
| `completedAt` | DateTime? | 완료 시각, 미완료 Task는 null |
| `projectId` | UUID | FK → Project |
| `createdAt` | DateTime | 생성 시각 |
| `updatedAt` | DateTime | 수정 시각 |

관계: `project`. Task 소유권은 `project.userId`를 통해 검증한다. `completedAt`은 완료 시점 기반 최근 활동과 기간별 분석을 위해 저장하며, `DONE` 전환 시 기록하고 다른 상태로 되돌릴 때 null로 만드는 규칙은 Task 서비스에서 트랜잭션으로 보장한다.

### 6.6 LearningLog

사용자의 날짜별 학습 기록이다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK, 자동 생성 |
| `title` | String | 학습 제목 |
| `content` | Text | 학습 내용 |
| `studyMinutes` | Int | 학습 시간(분) |
| `studiedAt` | Date | 학습일 |
| `category` | LearningCategory | 학습 분류, 기본값 `OTHER` |
| `userId` | UUID | FK → User |
| `createdAt` | DateTime | 생성 시각 |
| `updatedAt` | DateTime | 수정 시각 |

관계: `user`, `technologies`.

`studyMinutes`는 1분 이상 24시간 이하로 제한하고 미래 학습일은 허용하지 않는다. 날짜 상한은 User의 IANA `timezone`을 기준으로 Learning Log 입력 스키마에서 검증한다.

### 6.7 Technology

Project와 LearningLog가 공유하는 정규화된 기술 이름이다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK, 자동 생성 |
| `name` | String | unique |
| `createdAt` | DateTime | 생성 시각 |

관계: `projects`, `learningLogs`, `primaryUsers`.

MVP 필드만 유지하며 기술 카테고리, 아이콘, 별칭은 실제 요구가 생길 때 확장한다.

### 6.8 ProjectTechnology

Project와 Technology의 명시적 연결 모델이다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `projectId` | UUID | 복합 PK, FK → Project |
| `technologyId` | UUID | 복합 PK, FK → Technology |
| `createdAt` | DateTime | 연결 시각 |

### 6.9 LearningLogTechnology

LearningLog와 Technology의 명시적 연결 모델이다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `learningLogId` | UUID | 복합 PK, FK → LearningLog |
| `technologyId` | UUID | 복합 PK, FK → Technology |
| `createdAt` | DateTime | 연결 시각 |

### 6.10 UserTechnology

User의 주 사용 기술과 표시 순서를 저장하는 명시적 연결 모델이다. `(userId, technologyId)`로 중복 기술을 막고 `(userId, position)`으로 사용자별 표시 순서 중복을 막는다. 프로필 저장 transaction에서 기존 연결을 교체한다.

## 7. Technology 관계 전략

implicit many-to-many 대신 명시적 연결 모델을 사용한다.

- 연결 생성 시각을 보존할 수 있다.
- Project 또는 LearningLog 삭제 시 연결만 cascade 삭제하도록 명확히 표현할 수 있다.
- 사용 중인 Technology 삭제를 `Restrict`로 막을 수 있다.
- 향후 숙련도, 주 기술 여부, 표시 순서 같은 관계 메타데이터를 무리 없이 추가할 수 있다.
- UserTechnology의 `position`은 프로필에서 선택한 주 사용 기술 순서를 보존한다.

복합 PK로 동일 기술의 중복 연결을 막고, Technology 기준 역방향 조회를 위해 `technologyId` 인덱스를 둔다.

## 8. 삭제 정책

| 삭제 대상 | 처리 |
| --- | --- |
| User | 소유한 Project, LearningLog, GitHubRepository와 UserTechnology를 cascade 삭제한다. 하위 Task와 연결 모델도 연쇄 정리된다. |
| Project | Task와 ProjectTechnology를 cascade 삭제한다. GitHubRepository 캐시는 유지한다. |
| GitHubRepository | Project의 `repositoryId`를 null로 만들고 프로젝트 자체 데이터는 유지한다. |
| Task | 해당 Task만 삭제한다. |
| LearningLog | LearningLogTechnology를 cascade 삭제한다. |
| Technology | ProjectTechnology 또는 LearningLogTechnology에서 사용 중이면 `Restrict`한다. 미사용 기술만 삭제할 수 있다. |

MVP에는 soft delete를 도입하지 않는다. User 삭제는 영향 범위가 크므로 실제 계정 삭제 기능에서 재인증, 확인 UI와 트랜잭션 테스트를 추가한다.

## 9. Index와 제약 조건

### Unique / Primary Key

- `User.email`: 값이 있는 사용자의 로그인·계정 연결 중복 방지. null OAuth 계정은 여러 건 허용
- `Account(provider, providerAccountId)`: Provider 계정 중복 연결 방지
- `Session.sessionToken`: Adapter 세션 토큰 중복 방지
- `VerificationToken.token` 및 `(identifier, token)`: 인증 토큰 중복 방지
- `Technology.name`: 기술 사전 중복 방지
- `ProjectTechnology(projectId, technologyId)`: 프로젝트의 기술 중복 연결 방지
- `LearningLogTechnology(learningLogId, technologyId)`: 학습 기록의 기술 중복 연결 방지
- `GitHubRepository(userId, externalId)`: 사용자별 GitHub Repository 캐시 중복 방지
- `UserTechnology(userId, technologyId)`: 사용자별 주 사용 기술 중복 방지
- `UserTechnology(userId, position)`: 사용자별 기술 표시 순서 중복 방지

### Index

| 모델 | Index | 조회 근거 |
| --- | --- | --- |
| Project | `(userId, status)` | 사용자별 프로젝트와 상태 필터 |
| Project | `(userId, updatedAt)` | 사용자별 최근 프로젝트 정렬 |
| Project | `(repositoryId)` | Repository에 연결된 프로젝트 조회와 FK 처리 |
| GitHubRepository | `(userId, remoteUpdatedAt)` | 사용자별 Repository 최신 수정순 조회 |
| Task | `(projectId, status)` | 프로젝트별 Task와 상태 필터 |
| Task | `(projectId, dueDate)` | 프로젝트별 마감일 정렬·조회 |
| LearningLog | `(userId, studiedAt)` | 사용자별 날짜 범위·최신 학습 기록 |
| Account | `(userId)` | 사용자별 연결 계정 조회 및 User FK 처리 |
| Session | `(userId)` | 사용자별 Adapter 세션 조회 및 User FK 처리 |
| ProjectTechnology | `(technologyId)` | 기술별 프로젝트 역방향 조회와 FK 처리 |
| LearningLogTechnology | `(technologyId)` | 기술별 학습 기록 역방향 조회와 FK 처리 |
| UserTechnology | `(technologyId)` | 주 사용 기술의 역방향 조회와 FK 처리 |

`userId`, `projectId`, `status`, `studiedAt`, `dueDate`를 각각 단독으로 모두 인덱싱하지 않는다. 사용자 소유권 범위를 포함한 실제 조회 조합을 우선한다.

Day 17 Analytics의 Task 완료율은 완료 시점이 아닌 현재 `status`를 사용하므로 기존 `Task(projectId, status)` 인덱스와 사용자 소유 Project 조회를 활용한다. 기간별 Task 완료 추이를 구현하기 전까지 `completedAt` 단독 인덱스는 추가하지 않는다.

## 10. Migration과 Seed

- 초기 migration `20260929071200_init`을 `npm run db:migrate -- --name init`으로 생성·적용했다.
- Day 12 migration `20261008050909_add_learning_category_and_user_timezone`에서 `LearningCategory`, `LearningLog.category`, `User.timezone`을 추가했다.
- Day 20 migration `20261012063000_add_github_repository_cache`에서 GitHubRepository 캐시와 Project 연결을 추가했다.
- Day 21 migration `20261012070000_add_user_profile`에서 User 프로필 필드와 UserTechnology를 추가했다.
- 로컬 PostgreSQL에서 Auth.js 및 도메인 테이블 10개와 `_prisma_migrations` 생성을 확인했다.
- Production에서는 `prisma migrate dev`를 실행하지 않는다.
- Day 4에는 seed를 구현하지 않았다.
- 추후 seed는 `prisma/seed.ts`에 두고 Technology를 `upsert`해 반복 실행 시 중복이 생기지 않도록 구성할 수 있다.

## 11. 후속 검토 사항

- PostgreSQL 호스팅 업체와 pooled/direct URL 전략
- Production 환경의 PostgreSQL 연결과 GitHub OAuth callback URL을 설정하고 배포 환경에서 인증을 확인
- User 삭제 전 유예·복구 정책
- 전체 IANA 시간대 자동완성 목록 제공 여부
- 실제 쿼리 측정 후 인덱스 조정
