import { cn } from '@/shared/lib/utils';

export type PillTone = 'primary' | 'positive' | 'caution' | 'negative' | 'neutral';

const TONES: Record<PillTone, string> = {
  primary: 'bg-primary-soft text-primary-soft-foreground',
  positive: 'bg-positive-soft text-positive-foreground',
  caution: 'bg-caution-soft text-caution-foreground',
  negative: 'bg-negative-soft text-negative-foreground',
  neutral: 'bg-surface-tint text-muted-foreground border',
};

/** 상태 표시. 색은 상태 의미(tone)로만 정한다 — 점(dot)이 있어 색맹에서도 구분된다. */
export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}
