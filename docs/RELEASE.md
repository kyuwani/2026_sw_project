# DevLog MVP 릴리스 판정

## 현재 판정

상태: **보류** (2026-10-15)

로컬 품질 검증, Vercel Preview·Production 배포와 Production GitHub OAuth는 통과했다. 인증 후 CRUD·집계 Smoke Test와 환경별 migration 이력 확인이 남아 있어 운영 릴리스 완료로 판정하지 않는다.

## 완료된 검증

- ESLint 통과
- TypeScript strict typecheck 통과
- 단위 테스트 158개 통과, DB 통합 대상 17개는 일반 실행에서 의도대로 제외
- PostgreSQL 통합 테스트 17개 통과
- Playwright 핵심 사용자 여정과 접근성·반응형 테스트 2개 통과
- Next.js production build 통과
- Vercel Preview build와 deployment Ready 확인
- Preview `/login`, `/signup`, Auth.js provider·session endpoint HTTP 200 확인
- 비로그인 `/dashboard`가 `/login`으로 redirect되는 동작 확인
- Preview Smoke Test 이후 runtime error와 HTTP 5xx 로그 없음 확인
- Production build와 deployment Ready, 운영 alias 연결 확인
- Production 로그인·회원가입·Auth.js endpoint 응답과 보호 경로 redirect 확인
- Production credentials 인증의 DB 조회와 안전한 실패 응답 확인
- GitHub provider 노출, OAuth authorize 요청의 Client ID와 callback URL 확인
- 운영 계정의 GitHub 승인, callback HTTP 302, Account 연결과 Dashboard 진입 확인
- Production Smoke Test 중 HTTP 5xx 없음 확인

## 릴리스 차단 항목

1. Preview에는 GitHub OAuth ID와 Secret이 없어 이메일 인증만 사용할 수 있다. Preview OAuth 검증이 필요하면 별도 OAuth App과 고정 callback host가 필요하다.
2. Vercel `Secret` 타입은 CLI `env run`으로 내려오지 않는다. 승인된 CI 또는 운영 환경에서 Preview와 Production의 `DIRECT_URL`을 주입해 migration status와 deploy를 확인해야 한다.
3. Production 인증 계정으로 Project·Task·Learning Log CRUD, Dashboard와 Analytics를 Smoke Test해야 한다.

## MVP 완료 기준 점검

| 기준 | 판정 | 근거 또는 남은 확인 |
| --- | --- | --- |
| 이메일 가입·로그인 | 충족 | 단위·E2E 통과, Production DB 조회와 인증 실패 처리 확인 |
| Project·Task 생성과 완료 | 충족 | 통합·E2E 통과 |
| Learning Log 작성과 검색 | 충족 | 단위·통합·E2E 통과 |
| Dashboard·Analytics 집계 | 충족 | 단위·통합·E2E 통과 |
| GitHub OAuth·Repository·Commit | 충족 | Production 승인, callback과 Account 연결 확인, Repository·Commit 로직 테스트 통과 |
| 사용자별 리소스 격리 | 충족 | 소유권 단위·통합 테스트 통과 |
| 모바일·데스크톱 핵심 흐름 | 충족 | Playwright 목표 viewport와 접근성 검증 통과 |
| 전체 품질 명령 | 충족 | lint, typecheck, unit, integration, E2E, build 통과 |
| Production 핵심 흐름 | 조건부 | 비인증 경로와 DB 조회 정상, 인증 후 CRUD·집계 확인 필요 |

## 후속 backlog

### 릴리스 전 필수

- 환경별 migration status 확인과 미적용 migration deploy
- Production 인증·CRUD·Analytics·GitHub callback Smoke Test
- `/login`, `/signup`, `/api/auth/*` 배포 계층 rate limit 적용과 관찰

### MVP 이후

- 이메일 소유 확인과 비밀번호 재설정
- 계정 삭제·복구 정책과 사용자 흐름
- 운영 오류 추적과 Web Vitals 관측
- PostgreSQL client 다음 major 전 `sslmode=verify-full` 명시 검토
- 공개 프로필, 팀 기능, 알림과 외부 서비스 연동
- GitHub Webhook 기반 활동 동기화
