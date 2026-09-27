import { type ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTable } from './data-table';

interface Row {
  id: string;
  name: string;
  amount: number;
}
const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'amount', header: '금액', meta: { align: 'right' } },
];
const rows: Row[] = [
  { id: 'a', name: '루미', amount: 1000 },
  { id: 'b', name: '모모', amount: 2500 },
];

describe('DataTable', () => {
  it('행을 렌더하고 클릭을 전달한다', async () => {
    const onRowClick = vi.fn();
    render(
      <DataTable columns={columns} data={rows} getRowId={(r) => r.id} onRowClick={onRowClick} />,
    );
    expect(screen.getByRole('columnheader', { name: '금액' })).toHaveClass('text-right');
    await userEvent.click(screen.getByText('모모'));
    expect(onRowClick).toHaveBeenCalledWith(rows[1]);
  });

  it('비어 있으면 안내 문구', () => {
    render(<DataTable columns={columns} data={[]} getRowId={(r) => r.id} emptyMessage="없음" />);
    expect(screen.getByText('없음')).toBeInTheDocument();
  });

  it('로딩 중에는 스켈레톤 행', () => {
    render(
      <DataTable columns={columns} data={[]} getRowId={(r) => r.id} isLoading skeletonRows={3} />,
    );
    expect(screen.getAllByRole('row', { hidden: true })).toHaveLength(4); // 헤더 1 + 스켈레톤 3
  });
});
