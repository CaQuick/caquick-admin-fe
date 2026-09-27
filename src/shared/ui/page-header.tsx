import { type ReactNode } from 'react';

interface Props {
  title: ReactNode;
  description?: ReactNode;
  /** 제목 옆 보조 정보(건수 등) */
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, meta, actions }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-start gap-x-4 gap-y-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-bold">{title}</h2>
          {meta && <span className="text-[13px] text-muted-foreground tabular-nums">{meta}</span>}
        </div>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="ml-auto flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
