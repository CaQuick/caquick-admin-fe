import { useState } from 'react';
import { toast } from 'sonner';

import { copyText } from '@/shared/lib/clipboard';
import { generateInitialPassword } from '@/shared/lib/initial-password';

import { Button } from './button';
import { FillFromUsernameButton } from './fill-from-username-button';

interface Props {
  /** 지금 칸에 든 비밀번호. 복사 대상이다 */
  value: string;
  onChange: (password: string) => void;
  /** 주면 '아이디로 채우기'를 함께 둔다 */
  username?: string;
}

/** 임시 비밀번호 칸 아래의 보조 버튼 묶음: 생성·복사·아이디로 채우기. */
export function InitialPasswordActions({ value, onChange, username }: Props) {
  const [generated, setGenerated] = useState<string | null>(null);

  const generate = () => {
    const next = generateInitialPassword();
    setGenerated(next);
    onChange(next);
  };
  const copy = async () => {
    if (await copyText(value)) toast.success('비밀번호를 복사했습니다.');
    else toast.error('복사하지 못했습니다. 비밀번호를 직접 옮겨 적어 전달해 주세요.');
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="xs" onClick={generate}>
          임시 비밀번호 생성
        </Button>
        <Button type="button" variant="outline" size="xs" disabled={value === ''} onClick={copy}>
          복사
        </Button>
        {username !== undefined && <FillFromUsernameButton username={username} onFill={onChange} />}
      </div>
      {/* 칸은 가려져 있어 만든 값을 눈으로 확인할 곳이 필요하다. 칸을 고치면 더는 같은 값이 아니므로 감춘다 */}
      {generated !== null && generated === value && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          만든 비밀번호: <code className="font-mono text-foreground select-all">{generated}</code>
        </p>
      )}
    </div>
  );
}
