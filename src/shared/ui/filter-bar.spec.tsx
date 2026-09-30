import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { FilterBar } from './filter-bar';
import { IdFilterInput } from './id-filter-input';
import { Label } from './label';
import { Switch } from './switch';

function Harness() {
  const [store, setStore] = useState<string | undefined>(undefined);
  const [q, setQ] = useState<string | undefined>('케이크');
  return (
    <FilterBar
      keyword={q ?? ''}
      onKeywordSubmit={(v) => setQ(v || undefined)}
      hasActiveFilters={q !== undefined || store !== undefined}
      onReset={() => {
        setQ(undefined);
        setStore(undefined);
      }}
    >
      <IdFilterInput label="매장 ID" value={store} onCommit={setStore} />
    </FilterBar>
  );
}

describe('FilterBar', () => {
  it('초기화하면 URL 값이 그대로인 ID 필터의 잘못된 초안과 오류도 비운다', async () => {
    render(<Harness />);
    const id = screen.getByLabelText('매장 ID');
    await userEvent.type(id, 'abc');
    await userEvent.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('숫자만');

    await userEvent.click(screen.getByRole('button', { name: /초기화/ }));

    expect(screen.getByLabelText('매장 ID')).toHaveValue('');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    ['이모지 100자는 그대로', 100, 100],
    ['이모지 101자는 100자로 자른다', 101, 100],
  ])('검색어 길이는 코드 포인트로 센다: %s', async (_label, typed, kept) => {
    render(<Harness />);
    const input = screen.getByLabelText('검색어');
    await userEvent.clear(input);
    await userEvent.click(input);
    await userEvent.paste('😀'.repeat(typed));
    expect([...(input as HTMLInputElement).value]).toHaveLength(kept);
  });

  it('오른쪽 끝 슬롯은 초기화 버튼보다 뒤, 필터 줄의 마지막 요소로 그린다', () => {
    render(
      <FilterBar
        keyword=""
        onKeywordSubmit={() => undefined}
        hasActiveFilters
        onReset={() => undefined}
        trailing={
          <>
            <Switch id="t-deleted" />
            <Label htmlFor="t-deleted">삭제 포함</Label>
          </>
        }
      >
        <IdFilterInput label="매장 ID" value={undefined} onCommit={() => undefined} />
      </FilterBar>,
    );
    const toggle = screen.getByRole('switch', { name: '삭제 포함' });
    const bar = toggle.closest('[data-slot="filter-bar"]')!;
    const slot = bar.lastElementChild!;
    expect(slot).toContainElement(toggle);
    expect(slot).toHaveClass('ml-auto');
    const reset = screen.getByRole('button', { name: /초기화/ });
    expect(reset.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('onReset이 없으면 필터가 걸려 있어도 초기화 버튼을 두지 않는다', () => {
    render(<FilterBar hasActiveFilters trailing={<span>보기</span>} />);
    expect(screen.queryByRole('button', { name: /초기화/ })).toBeNull();
    expect(screen.getByText('보기').parentElement).toHaveAttribute(
      'data-slot',
      'filter-bar-trailing',
    );
  });
});
