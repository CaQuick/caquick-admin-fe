import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { messageFor } from '@/shared/api';
import { formatCount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { PageHeader } from '@/shared/ui/page-header';
import { Textarea } from '@/shared/ui/textarea';

import { activeUserCountQueryOptions, sendNotification } from '../api/queries';
import { RecipientField } from '../components/recipient-field';
import { NOTIFICATION_TYPES, TARGET_KINDS, confirmMessage } from '../meta';
import { type SendValues, newIdempotencyKey, sendSchema, toSendInput } from '../schema';

interface Result {
  sentCount: number;
  skippedAccountIds: string[];
  broadcastId: string;
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
  const qc = useQueryClient();
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
      accountIds: [],
    },
  });
  const { errors, isSubmitting } = form.formState;
  const type = form.watch('type');
  const targetKind = form.watch('targetKind');
  const pickedCount = form.watch('accountIds').length;
  const activeUsers = useQuery({
    ...activeUserCountQueryOptions(),
    enabled: targetKind === 'ALL_USERS',
  });

  const send = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    const values = form.getValues();
    setError(null);
    try {
      const r = await sendNotification(qc, toSendInput(values, key));
      setResult({ ...r, title: values.title });
      form.reset();
      setKey(newIdempotencyKey());
    } catch (e) {
      // 같은 키로 재시도 — BE가 첫 응답을 재생하므로 중복 발송이 없다
      const message = messageFor(e);
      setError(message);
      // 다이얼로그가 열린 동안 폼 상단 문구는 가려진다
      toast.error(message);
      throw e;
    }
  };

  return (
    <>
      <PageHeader
        title="새 알림 보내기"
        back={{ to: '/notifications', label: '발송 이력으로' }}
        description="대상이 많으면 모두 도착하기까지 몇 분 걸릴 수 있습니다. 보낸 알림은 발송 이력에서 다시 볼 수 있습니다."
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
                <p className="text-xs text-muted-foreground">
                  {NOTIFICATION_TYPES.find((t) => t.value === type)?.help}
                </p>
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
                    options={TARGET_KINDS}
                    onChange={field.onChange}
                  />
                )}
              />
              {targetKind === 'ALL_USERS' ? (
                <p className="text-xs text-muted-foreground">
                  보내는 시점에 이용 중인 구매자 전체가 받습니다. 정지·탈퇴한 계정은 받지 않습니다.
                </p>
              ) : (
                <Controller
                  control={form.control}
                  name="accountIds"
                  render={({ field }) => (
                    <RecipientField
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.accountIds?.message}
                    />
                  )}
                />
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <ConfirmDialog
              trigger={
                <Button type="button" disabled={isSubmitting}>
                  보내기
                </Button>
              }
              title="알림을 보낼까요?"
              description={confirmMessage(targetKind, pickedCount, activeUsers.data)}
              confirmLabel="보내기"
              onConfirm={send}
            />
          </div>
        </form>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">방금 보낸 알림</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {result ? (
              <>
                <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm tabular-nums">
                  <dt className="text-muted-foreground">제목</dt>
                  <dd className="truncate">{result.title}</dd>
                  <dt className="text-muted-foreground">대상 수</dt>
                  <dd>{formatCount(result.sentCount)}명</dd>
                  <dt className="text-muted-foreground">받지 못한 계정</dt>
                  <dd>
                    {result.skippedAccountIds.length === 0
                      ? '없음'
                      : `${formatCount(result.skippedAccountIds.length)}개(탈퇴·정지 등): ${result.skippedAccountIds.slice(0, 20).join(', ')}${result.skippedAccountIds.length > 20 ? ' 외' : ''}`}
                  </dd>
                </dl>
                <Button asChild variant="outline" size="sm" className="self-start">
                  <Link to="/notifications" search={{ broadcastId: result.broadcastId }}>
                    발송 이력에서 보기
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                이 화면에서 보낸 알림의 결과가 여기에 표시됩니다.
              </p>
            )}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">요청 번호</summary>
              <p className="mt-1">
                같은 요청 번호로 다시 보내면 한 번만 발송됩니다. 보내기에 실패해 다시 시도할 때
                중복으로 보내지 않도록 쓰입니다.
              </p>
              <p className="mt-1 font-mono break-all">{key}</p>
            </details>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
