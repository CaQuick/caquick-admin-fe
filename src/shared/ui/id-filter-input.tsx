import { useId, useRef, useState } from 'react';

import { isIdText } from '@/shared/lib/list-search';
import { Input } from '@/shared/ui/input';

interface Props {
  label: string;
  placeholder?: string;
  /** URL 기준 현재 값 */
  value: string | undefined;
  onCommit: (v: string | undefined) => void;
}

/** 목록의 ID 필터. Enter나 포커스 이동으로 적용한다. 숫자가 아니면 커밋하지 않고 입력을 남긴 채 알린다(조용히 버리지 않는다). */
export function IdFilterInput(props: Props) {
  // URL 값이 바뀌면(초기화·링크 이동) 입력과 오류를 함께 새로 시작한다
  return <IdField key={props.value ?? ''} {...props} />;
}

function IdField({ label, placeholder = label, value, onCommit }: Props) {
  const [invalid, setInvalid] = useState(false);
  const errorId = useId();
  // 마지막으로 적용한 값. 같으면 다시 커밋하지 않는다: Enter 뒤 blur가 한 번 더 오고, 커밋은 목록 커서를 처음으로 돌린다
  const committed = useRef(value);
  const commit = (raw: string) => {
    const v = raw.trim() || undefined;
    if (v !== undefined && !isIdText(v)) return setInvalid(true);
    if (v === committed.current) return;
    committed.current = v;
    onCommit(v);
  };
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
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
          e.preventDefault();
          commit(e.currentTarget.value);
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
