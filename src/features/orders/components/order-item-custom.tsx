import {
  areaToPercent,
  ColorSwatch,
  customModeLabel,
  imageKindLabel,
  SLOT_TEXT_STATE_LABEL,
  slotTextState,
  splitCustomImages,
  textAlignLabel,
} from '@/features/custom';
import { type AdminOrderQuery } from '@/graphql/generated/graphql';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

type Item = AdminOrderQuery['adminOrder']['items'][number];
type CustomText = Item['customTexts'][number];
type FreeEdit = Item['freeEdits'][number];
type CustomImage = Item['customImages'][number];

const bySortOrder = (a: { sortOrder: number }, b: { sortOrder: number }) =>
  a.sortOrder - b.sortOrder;

/** 품목의 커스텀 내용. 관리자 화면에는 렌더러가 없어 구매자가 올린 이미지와 주문 시점 스냅샷으로 확인한다 */
export function OrderItemCustom({ item }: { item: Item }) {
  const { top, sides, composite } = splitCustomImages(item.customImages);
  // 슬롯형의 대표 이미지가 곧 합성 이미지다
  const compositeUrl =
    composite?.imageUrl ?? (item.customMode === 'SLOT' ? item.customPreviewImageUrl : null);
  const texts = [...item.customTexts].sort(bySortOrder);
  const edits = [...item.freeEdits].sort(bySortOrder);
  const hasRenders = top !== null || sides.length > 0;
  const hasSlot = compositeUrl !== null || texts.length > 0;
  if (item.customMode === 'NONE' && !hasRenders && !hasSlot && edits.length === 0) return null;
  return (
    <section
      aria-label="커스텀 내용"
      className="mt-2 flex flex-col gap-3 rounded-md border p-3 text-xs"
    >
      <Badge variant="outline">
        커스텀{item.customMode === 'NONE' ? '' : ` · ${customModeLabel(item.customMode)}`}
      </Badge>
      {hasRenders && <RenderImages top={top} sides={sides} />}
      {hasSlot && <SlotTexts compositeUrl={compositeUrl} texts={texts} />}
      {edits.length > 0 && <FreeEdits baseImageUrl={item.customBaseImageUrl} edits={edits} />}
    </section>
  );
}

/** 이미지를 새 탭에서 원본으로 연다. 아래 글자로 어느 면인지 보인다 */
function ImageLink({ url, label, className }: { url: string; label: string; className: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={`${label} 원본 보기(새 탭)`}
      className="flex flex-col items-center gap-1"
    >
      <img
        src={url}
        alt=""
        loading="lazy"
        className={cn('rounded-md border bg-surface-tint object-cover', className)}
      />
      <span className="text-muted-foreground">{label}</span>
    </a>
  );
}

// 모르는 종류는 3D 렌더라고 단정하지 않고 원문으로 보인다
const renderLabel = ({ kind }: CustomImage) =>
  kind.startsWith('THREE_D_') ? `3D ${imageKindLabel(kind)}` : imageKindLabel(kind);

function RenderImages({ top, sides }: { top: CustomImage | null; sides: CustomImage[] }) {
  return (
    <div>
      <div className="mb-1 text-muted-foreground">3D 렌더 이미지</div>
      <ul aria-label="3D 렌더 이미지" className="flex flex-wrap items-end gap-2">
        {top && (
          <li>
            <ImageLink url={top.imageUrl} label={renderLabel(top)} className="size-40" />
          </li>
        )}
        {sides.map((image) => (
          <li key={image.id}>
            <ImageLink url={image.imageUrl} label={renderLabel(image)} className="size-20" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlotTexts({ compositeUrl, texts }: { compositeUrl: string | null; texts: CustomText[] }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      {compositeUrl && <ImageLink url={compositeUrl} label="합성 이미지" className="size-40" />}
      {texts.length > 0 && (
        <div className="min-w-0 flex-1">
          <Table aria-label="문구 자리" className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>문구 자리</TableHead>
                <TableHead>입력 문구</TableHead>
                <TableHead>기본 문구 대비</TableHead>
                <TableHead>글자색</TableHead>
                <TableHead>정렬</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {texts.map((t) => {
                const state = slotTextState(t);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.label}</TableCell>
                    <TableCell className="break-words whitespace-pre-wrap">
                      {state === 'EMPTY' ? '—' : t.valueText}
                    </TableCell>
                    <TableCell>
                      {SLOT_TEXT_STATE_LABEL[state]}
                      {state === 'CHANGED' && (
                        <span className="block whitespace-pre-wrap text-muted-foreground">
                          기본: {t.defaultText}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ColorSwatch color={t.textColor} />
                    </TableCell>
                    <TableCell>{textAlignLabel(t.textAlign)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/** 바탕 위 번호 영역과 영역별 요청 문구·참고 사진. 영역 번호는 요청 순서다 */
function FreeEdits({ baseImageUrl, edits }: { baseImageUrl: string | null; edits: FreeEdit[] }) {
  return (
    <div>
      <div className="mb-1 text-muted-foreground">자유 편집 {edits.length}건</div>
      <div className="flex flex-wrap items-start gap-3">
        {baseImageUrl && (
          <figure
            aria-label="바탕 위 자유 편집 영역"
            className="relative w-48 shrink-0 overflow-hidden rounded-md border"
          >
            <img src={baseImageUrl} alt="바탕 이미지" className="block h-auto w-full" />
            {edits.map((e, i) => (
              <span
                key={e.id}
                data-area={i + 1}
                className="absolute border-2 border-primary bg-primary/10"
                style={areaToPercent(e)}
              >
                <span className="absolute top-0 left-0 bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </span>
            ))}
          </figure>
        )}
        <ol className="flex min-w-0 flex-1 flex-col gap-2">
          {edits.map((e, i) => (
            <FreeEditRow key={e.id} n={i + 1} edit={e} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function FreeEditRow({ n, edit }: { n: number; edit: FreeEdit }) {
  const photos = [...edit.attachments].sort(bySortOrder);
  return (
    <li aria-label={`자유 편집 ${n}`} className="flex gap-2 rounded-md border p-2">
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-primary-foreground"
      >
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div>
          <div className="text-muted-foreground">요청 문구</div>
          <p className="break-words whitespace-pre-wrap">
            {edit.descriptionText.trim() ? edit.descriptionText : '요청 문구가 없습니다.'}
          </p>
        </div>
        {photos.length > 0 && (
          <div>
            <div className="text-muted-foreground">참고 사진 {photos.length}장</div>
            <ul aria-label={`자유 편집 ${n} 참고 사진`} className="mt-1 flex flex-wrap gap-1.5">
              {photos.map((a, i) => (
                <li key={a.id}>
                  <a href={a.imageUrl} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={a.imageUrl}
                      alt={`자유 편집 ${n} 참고 사진 ${i + 1}`}
                      className="size-12 rounded-md border object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}
