# DevLog 아키텍처

## 1. 문서 목적

이 문서는 DevLog의 기술 선택, 코드 경계, 데이터 흐름, 인증·인가 및 서버 인터페이스 원칙을 정의한다. 구현 세부사항이 바뀌더라도 계층 간 책임과 의존 방향은 유지한다.

## 2. 아키텍처 개요

DevLog는 Next.js App Router 기반의 모듈형 모놀리스로 개발한다. 별도 API 서버를 두지 않고 Next.js가 UI, 인증, 서버 로직과 외부 연동의 BFF 역할을 담당한다.

```text
Browser
  ├─ Server-rendered UI
  └─ Interactive Client Components
             │
Next.js App Router
  ├─ Pages and Layouts
  ├─ Server Actions
  ├─ Route Handlers
  ├─ Auth.js
  └─ Domain services
             │
Data access layer
  ├─ Prisma ORM ─ PostgreSQL
  └─ GitHub client ─ GitHub API
```

핵심 원칙은 다음과 같다.

- Server Component를 기본값으로 사용한다.
- 데이터 조회는 서버에서 원본 데이터 소스에 직접 접근한다.
- 사용자 입력에 의한 내부 데이터 변경은 Server Action을 우선한다.
- 외부 서비스가 호출해야 하는 엔드포인트에만 Route Handler를 사용한다.
- UI, 검증, 비즈니스 규칙, DB 접근, 외부 API 연동을 분리한다.
- 기능 단위로 코드를 모으되 공통 기반만 `components`와 `lib`에 둔다.

## 3. 전체 기술 스택

| 영역 | 기술 | 사용 목적 |
| --- | --- | --- |
| Framework | Next.js App Router | 서버 렌더링, 라우팅, Server Action, Route Handler |
| Language | TypeScript strict mode | 정적 타입 안정성 |
| UI | React, Tailwind CSS | 컴포넌트 UI와 반응형 스타일 |
| Validation | Zod | Form, URL, 환경 변수, 외부 API 응답 검증 |
| Database | PostgreSQL | 사용자 및 활동 데이터 저장 |
| ORM | Prisma ORM | 스키마, 마이그레이션, 타입 안전 쿼리 |
| Authentication | Auth.js | 세션, GitHub OAuth, 인증 엔드포인트 |
| Chart | Recharts | Analytics 시각화 |
| Icons | Lucide React | 일관된 아이콘 |
| Unit/Integration test | Vitest 후보 | 비즈니스 로직과 데이터 검증 |
| E2E test | Playwright 후보 | 핵심 사용자 흐름 검증 |
| Deployment | Vercel | Preview 및 Production 배포 |
| Database hosting | 미정 | 연결 풀링과 백업을 지원하는 PostgreSQL 선택 |

정확한 패키지 버전과 테스트 도구 도입은 해당 구현 Day에 `package.json`, Node.js 지원 범위, 공식 문서 및 패키지 호환성을 확인한 뒤 결정한다.

## 4. 권장 파일 구조

```text
src/
├─ app/
│  ├─ (auth)/
│  │  ├─ login/
│  │  └─ signup/
│  ├─ (dashboard)/
│  │  ├─ dashboard/
│  │  ├─ projects/
│  │  │  └─ [projectId]/
│  │  ├─ tasks/
│  │  ├─ learning/
│  │  ├─ analytics/
│  │  └─ profile/
│  ├─ api/
│  │  ├─ auth/[...nextauth]/
│  │  └─ github/
│  ├─ error.tsx
│  ├─ layout.tsx
│  ├─ loading.tsx
│  └─ page.tsx
├─ components/
│  ├─ layout/
│  └─ ui/
├─ features/
│  ├─ auth/
│  ├─ dashboard/
│  ├─ projects/
│  ├─ tasks/
│  ├─ learning-logs/
│  ├─ analytics/
│  ├─ github/
│  └─ profile/
│     ├─ actions/
│     ├─ components/
│     ├─ queries/
│     ├─ schemas/
│     └─ services/
├─ lib/
│  ├─ auth/
│  ├─ db/
│  ├─ env/
│  ├─ github/
│  └─ utils/
├─ types/
└─ test/
prisma/
├─ migrations/
├─ schema.prisma
└─ seed.ts
docs/
```

### 4.1 디렉터리 책임

- `app`: 라우팅, 메타데이터, 페이지 조립, 로딩 및 오류 경계
- `components/ui`: 특정 도메인에 의존하지 않는 표현 컴포넌트
- `components/layout`: Sidebar, Topbar 등 앱 셸
- `features`: 기능별 UI, 입력 스키마, Action, 조회 및 비즈니스 로직
- `lib/db`: Prisma Client와 공통 DB 기반 코드
- `lib/auth`: Auth.js 설정과 서버 인증 유틸리티
- `lib/env`: 환경 변수 검증
- `lib/github`: GitHub API 클라이언트와 응답 변환
- `types`: 여러 기능이 공유하는 순수 애플리케이션 타입만 배치
- `prisma`: DB 스키마, 마이그레이션, seed

## 5. Server Component와 Client Component 기준

### 5.1 Server Component를 사용하는 경우

- 페이지 최초 데이터 조회
- Dashboard와 Analytics 집계 조회
- 세션과 권한에 따른 서버 렌더링
- Prisma 또는 GitHub API 접근
- 비밀 환경 변수를 사용하는 코드
- 읽기 전용 목록, 상세, 요약 UI

### 5.2 Client Component를 사용하는 경우

- `useState`, `useEffect`, 이벤트 핸들러가 필요한 UI
- 모달, 드롭다운, 모바일 메뉴
- 즉시 반응해야 하는 필터 컨트롤
- Recharts 차트
- 낙관적 업데이트가 필요한 작은 상호작용
- 브라우저 API를 사용하는 코드

### 5.3 경계 원칙

- 페이지 전체에 `"use client"`를 선언하지 않는다.
- 가능한 한 Server Component에서 데이터를 준비해 직렬화 가능한 props로 전달한다.
- Client Component에 Prisma 모델 전체나 Secret을 전달하지 않는다.
- 날짜와 `Decimal`, `BigInt` 등 직렬화 주의 타입은 명시적으로 변환한다.
- Client Component는 데이터 접근 모듈을 import하지 않는다.

## 6. 계층 및 의존 방향

```text
Page / UI
    ↓
Action or Query
    ↓
Domain service
    ↓
Data access / External client
    ↓
PostgreSQL / GitHub API
```

- 상위 계층은 하위 계층을 호출할 수 있다.
- 데이터 접근 계층은 UI를 알지 못한다.
- 서비스 계층은 React 컴포넌트나 `FormData`에 의존하지 않는다.
- Server Action에서 `FormData`를 검증 가능한 입력 객체로 변환한 뒤 서비스로 전달한다.
- 단순 조회는 불필요한 서비스 래퍼를 만들지 않고 기능별 query에서 수행할 수 있다.

## 7. 데이터 흐름

### 7.1 조회

```text
Request
 → Server Component
 → auth()로 사용자 확인
 → feature query
 → Prisma 또는 GitHub client
 → 화면용 DTO 변환
 → Server Component 렌더링
 → 필요한 부분만 Client Component에 전달
```

Server Component는 내부 Route Handler를 HTTP로 다시 호출하지 않는다. 서버에서 직접 query 또는 service를 사용한다.

### 7.2 변경

```text
Form / Client event
 → Server Action
 → 세션 확인
 → Zod 입력 검증
 → 리소스 소유권 확인
 → domain service
 → Prisma transaction
 → revalidatePath 또는 redirect
 → 결과 UI
```

Server Action의 반환값은 성공 여부와 사용자에게 보여 줄 안전한 오류만 포함한다. DB 오류나 내부 스택을 그대로 노출하지 않는다.

### 7.3 외부 API

```text
Server Component or service
 → 서버에 저장된 GitHub 연결 정보 확인
 → GitHub API 호출
 → 상태 코드 및 응답 스키마 검증
 → 내부 DTO로 변환
 → 제한된 시간 동안 캐시
 → UI 렌더링
```

GitHub API 장애가 프로젝트 자체 데이터 조회를 막지 않도록 외부 활동 영역은 독립적인 오류 상태를 가진다.

## 8. 인증 구조

### 8.1 인증 방식

- Auth.js를 사용한다.
- GitHub Provider로 OAuth 로그인을 지원한다.
- 이메일·비밀번호 로그인은 Credentials Provider와 자체 회원가입 Action으로 구성한다.
- 비밀번호는 검증된 단방향 비밀번호 해시 알고리즘으로 저장한다.
- 사용자의 GitHub `Account` 연결 정보는 Auth.js Adapter 모델로 관리한다.
- MVP는 JWT 세션을 사용한다. Credentials Provider가 JWT 세션을 요구하며, Prisma Adapter는 GitHub 계정 연결과 사용자 저장에 사용한다.

### 8.2 인증과 인가 분리

- 인증은 현재 사용자가 누구인지 확인한다.
- 인가는 사용자가 특정 리소스를 읽거나 변경할 수 있는지 확인한다.
- 로그인만 확인하고 리소스 소유권 확인을 생략하지 않는다.
- Project는 `userId`로 소유권을 검증한다.
- Task는 상위 Project의 `userId`를 통해 소유권을 검증한다.
- LearningLog와 GitHubRepository는 `userId`로 소유권을 검증한다.

### 8.3 보호 경계

- Middleware/Proxy는 빠른 화면 리다이렉트 용도로만 사용한다.
- 실제 보안 검사는 Page, Server Action, query 또는 service에서 다시 수행한다.
- 사용자가 보낸 `userId`는 신뢰하지 않고 세션의 사용자 ID를 사용한다.
- OAuth access token은 서버에서만 접근하고 클라이언트 props나 로그에 포함하지 않는다.

## 9. API와 Server Action 전략

### 9.1 Server Action을 사용한다

- Project, Task, LearningLog CRUD
- 프로필 수정
- 프로젝트와 Repository 연결·해제
- 회원가입
- 서버 렌더링 화면과 밀접하게 연결된 변경 작업

### 9.2 Route Handler를 사용한다

- Auth.js의 인증 엔드포인트
- GitHub OAuth callback 중 Auth.js가 담당하지 않는 별도 연동이 필요한 경우
- 향후 GitHub Webhook
- 향후 외부 클라이언트용 공개 API
- 파일 업로드처럼 HTTP 요청·응답 제어가 필요한 경우

### 9.3 사용하지 않는 방식

- Server Component에서 자체 Route Handler를 `fetch`하지 않는다.
- Server Action을 일반 조회 API로 사용하지 않는다.
- 하나의 거대한 Action 파일에 모든 도메인 변경을 모으지 않는다.
- 브라우저에서 Prisma나 DB에 직접 접근하지 않는다.

## 10. 검증과 오류 처리

- Form, URL parameter, search parameter, 환경 변수, 외부 API 응답을 검증한다.
- 기능별 Zod 스키마를 UI와 서버에서 공유하되 최종 검증은 서버에서 수행한다.
- 필드 오류와 폼 전체 오류를 구분한다.
- 예상 가능한 도메인 오류는 안전한 사용자 메시지로 변환한다.
- 예상하지 못한 오류는 서버에서 기록하고 사용자에게 일반화된 메시지를 표시한다.
- `notFound`, `error.tsx`, 빈 상태를 목적에 맞게 구분한다.

## 11. 캐시와 성능

- 사용자별 데이터는 잘못 공유되지 않도록 캐시 범위를 명확하게 관리한다.
- 변경 후 필요한 경로만 재검증한다.
- Dashboard의 독립적인 데이터 조회는 병렬화한다.
- Dashboard는 사용자 시간대를 먼저 조회해 날짜 경계를 정한 뒤 프로젝트 수, 완료 Task, 주간 학습, 연속 학습용 날짜, 진행 프로젝트, 마감 Task, 최근 학습 기록과 최근 활동 원본을 `Promise.all`로 병렬 조회한다. 최근 활동은 사용자 소유 프로젝트 변경, 완료 Task와 학습 기록을 합쳐 시간순으로 제한한다.
- 목록은 데이터 증가에 대비해 페이지네이션 또는 제한된 조회를 사용한다.
- GitHub 응답은 짧은 TTL을 적용할 수 있지만 사용자 토큰과 권한 경계를 지킨다.
- Analytics 집계 테이블은 실제 성능 문제가 확인되기 전까지 만들지 않는다.
- Analytics는 사용자 시간대로 이번 주와 이번 달의 날짜 경계를 먼저 계산하고, 두 기간의 합집합에 해당하는 학습 기록과 사용자 소유 프로젝트·Task를 병렬 조회한다. 주간·월간 일별 값, Task 완료율과 프로젝트 진행률은 애플리케이션 계층에서 원본 데이터로 계산한다.
- Analytics 페이지는 Server Component에서 세션, Zod로 검증한 URL 기간과 집계 DTO를 준비한다. Recharts가 필요한 학습 막대와 기술 도넛만 Client Component로 분리하며, `ResponsiveContainer`와 차트 밖 텍스트 표·범례를 함께 사용한다.

## 12. 환경 변수

예상되는 환경 변수 이름은 다음과 같다. 실제 값은 코드와 Git에 기록하지 않는다.

- `DATABASE_URL`
- `DIRECT_URL` 또는 호스팅 업체가 요구하는 migration용 URL
- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

환경 변수는 서버 시작 또는 빌드 시 Zod로 검증한다. 클라이언트 공개가 필요한 값만 `NEXT_PUBLIC_` 접두사를 사용한다.

### 12.1 Prisma 데이터 계층

- Prisma ORM 7의 `prisma-client` generator와 명시적 출력 경로를 사용한다.
- PostgreSQL 연결은 `pg` 기반 `@prisma/adapter-pg`를 사용한다.
- CLI 설정과 migration 경로는 루트의 `prisma.config.ts`에서 관리한다.
- Next.js 외부에서 실행되는 Prisma CLI도 동일한 환경변수 우선순위를 사용하도록 `@next/env`로 루트 `.env*` 파일을 로드한다.
- `src/lib/db/prisma.ts`만 Prisma Client를 생성하며 개발 Hot Reload 중에는 `globalThis`에 인스턴스를 보존한다.
- DB 모듈과 환경변수 모듈은 `server-only` 경계로 Client Component import를 차단한다.

## 13. 배포 구조

- Vercel Preview와 Production 환경을 분리한다.
- DB migration은 애플리케이션 요청 중 자동 실행하지 않는다.
- Production 배포 전 migration 적용 절차를 별도로 둔다.
- Preview DB 전략은 DB 호스팅 업체 결정 후 문서화한다.
- OAuth callback URL을 Local, Preview, Production 환경별로 관리한다.
