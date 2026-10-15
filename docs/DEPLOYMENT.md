# DevLog 배포 절차

## 1. 목적과 범위

이 문서는 DevLog를 Vercel Preview와 Production에 배포하기 전 필요한 환경 분리, PostgreSQL migration, GitHub OAuth callback과 검증 절차를 정의한다. 실제 Vercel 프로젝트 연결, 호스팅 DB 생성과 첫 배포는 Day 29에서 수행한다.

## 2. 환경 분리

Local, Preview와 Production은 DB, 인증 Secret과 GitHub OAuth App을 공유하지 않는다.

| 항목 | Local | Preview | Production |
| --- | --- | --- | --- |
| 배포 위치 | 개발 머신 | Vercel Preview | Vercel Production |
| PostgreSQL | 로컬 Docker | Preview 전용 DB | Production 전용 DB |
| `DATABASE_URL` | 로컬 URL | Preview pooled URL | Production pooled URL |
| `DIRECT_URL` | 생략 가능 | Preview direct URL | Production direct URL |
| `AUTH_SECRET` | 개발 전용 값 | Preview 전용 값 | Production 전용 값 |
| GitHub OAuth App | Local 전용 | Preview 전용 | Production 전용 |

Preview가 Production DB에 연결되거나 Production Secret을 상속하지 않도록 Vercel Project Settings에서 각 변수의 적용 환경을 개별 지정한다. Preview DB는 Production 데이터 복제본이 아닌 별도 인스턴스 또는 격리된 branch를 사용한다.

## 3. Vercel 환경 변수

Preview와 Production 각각에 다음 변수를 등록한다. 실제 값은 Vercel과 DB·GitHub 관리 화면에만 저장하고 Git, 문서, 로그에 기록하지 않는다.

| 변수 | 용도 | Preview/Production 규칙 |
| --- | --- | --- |
| `DATABASE_URL` | 애플리케이션 runtime 쿼리 | 서버리스 동시성을 지원하는 pooled URL |
| `DIRECT_URL` | Prisma migration과 관리 명령 | 같은 환경 DB의 direct URL |
| `AUTH_SECRET` | Auth.js 세션 서명 | 환경마다 별도 생성한 32자 이상 값 |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | 환경별 OAuth App 값 |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret | 환경별 OAuth App 값 |

`NEXT_PUBLIC_` 변수는 현재 필요하지 않다. DB URL과 인증 값에는 이 접두사를 붙이지 않는다. 환경 변수 변경은 기존 deployment에 소급 적용되지 않으므로 변경 후 새 deployment를 생성한다.

Secret이 주입되는 승인된 CI job 또는 운영자 shell에서 현재 설정을 검증한다.

```bash
npm run deploy:check -- preview
npm run deploy:check -- production
```

Vercel에서 `Secret` 타입으로 저장한 값은 CLI의 `env run`으로 내려오지 않는다. 로컬 `.env.local`이 있는 개발 머신에서 `vercel env run`을 사용하면 누락된 값이 로컬 값으로 보완되어 잘못된 DB를 검사할 수 있으므로 배포 검증과 migration에 사용하지 않는다. 검증 명령은 필수값, PostgreSQL URL 형식, 로컬 DB 주소 사용 여부만 확인하고 값을 출력하지 않는다. Preview와 Production 값이 서로 다른지는 Vercel 설정 화면에서 별도로 대조한다.

## 4. GitHub OAuth callback

GitHub OAuth App의 Authorization callback URL은 각 환경의 고정 host를 사용한다.

```text
Local:      http://localhost:3000/api/auth/callback/github
Preview:    https://<preview-host>/api/auth/callback/github
Production: https://<production-host>/api/auth/callback/github
```

임의의 commit별 Preview URL 대신 branch 고정 URL 또는 Preview 전용 custom domain을 사용한다. GitHub OAuth App은 Local, Preview, Production별로 생성하고 Client ID와 Secret을 해당 Vercel 환경에만 등록한다. Day 29 smoke test에서 로그인, callback, Account 연결과 로그아웃을 각 배포 환경에서 확인한다.

## 5. Migration 절차

`prisma migrate dev`는 Local에서 새 migration을 만드는 용도로만 사용한다. Preview와 Production에서는 검토가 끝나 Git에 커밋된 migration을 `prisma migrate deploy`로 적용한다.

배포 순서는 다음과 같다.

1. `prisma/schema.prisma`, 새 migration SQL과 `docs/DATABASE.md`의 일치 여부를 검토한다.
2. 복구가 어려운 변경은 DB provider의 backup 또는 restore point를 먼저 만든다.
3. Preview 전용 `DIRECT_URL`로 `npm run db:migrate:status`를 실행한다.
4. Preview에 `npm run db:migrate:deploy`를 한 번 실행하고 application을 배포한다.
5. Preview smoke test가 통과하면 Production backup 상태를 확인한다.
6. Production 전용 `DIRECT_URL`로 status 확인 후 migration을 한 번 실행한다.
7. Production application을 배포하고 Day 29 smoke test를 수행한다.

Secret이 주입되는 승인된 CI job 또는 운영자 shell에서 실행하는 예시:

```bash
npm run db:migrate:status
npm run db:migrate:deploy
```

Vercel build command에는 migration을 연결하지 않는다. Preview와 Production deployment가 동시에 실행될 수 있으므로 migration은 승인된 CI 단계 또는 운영자가 한 번만 실행한다. 적용한 migration 파일을 수정하거나 삭제하지 않으며, 실패 시 원인을 확인한 뒤 새 migration 또는 `prisma migrate resolve` 절차를 검토한다. 데이터 손실 가능성이 있으면 자동 복구를 시도하지 않고 backup 복원을 우선 판단한다.

명령 실행 전에 대상 환경의 `DIRECT_URL` host를 별도 안전한 경로로 확인한다. 명령 출력의 datasource host가 `localhost` 또는 `127.0.0.1`이면 즉시 중단한다.

## 6. 배포 전 체크리스트

- [ ] Preview와 Production DB가 서로 다르다.
- [ ] 각 환경의 `DATABASE_URL`은 pooled, `DIRECT_URL`은 direct 연결이다.
- [ ] `AUTH_SECRET`과 GitHub OAuth App이 환경별로 분리되어 있다.
- [ ] OAuth callback이 각 환경의 고정 host와 일치한다.
- [ ] 모든 migration SQL을 검토하고 Preview에 먼저 적용했다.
- [ ] `npm run deploy:check -- <environment>`가 통과한다.
- [ ] `npm run lint`, `npm run typecheck`, 전체 test와 `npm run build`가 통과한다.
- [ ] Secret, `.env*`, `.vercel`과 build 산출물이 Git에 포함되지 않았다.
