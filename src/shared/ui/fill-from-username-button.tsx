import { useId } from 'react';

import { INITIAL_PASSWORD_MIN } from '@/shared/lib/initial-password';

import { Button } from './button';

interface Props {
  username: string;
  onFill: (password: string) => void;
}

/** 초기 비밀번호를 아이디와 같게 채운다. 아이디가 비밀번호 최소 길이보다 짧으면 쓸 수 없다. */
export function FillFromUsernameButton({ username, onFill }: Props) {
  const reasonId = useId();
  const value = username.trim();
  const tooShort = value.length < INITIAL_PASSWORD_MIN;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={tooShort}
        aria-describedby={tooShort ? reasonId : undefined}
        onClick={() => onFill(value)}
      >
        아이디로 채우기
      </Button>
      {tooShort && (
        <span id={reasonId} className="text-xs text-muted-foreground">
          아이디가 {INITIAL_PASSWORD_MIN}자 이상이어야 쓸 수 있습니다.
        </span>
      )}
    </div>
  );
}
