import { type LinkProps, Link } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import { rememberedSearch } from '@/shared/lib/list-return';

interface Props {
  title: ReactNode;
  description?: ReactNode;
  /** 제목 옆 보조 정보(건수 등) */
  meta?: ReactNode;
  actions?: ReactNode;
  /** 목록으로 돌아가는 링크. 그 목록을 마지막에 본 필터·페이지로 돌아간다 */
  back?: { to: NonNullable<LinkProps['to']>; label?: string };
}

export function PageHeader({ title, description, meta, actions, back }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-start gap-x-4 gap-y-2">
      <div className="min-w-0">
        {back && (
          <Link
            to={back.to}
            // 경로마다 검색 스키마가 달라 타입으로 좁힐 수 없다. 값은 그 경로에서 라우터가 검증한 것이다
            search={(rememberedSearch(back.to) ?? {}) as never}
            className="mb-1 inline-flex items-center gap-0.5 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="size-3.5" aria-hidden />
            {back.label ?? '목록으로'}
          </Link>
        )}
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
