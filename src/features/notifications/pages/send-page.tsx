import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { PageHeader } from '@/shared/ui/page-header';
import { Textarea } from '@/shared/ui/textarea';

import { sendNotification } from '../api/queries';
import {
  NOTIFICATION_TYPES,
  type SendValues,
  newIdempotencyKey,
  parseAccountIds,
  sendSchema,
  toSendInput,
} from '../schema';

interface Result {
  sentCount: number;
  skippedAccountIds: string[];
  title: string;
}

function Radios<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className="rounded-lg border px-3 py-1.5 text-[13px] aria-checked:border-primary aria-checked:bg-primary-soft aria-checked:font-semibold aria-checked:text-primary-soft-foreground"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SendNotificationPage() {
  const [key, setKey] = useState(newIdempotencyKey);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const form = useForm<SendValues>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      type: 'SYSTEM',
      title: '',
      body: '',
      targetKind: 'ALL_USERS',
      accountIdsRaw: '',
    },
  });
  const { errors, isSubmitting } = form.formState;
  const targetKind = form.watch('targetKind');
  const idCount = parseAccountIds(form.watch('accountIdsRaw')).length;

  const send = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    const values = form.getValues();
    setError(null);
    try {
      const r = await sendNotification(toSendInput(values, key));
      setResult({ ...r, title: values.title });
      form.reset();
      setKey(newIdempotencyKey());
    } catch (e) {
      // 같은 키로 재시도 — BE가 첫 응답을 재생하므로 중복 발송이 없다
      setError(messageFor(e));
      throw e;
    }
  };

  return (
    <>
      <PageHeader
        title="알림 발송"
        description="대상은 요청 시점에 고정되고, 저장은 1,000명씩 백그라운드에서 진행됩니다. 발송 이력 조회 API는 없습니다."
      />
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <form noValidate onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
          {error && (
            <p
              role="alert"
              className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative-foreground"
            >
              {error}
            </p>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">내용</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>유형</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Radios
                      name="유형"
                      value={field.value}
                      options={NOTIFICATION_TYPES}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nt-title">제목</Label>
                <Input
                  id="nt-title"
                  maxLength={200}
                  aria-invalid={!!errors.title}
                  {...form.register('title')}
                />
                {errors.title && (
                  <p className="text-xs text-negative-foreground">{errors.title.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nt-body">본문</Label>
                <Textarea
                  id="nt-body"
                  rows={6}
                  maxLength={2000}
                  aria-invalid={!!errors.body}
                  {...form.register('body')}
                />
                {errors.body && (
                  <p className="text-xs text-negative-foreground">{errors.body.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">대상</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Controller
                control={form.control}
                name="targetKind"
                render={({ field }) => (
                  <Radios
                    name="대상"
                    value={field.value}
                    options={[
                      { value: 'ALL_USERS', label: '활성 구매자 전체' },
                      { value: 'ACCOUNT_IDS', label: '계정 ID 목록' },
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
              {targetKind === 'ACCOUNT_IDS' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nt-ids">계정 ID (쉼표·줄바꿈 구분, 최대 500)</Label>
                  <Textarea
                    id="nt-ids"
                    rows={4}
                    aria-invalid={!!errors.accountIdsRaw}
                    {...form.register('accountIdsRaw')}
                  />
                  <p
                    className={
                      errors.accountIdsRaw
                        ? 'text-xs text-negative-foreground'
                        : 'text-xs text-muted-foreground'
                    }
                  >
                    {errors.accountIdsRaw?.message ?? `${formatCount(idCount)}개 (중복 제거)`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <ConfirmDialog
              trigger={
                <Button type="button" disabled={isSubmitting}>
                  발송
                </Button>
              }
              title="알림을 보낼까요?"
              description={
                targetKind === 'ALL_USERS'
                  ? '활성 구매자 전체에게 갑니다. 되돌릴 수 없습니다.'
                  : `계정 ${formatCount(idCount)}개에 갑니다. 되돌릴 수 없습니다.`
              }
              confirmLabel="발송"
              onConfirm={send}
            />
          </div>
        </form>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">최근 발송 결과</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5 text-sm tabular-nums">
                <dt className="text-muted-foreground">제목</dt>
                <dd className="truncate">{result.title}</dd>
                <dt className="text-muted-foreground">대상 수</dt>
                <dd>{formatCount(result.sentCount)}명</dd>
                <dt className="text-muted-foreground">제외됨</dt>
                <dd>
                  {result.skippedAccountIds.length === 0
                    ? '없음'
                    : `${result.skippedAccountIds.length}개 — ${result.skippedAccountIds.slice(0, 20).join(', ')}${result.skippedAccountIds.length > 20 ? ' …' : ''}`}
                </dd>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                이 세션에서 보낸 결과가 여기에 표시됩니다.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              멱등 키: <span className="font-mono">{key}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
