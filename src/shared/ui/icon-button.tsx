import { type ComponentProps, type MouseEvent, useId } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

type Props = Omit<ComponentProps<typeof Button>, 'aria-label' | 'asChild'> & {
  /** 접근 이름이자 툴팁 문구. 아이콘만 있는 버튼이라 필수다 */
  label: string;
  /** 있으면 버튼을 비활성으로 두고 툴팁(라벨 아래)·설명으로 이유를 알린다 */
  disabledReason?: string;
};

/**
 * 아이콘만 있는 버튼. 마우스는 툴팁으로, 스크린 리더는 aria-label로 같은 이름을 듣는다.
 * 비활성 사유가 있으면 disabled 대신 aria-disabled를 쓴다. disabled는 포커스·호버를 막아 이유를 볼 수 없다.
 */
export function IconButton({
  label,
  disabledReason,
  disabled,
  onClick,
  className,
  variant = 'ghost',
  size = 'icon-sm',
  children,
  ...rest
}: Props) {
  const reasonId = useId();
  const blocked = disabledReason !== undefined;
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (blocked) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            {...rest}
            variant={variant}
            size={size}
            aria-label={label}
            disabled={blocked ? undefined : disabled}
            aria-disabled={blocked || undefined}
            aria-describedby={blocked ? reasonId : undefined}
            className={cn(blocked && 'cursor-not-allowed opacity-50', className)}
            onClick={handleClick}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {blocked ? (
            <>
              <p className="font-medium">{label}</p>
              <p>{disabledReason}</p>
            </>
          ) : (
            label
          )}
        </TooltipContent>
      </Tooltip>
      {blocked && (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      )}
    </TooltipProvider>
  );
}
