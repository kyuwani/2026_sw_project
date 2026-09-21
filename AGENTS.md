# DevLog 개발 규칙

## 1. 기본 원칙

- 이 프로젝트의 이름은 `DevLog`다.
- Next.js App Router와 TypeScript strict mode를 기준으로 개발한다.
- 기존 코드, 문서, Git 상태와 설치된 패키지를 먼저 확인한 뒤 작업한다.
- Server Component를 기본으로 사용하고 상호작용이 필요한 가장 작은 범위에만 `"use client"`를 사용한다.
- UI, 검증, 비즈니스 로직, DB 접근, 인증·인가, 외부 연동을 분리한다.
- Form, URL, search parameter, 환경 변수, 외부 API 응답을 신뢰하지 않고 Zod로 검증한다.
- 사용자 노출 문구와 프로젝트 문서는 자연스러운 한국어로 작성한다.
- 코드 식별자, 파일명과 commit type은 영어를 사용한다.
- 요청하지 않은 기능 추가, 대규모 리팩터링, 아키텍처 변경을 하지 않는다.
- 기존 기능을 임의로 삭제하거나 동작을 변경하지 않는다.

## 2. 작업 절차

1. 요청 범위와 완료 조건을 확인한다.
2. `git status`, 관련 문서, 기존 코드와 테스트를 확인한다.
3. Next.js 관련 코드를 작성하기 전 설치된 버전의 `node_modules/next/dist/docs/`에서 관련 가이드를 읽는다.
4. 라이브러리를 추가하기 전에 `package.json`과 기존 lockfile을 확인한다.
5. DB 변경 전에 `prisma/schema.prisma`, migration과 `docs/DATABASE.md`를 확인한다.
6. 요청 범위 안에서 가장 작은 논리적 변경으로 구현한다.
7. lint, typecheck, 관련 test와 build를 가능한 범위에서 실행한다.
8. `git diff`와 `git status`로 의도하지 않은 변경, Secret, 임시 파일을 확인한다.
9. 문서와 코드가 달라졌다면 같은 작업에서 문서를 갱신한다.
10. 검증 성공 후 논리적 단위로 Conventional Commits 형식의 한국어 커밋을 만든다.

## 3. 파일 구조 규칙

- `src/app`: 라우트, layout, page, loading, error 및 Route Handler
- `src/components/ui`: 도메인에 종속되지 않는 공통 UI
- `src/components/layout`: Sidebar, Topbar 등 앱 셸
- `src/features/<feature>`: 기능별 components, actions, queries, schemas, services
- `src/lib/db`: Prisma Client와 공통 DB 기반 코드
- `src/lib/auth`: Auth.js 설정과 인증 유틸리티
- `src/lib/env`: 환경 변수 스키마와 검증
- `src/lib/github`: GitHub API 클라이언트와 변환 로직
- `src/types`: 여러 기능에서 공유하는 애플리케이션 타입
- `prisma`: schema, migrations, seed
- `docs`: 제품, 아키텍처, DB, UI, 로드맵 문서

추가 규칙:

- route 전용 컴포넌트는 사용되는 route 가까이에 둘 수 있다.
- 두 개 이상의 기능에서 재사용되지 않는 코드를 성급하게 공통화하지 않는다.
- barrel export는 순환 의존성과 client/server 경계를 흐리게 할 수 있으므로 제한적으로 사용한다.
- Server 전용 모듈은 필요하면 `server-only`로 클라이언트 import를 방지한다.
- 생성 파일은 직접 수정하지 않는다.

## 4. TypeScript 규칙

- `strict: true`를 유지한다.
- `any`, `@ts-ignore`, 무분별한 타입 단언으로 오류를 숨기지 않는다.
- 외부 입력에는 `unknown`을 사용하고 검증 후 타입을 좁힌다.
- 공개 함수와 도메인 경계의 입력·출력 타입을 명확하게 정의한다.
- DB 타입을 Client Component의 API로 그대로 노출하지 않고 필요한 DTO를 정의한다.
- `null`과 `undefined`의 의미를 의도적으로 구분한다.
- enum 또는 좁은 문자열 union으로 상태를 제한한다.
- 날짜, `BigInt`, `Decimal` 등 직렬화 경계 타입을 명시적으로 변환한다.
- 불가능한 상태가 타입으로 표현되지 않도록 discriminated union을 우선 고려한다.
- 타입 오류를 해결하기 위해 lint나 TypeScript 규칙을 비활성화하지 않는다.

## 5. 컴포넌트 규칙

- 컴포넌트는 하나의 분명한 역할을 가진다.
- 데이터 조회와 화면 조립은 Server Component를 우선한다.
- 상태, 이벤트, 브라우저 API가 필요한 최소 하위 트리만 Client Component로 만든다.
- 페이지 컴포넌트에 거대한 폼과 비즈니스 로직을 직접 작성하지 않는다.
- props는 필요한 데이터만 전달하고 과도한 prop spreading을 피한다.
- 공통 UI는 도메인 모델이나 Prisma에 의존하지 않는다.
- 폼은 label, 설명, 필드 오류와 제출 상태를 제공한다.
- 아이콘 단독 버튼에는 접근 가능한 이름을 제공한다.
- 색상만으로 상태나 오류를 구분하지 않는다.
- 로딩, 빈 상태, 오류 상태를 기능의 일부로 구현한다.
- 반응형 레이아웃을 모바일과 데스크톱에서 확인한다.

## 6. Server Action 및 API 규칙

- 내부 UI가 수행하는 mutation은 Server Action을 우선한다.
- 인증 엔드포인트, Webhook, 외부 클라이언트용 API에는 Route Handler를 사용한다.
- Server Component가 자체 Route Handler를 HTTP로 호출하지 않는다.
- Server Action을 일반 데이터 조회 수단으로 사용하지 않는다.
- 모든 mutation은 인증, Zod 검증, 인가, 비즈니스 규칙 검사를 거친다.
- 사용자가 전달한 `userId`를 권한 판단에 사용하지 않는다.
- 예상 가능한 오류만 안전한 사용자 메시지로 반환한다.
- 내부 예외, SQL, 토큰, 스택 추적을 클라이언트에 노출하지 않는다.
- 변경 후 필요한 경로만 revalidate한다.

## 7. DB 규칙

- Prisma Schema를 변경하기 전 기존 모델, 관계, 인덱스, migration을 확인한다.
- Schema 변경 시 `docs/DATABASE.md`를 함께 갱신한다.
- 공유된 기존 migration을 수정하지 않고 새 migration을 추가한다.
- Production에서 `prisma migrate dev`를 실행하지 않는다.
- 사용자 소유 리소스 쿼리는 항상 소유권 범위를 포함한다.
- 관련 데이터를 함께 변경할 때는 transaction을 사용한다.
- 집계로 계산 가능한 값은 성능 근거 없이 중복 저장하지 않는다.
- N+1 쿼리를 피하고 필요한 필드만 select한다.
- 인덱스는 실제 조회와 정렬 조건을 근거로 추가한다.
- seed는 반복 실행 가능해야 하며 실제 개인정보나 Secret을 포함하지 않는다.
- cascade 삭제는 영향 범위를 검토하고 테스트한다.

## 8. 인증 및 보안 규칙

- 인증과 리소스 인가를 별도로 검사한다.
- 화면 숨김이나 Proxy/Middleware만으로 인가를 대체하지 않는다.
- 비밀번호는 검증된 단방향 해시로만 저장한다.
- Secret, DB URL, OAuth token을 코드, 문서 예시 값, 로그 또는 Git에 기록하지 않는다.
- OAuth scope는 필요한 최소 범위만 요청한다.
- GitHub 등 외부 API 응답도 런타임 검증을 거친다.
- 민감한 서버 모듈을 Client Component에서 import하지 않는다.
- 오류 메시지로 계정 존재 여부나 내부 리소스 정보를 과도하게 노출하지 않는다.

## 9. 테스트 및 검증 규칙

위험도가 높은 영역부터 테스트한다.

우선순위:

1. 인증과 사용자별 인가
2. 입력 검증과 비즈니스 규칙
3. Task 완료 상태와 프로젝트 진행률
4. 학습 시간 및 연속 학습 일수 집계
5. Prisma transaction과 삭제 정책
6. 핵심 사용자 여정 E2E
7. 표현 중심 UI

작업 완료 전 가능한 범위에서 다음 명령을 실행한다.

- lint
- typecheck
- 관련 unit/integration test
- 전체 test
- production build

테스트를 실행하지 못하거나 실패한 항목이 있으면 이유와 영향을 완료 보고에 명시한다. 테스트 통과를 위해 제품 코드를 왜곡하거나 검증을 약화하지 않는다.

## 10. Git 규칙

- 작업 시작과 종료 시 `git status`를 확인한다.
- 사용자 또는 다른 작업자의 기존 변경을 덮어쓰거나 되돌리지 않는다.
- 하나의 커밋에는 하나의 논리적 변경을 담는다.
- Conventional Commits 형식을 사용한다.
- commit type 예: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- 커밋 제목의 설명은 자연스러운 한국어로 작성한다.
- 예: `feat: 프로젝트 생성 기능 구현`
- 검증이 실패한 상태를 성공한 것처럼 커밋하거나 보고하지 않는다.
- `git add` 전에 diff를 확인하고 Secret, `.env`, build 산출물, 임시 파일을 제외한다.
- 강제 push, history rewrite, destructive reset은 명시적 요청 없이 수행하지 않는다.
- 원격 push와 PR 생성은 사용자의 요청 범위에 포함될 때만 수행한다.

## 11. 문서 규칙

- 제품 범위 변경은 `docs/PRODUCT.md`에 반영한다.
- 계층, 인증 방식, 주요 기술 결정은 `docs/ARCHITECTURE.md`에 반영한다.
- 모델, 관계, 제약, 삭제 정책은 `docs/DATABASE.md`에 반영한다.
- 화면 구조와 공통 UI 패턴은 `docs/UI.md`에 반영한다.
- 일정과 완료 조건 변경은 `docs/ROADMAP.md`에 반영한다.
- 중요한 트레이드오프가 확정되면 필요 시 `docs/DECISIONS.md`를 추가한다.
- 구현과 문서가 불일치하면 동일 작업에서 함께 수정한다.

## 12. 범위 관리

- 현재 Day의 완료 조건을 먼저 충족한다.
- 요청하지 않은 신규 기능이나 의존성을 추가하지 않는다.
- 팀 협업, 알림, 공개 프로필, AI 기능, Webhook 동기화는 MVP 이후 범위다.
- 성능 문제를 측정하기 전에 복잡한 캐시나 집계 테이블을 추가하지 않는다.
- 아키텍처 변경이 필요하면 이유, 대안, 영향 범위를 먼저 설명한다.

## 13. 완료 보고 형식

모든 구현 작업은 다음 형식으로 보고한다.

```markdown
## 작업 완료

### 구현

- 구현한 내용

### 변경된 파일

- 파일 경로
- 변경 이유

### 검증

- lint
- typecheck
- test
- build

### 커밋

- 커밋 해시와 메시지 또는 커밋하지 못한 이유

### 문서 변경

- 갱신한 문서 또는 변경 없음

### 발견된 문제

- 문제점 또는 기술적 이슈

### 다음 단계

- 다음 Day에서 진행할 작업
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
