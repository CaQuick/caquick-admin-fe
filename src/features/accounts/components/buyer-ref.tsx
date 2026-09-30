import { Link } from '@tanstack/react-router';
import { type ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { StatusPill } from '@/shared/ui/status-pill';

interface Props {
  accountId: string;
  /** 닉네임. null이면 탈퇴(프로필 삭제)한 구매자 */
  nickname: string | null | undefined;
  /** 보일 글자. 기본은 닉네임, 탈퇴면 #ID */
  children?: ReactNode;
  /** 탈퇴 회원 배지. 같은 카드에 이미 붙었으면 끈다 */
  badge?: boolean;
  className?: string;
}

/**
 * 구매자 계정 표시. 탈퇴 계정은 구매자 상세가 NOT_FOUND라 링크 없이 글자와 '탈퇴 회원' 배지로 보인다
 */
export function BuyerRef({ accountId, nickname, children, badge = true, className }: Props) {
  if (nickname == null) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className={cn(className, 'text-foreground')}>{children ?? `#${accountId}`}</span>
        {badge && <StatusPill tone="neutral">탈퇴 회원</StatusPill>}
      </span>
    );
  }
  return (
    <Link
      to="/users/$accountId"
      params={{ accountId }}
      className={cn('hover:underline', className)}
    >
      {children ?? nickname}
    </Link>
  );
}
