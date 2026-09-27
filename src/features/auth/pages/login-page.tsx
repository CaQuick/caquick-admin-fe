import { useNavigate } from '@tanstack/react-router';

import { AuthCard } from '../components/auth-card';
import { LoginForm } from '../components/login-form';

interface Props {
  /** 로그인 뒤 돌아갈 경로(가드가 넘긴 값). 없으면 홈. */
  redirect?: string;
}

export function LoginPage({ redirect }: Props) {
  const navigate = useNavigate();
  return (
    <AuthCard title="관리자 로그인" description="관리자 계정으로만 로그인할 수 있습니다.">
      <LoginForm
        onSuccess={({ mustChangePassword }) => {
          void navigate({
            to: mustChangePassword ? '/change-password' : (redirect ?? '/'),
            replace: true,
          });
        }}
      />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        첫 로그인이거나 비밀번호가 초기화된 계정은 로그인 직후 비밀번호 변경 화면으로 이동합니다.
      </p>
    </AuthCard>
  );
}
