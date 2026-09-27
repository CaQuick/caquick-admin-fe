import { authRequest } from '@/shared/api';

type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

/** BE /auth/admin/login·refresh 응답(envelope 없음). */
export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
}

export const authApi = {
  login: (body: { username: string; password: string }) =>
    authRequest<LoginResponse>('/admin/login', { body }),
  refresh: () => authRequest<LoginResponse>('/admin/refresh'),
  logout: () => authRequest<void>('/admin/logout'),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    authRequest<{ ok: boolean }>('/admin/change-password', { auth: true, body }),
};
