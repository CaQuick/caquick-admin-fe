import { InboxIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
      <InboxIcon className="size-6 opacity-60" aria-hidden />
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && <p className="max-w-sm text-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
