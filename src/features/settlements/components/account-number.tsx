import { CopyIcon } from 'lucide-react';
import { toast } from 'sonner';

import { copyText } from '@/shared/lib/clipboard';
import { IconButton } from '@/shared/ui/icon-button';

/** 계좌번호 전체와 복사 버튼. 상세·단건 화면에서만 쓴다(목록은 마스킹). 번호는 토스트에도 남기지 않는다 */
export function AccountNumber({ value }: { value: string }) {
  const copy = async () => {
    if (await copyText(value)) toast.success('계좌번호를 복사했습니다.');
    else toast.error('복사하지 못했습니다. 계좌번호를 직접 옮겨 적어 주세요.');
  };
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono tabular-nums select-all">{value}</span>
      <IconButton label="계좌번호 복사" onClick={() => void copy()}>
        <CopyIcon className="size-3.5" />
      </IconButton>
    </span>
  );
}
