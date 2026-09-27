import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { gqlError, gqlOk, restOk } from '@/test/msw/graphql';
import { server } from '@/test/msw/server';

const me = {
  accountId: '1',
  username: 'ops.admin',
  email: null,
  name: null,
  status: 'ACTIVE',
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-09-27T00:00:00.000Z',
};
const cat = (id: string, name: string, isActive = true) => ({
  id,
  categoryType: 'EVENT',
  name,
  description: null,
  sortOrder: 0,
  isActive,
  productCount: 2,
  createdAt: 'x',
  updatedAt: 'y',
});

function boot(path: string) {
  server.use(
    restOk('/admin/refresh', {
      accessToken: 'at',
      tokenType: 'Bearer',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    }),
    gqlOk('AdminMe', { adminMe: me }),
  );
  window.history.pushState({}, '', path);
  render(<App />);
}

describe('카테고리', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('타입 탭·비활성 포함이 요청에 반영되고, 추가·수정·삭제가 동작한다', async () => {
    const inputs: Record<string, unknown>[] = [];
    let created: unknown;
    let updated: unknown;
    let deleted: unknown;
    const items = [cat('1', '가을 시즌'), cat('2', '숨김', false)];
    server.use(
      graphql.query('AdminCategories', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        inputs.push(input);
        return HttpResponse.json({
          data: {
            adminCategories: input.includeInactive ? items : items.filter((c) => c.isActive),
          },
        });
      }),
      graphql.mutation('AdminCreateCategory', ({ variables }) => {
        created = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminCreateCategory: { id: '3' } } });
      }),
      graphql.mutation('AdminUpdateCategory', ({ variables }) => {
        updated = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminUpdateCategory: { id: '1' } } });
      }),
      graphql.mutation('AdminDeleteCategory', ({ variables }) => {
        deleted = variables;
        return HttpResponse.json({ data: { adminDeleteCategory: true } });
      }),
    );
    boot('/categories');
    expect(await screen.findByText('가을 시즌')).toBeInTheDocument();
    expect(screen.queryByText('숨김')).not.toBeInTheDocument();
    expect(inputs[0]).toEqual({ categoryType: 'EVENT', includeInactive: false });

    await userEvent.click(screen.getByRole('switch', { name: '비활성 포함' }));
    expect(await screen.findByText('숨김')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: '스타일' }));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toEqual({ categoryType: 'STYLE', includeInactive: true }),
    );

    await userEvent.click(screen.getByRole('button', { name: '카테고리 추가' }));
    let dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    expect(await within(dialog).findByText('이름은 필수입니다.')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText('이름'), '모던');
    await userEvent.clear(within(dialog).getByLabelText('정렬 순서'));
    await userEvent.type(within(dialog).getByLabelText('정렬 순서'), '5');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    await vi.waitFor(() =>
      expect(created).toEqual({
        categoryType: 'STYLE',
        name: '모던',
        description: null,
        sortOrder: 5,
        isActive: true,
      }),
    );
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: '가을 시즌 수정' }));
    dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('설명'), '9~11월');
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(updated).toEqual({
        categoryId: '1',
        name: '가을 시즌',
        description: '9~11월',
        sortOrder: 0,
        isActive: true,
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: '가을 시즌 삭제' }));
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ categoryId: '1' }));
  });

  it('중복 이름은 다이얼로그 안에 오류', async () => {
    server.use(
      gqlOk('AdminCategories', { adminCategories: [cat('1', '가을 시즌')] }),
      gqlError('AdminCreateCategory', {
        message: '같은 이름이 있습니다.',
        code: 'CATEGORY_NAME_TAKEN',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/categories');
    await userEvent.click(await screen.findByRole('button', { name: '카테고리 추가' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('이름'), '가을 시즌');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('같은 이름이 있습니다.');
  });
});

describe('태그', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('검색·추가·수정·삭제', async () => {
    const inputs: Record<string, unknown>[] = [];
    let created: unknown;
    let updated: unknown;
    let deleted: unknown;
    server.use(
      graphql.query('AdminTags', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({
          data: {
            adminTags: {
              items: [
                {
                  id: '7',
                  name: '비건',
                  productCount: 4,
                  createdAt: 'x',
                  updatedAt: '2026-09-01T00:00:00.000Z',
                },
              ],
              totalCount: 1,
              hasMore: false,
              nextCursor: null,
            },
          },
        });
      }),
      graphql.mutation('AdminCreateTag', ({ variables }) => {
        created = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminCreateTag: { id: '8' } } });
      }),
      graphql.mutation('AdminUpdateTag', ({ variables }) => {
        updated = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminUpdateTag: { id: '7' } } });
      }),
      graphql.mutation('AdminDeleteTag', ({ variables }) => {
        deleted = variables;
        return HttpResponse.json({ data: { adminDeleteTag: true } });
      }),
    );
    boot('/tags?q=%EB%B9%84');
    expect(await screen.findByText('비건')).toBeInTheDocument();
    expect(inputs[0]).toEqual({ limit: 20, cursor: null, keyword: '비' });

    await userEvent.click(screen.getByRole('button', { name: '태그 추가' }));
    let dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('이름'), '글루텐프리');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    await vi.waitFor(() => expect(created).toEqual({ name: '글루텐프리' }));

    await userEvent.click(screen.getByRole('button', { name: '비건 수정' }));
    dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByLabelText('이름');
    await userEvent.clear(name);
    await userEvent.type(name, '비건 케이크');
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    await vi.waitFor(() => expect(updated).toEqual({ tagId: '7', name: '비건 케이크' }));

    await userEvent.click(screen.getByRole('button', { name: '비건 삭제' }));
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ tagId: '7' }));
  });
});
