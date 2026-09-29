import { useId } from 'react';

import { INITIAL_PASSWORD_MAX, INITIAL_PASSWORD_MIN } from '@/shared/lib/initial-password';

import { Button } from './button';

interface Props {
  username: string;
  onFill: (password: string) => void;
}

/** 초기 비밀번호를 아이디와 같게 채운다. 아이디 길이가 비밀번호 허용 범위(8~64자) 밖이면 쓸 수 없다. */
export function FillFromUsernameButton({ username, onFill }: Props) {
  const reasonId = useId();
  const value = username.trim();
  // 아이디는 80자까지라 비밀번호 상한(64자)을 넘을 수 있다
  const reason =
    value.length < INITIAL_PASSWORD_MIN
      ? `아이디가 ${INITIAL_PASSWORD_MIN}자 이상이어야 쓸 수 있습니다.`
      : value.length > INITIAL_PASSWORD_MAX
        ? `아이디가 ${INITIAL_PASSWORD_MAX}자를 넘어 비밀번호로 쓸 수 없습니다.`
        : null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={reason !== null}
        aria-describedby={reason ? reasonId : undefined}
        onClick={() => onFill(value)}
      >
        아이디로 채우기
      </Button>
      {reason && (
        <span id={reasonId} className="text-xs text-muted-foreground">
          {reason}
        </span>
      )}
    </div>
  );
}
