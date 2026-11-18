import { ColorSwatch, customModeLabel, textAlignLabel } from '@/features/custom';
import { type AdminProductQuery, type CustomModeType } from '@/graphql/generated/graphql';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

type Template = NonNullable<AdminProductQuery['adminProduct']['customTemplate']>;

/** 커스텀 방식과 슬롯형 템플릿(바탕·자유 편집·문구 자리 스타일). 문구 자리 위치는 보이지 않는다 */
export function ProductCustomCard({
  mode,
  template,
}: {
  mode: CustomModeType;
  template: Template | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">커스텀 설정</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5">
          <dt className="text-muted-foreground">커스텀 방식</dt>
          <dd className="font-medium">{customModeLabel(mode)}</dd>
          {template && (
            <>
              <dt className="text-muted-foreground">자유 편집</dt>
              <dd>{template.freeEditEnabled ? '허용' : '허용 안 함'}</dd>
            </>
          )}
        </dl>
        {mode === 'THREE_D' && (
          <p className="text-muted-foreground">
            모양·크기·맛·디자인은 옵션 선택지의 3D 연결로 고릅니다. 3D 상품에는 자유 편집이
            없습니다.
          </p>
        )}
        {template ? (
          <TemplateSection template={template} unused={mode !== 'SLOT'} />
        ) : (
          mode === 'SLOT' && <p className="text-muted-foreground">등록된 템플릿이 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
}

function TemplateSection({ template, unused }: { template: Template; unused: boolean }) {
  const tokens = [...template.textTokens].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <>
      {unused && (
        <p className="text-muted-foreground">
          커스텀 방식이 슬롯형이 아니라 이 템플릿은 구매자에게 보이지 않습니다.
        </p>
      )}
      <a href={template.baseImageUrl} target="_blank" rel="noreferrer" className="w-fit">
        <img
          src={template.baseImageUrl}
          alt="템플릿 바탕 이미지"
          className="size-24 rounded-md border object-cover"
        />
      </a>
      {tokens.length === 0 ? (
        <p className="text-muted-foreground">문구 자리가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>문구 자리</TableHead>
                <TableHead>기본 문구</TableHead>
                <TableHead className="text-right">최대 글자 수</TableHead>
                <TableHead>필수 입력</TableHead>
                <TableHead>글자색</TableHead>
                <TableHead>정렬</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <span className="block font-medium">{t.label}</span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {t.tokenKey}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-pre-line">{t.defaultText || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.maxLength}자</TableCell>
                  <TableCell>{t.isRequired ? '필수' : '선택'}</TableCell>
                  <TableCell>
                    <ColorSwatch color={t.textColor} />
                  </TableCell>
                  <TableCell>{textAlignLabel(t.textAlign)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
