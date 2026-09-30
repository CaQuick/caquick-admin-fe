import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';

import { CursorPager } from './cursor-pager';

const TOTAL = 45;
const LIMIT = 20;

/** 커서 = 앞에서 건너뛴 건수. 서버처럼 다음 커서만 준다 */
function pageAt(cursor: string | undefined, limit = LIMIT) {
  const start = cursor === undefined ? 0 : Number(cursor.slice(1));
  const end = Math.min(start + limit, TOTAL);
  return {
    totalCount: TOTAL,
    hasMore: end < TOTAL,
    nextCursor: end < TOTAL ? `c${end}` : null,
    items: Array.from({ length: end - start }, (_, i) => start + i),
  };
}

interface Search {
  cursor?: string;
  limit?: number;
  q?: string;
}

let setSearchFromOutside: (s: Search) => void = () => undefined;

function Harness({ initial = {} }: { initial?: Search }) {
  const [search, setSearch] = useState<Search>(initial);
  // 주소창·뒤로가기처럼 밖에서 검색 파라미터를 바꾸는 경우를 흉내 낸다
  useEffect(() => {
    setSearchFromOutside = setSearch;
  }, []);
  return (
    <CursorPager
      page={pageAt(search.cursor, search.limit)}
      search={search}
      onCursorChange={(cursor) => setSearch((s) => ({ ...s, cursor }))}
    />
  );
}

const button = (name: string) => screen.queryByRole('button', { name });

describe('CursorPager', () => {
  it('다음으로 가며 지나온 커서를 쌓고, 이전으로 한 페이지씩 돌아온다', async () => {
    render(<Harness />);
    expect(screen.getByText('1–20 / 전체 45건')).toBeInTheDocument();
    expect(button('이전')).not.toBeInTheDocument();
    expect(button('처음')).not.toBeInTheDocument();

    await userEvent.click(button('다음')!);
    expect(screen.getByText('21–40 / 전체 45건')).toBeInTheDocument();
    await userEvent.click(button('다음')!);
    expect(screen.getByText('41–45 / 전체 45건')).toBeInTheDocument();
    expect(button('다음')).toBeDisabled();

    await userEvent.click(button('이전')!);
    expect(screen.getByText('21–40 / 전체 45건')).toBeInTheDocument();
    await userEvent.click(button('이전')!);
    expect(screen.getByText('1–20 / 전체 45건')).toBeInTheDocument();
    expect(button('이전')).not.toBeInTheDocument();
  });

  it('처음으로 가면 첫 구간이고, 다시 다음을 누르면 스택을 새로 쌓는다', async () => {
    render(<Harness />);
    await userEvent.click(button('다음')!);
    await userEvent.click(button('다음')!);
    await userEvent.click(button('처음')!);
    expect(screen.getByText('1–20 / 전체 45건')).toBeInTheDocument();
    expect(button('이전')).not.toBeInTheDocument();
    await userEvent.click(button('다음')!);
    await userEvent.click(button('이전')!);
    expect(screen.getByText('1–20 / 전체 45건')).toBeInTheDocument();
  });

  it('목록 조건(필터)이 바뀌면 지나온 커서를 비운다', async () => {
    render(<Harness />);
    await userEvent.click(button('다음')!);
    await userEvent.click(button('다음')!);
    expect(button('이전')).toBeInTheDocument();

    // 필터를 바꾸면서 커서를 유지한 경우에도 이전 목록의 커서로 돌아가지 않는다
    act(() => setSearchFromOutside({ cursor: 'c40', q: '케이크' }));
    expect(button('이전')).not.toBeInTheDocument();
    expect(screen.getByText('전체 45건 중 5건 표시')).toBeInTheDocument();

    act(() => setSearchFromOutside({ q: '케이크' }));
    expect(screen.getByText('1–20 / 전체 45건')).toBeInTheDocument();
    await userEvent.click(button('다음')!);
    await userEvent.click(button('이전')!);
    expect(screen.getByText('1–20 / 전체 45건')).toBeInTheDocument();
  });

  it('페이지 크기가 바뀌어도 조건 변경으로 보고 비운다', async () => {
    render(<Harness />);
    await userEvent.click(button('다음')!);
    act(() => setSearchFromOutside({ cursor: 'c20', limit: 50 }));
    expect(button('이전')).not.toBeInTheDocument();
  });

  it('브라우저 뒤로가기처럼 밖에서 커서가 바뀌어도 쌓인 순서에서 위치를 찾는다', async () => {
    render(<Harness />);
    await userEvent.click(button('다음')!);
    await userEvent.click(button('다음')!);
    act(() => setSearchFromOutside({ cursor: 'c20' }));
    expect(screen.getByText('21–40 / 전체 45건')).toBeInTheDocument();
    await userEvent.click(button('이전')!);
    expect(screen.getByText('1–20 / 전체 45건')).toBeInTheDocument();
    // 앞으로가기
    act(() => setSearchFromOutside({ cursor: 'c40' }));
    expect(screen.getByText('41–45 / 전체 45건')).toBeInTheDocument();
    expect(button('이전')).toBeInTheDocument();
  });

  it('주소로 중간 페이지에 바로 들어오면 구간을 모르므로 건수만 보이고 이전은 없다', () => {
    render(<Harness initial={{ cursor: 'c20' }} />);
    expect(screen.getByText('전체 45건 중 20건 표시')).toBeInTheDocument();
    expect(button('이전')).not.toBeInTheDocument();
    expect(button('처음')).toBeInTheDocument();
  });

  it('limit을 구간 계산에 쓴다', async () => {
    render(<Harness initial={{ limit: 10 }} />);
    expect(screen.getByText('1–10 / 전체 45건')).toBeInTheDocument();
    await userEvent.click(button('다음')!);
    await userEvent.click(button('다음')!);
    expect(screen.getByText('21–30 / 전체 45건')).toBeInTheDocument();
  });

  it('결과가 없으면 0건으로 보인다', () => {
    render(
      <CursorPager
        page={{ totalCount: 0, hasMore: false, nextCursor: null, items: [] }}
        search={{}}
        onCursorChange={vi.fn()}
      />,
    );
    expect(screen.getByText('전체 0건 중 0건 표시')).toBeInTheDocument();
    expect(button('다음')).toBeDisabled();
  });

  it('불러오는 중에는 이동 버튼을 막는다', () => {
    render(
      <CursorPager
        page={pageAt('c20')}
        search={{ cursor: 'c20' }}
        onCursorChange={vi.fn()}
        isFetching
      />,
    );
    expect(button('다음')).toBeDisabled();
    expect(button('처음')).toBeDisabled();
  });
});
