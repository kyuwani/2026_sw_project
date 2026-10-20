# DevLog

DevLog는 프로젝트, 할 일, 학습 기록과 GitHub 활동을 한곳에서 관리하는 개인 개발자 대시보드입니다. 기록한 데이터를 바탕으로 프로젝트 진행률, 학습 시간, 연속 학습 일수와 기술별 학습 비율을 확인할 수 있습니다.

## 주요 기능

- 이메일·비밀번호 회원가입과 로그인, GitHub OAuth
- 프로젝트와 Task 생성·조회·수정·삭제 및 진행률 계산
- 학습 기록 작성, 검색, 기간·카테고리·기술 필터
- Dashboard 핵심 지표와 최근 활동
- 주간·월간 자동 회고, 최근 365일 학습 캘린더, Task 완료율과 기술별 Analytics
- GitHub Repository 연결과 최근 Commit 조회
- 프로필, 주 사용 기술과 IANA 시간대 관리
- 사용자별 데이터 격리, 서버 입력 검증과 소유권 검사

## 기술 구성

- Next.js 16 App Router, React 19, TypeScript strict mode
- Tailwind CSS 4, Recharts
- PostgreSQL, Prisma ORM 7
- Auth.js 5, bcryptjs, Zod 4
- Vitest, Playwright, axe-core
- Vercel 배포

## 로컬 실행

### 준비 사항

- Node.js 24 권장
- npm
- PostgreSQL
- E2E 테스트를 실행하려면 Playwright Chromium

### 1. 저장소와 패키지 준비

```bash
git clone https://github.com/kyuwani/2026_sw_project.git
cd 2026_sw_project
npm ci
```

### 2. 환경 변수 설정

`.env.example`을 참고해 프로젝트 루트에 `.env.local`을 만듭니다.

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
DIRECT_URL=""
AUTH_SECRET="32자 이상의 환경별 고유 값"
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
```

- `DATABASE_URL`은 필수입니다.
- 로컬에서는 `DIRECT_URL`을 비워 두면 `DATABASE_URL`을 migration에도 사용합니다.
- `AUTH_SECRET`은 `openssl rand -base64 32` 등으로 생성하며 Git에 커밋하지 않습니다.
- GitHub 로그인을 사용하려면 OAuth App callback을 `http://localhost:3000/api/auth/callback/github`로 설정하고 ID와 Secret을 함께 입력합니다.

### 3. 데이터베이스 준비

비어 있는 로컬 PostgreSQL 데이터베이스를 준비한 뒤 migration을 적용합니다.

```bash
npm run db:migrate
```

공유 환경이나 Production에는 새 migration을 만드는 `db:migrate` 대신 검토된 migration만 적용하는 다음 명령을 사용합니다.

```bash
npm run db:migrate:status
npm run db:migrate:deploy
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속합니다.

## 검증 명령

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

- 단위 테스트는 외부 서비스와 DB를 mock하여 실행합니다.
- 통합 테스트와 E2E 테스트는 `DATABASE_URL`의 PostgreSQL에 테스트 데이터를 만들고 종료 시 정리합니다. 개인 개발 DB 또는 별도 테스트 DB에서 실행하세요.
- E2E 테스트는 로컬 개발 서버를 자동으로 시작하고 Chromium에서 핵심 사용자 여정, 접근성, 목표 viewport와 인증 요청 거절 시 오류 화면을 검증합니다.

## 프로젝트 구조

```text
src/app                 라우트, layout과 Route Handler
src/components          공통 UI와 앱 셸
src/features            기능별 Action, Query, Service, Schema와 UI
src/lib                 DB, 환경 변수, 날짜와 GitHub 기반 코드
prisma                  Schema와 migration
tests/e2e               Playwright 사용자 여정
docs                    제품, 아키텍처, DB, UI, 로드맵과 배포 문서
```

상세 설계는 `docs/ARCHITECTURE.md`, 데이터 모델은 `docs/DATABASE.md`, 제품 범위는 `docs/PRODUCT.md`를 참고하세요. Vercel 환경 분리, migration 순서와 운영 체크리스트는 `docs/DEPLOYMENT.md`에 정리되어 있습니다.

## 배포

Preview와 Production은 PostgreSQL, `AUTH_SECRET`과 GitHub OAuth App을 각각 분리합니다. 환경 변수 등록 후 아래 순서로 배포합니다.

1. Secret이 주입되는 승인된 CI 또는 운영 환경에서 `npm run deploy:check -- preview` 또는 `production`으로 환경 변수를 점검합니다.
2. Preview DB에 `npm run db:migrate:deploy`를 적용합니다.
3. Preview 배포와 핵심 Smoke Test를 완료합니다.
4. Production backup을 확인하고 Production DB에 migration을 적용합니다.
5. Production 배포 후 인증, CRUD, Dashboard, Analytics와 GitHub 연결을 점검합니다.

구체적인 명령과 OAuth callback 정책은 `docs/DEPLOYMENT.md`를 따릅니다.

## 알려진 제한사항

- 개인 사용자용 MVP이며 팀, 초대, 댓글, 알림과 공개 프로필은 제공하지 않습니다.
- 비밀번호 재설정, 이메일 소유 확인과 계정 삭제·복구 흐름은 아직 제공하지 않습니다.
- GitHub 최근 Commit은 요청 시 조회하며 Webhook으로 저장하거나 실시간 동기화하지 않습니다.
- GitHub Repository 원격 목록은 최근 업데이트 순 최대 100개를 조회합니다.
- 프로필 이미지는 업로드하지 않고 URL 또는 OAuth 프로필 이미지를 사용합니다.
- AI 회고, 캘린더·Notion·Slack 연동과 데이터 내보내기는 MVP 이후 범위입니다.

## 문서

- `docs/PRODUCT.md`: 제품 목표와 MVP 범위
- `docs/ARCHITECTURE.md`: 계층, 인증과 데이터 흐름
- `docs/DATABASE.md`: 모델, 관계, 인덱스와 삭제 정책
- `docs/UI.md`: 화면 구조와 공통 UI 패턴
- `docs/ROADMAP.md`: 6주 개발 일정과 완료 조건
- `docs/DEPLOYMENT.md`: Vercel 배포와 운영 절차
- `docs/RELEASE.md`: MVP 완료 기준과 릴리스 차단 항목
