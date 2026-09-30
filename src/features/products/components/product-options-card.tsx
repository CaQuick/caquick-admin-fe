import { type AdminProductQuery } from '@/graphql/generated/graphql';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { StatusPill } from '@/shared/ui/status-pill';

import { formatPriceDelta, optionGroupWarnings, selectionRule } from '../option-rules';
import { WarningBadge } from './warning-badge';

type OptionGroup = AdminProductQuery['adminProduct']['optionGroups'][number];

/** 옵션 그룹과 선택지. 구매자가 주문할 수 없게 만드는 구성은 그룹마다 경고 배지로 알린다 */
export function ProductOptionsCard({ optionGroups }: { optionGroups: OptionGroup[] }) {
  const blocked = optionGroups.some((g) => optionGroupWarnings(g).some((w) => w.blocksOrder));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">옵션 그룹 {optionGroups.length}개</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {blocked && (
          <p
            role="alert"
            className="rounded-md bg-negative-soft px-3 py-2 text-negative-foreground"
          >
            옵션 구성 때문에 구매자가 이 상품을 주문할 수 없습니다. 그룹의 경고 배지를 가리키면
            이유를 볼 수 있습니다.
          </p>
        )}
        {optionGroups.length === 0 ? (
          <p className="text-muted-foreground">등록된 옵션이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {optionGroups.map((g) => (
              <OptionGroupItem key={g.id} group={g} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function OptionGroupItem({ group: g }: { group: OptionGroup }) {
  return (
    <li className="rounded-lg border p-3" aria-label={`옵션 그룹 ${g.name}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold">{g.name}</span>
        <StatusPill tone={g.isRequired ? 'primary' : 'neutral'}>
          {g.isRequired ? '필수' : '선택 사항'}
        </StatusPill>
        <span className="text-xs text-muted-foreground">{selectionRule(g)}</span>
        {!g.isActive && <StatusPill tone="neutral">숨김</StatusPill>}
        {optionGroupWarnings(g).map((w) => (
          <WarningBadge
            key={w.label}
            label={w.label}
            reason={w.reason}
            tone={w.blocksOrder ? 'negative' : 'caution'}
          />
        ))}
      </div>
      {g.description && (
        <p className="mt-1 whitespace-pre-line text-muted-foreground">{g.description}</p>
      )}
      {g.optionItems.length === 0 ? (
        <p className="mt-2 text-muted-foreground">선택지가 없습니다.</p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-divider">
          {g.optionItems.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
              <span className="size-10 shrink-0 overflow-hidden rounded-md border bg-surface-tint">
                {item.imageUrl && (
                  <a href={item.imageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={item.imageUrl}
                      alt={`${item.title} 이미지`}
                      className="size-full object-cover"
                    />
                  </a>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{item.title}</span>
                  {!item.isActive && <StatusPill tone="neutral">숨김</StatusPill>}
                </span>
                {item.description && (
                  <span className="block whitespace-pre-line text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </span>
              <span className="shrink-0 tabular-nums">{formatPriceDelta(item.priceDelta)}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
