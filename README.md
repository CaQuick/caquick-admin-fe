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

## 명령어

| 명령                          | 내용                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| `pnpm validate`               | lint → typecheck → knip → 테스트(커버리지) → 빌드. pre-push 훅과 동일합니다 |
| `pnpm test` / `pnpm test:cov` | Vitest                                                                      |
| `pnpm lint` / `pnpm format`   | ESLint(경계 규칙 포함) / Prettier                                           |
| `pnpm build` / `pnpm preview` | 운영 빌드 / 로컬 미리보기                                                   |

## 문서

- [docs/guide/architecture-conventions.md](./docs/guide/architecture-conventions.md) — 구조·의존 방향·데이터·인증·테스트 규칙
- [docs/guide/decisions.md](./docs/guide/decisions.md) — 확정된 결정과 이유
