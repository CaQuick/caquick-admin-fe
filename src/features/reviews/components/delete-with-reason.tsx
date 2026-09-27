import { useQueryClient } from '@tanstack/react-query';
import { Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { ReasonDialog } from '@/shared/ui/reason-dialog';

import { deleteReview, deleteReviewComment } from '../api/queries';

interface Props {
  kind: 'review' | 'comment';
  id: string;
  /** 이미 삭제된 대상은 버튼을 숨긴다 */
  deleted: boolean;
}

/** 리뷰·댓글 강제 삭제. 사유는 감사 로그와, 닫히는 신고의 메모에 남는다. */
export function DeleteWithReason({ kind, id, deleted }: Props) {
  const qc = useQueryClient();
  if (deleted) return null;
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
      title={`${label}을 삭제할까요?`}
      description={
        kind === 'review'
          ? '사진·댓글이 함께 내려가고, 대기 중인 신고는 삭제됨으로 닫힙니다.'
          : '대기 중인 신고는 삭제됨으로 닫힙니다.'
      }
      confirmLabel="삭제"
      destructive
      onConfirm={async (reason) => {
        try {
          if (kind === 'review') await deleteReview(qc, id, reason);
          else await deleteReviewComment(qc, id, reason);
          toast.success(`${label}을 삭제했습니다.`);
        } catch (e) {
          toast.error(messageFor(e));
          throw e;
        }
      }}
    />
  );
}
