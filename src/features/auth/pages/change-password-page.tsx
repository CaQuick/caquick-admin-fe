import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/button';

import { AuthCard } from '../components/auth-card';
import { ChangePasswordForm } from '../components/change-password-form';
import { useAuthStore } from '../store';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();
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
        onSessionLost={(message) => {
          toast.error(message);
          void navigate({ to: '/login', replace: true });
        }}
      />
      {/* 강제 변경이면 다른 화면이 모두 막혀 있어 돌아갈 곳이 없다 */}
      {!forced && (
        <Button
          type="button"
          variant="ghost"
          className="mt-2 h-10 w-full"
          onClick={() => {
            // 주소로 바로 들어왔으면 이전 기록이 앱 밖이라 홈으로 보낸다
            if (canGoBack) router.history.back();
            else void navigate({ to: '/' });
          }}
        >
          돌아가기
        </Button>
      )}
    </AuthCard>
  );
}
