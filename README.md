<p align="center"><img src="./.github/assets/logo.png" alt="CaQuick" width="120" /></p>

# caquick-admin-fe

케이퀵(CaQuick) 관리자 웹입니다. React + Vite + TypeScript SPA로, 백엔드([caquick-be](https://github.com/CaQuick/caquick-be))의 관리자 GraphQL·REST API를 사용합니다. 운영 주소는 `admin.caquick.site`입니다.

## 스택

- React 19 · TypeScript · Vite
- TanStack Router(파일 기반 라우팅) · TanStack Query · graphql-request · graphql-codegen
- Tailwind CSS v4 · shadcn/ui · lucide
- Vitest · Testing Library · MSW
- nginx 정적 서빙 이미지를 GHCR에 올리고 맥미니(셀프호스트 러너)가 compose로 교체합니다

## 시작하기

```bash
corepack enable
pnpm install
pnpm dev            # http://localhost:5173 — /graphql·/auth는 localhost:4000(백엔드)으로 프록시됩니다
```

백엔드를 다른 곳에 띄웠다면 `DEV_API_ORIGIN=http://host:port pnpm dev`.

### 환경 변수

| 이름                       | 내용                                                                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`        | API 오리진. 개발은 비워 두고 Vite 프록시를 씁니다. 운영 이미지는 빌드 인자로 받습니다                                                                                               |
| `VITE_NAVER_MAP_CLIENT_ID` | 매장 위치 미리보기에 쓰는 네이버 지도 키(NCP Dynamic Map `ncpKeyId`). 로컬은 `.env.local`, 운영은 GitHub 저장소 변수가 빌드 인자로 들어갑니다. 비어 있으면 지도 미리보기만 꺼집니다 |

지도 키는 NCP 콘솔의 Web 서비스 URL에 등록된 주소(운영 도메인과 로컬 개발 주소)에서만 인증됩니다. 레포가 공개라 키를 파일에 커밋하지 않습니다.

## 명령어

| 명령                          | 내용                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm validate`               | lint → typecheck → codegen:check → knip → 테스트(커버리지) → 빌드. pre-push 훅과 동일합니다 |
| `pnpm test` / `pnpm test:cov` | Vitest                                                                                      |
| `pnpm lint` / `pnpm format`   | ESLint(경계 규칙 포함) / Prettier                                                           |
| `pnpm build` / `pnpm preview` | 운영 빌드 / 로컬 미리보기                                                                   |

## 배포

`main`에 머지되면 CI → 이미지 빌드(GHCR `ghcr.io/caquick/caquick-admin-fe:<sha>`, arm64) → 맥미니 셀프호스트 러너가 compose로 교체합니다. 절차와 호스트 준비는 [infra/README.md](./infra/README.md)에 있습니다.

## 문서

- [docs/guide/architecture-conventions.md](./docs/guide/architecture-conventions.md) — 구조·의존 방향·데이터·인증·테스트 규칙
- [docs/guide/decisions.md](./docs/guide/decisions.md) — 확정된 결정과 이유
