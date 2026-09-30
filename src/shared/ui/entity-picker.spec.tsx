import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type EntityOption, EntityPicker } from './entity-picker';

const STORES: EntityOption[] = [
  { id: '1', label: '루미 케이크', description: 'ID 1' },
  { id: '2', label: '달빛 베이커리', description: 'ID 2' },
  { id: '3', label: '루나 케이크', description: 'ID 3' },
];

interface SetupProps {
  label?: string;
  value?: string;
  selectedLabel?: string;
  idEntry?: boolean;
}

function setup(
  props: SetupProps = {},
  search: (keyword: string) => Promise<EntityOption[]> = (k) =>
    Promise.resolve(STORES.filter((s) => s.label.includes(k))),
) {
  const onChange = vi.fn();
  const queryFn = vi.fn(search);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <EntityPicker
        label="매장"
        value={undefined}
        onChange={onChange}
        searchQuery={(keyword) =>
          queryOptions({ queryKey: ['test-picker', keyword], queryFn: () => queryFn(keyword) })
        }
        {...props}
      />
    </QueryClientProvider>,
  );
  const trigger = screen.getByRole('combobox', { name: new RegExp(`^${props.label ?? '매장'}`) });
  return { onChange, queryFn, trigger };
}

const options = () => within(screen.getByRole('listbox')).getAllByRole('option');
const selectedOption = () => options().find((o) => o.getAttribute('aria-selected') === 'true');

describe('EntityPicker', () => {
  it('버튼은 닫힌 combobox이고 ↓로 열면 검색칸(combobox)과 결과 목록(listbox)을 보인다', async () => {
    const { trigger } = setup();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent('매장 선택');

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const input = screen.getByRole('combobox', { name: '매장 검색' });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
    expect(screen.getByRole('listbox')).toHaveAccessibleName('매장 검색 결과');
    expect(await screen.findByRole('option', { name: /루미 케이크/ })).toBeInTheDocument();
    expect(options()).toHaveLength(3);
  });

  it('↑↓로 옮기고 Enter로 고르면 ID를 넘기고 닫힌 뒤 버튼에 이름을 보인다', async () => {
    const { trigger, onChange } = setup();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('option', { name: /루미 케이크/ });
    expect(selectedOption()).toHaveTextContent('루미 케이크');

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(selectedOption()).toHaveTextContent('루나 케이크');
    const input = screen.getByRole('combobox', { name: '매장 검색' });
    expect(input).toHaveAttribute('aria-activedescendant', selectedOption()!.id);
    await userEvent.keyboard('{ArrowUp}');
    expect(selectedOption()).toHaveTextContent('달빛 베이커리');

    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('2', STORES[1]);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('Esc로 닫으면 아무것도 고르지 않고 버튼으로 포커스를 돌린다', async () => {
    const { trigger, onChange } = setup();
    await userEvent.click(trigger);
    await screen.findByRole('option', { name: /루미 케이크/ });
    await userEvent.keyboard('{ArrowDown}{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Enter·Space로도 연다', async () => {
    const { trigger } = setup();
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('입력을 잠시 멈추면 검색어로 다시 조회한다', async () => {
    const { trigger, queryFn } = setup();
    await userEvent.click(trigger);
    await screen.findByRole('option', { name: /루미 케이크/ });
    await userEvent.type(screen.getByRole('combobox', { name: '매장 검색' }), '루');
    await vi.waitFor(() => expect(options()).toHaveLength(2));
    expect(queryFn).toHaveBeenCalledWith('루');
    // 한 글자마다가 아니라 멈춘 뒤 한 번
    expect(queryFn.mock.calls.map(([k]) => k)).toEqual(['', '루']);
  });

  it('닫혀 있는 동안에는 조회하지 않는다', () => {
    const { queryFn } = setup();
    expect(queryFn).not.toHaveBeenCalled();
  });

  it('결과가 없으면 조사를 맞춘 안내를 보인다', async () => {
    const { trigger } = setup({ label: '상품' }, () => Promise.resolve([]));
    await userEvent.click(trigger);
    expect(await screen.findByText('찾는 상품이 없습니다.')).toBeInTheDocument();
  });

  it('조회에 실패하면 다시 시도하라고 안내한다', async () => {
    const { trigger } = setup({}, () => Promise.reject(new Error('down')));
    await userEvent.click(trigger);
    expect(
      await screen.findByText('목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'),
    ).toBeInTheDocument();
  });

  it.each([
    [{ value: '17' }, '#17'],
    [{ value: '17', selectedLabel: '별빛 케이크' }, '별빛 케이크'],
    [{ value: '0' }, '#0'],
  ])('선택값 %j 는 버튼에 %s 로 보인다', (props, text) => {
    const { trigger } = setup(props);
    expect(trigger).toHaveTextContent(text);
    expect(trigger).toHaveAccessibleName(`매장 ${text}`);
  });

  it('선택 해제 버튼은 undefined를 넘기고, 선택이 없으면 두지 않는다', async () => {
    const { onChange } = setup({ value: '0' });
    await userEvent.click(screen.getByRole('button', { name: '매장 선택 해제' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('선택이 없으면 해제 버튼이 없다', () => {
    setup();
    expect(screen.queryByRole('button', { name: '매장 선택 해제' })).not.toBeInTheDocument();
  });

  it('이미 고른 것을 다시 고르면 변경으로 알리지 않는다', async () => {
    const { trigger, onChange } = setup({ value: '1' });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: /루미 케이크/ }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('EntityPicker ID 직접 선택', () => {
  async function typeIn(
    text: string,
    props: SetupProps = {},
    search?: (keyword: string) => Promise<EntityOption[]>,
  ) {
    const ctx = setup(props, search);
    await userEvent.click(ctx.trigger);
    await userEvent.type(screen.getByRole('combobox', { name: '매장 검색' }), text);
    return ctx;
  }

  it('숫자를 입력하면 그 ID를 고르는 항목을 맨 위에 두고, 고르면 ID를 넘긴다', async () => {
    const { onChange } = await typeIn('17');
    const idOption = await screen.findByRole('option', { name: /#17.*ID로 선택/ });
    expect(options()[0]).toBe(idOption);
    await userEvent.click(idOption);
    expect(onChange).toHaveBeenCalledWith('17', expect.objectContaining({ id: '17' }));
  });

  it.each([
    ['숫자가 아닌 검색어', '루미', {}],
    ['ID 상한(2^64-1)을 넘는 숫자', '18446744073709551616', {}],
    ['idEntry=false', '17', { idEntry: false }],
  ] as const)('%s면 ID 항목을 두지 않는다', async (_case, text, props) => {
    await typeIn(text, props);
    await waitFor(() => expect(screen.queryByText('검색하고 있습니다.')).not.toBeInTheDocument());
    expect(screen.queryByRole('option', { name: /ID로 선택/ })).not.toBeInTheDocument();
  });

  it('검색 결과에 같은 ID가 있으면 ID 항목을 겹쳐 두지 않는다', async () => {
    await typeIn('2', {}, (k) => Promise.resolve(STORES.filter((store) => store.id === k)));
    expect(await screen.findByRole('option', { name: /달빛 베이커리/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /ID로 선택/ })).not.toBeInTheDocument();
    expect(options()).toHaveLength(1);
  });
});
