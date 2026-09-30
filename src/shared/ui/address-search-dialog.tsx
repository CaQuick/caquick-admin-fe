import { type ReactNode, useEffect, useRef, useState } from 'react';

import { type PostcodeResult, loadPostcode, toPostcodeResult } from '@/shared/lib/kakao-postcode';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

interface Props {
  /** 다이얼로그를 여는 버튼 */
  trigger: ReactNode;
  /** 고른 주소. 고르면 다이얼로그를 닫는다 */
  onSelect: (result: PostcodeResult) => void;
  /** 검색칸에 미리 넣을 주소(수정할 때 기존 주소) */
  initialQuery?: string;
}

type Status = 'loading' | 'ready' | 'error';

/** 카카오 우편번호 검색을 다이얼로그 안에 띄운다. 팝업 창은 차단될 수 있어 embed 방식을 쓴다. */
export function AddressSearchDialog({ trigger, onSelect, initialQuery }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-3 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>주소 검색</DialogTitle>
          <DialogDescription>도로명, 건물 이름, 지번으로 검색해 주세요.</DialogDescription>
        </DialogHeader>
        {open && (
          <PostcodeEmbed
            initialQuery={initialQuery}
            onSelect={(result) => {
              setOpen(false);
              onSelect(result);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PostcodeEmbed({
  initialQuery,
  onSelect,
}: {
  initialQuery?: string;
  onSelect: (result: PostcodeResult) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);
  // 스크립트 콜백이 늘 최신 onSelect를 부르게 한다
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    let cancelled = false;
    loadPostcode().then(
      (Postcode) => {
        const el = container.current;
        if (cancelled || !el) return;
        el.replaceChildren();
        new Postcode({
          oncomplete: (data) => onSelectRef.current(toPostcodeResult(data)),
          width: '100%',
          height: '100%',
        }).embed(el, { q: initialQuery, autoClose: false });
        setStatus('ready');
      },
      () => {
        if (!cancelled) setStatus('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, initialQuery]);

  return (
    <div className="relative h-[460px] overflow-hidden rounded-md border">
      <div ref={container} className="size-full" />
      {status === 'loading' && (
        <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          주소 검색 창을 불러오고 있습니다.
        </p>
      )}
      {status === 'error' && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background text-sm"
        >
          <p>주소 검색 창을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus('loading');
              setAttempt((n) => n + 1);
            }}
          >
            다시 시도
          </Button>
        </div>
      )}
    </div>
  );
}
