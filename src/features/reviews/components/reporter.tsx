import { Link } from '@tanstack/react-router';

import { cn } from '@/shared/lib/utils';
import { StatusPill } from '@/shared/ui/status-pill';

interface Props {
  accountId: string;
  /** 신고 시점 닉네임. 이 값을 기록하기 전에 탈퇴한 신고자는 null */
  nickname: string | null | undefined;
  withdrawn: boolean;
  className?: string;
}

/**
 * 신고자 표시. 탈퇴했으면 신고 시점 닉네임 옆에 '탈퇴 회원'을 붙이고(탈퇴 계정은 상세를 열 수 없어 링크 없이), 닉네임이 없으면 '탈퇴 회원'만 보인다
 */
export function Reporter({ accountId, nickname, withdrawn, className }: Props) {
  const name = nickname ?? (withdrawn ? null : `#${accountId}`);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {name !== null && withdrawn && <span className={className}>{name}</span>}
      {name !== null && !withdrawn && (
        <Link
          to="/users/$accountId"
          params={{ accountId }}
          className={cn('hover:underline', className)}
        >
          {name}
        </Link>
      )}
      {withdrawn && <StatusPill tone="neutral">탈퇴 회원</StatusPill>}
    </span>
  );
}
