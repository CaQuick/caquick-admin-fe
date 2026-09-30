import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type FormEvent, type ReactNode } from 'react';

import { CursorPager } from './cursor-pager';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from './dialog';
import { EntityPicker } from './entity-picker';
import { IconButton } from './icon-button';

/** 공용 컴포넌트의 보조 버튼은 폼 안에 놓여도 폼을 제출하지 않는다(type 기본값이 submit이라 명시가 필요). */
function renderInForm(ui: ReactNode) {
  const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <form onSubmit={onSubmit}>{ui}</form>
    </QueryClientProvider>,
  );
  return onSubmit;
}

const PAGE = { totalCount: 45, hasMore: true, nextCursor: 'c20', items: [1] };

describe('폼 안의 공용 보조 버튼', () => {
  it.each<[string, ReactNode, string]>([
    [
      'IconButton 기본',
      <IconButton key="i" label="새로 고침" onClick={() => undefined}>
        ↻
      </IconButton>,
      '새로 고침',
    ],
    [
      'EntityPicker 선택 해제',
      <EntityPicker
        key="e"
        label="매장"
        value="1"
        selectedLabel="루미 케이크"
        onChange={() => undefined}
        searchQuery={(k) =>
          queryOptions({ queryKey: ['safe', k], queryFn: () => Promise.resolve([]) })
        }
      />,
      '매장 선택 해제',
    ],
    [
      'CursorPager 다음',
      <CursorPager key="p" page={PAGE} search={{}} onCursorChange={() => undefined} />,
      '다음',
    ],
    [
      'CursorPager 처음',
      <CursorPager
        key="p"
        page={PAGE}
        search={{ cursor: 'c20' }}
        onCursorChange={() => undefined}
      />,
      '처음',
    ],
  ])('%s 버튼은 폼을 제출하지 않는다', async (_name, ui, buttonName) => {
    const onSubmit = renderInForm(ui);
    const button = screen.getByRole('button', { name: new RegExp(buttonName) });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('IconButton에 type을 명시하면 그 값을 쓴다', () => {
    renderInForm(
      <IconButton label="저장" type="submit">
        ✓
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: '저장' })).toHaveAttribute('type', 'submit');
  });

  it('다이얼로그 안 폼의 닫기 버튼은 폼을 제출하지 않는다', async () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>제목</DialogTitle>
          <DialogDescription>설명</DialogDescription>
          <form onSubmit={onSubmit}>
            <DialogFooter showCloseButton>
              <button type="submit">저장</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>,
    );
    const close = screen.getByRole('button', { name: '닫기' });
    expect(close).toHaveAttribute('type', 'button');
    await userEvent.click(close);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
