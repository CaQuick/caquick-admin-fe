import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCount } from '@/shared/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

import { type DashboardSummary } from './types';

const STATUS: { key: keyof DashboardSummary['orderCounts']; label: string }[] = [
  { key: 'submitted', label: '접수' },
  { key: 'confirmed', label: '확인' },
  { key: 'made', label: '제작 완료' },
  { key: 'pickedUp', label: '픽업 완료' },
  { key: 'canceled', label: '취소' },
];

/** 기간 내 주문 상태 분포. 단일 계열(진행 단계)이라 색 1개, 취소만 회색. 표는 스크린리더·색각 보조용. */
export function OrderStatusChart({ summary }: { summary: DashboardSummary }) {
  const data = STATUS.map((s) => ({ ...s, count: summary.orderCounts[s.key] }));
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <Card>
      <CardHeader className="flex-row items-baseline gap-2">
        <CardTitle className="text-sm">주문 상태 분포</CardTitle>
        <span className="text-xs text-muted-foreground">
          기간 내 생성 주문 {formatCount(total)}건
        </span>
      </CardHeader>
      <CardContent>
        <div className="h-56" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 16, right: 8, left: -16, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid vertical={false} stroke="var(--divider)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-tint)' }}
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [`${formatCount(Number(v))}건`, '주문']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {data.map((d) => (
                  <Cell
                    key={d.key}
                    fill={d.key === 'canceled' ? 'var(--chart-4)' : 'var(--chart-1)'}
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  style={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="sr-only">
          <caption>주문 상태별 건수</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.key}>
                <th scope="row">{d.label}</th>
                <td>{d.count}건</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
