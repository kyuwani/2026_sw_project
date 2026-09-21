# DevLog 데이터베이스 설계

## 1. 문서 목적

이 문서는 DevLog MVP의 PostgreSQL 데이터 모델, 관계, 제약 조건과 주요 계산 규칙을 정의한다. 실제 Prisma Schema 변경 시 이 문서도 함께 갱신한다.

## 2. 설계 원칙

- PostgreSQL과 Prisma ORM을 사용한다.
- 기본 키는 UUID 문자열을 사용한다.
- 모든 시각은 DB에 UTC로 저장하고 사용자에게 보여 줄 때 시간대를 적용한다.
- 학습일처럼 달력 날짜 자체가 의미인 값은 PostgreSQL `date` 사용을 우선한다.
- 외부 시스템 ID는 JavaScript 정수 범위를 넘을 수 있으므로 문자열로 저장한다.
- 모든 사용자 소유 데이터는 서버에서 소유권을 검증한다.
- 다대다 관계는 명시적인 연결 모델로 관리한다.
- 집계로 계산 가능한 값은 원본과 중복 저장하지 않는다.
- 삭제와 보존 정책을 관계별로 명시한다.

## 3. 관계 개요

```text
User
 ├─ Account
 ├─ Project ─ Task
 │    ├─ ProjectTechnology ─ Technology
 │    └─ GitHubRepository
 ├─ LearningLog ─ LearningLogTechnology ─ Technology
 ├─ UserTechnology ─ Technology
 └─ GitHubRepository
```

Auth.js 버전과 세션 전략에 따라 `Session`, `VerificationToken`, `Authenticator` 모델이 추가될 수 있다.

## 4. Enum 설계

### 4.1 ProjectStatus

- `PLANNED`: 계획
- `IN_PROGRESS`: 진행 중
- `PAUSED`: 일시 중지
- `COMPLETED`: 완료
- `ARCHIVED`: 보관

### 4.2 TaskStatus

- `TODO`: 할 일
- `IN_PROGRESS`: 진행 중
- `DONE`: 완료

### 4.3 TaskPriority

- `LOW`: 낮음
- `MEDIUM`: 보통
- `HIGH`: 높음
- `URGENT`: 긴급

### 4.4 LearningCategory

- `DEVELOPMENT`: 개발
- `ALGORITHM`: 알고리즘
- `COMPUTER_SCIENCE`: 컴퓨터 과학
- `PROJECT`: 프로젝트
- `CAREER`: 취업·커리어
- `ETC`: 기타

### 4.5 TechnologyCategory

- `LANGUAGE`
- `FRONTEND`
- `BACKEND`
- `DATABASE`
- `DEVOPS`
- `TOOL`
- `ETC`

## 5. 모델 상세

### 5.1 User

사용자 인증과 프로필의 기준 모델이다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK |
| `email` | String | unique, 정규화된 이메일 |
| `emailVerified` | DateTime? | 이메일 인증 시각 |
| `passwordHash` | String? | OAuth 전용 사용자는 null 가능 |
| `name` | String? | 표시 이름 |
| `image` | String? | 프로필 이미지 URL |
| `bio` | String? | 자기소개, 길이 제한 적용 |
| `githubUrl` | String? | 공개 GitHub 프로필 URL |
| `timezone` | String | IANA 시간대, 기본값 `Asia/Seoul` 후보 |
| `createdAt` | DateTime | 생성 시각 |
| `updatedAt` | DateTime | 수정 시각 |

규칙:

- 이메일 저장 전 앞뒤 공백 제거와 소문자 정규화를 수행한다.
- 비밀번호 원문은 어떤 경우에도 저장하지 않는다.
- OAuth 응답으로 전달된 프로필 값도 길이와 URL을 검증한다.

### 5.2 Account

Auth.js Provider 계정 연결 모델이다. GitHub OAuth 토큰과 Provider 식별자를 저장한다.

주요 필드:

- `id`
- `userId`
- `type`
- `provider`
- `providerAccountId`
- `access_token`
- `refresh_token`
- `expires_at`
- `token_type`
- `scope`
- `id_token`
- `session_state`

제약:

- `(provider, providerAccountId)` unique
- `userId` index
- User 삭제 시 cascade
- 토큰 값은 로그, Client Component, API 응답에 포함하지 않는다.

### 5.3 Session

DB 세션 전략을 선택할 때 사용하는 Auth.js 모델이다.

주요 필드:

- `sessionToken`: unique
- `userId`
- `expires`

MVP가 JWT 세션을 사용하면 생성하지 않을 수 있다. 구현 당시 Auth.js 버전과 Credentials Provider 요구사항에 따라 최종 결정한다.

### 5.4 VerificationToken

이메일 검증 또는 비밀번호 없는 로그인 기능을 도입할 때 사용한다. MVP의 이메일 인증 범위가 확정되기 전까지 선택 모델로 둔다.

### 5.5 Project

사용자가 관리하는 개발 프로젝트다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK |
| `userId` | UUID | FK → User, index |
| `name` | String | 필수, 길이 제한 |
| `description` | String? | 상세 설명 |
| `status` | ProjectStatus | 기본값 `PLANNED` |
| `startDate` | Date? | 시작일 |
| `endDate` | Date? | 종료일 |
| `githubRepositoryId` | UUID? | 연결된 저장소, 선택 |
| `createdAt` | DateTime | 생성 시각 |
| `updatedAt` | DateTime | 수정 시각 |

규칙:

- `endDate`는 `startDate`보다 빠를 수 없다.
- MVP에서는 프로젝트 하나에 GitHub Repository 하나만 연결한다.
- 사용자별 프로젝트 목록 조회를 위해 `(userId, status, updatedAt)` 인덱스를 둔다.
- 사용자별 동일한 프로젝트 이름은 허용한다.

### 5.6 Task

프로젝트를 구성하는 실행 단위다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK |
| `projectId` | UUID | FK → Project, index |
| `title` | String | 필수 |
| `description` | String? | 상세 내용 |
| `status` | TaskStatus | 기본값 `TODO` |
| `priority` | TaskPriority | 기본값 `MEDIUM` |
| `dueDate` | Date? | 마감일 |
| `completedAt` | DateTime? | 완료 시각 |
| `position` | Int | 동일 프로젝트 내 정렬 순서 |
| `createdAt` | DateTime | 생성 시각 |
| `updatedAt` | DateTime | 수정 시각 |

규칙:

- 상태가 `DONE`으로 바뀔 때 `completedAt`을 기록한다.
- `DONE`에서 다른 상태로 돌아가면 `completedAt`을 null로 변경한다.
- Task의 소유권은 상위 Project의 `userId`로 판별한다.
- Project 삭제 시 Task를 cascade 삭제한다.
- `(projectId, status, position)` 및 `(projectId, dueDate)` 인덱스를 고려한다.

### 5.7 LearningLog

사용자의 날짜별 학습 기록이다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK |
| `userId` | UUID | FK → User, index |
| `title` | String | 학습 제목 |
| `content` | String | 학습 내용 |
| `studyDate` | Date | 사용자의 시간대 기준 학습일 |
| `durationMinutes` | Int | 1 이상, 상한 검증 |
| `category` | LearningCategory | 학습 분류 |
| `createdAt` | DateTime | 생성 시각 |
| `updatedAt` | DateTime | 수정 시각 |

규칙:

- 한 날짜에 여러 기록을 허용한다.
- `durationMinutes`는 정수 분으로 저장한다.
- 기간 조회를 위해 `(userId, studyDate)` 인덱스를 둔다.
- 검색은 MVP에서 제목과 내용의 대소문자 무시 부분 검색으로 시작한다.

### 5.8 Technology

프로젝트, 학습 기록, 사용자 프로필에서 공유하는 정규화된 기술 사전이다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK |
| `name` | String | 표시 이름, unique 후보 |
| `slug` | String | 정규화된 식별자, unique |
| `category` | TechnologyCategory | 기술 분류 |
| `iconKey` | String? | 내부 아이콘 키 |
| `createdAt` | DateTime | 생성 시각 |

규칙:

- 사용자가 임의의 중복 기술을 계속 만들지 않도록 MVP에서는 seed된 목록을 선택한다.
- 새 기술 직접 입력은 추후 기능으로 둔다.
- 외부 이미지 URL보다 내부 아이콘 키 또는 텍스트 배지를 우선한다.

### 5.9 ProjectTechnology

Project와 Technology의 명시적 다대다 연결 모델이다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `projectId` | UUID | FK → Project |
| `technologyId` | UUID | FK → Technology |
| `createdAt` | DateTime | 연결 시각 |

제약:

- `(projectId, technologyId)` composite PK 또는 unique
- 양쪽 조회에 필요한 인덱스 구성
- Project 삭제 시 cascade
- Technology 삭제는 연결 데이터가 있으면 제한하거나 관리 절차를 거친다.

### 5.10 LearningLogTechnology

LearningLog와 Technology의 명시적 다대다 연결 모델이다.

주요 필드:

- `learningLogId`
- `technologyId`
- `createdAt`

제약:

- `(learningLogId, technologyId)` composite PK 또는 unique
- LearningLog 삭제 시 cascade

### 5.11 UserTechnology

프로필에 표시할 사용자의 주 사용 기술이다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `userId` | UUID | FK → User |
| `technologyId` | UUID | FK → Technology |
| `position` | Int | 프로필 표시 순서 |
| `createdAt` | DateTime | 연결 시각 |

제약:

- `(userId, technologyId)` composite PK 또는 unique
- 사용자별 선택 개수에 MVP 상한을 둔다.

### 5.12 GitHubRepository

사용자가 GitHub에서 선택하거나 프로젝트에 연결한 Repository의 최소 캐시 정보다.

| 필드 | 타입 | 제약/설명 |
| --- | --- | --- |
| `id` | UUID | PK |
| `userId` | UUID | FK → User, index |
| `githubId` | String | GitHub Repository ID |
| `nodeId` | String? | GitHub GraphQL Node ID |
| `owner` | String | Repository owner |
| `name` | String | Repository name |
| `fullName` | String | `owner/name` |
| `htmlUrl` | String | Repository URL |
| `description` | String? | GitHub 설명 |
| `defaultBranch` | String | 기본 브랜치 |
| `isPrivate` | Boolean | 공개 여부 |
| `language` | String? | 대표 언어 |
| `pushedAt` | DateTime? | GitHub 마지막 push 시각 |
| `syncedAt` | DateTime | 마지막 조회·동기화 시각 |
| `createdAt` | DateTime | 생성 시각 |
| `updatedAt` | DateTime | 수정 시각 |

제약:

- `(userId, githubId)` unique
- 프로젝트 연결 전에도 사용자가 선택한 저장소를 캐시할 수 있다.
- 최근 Commit 본문은 MVP에서 영구 저장하지 않고 GitHub API에서 조회한다.
- Repository 연결 권한은 `userId`로 검증한다.

## 6. 주요 계산 규칙

### 6.1 프로젝트 진행률

```text
Task가 0개인 경우: 0
그 외: floor(DONE Task 수 / 전체 Task 수 × 100)
```

진행률은 조회 시 계산하며 Project에 별도 저장하지 않는다.

### 6.2 Task 완료율

- 선택 기간 또는 전체 기간의 생성 Task 중 `DONE` 상태의 비율이다.
- 기간 기반 통계는 요구사항에 따라 생성일 기준인지 완료일 기준인지 UI에 명시한다.
- MVP Dashboard의 전체 완료율은 현재 존재하는 전체 Task 상태를 기준으로 한다.

### 6.3 학습 시간

- 일별 학습 시간은 동일한 `studyDate`의 `durationMinutes` 합계다.
- 주간 범위는 사용자 시간대의 월요일부터 일요일까지다.
- 월간 범위는 사용자 시간대의 해당 달 1일부터 말일까지다.

### 6.4 연속 학습 일수

1. 사용자 시간대 기준으로 학습 기록이 있는 날짜를 중복 제거한다.
2. 오늘 기록이 있으면 오늘부터 역순으로 계산한다.
3. 오늘 기록이 없고 어제 기록이 있으면 어제부터 역순으로 계산한다.
4. 날짜가 하루 이상 끊기는 시점에서 종료한다.

## 7. 삭제 정책

| 대상 | 정책 |
| --- | --- |
| User | 계정 삭제 기능 도입 시 관련 개인 데이터 cascade 여부와 유예 기간 별도 결정 |
| Project | Task, ProjectTechnology 연결 cascade 삭제 |
| Task | 직접 삭제, 통계에서도 제외 |
| LearningLog | LearningLogTechnology 연결 cascade 삭제 |
| Technology | 사용 중이면 삭제 제한, 관리 가능한 비활성화 방식 추후 검토 |
| GitHubRepository | Project 연결 해제 후 삭제하거나 연결 시 제한 |

MVP는 soft delete를 도입하지 않는다. 복구와 감사 이력이 제품 요구사항으로 확정되면 별도 결정으로 추가한다.

## 8. 트랜잭션이 필요한 작업

- 프로젝트 생성과 기술 스택 연결
- 프로젝트 수정과 기술 스택 전체 교체
- 학습 기록 생성·수정과 기술 스택 연결
- Task 완료 상태와 `completedAt` 변경
- GitHub Repository 캐시 upsert와 Project 연결
- 계정 삭제가 도입될 경우 사용자 데이터 정리

## 9. Migration 및 Seed 규칙

- schema 변경은 migration과 함께 커밋한다.
- 이미 공유된 migration 파일을 수정하지 않고 새 migration을 추가한다.
- Production에서 `migrate dev`를 실행하지 않는다.
- seed는 여러 번 실행해도 중복 데이터가 쌓이지 않게 작성한다.
- Technology 기본 목록과 개발용 최소 샘플 데이터만 seed한다.
- 실제 사용자 이메일, 토큰, Secret을 seed에 넣지 않는다.

## 10. 미결정 사항

- PostgreSQL 호스팅 업체와 연결 풀링 방식
- Auth.js 최종 세션 전략
- 이메일 인증 및 비밀번호 재설정 모델의 MVP 포함 여부
- 프로필 이미지 저장 위치
- 계정 삭제 유예 및 복구 정책
