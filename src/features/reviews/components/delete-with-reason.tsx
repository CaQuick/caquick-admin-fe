import { useQueryClient } from '@tanstack/react-query';
import { Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { withJosa } from '@/shared/lib/josa';
import { Button } from '@/shared/ui/button';
import { ReasonDialog } from '@/shared/ui/reason-dialog';

import { deleteReview, deleteReviewComment } from '../api/queries';

interface Props {
  kind: 'review' | 'comment';
  id: string;
  /** 이미 삭제된 대상은 버튼 대신 같은 폭의 빈자리를 둔다(행마다 옆 링크 위치가 어긋나지 않게) */
  deleted: boolean;
}

/** 리뷰·댓글 강제 삭제. 사유는 감사 로그와, 닫히는 신고의 메모에 남는다. */
export function DeleteWithReason({ kind, id, deleted }: Props) {
  const qc = useQueryClient();
  if (deleted) return <span className="inline-block size-8 shrink-0" aria-hidden />;
  const label = kind === 'review' ? '리뷰' : '댓글';
  return (
    <ReasonDialog
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-negative-foreground"
          aria-label={`${label} ${id} 삭제`}
        >
          <Trash2Icon className="size-4" />
        </Button>
      }
      title={`${withJosa(label, '을/를')} 삭제할까요?`}
      description={
        kind === 'review'
          ? '사진·댓글이 함께 내려가고, 대기 중인 신고는 처리 완료(대상 삭제)로 닫힙니다.'
          : '대기 중인 신고는 처리 완료(대상 삭제)로 닫힙니다.'
      }
      confirmLabel="삭제"
      destructive
      onConfirm={async (reason) => {
        try {
          if (kind === 'review') await deleteReview(qc, id, reason);
          else await deleteReviewComment(qc, id, reason);
          toast.success(`${withJosa(label, '을/를')} 삭제했습니다.`);
        } catch (e) {
          toast.error(messageFor(e));
          throw e;
        }
      }}
    />
  );
}
