import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { AuthCard } from '../components/auth-card';
import { ChangePasswordForm } from '../components/change-password-form';
import { useAuthStore } from '../store';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const forced = useAuthStore((s) => s.mustChangePassword);
  return (
    <AuthCard
      title="비밀번호 변경"
      description={
        forced ? '계속하려면 먼저 비밀번호를 바꿔야 합니다.' : '새 비밀번호를 설정합니다.'
      }
    >
      <ChangePasswordForm
        onSuccess={() => {
          toast.success('비밀번호를 변경했습니다. 다시 로그인해 주세요.');
          void navigate({ to: '/login', replace: true });
        }}
      />
    </AuthCard>
  );
}
