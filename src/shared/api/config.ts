/** API 오리진. 개발은 빈 문자열(same-origin, Vite 프록시), 운영 빌드는 VITE_API_BASE_URL(예 https://api.caquick.site). */
const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export const GRAPHQL_URL = `${API_BASE_URL}/graphql`;
export const AUTH_URL = `${API_BASE_URL}/auth`;
