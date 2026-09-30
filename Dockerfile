# syntax=docker/dockerfile:1.7
# 정적 SPA 이미지 — pnpm build 산출물(dist)을 nginx가 서빙한다. API 오리진은 빌드 시점에 굽는다(VITE_API_BASE_URL).
ARG NODE_IMAGE=node:24-bookworm-slim
ARG NGINX_IMAGE=nginx:1.27-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_BASE_URL=https://api.caquick.site
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
# 네이버 지도 키(공개 키지만 레포가 public이라 기본값을 두지 않는다). 비면 지도 미리보기만 꺼진다
ARG VITE_NAVER_MAP_CLIENT_ID=
ENV VITE_NAVER_MAP_CLIENT_ID=${VITE_NAVER_MAP_CLIENT_ID}
RUN pnpm build && test -f dist/index.html

FROM ${NGINX_IMAGE} AS runtime
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY infra/security-headers.inc /etc/nginx/conf.d/security-headers.inc
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD wget -q --spider http://127.0.0.1/healthz || exit 1
