import { useId, useState } from 'react';

import { isIdText } from '@/shared/lib/list-search';
import { Input } from '@/shared/ui/input';

interface Props {
  label: string;
  placeholder?: string;
  /** URL 기준 현재 값 */
  value: string | undefined;
  onCommit: (v: string | undefined) => void;
}

/** 목록의 ID 필터. 숫자가 아니면 커밋하지 않고 입력을 남긴 채 알린다(조용히 버리지 않는다). */
export function IdFilterInput(props: Props) {
  // URL 값이 바뀌면(초기화·링크 이동) 입력과 오류를 함께 새로 시작한다
  return <IdField key={props.value ?? ''} {...props} />;
}

function IdField({ label, placeholder = label, value, onCommit }: Props) {
  const [invalid, setInvalid] = useState(false);
  const errorId = useId();
  return (
    <span className="flex items-center gap-1.5">
      <Input
        aria-label={label}
        placeholder={placeholder}
        inputMode="numeric"
        className="h-9 w-24"
        defaultValue={value ?? ''}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        onChange={() => setInvalid(false)}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v && !isIdText(v)) return setInvalid(true);
          onCommit(v || undefined);
        }}
      />
      {invalid && (
        <span id={errorId} role="alert" className="text-xs text-negative-foreground">
          숫자만 입력해 주세요.
        </span>
      )}
    </span>
  );
}
