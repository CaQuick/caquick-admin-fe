import { ImageIcon, Loader2Icon, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import { type UploadPurpose } from '@/graphql/generated/graphql';
import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';

import { ACCEPTED_TYPES, uploadImage } from './upload';

interface Props {
  id: string;
  purpose: UploadPurpose;
  value: string | null;
  onChange: (publicUrl: string | null) => void;
  /** 미리보기 비율 */
  aspect?: string;
}

/** 이미지 1장 업로드 필드. 선택 즉시 presigned PUT으로 올리고 publicUrl을 value로 준다. */
export function ImageUploadField({ id, purpose, value, onChange, aspect = '1 / 1' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await uploadImage(purpose, file));
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div
          className="grid w-32 shrink-0 place-items-center overflow-hidden rounded-lg border bg-surface-tint"
          style={{ aspectRatio: aspect }}
        >
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="sr-only"
            onChange={(e) => void pick(e.target.files?.[0])}
            disabled={busy}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2Icon className="size-4 animate-spin" /> : null}
            {busy ? '업로드 중…' : value ? '이미지 바꾸기' : '이미지 선택'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              disabled={busy}
            >
              <XIcon className="size-3.5" /> 제거
            </Button>
          )}
          <p className="text-xs text-muted-foreground">JPEG·PNG·WebP, 5MB 이하</p>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-negative-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
