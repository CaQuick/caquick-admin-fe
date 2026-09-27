import { type ReactNode } from 'react';

import { Label } from '@/shared/ui/label';

interface Props {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
}

export function Field({ id, label, required = false, error, help, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-negative-foreground"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-negative-foreground">{error}</p>
      ) : help ? (
        <p className="text-xs text-muted-foreground">{help}</p>
      ) : null}
    </div>
  );
}
