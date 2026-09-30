import { type AdminProductQuery } from '@/graphql/generated/graphql';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { StatusPill } from '@/shared/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

type Template = NonNullable<AdminProductQuery['adminProduct']['customTemplate']>;

/** 케이크 문구 커스텀 템플릿 요약. 바탕 이미지와 문구 칸 구성만 보이고 위치는 보이지 않는다 */
export function ProductTemplateCard({ template }: { template: Template | null | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">문구 커스텀 템플릿</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {!template ? (
          <p className="text-muted-foreground">등록된 템플릿이 없습니다.</p>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <a href={template.baseImageUrl} target="_blank" rel="noreferrer">
                <img
                  src={template.baseImageUrl}
                  alt="템플릿 바탕 이미지"
                  className="size-24 rounded-md border object-cover"
                />
              </a>
              <div className="flex flex-col gap-1">
                <StatusPill tone={template.isActive ? 'positive' : 'neutral'}>
                  {template.isActive ? '사용 중' : '사용 안 함'}
                </StatusPill>
                <span className="text-muted-foreground">
                  {template.isActive
                    ? '구매자가 이 템플릿에 문구를 입력할 수 있습니다.'
                    : '구매자 화면에 문구 입력이 열리지 않습니다.'}
                </span>
              </div>
            </div>
            {template.textTokens.length === 0 ? (
              <p className="text-muted-foreground">문구 칸이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>문구 칸 이름</TableHead>
                      <TableHead>기본 문구</TableHead>
                      <TableHead className="text-right">최대 글자 수</TableHead>
                      <TableHead>필수 입력</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {template.textTokens.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.tokenKey}</TableCell>
                        <TableCell className="whitespace-pre-line">
                          {t.defaultText || '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{t.maxLength}자</TableCell>
                        <TableCell>{t.isRequired ? '필수' : '선택'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
