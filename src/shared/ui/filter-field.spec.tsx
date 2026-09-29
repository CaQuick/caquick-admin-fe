import { render, screen, within } from '@testing-library/react';

import { FilterField } from './filter-field';
import { Input } from './input';

describe('FilterField', () => {
  it('보이는 라벨로 입력들을 한 묶음으로 이름 붙인다', () => {
    render(
      <FilterField label="주문일">
        <Input type="date" aria-label="주문일 시작" />
        <span>~</span>
        <Input type="date" aria-label="주문일 끝" />
      </FilterField>,
    );
    const group = screen.getByRole('group', { name: '주문일' });
    expect(within(group).getByText('주문일')).toBeVisible();
    expect(within(group).getByLabelText('주문일 시작')).toBeInTheDocument();
    expect(within(group).getByLabelText('주문일 끝')).toBeInTheDocument();
  });
});
