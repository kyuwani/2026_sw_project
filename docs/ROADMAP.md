# DevLog 6주 개발 로드맵

## 1. 목표와 전제

이 로드맵은 6주 동안 DevLog MVP를 개발 가능한 상태로 완성하는 것을 목표로 한다. 데이터베이스 연결 확정 Day를 분리해 총 31개의 개발 Day를 기준으로 하며, Week 2만 6개의 Day를 포함한다. 각 Day는 하나의 검증 가능한 결과를 만든다.

전제:

- 개인 사용자용 서비스만 구현한다.
- 한 명의 개발자가 AI 도구를 활용해 순차적으로 개발한다.
- 요구사항 변경과 외부 서비스 설정을 위한 여유를 포함한다.
- 각 Day 시작 시 기존 코드와 문서를 먼저 확인한다.
- 각 Day 종료 시 가능한 범위에서 lint, typecheck, test, build를 실행한다.
- 완료 조건을 만족하지 못한 작업은 다음 Day의 신규 범위보다 우선한다.

## 2. Week 1 — 기반, UI 셸, 데이터베이스

### Day 1 — 프로젝트 초기화

상태: **완료** (2026-09-21)

작업:

- Git 저장소와 원격 저장소 연결
- Next.js App Router, TypeScript strict, Tailwind CSS 초기화
- 기본 디렉터리와 경로 별칭 구성
- lint, typecheck, build 스크립트 구성
- 환경 변수 예시와 검증 기반 마련

완료 조건:

- 기본 페이지가 로컬에서 렌더링된다.
- TypeScript strict mode가 활성화되어 있다.
- `lint`, `typecheck`, `build`가 모두 통과한다.
- Secret이 Git 추적 대상에 포함되지 않는다.

### Day 2 — 디자인 토큰과 앱 셸

상태: **완료** (2026-09-21)

작업:

- 색상, 타이포그래피, 간격 토큰
- Sidebar, Topbar, Main Content로 구성된 공통 App Shell
- 데스크톱 Sidebar와 모바일 Drawer 내비게이션
- Navigation 데이터와 route active 표시 분리
- Dashboard Mock Data 유지
- 모바일 메뉴 포커스 트랩, Escape 닫기, 본문 바로가기

완료 조건:

- 데스크톱과 모바일에서 내비게이션을 사용할 수 있다.
- 현재 경로가 시각적·텍스트적으로 구분된다.
- 키보드로 주요 내비게이션을 조작할 수 있다.
- 모든 메뉴가 개별 route로 이동하고 공통 App Shell을 유지한다.
- lint, typecheck, production build가 통과한다.

### Day 3 — 기본 디자인 시스템

상태: **완료** (2026-09-22)

작업:

- semantic 색상, radius, shadow 디자인 토큰
- Button, Card, Input, Textarea, Badge, Progress, Select
- native dialog 기반 Dialog와 공통 EmptyState
- 반응형 PageHeader
- Dashboard의 PageHeader, 통계 Card, Badge, Progress 적용

완료 조건:

- 공통 컴포넌트가 페이지 도메인에 종속되지 않는다.
- Dialog 외 컴포넌트는 불필요한 Client Component 경계를 만들지 않는다.
- 폼 컴포넌트가 label, 오류, disabled와 focus 상태를 지원한다.
- Dashboard Mock Data와 기존 App Shell이 그대로 동작한다.
- lint, typecheck, production build가 통과한다.

### Day 4 — PostgreSQL과 Prisma

상태: **완료** (Schema 확정 2026-09-22, 로컬 PostgreSQL 초기 migration 적용 2026-09-29)

작업:

- 안정 버전 Prisma ORM 7.10.0과 PostgreSQL driver adapter 설정
- User, Project, Task, LearningLog, Technology 기본 모델
- ProjectTechnology, LearningLogTechnology 명시적 관계 모델
- 환경변수 검증과 Prisma Client singleton 구성
- 실제 Schema 기준 `DATABASE.md` 갱신

완료 조건:

- Schema format, validation과 Prisma Client generation이 통과한다.
- Prisma CLI와 Client 버전이 일치한다.
- 실제 DB 연결 문자열이 Git 추적 대상에 포함되지 않는다.
- `DATABASE.md`와 실제 Schema가 일치한다.

DB 연결 후 후속 확인:

- PostgreSQL 호스팅 또는 로컬 DB 방식을 결정한다.
- 실제 `DATABASE_URL`을 설정하고 `init` migration을 생성·적용한다.
- 서버에서 DB 연결 확인 쿼리를 실행한다.
- 개발용 seed 도입 시 Technology `upsert`로 반복 실행 안전성을 보장한다.

### Day 5 — Database Schema 확정과 PostgreSQL 연결

상태: **완료** (Schema 확정 2026-09-22, 로컬 PostgreSQL `init` migration 적용 2026-09-29)

작업:

- User, Project, Task, LearningLog, Technology와 연결 모델 최종 검토
- required/optional, unique, index와 삭제 정책 확정
- Auth.js 확장성을 고려한 User 모델 검토
- 실제 `DATABASE_URL`이 있으면 `init` migration과 DB 연결 smoke test
- `DATABASE.md`와 실제 Schema 동기화

완료 조건:

- Prisma Schema와 `DATABASE.md`가 일치한다.
- 관계, 인덱스와 cascade/restrict 정책의 근거가 문서화된다.
- Prisma format, validate, generate와 프로젝트 품질 검증이 통과한다.
- DB 연결 정보가 없으면 migration 미실행 사유가 명확히 기록된다.

## 3. Week 2 — 인증, Project와 Task

### Day 6 — 사용자 인증

상태: **완료** (2026-09-29, 이메일 인증 및 GitHub OAuth callback·계정 연결 검증 완료)

작업:

- Auth.js와 Prisma Adapter 구성
- 세션 타입 확장과 보호된 Dashboard 라우트
- 이메일 회원가입
- 비밀번호 해싱과 로그인·로그아웃
- GitHub OAuth
- 로그인·회원가입 화면 오류 처리
- 인증 핵심 테스트

완료 조건:

- 비로그인 사용자가 보호 화면에 접근할 수 없다.
- 이메일 가입 후 로그인할 수 있다.
- 로그인 사용자가 Dashboard에 접근하고 로그아웃할 수 있다.
- 중복 이메일과 잘못된 입력이 안전하게 거절된다.
- GitHub OAuth 로그인 후 User와 Account가 올바르게 연결된다.
- 세션의 사용자 ID를 서버에서 안전하게 읽을 수 있다.
- 비밀번호와 OAuth 토큰이 응답 또는 로그에 노출되지 않는다.

### Day 7 — Project 생성

상태: **완료** (2026-10-06)

작업:

- Project 입력 스키마
- 생성 Server Action
- 기술 스택 선택
- 프로젝트 생성 화면

완료 조건:

- 로그인 사용자가 유효한 프로젝트를 생성할 수 있다.
- 잘못된 기간과 필수값 누락이 서버에서 거절된다.
- 생성된 프로젝트와 기술 연결이 트랜잭션으로 저장된다.

### Day 8 — Project 목록과 상세

상태: **완료** (2026-10-08)

작업:

- 사용자별 프로젝트 목록
- 상태 필터와 검색
- 프로젝트 상세 화면
- 로딩, 빈 상태, 오류 상태

완료 조건:

- 사용자는 자신의 프로젝트만 볼 수 있다.
- 검색과 상태 필터가 URL 상태와 함께 동작한다.
- 빈 목록과 검색 결과 없음이 구분된다.

### Day 9 — Project 수정과 삭제

상태: **완료** (2026-10-08)

작업:

- 수정 폼과 Action
- 기술 스택 교체
- 삭제 확인과 cascade 처리
- 소유권 검증 테스트

완료 조건:

- 프로젝트 정보와 기술 스택을 수정할 수 있다.
- 다른 사용자의 ID로 수정·삭제할 수 없다.
- 삭제 후 하위 연결 데이터가 정책대로 정리된다.

### Day 10 — Task CRUD

상태: **완료** (2026-10-08)

작업:

- Task 생성, 조회, 수정, 삭제
- 상태, 우선순위, 마감일
- 프로젝트 상세 Task 목록

완료 조건:

- 프로젝트 안에서 Task 전체 CRUD가 동작한다.
- Task 소유권을 상위 Project를 통해 검증한다.
- `DONE` 상태와 `completedAt`이 항상 일관된다.

### Day 11 — Task 필터와 진행률

상태: **완료** (2026-10-08)

작업:

- 상태, 우선순위, 마감 여부 필터
- 정렬
- 빠른 완료 처리
- 프로젝트 진행률 계산

완료 조건:

- 여러 필터를 함께 적용할 수 있다.
- Task 완료·재개 시 진행률이 즉시 갱신된다.
- Task 0개와 전체 완료 상태의 진행률이 정확하다.
- 진행률 계산 단위 테스트가 통과한다.

## 4. Week 3 — Learning Log와 Dashboard

### Day 12 — Learning Log 생성

상태: **완료** (2026-10-08)

작업:

- 학습 기록 입력 스키마
- 날짜, 시간, 카테고리, 기술 스택 입력
- 생성 Server Action과 폼

완료 조건:

- 유효한 학습 기록과 기술 연결이 저장된다.
- 학습 시간과 날짜가 서버에서 검증된다.
- 사용자의 시간대가 날짜 처리에 반영된다.

### Day 13 — Learning Log 목록과 상세

상태: **완료** (2026-10-08)

작업:

- 날짜별 학습 기록 목록
- 기록 상세 또는 확장 보기
- 페이지네이션 또는 제한 조회
- 빈 상태와 로딩 상태

완료 조건:

- 최신 학습일순으로 자신의 기록만 표시된다.
- 긴 내용이 목록 레이아웃을 깨뜨리지 않는다.
- 모바일과 데스크톱에서 읽을 수 있다.

### Day 14 — Learning Log 수정·삭제·필터

상태: **완료** (2026-10-12)

작업:

- 수정과 삭제
- 날짜 범위, 카테고리, 기술 필터
- 제목·내용 검색

완료 조건:

- 기록과 기술 스택을 수정할 수 있다.
- 검색과 필터 조합이 동작한다.
- 타인의 기록을 조회하거나 변경할 수 없다.

### Day 15 — Dashboard 집계

상태: **완료** (2026-10-12)

작업:

- 프로젝트 및 Task 요약 쿼리
- 최근 학습 기록
- 마감 임박 Task
- 연속 학습 일수 계산

완료 조건:

- Dashboard 수치가 원본 데이터와 일치한다.
- 독립적인 조회가 불필요하게 직렬 실행되지 않는다.
- 연속 학습 일수 경계 조건 테스트가 통과한다.

### Day 16 — Dashboard UI 완성

상태: **완료** (2026-10-12)

작업:

- 요약 카드
- 프로젝트 진행률
- 최근 활동과 학습 기록
- 이번 주 학습 미니 차트
- 첫 사용자 빈 상태

완료 조건:

- 신규 사용자와 데이터가 있는 사용자 화면이 모두 자연스럽다.
- 핵심 수치와 다음 행동을 첫 화면에서 확인할 수 있다.
- 좁은 모바일 화면에서 가로 넘침이 없다.

## 5. Week 4 — Analytics, GitHub, Profile

### Day 17 — Analytics 집계

상태: **완료** (2026-10-12)

작업:

- 주간·월간 학습 시간
- Task 완료율
- 프로젝트별 진행률
- 기술별 학습 시간 비율

완료 조건:

- 기간 경계와 시간대가 정확하다.
- 기록이 없는 기간에 0 또는 빈 상태를 일관되게 반환한다.
- 주요 집계 로직 단위 테스트가 통과한다.

### Day 18 — Analytics UI

상태: **완료** (2026-10-12)

작업:

- 기간 선택
- 학습 시간 차트
- 기술 비율 차트
- Task 및 프로젝트 지표
- 차트의 텍스트 요약

완료 조건:

- 차트가 컨테이너 크기에 맞게 반응한다.
- 차트를 볼 수 없는 사용자도 핵심 수치를 텍스트로 이해할 수 있다.
- 모바일에서 범례와 라벨이 겹치지 않는다.

### Day 19 — GitHub Repository 조회

상태: **완료** (2026-10-12)

작업:

- GitHub access token 서버 접근
- Repository 목록 조회
- 응답 검증과 내부 DTO 변환
- rate limit과 API 오류 처리

완료 조건:

- 연결된 사용자가 접근 가능한 Repository를 조회할 수 있다.
- 토큰이 브라우저나 로그에 노출되지 않는다.
- GitHub 장애 시 나머지 프로젝트 정보는 정상 표시된다.

### Day 20 — Project와 Repository 연결

상태: **완료** (2026-10-12)

작업:

- Repository 캐시 upsert
- 프로젝트 연결·해제
- Repository 기본 정보
- 최근 Commit 조회

완료 조건:

- 사용자가 자신의 Repository만 자신의 프로젝트에 연결할 수 있다.
- 프로젝트 상세에서 저장소 정보와 최근 Commit을 확인할 수 있다.
- 연결 해제 후 프로젝트 자체 데이터는 유지된다.

### Day 21 — Profile

작업:

- 이름, 자기소개, GitHub 링크, 시간대
- 주 사용 기술
- 프로필 이미지 정책에 따른 표시 또는 수정
- GitHub 연결 상태

완료 조건:

- 프로필을 조회하고 수정할 수 있다.
- IANA 시간대와 URL 입력이 검증된다.
- 시간대 변경 후 신규 집계가 선택한 시간대를 따른다.

## 6. Week 5 — 통합, 테스트, 보안, 접근성

### Day 22 — 사용자 흐름 통합 점검

작업:

- 가입부터 Dashboard까지 전체 흐름
- 프로젝트·Task·학습 기록 간 연결
- 내비게이션과 redirect 정리

완료 조건:

- 신규 사용자가 안내 없이 핵심 흐름을 완료할 수 있다.
- 막힌 링크, 잘못된 breadcrumb, 불필요한 새로고침이 없다.
- 주요 기능의 오류·빈 상태가 누락되지 않는다.

### Day 23 — 인증·인가 보안 테스트

작업:

- Project, Task, LearningLog 소유권 테스트
- 입력 변조와 예상하지 않은 ID 테스트
- OAuth 토큰 노출 점검
- 로그인 요청 보호 전략 검토

완료 조건:

- 타 사용자 리소스 접근 시 정보 노출 없이 거절된다.
- 클라이언트 입력의 `userId`가 권한 판단에 사용되지 않는다.
- Secret과 토큰이 코드, 번들, 로그, Git diff에 없다.

### Day 24 — 핵심 통합 테스트

작업:

- Prisma 기반 Project·Task 통합 테스트
- 학습 기록과 집계 통합 테스트
- transaction 실패 시나리오

완료 조건:

- 핵심 CRUD와 집계가 테스트 DB에서 검증된다.
- 테스트가 서로 독립적이며 반복 실행 가능하다.
- 실패 시 원인을 찾을 수 있는 테스트 이름과 구조를 가진다.

### Day 25 — E2E 테스트

작업:

- 로그인
- 프로젝트와 Task 생성·완료
- 학습 기록 작성
- Dashboard 반영

완료 조건:

- 최소 핵심 사용자 여정이 브라우저 테스트로 통과한다.
- 테스트용 사용자와 데이터 정리 방식이 문서화된다.
- CI 또는 로컬 단일 명령으로 실행할 수 있다.

### Day 26 — 접근성과 반응형 검증

작업:

- 키보드 내비게이션
- 포커스와 Dialog
- label, heading, 명도 대비
- 모바일·태블릿·데스크톱 레이아웃

완료 조건:

- 핵심 흐름을 키보드만으로 수행할 수 있다.
- 주요 화면에서 심각한 자동 접근성 오류가 없다.
- 목표 viewport에서 잘림과 의도하지 않은 가로 스크롤이 없다.

## 7. Week 6 — 안정화, 배포, 문서화, 버퍼

### Day 27 — 성능과 데이터 조회 개선

작업:

- 중복 쿼리와 N+1 점검
- 필요한 인덱스 검토
- Dashboard 병렬 조회
- GitHub 캐시와 목록 제한

완료 조건:

- 주요 화면의 쿼리 수가 설명 가능한 수준이다.
- 사용자별 캐시 데이터가 다른 사용자에게 공유되지 않는다.
- 성능 개선이 정확성이나 인가를 훼손하지 않는다.

### Day 28 — Production 배포 준비

작업:

- Production DB와 migration 절차
- Vercel 환경 변수
- OAuth callback URL
- Preview와 Production 환경 구분

완료 조건:

- Production과 Preview의 Secret 및 DB 연결이 분리된다.
- 배포 환경에서 migration을 안전하게 적용할 절차가 있다.
- 배포용 build가 성공한다.

### Day 29 — 배포와 Smoke Test

작업:

- Vercel 배포
- 인증, CRUD, Analytics, GitHub 기본 점검
- 오류 로그 확인

완료 조건:

- 운영 URL에서 핵심 사용자 흐름이 동작한다.
- GitHub OAuth callback과 DB 연결이 정상이다.
- 발견한 운영 오류를 기록하고 심각도별로 정리한다.

### Day 30 — 문서와 운영 준비

작업:

- README와 로컬 실행 방법
- 환경 변수와 migration 문서
- 아키텍처 및 DB 문서 동기화
- 알려진 제한사항 정리

완료 조건:

- 새로운 개발자가 문서만 보고 로컬 환경을 실행할 수 있다.
- 실제 구현과 문서 사이의 주요 불일치가 없다.
- Secret 없이 필요한 환경 변수 목록이 제공된다.

### Day 31 — 버그 수정과 MVP 릴리스 판정

작업:

- 남은 높은 우선순위 버그 수정
- 전체 검증 실행
- MVP 완료 기준 점검
- 후속 backlog 작성

완료 조건:

- lint, typecheck, 전체 test, production build가 통과한다.
- 핵심 사용자 여정 E2E가 통과한다.
- 치명적·높은 우선순위의 알려진 버그가 없다.
- `PRODUCT.md`의 MVP 완료 기준을 충족하거나 미충족 항목이 명시된다.

## 8. 일정 보호 원칙

- Day별 범위가 끝나지 않으면 낮은 우선순위 UI 개선보다 기능 정확성을 우선한다.
- GitHub 최근 Commit은 조회 전용으로 제한하고 Webhook 동기화를 추가하지 않는다.
- Analytics는 원본 데이터 집계로 구현하고 별도 데이터 파이프라인을 만들지 않는다.
- 이미지 업로드가 일정을 위협하면 OAuth 프로필 이미지 URL 표시로 MVP를 제한한다.
- 이메일 인증과 비밀번호 재설정은 보안·메일 인프라 준비 정도에 따라 출시 전 필수 범위를 별도로 판단한다.
- Week 6은 신규 핵심 기능을 추가하는 기간으로 사용하지 않는다.
