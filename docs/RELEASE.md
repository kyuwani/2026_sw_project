# DevLog MVP 릴리스 판정

## 현재 판정

상태: **보류** (2026-10-15)

로컬 품질 검증과 Vercel Preview 배포는 통과했다. Production GitHub OAuth 환경 변수 오타와 환경별 migration 확인이 남아 있어 운영 릴리스 완료로 판정하지 않는다.

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

## 릴리스 차단 항목

1. Vercel Production에 `AUTH_GTITHUB_SECRET` 오타 키가 있고 올바른 `AUTH_GITHUB_SECRET`이 없다. 현재 `AUTH_GITHUB_ID`만 인식되어 Production build가 인증 환경 변수 검증에서 실패한다.
2. Preview에는 GitHub OAuth ID와 Secret이 없어 이메일 인증만 사용할 수 있다. 환경별 OAuth App과 고정 callback host가 필요하다.
3. Vercel `Secret` 타입은 CLI `env run`으로 내려오지 않는다. 승인된 CI 또는 운영 환경에서 Preview와 Production의 `DIRECT_URL`을 주입해 migration status와 deploy를 확인해야 한다.
4. 위 설정을 교정한 Production deployment에서 이메일 인증, GitHub OAuth, Project·Task·Learning Log CRUD, Dashboard와 Analytics를 다시 Smoke Test해야 한다.

## MVP 완료 기준 점검

| 기준 | 판정 | 근거 또는 남은 확인 |
| --- | --- | --- |
| 이메일 가입·로그인 | 충족 | 단위·E2E 통과, Preview 공개 인증 화면 응답 확인 |
| Project·Task 생성과 완료 | 충족 | 통합·E2E 통과 |
| Learning Log 작성과 검색 | 충족 | 단위·통합·E2E 통과 |
| Dashboard·Analytics 집계 | 충족 | 단위·통합·E2E 통과 |
| GitHub OAuth·Repository·Commit | 조건부 | 로컬 로직 검증 완료, Preview·Production OAuth 설정 필요 |
| 사용자별 리소스 격리 | 충족 | 소유권 단위·통합 테스트 통과 |
| 모바일·데스크톱 핵심 흐름 | 충족 | Playwright 목표 viewport와 접근성 검증 통과 |
| 전체 품질 명령 | 충족 | lint, typecheck, unit, integration, E2E, build 통과 |
| Production 핵심 흐름 | 미충족 | Production 환경 변수 교정과 배포 후 Smoke Test 필요 |

## 후속 backlog

### 릴리스 전 필수

- Preview·Production 전용 GitHub OAuth App과 callback host 확정
- Production `AUTH_GITHUB_SECRET` 교정 후 오타 키 제거
- 환경별 migration status 확인과 미적용 migration deploy
- Production 배포 및 인증·CRUD·Analytics·GitHub Smoke Test
- `/login`, `/signup`, `/api/auth/*` 배포 계층 rate limit 적용과 관찰

### MVP 이후

- 이메일 소유 확인과 비밀번호 재설정
- 계정 삭제·복구 정책과 사용자 흐름
- 운영 오류 추적과 Web Vitals 관측
- 공개 프로필, 팀 기능, 알림과 외부 서비스 연동
- GitHub Webhook 기반 활동 동기화
