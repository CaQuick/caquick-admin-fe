# 아키텍처와 컨벤션

케이퀵 관리자 웹의 구조와 규칙. 결정의 배경은 [decisions.md](./decisions.md). 이 문서는 "왜"를 적고, 도구가 강제하는 것은 도구 이름을 함께 적는다.

## 1. 큰 그림

```
브라우저(admin.caquick.site) ──GraphQL·REST──> api.caquick.site (caquick-be)
```

- SPA 1개. 서버 코드가 없다. 정적 파일을 nginx가 서빙하고, 데이터는 전부 백엔드 관리자 API에서 온다.
- 백엔드 계약의 정본은 caquick-be의 SDL이다. 이 레포는 그 스냅샷(`schema/schema.graphql`)을 커밋하고 codegen으로 타입을 만든다.

## 2. 파일 배치와 의존 방향 (ESLint `boundaries`)

```
src/
  app/          엔트리·providers·라우터 생성. shared·routes만 본다
  routes/       TanStack Router 파일 라우트. features의 index.ts와 shared만 본다
  features/<area>/
    api/        *.graphql 문서 + queryOptions 팩토리
    components/ 화면 조각
    pages/      라우트가 렌더하는 페이지
    index.ts    밖에 내놓는 것만
  shared/       api 클라이언트·auth·ui(shadcn 복사본)·lib·hooks. features를 모른다
  graphql/      codegen 산출물(커밋)
  test/         MSW 핸들러·render 헬퍼·팩토리
```

- **shared → features 금지.** 공용이 도메인을 알면 공용이 아니다.
- **feature 간 import는 대상 `index.ts`로만.** 내부 경로를 파고들면 lint가 막는다.
- **routes는 얇다.** 검색 파라미터 파싱·로더 prefetch·페이지 컴포넌트 호출까지만.
- 규칙은 `eslint.config.js`의 `boundaries/dependencies`가 강제한다. 규칙을 고치면 위반 예시로 실제로 걸리는지 확인한다(현재 코드가 통과한다는 것은 증거가 아니다).

## 3. 데이터 계층

- **문서**는 feature 안 `api/*.graphql`. 이름은 `Admin<Area><동사>`(예 `AdminOrdersList`, `AdminCancelOrder`).
- **쿼리 키**는 feature별 팩토리(`ordersKeys.list(filters)`, `ordersKeys.detail(id)`)로만 만든다. 문자열 리터럴 키 금지.
- **mutation 뒤**에는 그 feature의 list·detail 키를 invalidate한다. 낙관적 업데이트는 쓰지 않는다 — 감사 대상 작업이라 서버 결과가 진실이다.
- **목록**은 커서 방식(`items · totalCount · hasMore · nextCursor`). 필터·커서는 URL 검색 파라미터(zod)로 유지해 새로고침·공유가 된다.
- **ID**는 문자열 그대로. `"0"`·빈 문자열을 truthy 검사로 버리지 않는다.
- **날짜**는 표시·입력 KST, 전송 ISO(UTC). 기간 필터의 경계는 KST 하루 시작·끝을 UTC로 바꿔 보낸다.

## 4. 인증

- 로그인·갱신·로그아웃·비밀번호 변경은 REST(`/auth/admin/*`). 나머지는 GraphQL.
- accessToken은 메모리(zustand)에만. refresh 토큰은 백엔드가 httpOnly 쿠키로 관리한다.
- 401·`UNAUTHENTICATED`면 refresh 1회(동시 요청은 하나의 promise를 공유) 후 재시도. 실패면 로그아웃.
- `mustChangePassword`인 계정은 비밀번호 변경 화면 밖으로 나갈 수 없다(백엔드도 FORBIDDEN을 준다).

## 5. 에러 표시

- GraphQL `errors[].extensions.code`(카탈로그 코드)를 한국어 문구 표로 매핑한다. 표에 없으면 백엔드 `message`를 그대로.
- `BAD_USER_INPUT`은 폼 상단 알림, 그 외는 토스트. `NOT_FOUND`는 목록으로 돌려보낸다.

## 6. UI

- shadcn 컴포넌트는 `src/shared/ui`에 복사해 소유한다. 레지스트리 갱신은 `pnpm dlx shadcn add -o <name>`.
- 토큰은 `src/app/globals.css` 한 곳. 색은 토큰 이름으로만 쓰고 hex를 컴포넌트에 쓰지 않는다.
- 상태 색(positive·caution·negative)은 상태에만 쓴다. 시리즈 색이 필요하면 `chart-*`.
- 다크 모드는 `.dark` 클래스(테마 스토어가 토글). OS 설정 추적은 `system`일 때만.

## 7. 테스트

- `*.spec.ts(x)`를 소스 옆에. `it`은 한국어 평서형.
- 네트워크는 MSW로 계약 기반 mock(응답 모양은 codegen 타입을 따른다). fetch를 직접 stub하지 않는다.
- 커버리지 임계는 `vitest.config.ts`. shadcn 복사본(`src/shared/ui`)·codegen 산출물·라우트 트리는 제외.

## 8. 명령어와 게이트

```bash
pnpm validate     # lint → typecheck → (codegen:check) → knip → test:cov → build — pre-push와 동일, --no-verify 금지
pnpm dev          # http://localhost:5173 (/graphql·/auth는 localhost:4000으로 프록시, DEV_API_ORIGIN으로 변경)
pnpm schema:pull  # BE SDL 스냅샷 갱신(03 PR부터)
pnpm codegen      # 스냅샷 + 문서 → src/graphql/generated (03 PR부터)
```

- 커밋은 Conventional Commits + 한국어 본문(commitlint). 브랜치는 `<type>/<대상>`.
- PR 본문에 `## 플랜 대조` 표. 봇 리뷰(Codex·CodeRabbit)는 BE와 같은 절차로 처리한다.
