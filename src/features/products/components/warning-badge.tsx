import { useId } from 'react';

import { type PillTone, StatusPill } from '@/shared/ui/status-pill';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

/** 이유를 툴팁으로 알리는 경고 배지. 키보드로도 초점을 받아 툴팁을 열고, 스크린 리더는 설명으로 듣는다 */
export function WarningBadge({
  label,
  reason,
  tone,
}: {
  label: string;
  reason: string;
  tone: Extract<PillTone, 'caution' | 'negative'>;
}) {
  const reasonId = useId();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            aria-describedby={reasonId}
            className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <StatusPill tone={tone}>{label}</StatusPill>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-72">{reason}</TooltipContent>
      </Tooltip>
      <span id={reasonId} className="sr-only">
        {reason}
      </span>
    </TooltipProvider>
  );
}
