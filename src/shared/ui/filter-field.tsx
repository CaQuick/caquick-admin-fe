import { type ReactNode, useId } from 'react';

import { cn } from '@/shared/lib/utils';

interface Props {
  /** 필터 앞에 보이는 짧은 이름(예: '매장', '주문일') */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * 필터 줄의 인라인 라벨. placeholder만으로는 값을 입력한 뒤 무엇을 거른 것인지 보이지 않는다.
 * 날짜 범위처럼 입력이 둘 이상일 수 있어 label 대신 group으로 묶는다(각 입력은 자기 aria-label을 유지).
 */
export function FilterField({ label, children, className }: Props) {
  const labelId = useId();
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cn('flex items-center gap-1.5', className)}
    >
      <span id={labelId} className="text-xs whitespace-nowrap text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
