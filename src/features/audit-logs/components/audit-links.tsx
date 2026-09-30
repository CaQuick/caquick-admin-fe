import { Link } from '@tanstack/react-router';

import { actorTypeLabel, targetLabel } from '../meta';

const linkClass = 'text-primary-soft-foreground hover:underline';

/** 대상 종류별 화면으로 잇는다. 상세 화면이 없는 종류(계정·분류·지역·알림 등)는 글자만 보인다 */
export function TargetLink({ targetType, targetId }: { targetType: string; targetId: string }) {
  const text = `${targetLabel(targetType)} #${targetId}`;
  switch (targetType) {
    case 'ORDER':
      return (
        <Link to="/orders/$orderId" params={{ orderId: targetId }} className={linkClass}>
          {text}
        </Link>
      );
    case 'STORE':
      return (
        <Link to="/stores/$storeId" params={{ storeId: targetId }} className={linkClass}>
          {text}
        </Link>
      );
    case 'PRODUCT':
      return (
        <Link to="/products/$productId" params={{ productId: targetId }} className={linkClass}>
          {text}
        </Link>
      );
    case 'BANNER':
      return (
        <Link to="/banners/$bannerId" params={{ bannerId: targetId }} className={linkClass}>
          {text}
        </Link>
      );
    case 'REVIEW':
      // 삭제 기록이 많아 삭제 포함으로 연다
      return (
        <Link to="/reviews" search={{ reviewId: targetId, deleted: 'true' }} className={linkClass}>
          {text}
        </Link>
      );
    case 'REVIEW_REPORT':
      return (
        <Link to="/reports/$reportId" params={{ reportId: targetId }} className={linkClass}>
          {text}
        </Link>
      );
    default:
      return <span>{text}</span>;
  }
}

/** 작업자. 라벨(`이름(아이디)`)이 없으면 #ID. 판매자는 판매자 상세로, 관리자는 상세 화면이 없어 글자만 */
export function ActorLink({
  accountId,
  accountType,
  label,
}: {
  accountId: string;
  accountType: string | null | undefined;
  label: string | null | undefined;
}) {
  const name = label ?? `#${accountId}`;
  const type = <span className="text-xs text-muted-foreground">{actorTypeLabel(accountType)}</span>;
  if (accountType === 'SELLER') {
    return (
      <span className="flex items-center gap-1.5">
        <Link to="/sellers/$accountId" params={{ accountId }} className={linkClass}>
          {name}
        </Link>
        {type}
      </span>
    );
  }
  if (accountType === 'USER') {
    return (
      <span className="flex items-center gap-1.5">
        <Link to="/users/$accountId" params={{ accountId }} className={linkClass}>
          {name}
        </Link>
        {type}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5">
      <span>{name}</span>
      {type}
    </span>
  );
}
