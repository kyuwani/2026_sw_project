# DevLog MVP 릴리스 판정

## 현재 판정

상태: **릴리스 완료** (2026-10-15)

로컬 전체 품질 검증과 Vercel Preview·Production 배포를 통과했다. Production에서 GitHub OAuth, Project·Task·Learning Log, Dashboard·Analytics, GitHub Repository·최근 Commit까지 핵심 사용자 흐름을 확인했으며 치명적이거나 높은 우선순위의 알려진 버그가 없어 DevLog MVP를 릴리스 완료로 판정한다.

## 완료된 검증

- ESLint 통과
- TypeScript strict typecheck 통과
- 단위 테스트 159개 통과, DB 통합 대상 17개는 일반 실행에서 의도대로 제외
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
- Production 인증 계정의 Project·Task·Learning Log 생성과 Task 완료 확인
- Dashboard와 Analytics에 운영 데이터가 반영되는 동작 확인
- GitHub Repository 연결과 최근 Commit 조회 확인
- Production Smoke Test 중 HTTP 5xx 없음 확인

## 알려진 제한사항

1. Preview에는 GitHub OAuth ID와 Secret이 없어 이메일 인증만 사용할 수 있다. Preview OAuth 검증이 필요하면 별도 OAuth App과 고정 callback host가 필요하다.
2. Vercel `Secret` 타입은 CLI `env run`으로 내려오지 않는다. 운영 기능으로 최신 스키마 동작은 확인했지만, migration 이력 자체의 정기 감사는 Secret을 안전하게 주입할 수 있는 승인된 CI 또는 운영 환경에서 수행해야 한다.
3. PostgreSQL client가 현재 `sslmode=require`를 `verify-full`과 동일하게 처리한다는 향후 호환성 경고를 출력한다. 다음 major 업데이트 전에 연결 문자열 정책을 재검토해야 한다.

## MVP 완료 기준 점검

| 기준 | 판정 | 근거 또는 남은 확인 |
| --- | --- | --- |
| 이메일 가입·로그인 | 충족 | 단위·E2E 통과, Production DB 조회와 인증 실패 처리 확인 |
| Project·Task 생성과 완료 | 충족 | 통합·E2E 및 Production Smoke Test 통과 |
| Learning Log 작성과 검색 | 충족 | 단위·통합·E2E 및 Production 작성 확인 |
| Dashboard·Analytics 집계 | 충족 | 단위·통합·E2E 및 Production 반영 확인 |
| GitHub OAuth·Repository·Commit | 충족 | Production 승인·callback·Account 연결·Repository 연결·최근 Commit 조회 확인 |
| 사용자별 리소스 격리 | 충족 | 소유권 단위·통합 테스트 통과 |
| 모바일·데스크톱 핵심 흐름 | 충족 | Playwright 목표 viewport와 접근성 검증 통과 |
| 전체 품질 명령 | 충족 | lint, typecheck, unit, integration, E2E, build 통과 |
| Production 핵심 흐름 | 충족 | 인증, CRUD, 집계, GitHub 연동과 HTTP 5xx 없음 확인 |

## 후속 backlog

### 운영 후속 작업

- 승인된 실행 환경에서 migration status 정기 확인 자동화
- `/login`, `/signup`, `/api/auth/*` 배포 계층 rate limit 적용과 관찰
- Preview GitHub OAuth가 필요해질 때 별도 OAuth App과 고정 callback host 구성
- PostgreSQL client 다음 major 전 `sslmode=verify-full` 명시 검토

### MVP 이후

- 이메일 소유 확인과 비밀번호 재설정
- 계정 삭제·복구 정책과 사용자 흐름
- 운영 오류 추적과 Web Vitals 관측
- 공개 프로필, 팀 기능, 알림과 외부 서비스 연동
- GitHub Webhook 기반 활동 동기화
