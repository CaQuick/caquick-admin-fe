import { PlayIcon } from 'lucide-react';

import { type ReviewMediaType } from '@/graphql/generated/graphql';

interface Media {
  mediaType: ReviewMediaType;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  sortOrder: number;
}

/**
 * 리뷰 첨부 사진·동영상. 누르면 원본을 새 탭으로 연다.
 * 동영상은 인라인 재생하지 않는다 — CSP에 media-src가 없어 S3 동영상이 막힌다.
 */
export function ReviewMediaList({ media }: { media: readonly Media[] }) {
  if (media.length === 0)
    return <p className="text-sm text-muted-foreground">첨부한 사진·동영상이 없습니다.</p>;
  const sorted = [...media].sort((a, b) => a.sortOrder - b.sortOrder);
  let photo = 0;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="첨부 사진·동영상">
      {sorted.map((m, i) => {
        const video = m.mediaType === 'VIDEO';
        const name = video ? '동영상 열기' : `사진 ${++photo} 원본 보기`;
        const thumb = video ? m.thumbnailUrl : (m.thumbnailUrl ?? m.mediaUrl);
        return (
          <li key={`${m.sortOrder}-${i}`}>
            <a
              href={m.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name}(새 탭)`}
              className="relative flex size-20 items-center justify-center overflow-hidden rounded-md border bg-surface-tint text-xs text-muted-foreground hover:ring-2 hover:ring-ring"
            >
              {thumb && (
                <img src={thumb} alt="" loading="lazy" className="size-full object-cover" />
              )}
              {video && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-foreground/40 text-background">
                  <PlayIcon className="size-5" aria-hidden />
                  <span className="text-[11px]">동영상</span>
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
