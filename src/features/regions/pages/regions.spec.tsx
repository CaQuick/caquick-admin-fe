import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { gqlOk, restOk } from '@/test/msw/graphql';
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
const seoul = {
  id: '1',
  parentId: null,
  level: 1,
  name: '서울',
  slug: 'seoul',
  sortOrder: 0,
  isActive: true,
  centerLat: null,
  centerLng: null,
  storeCount: 0,
  childCount: 1,
  createdAt: 'x',
  updatedAt: 'y',
};
const busan = { ...seoul, id: '2', name: '부산', slug: 'busan', childCount: 0 };
const gangnam = {
  id: '5',
  parentId: '1',
  level: 2,
  name: '강남구',
  slug: 'gangnam',
  sortOrder: 0,
  isActive: true,
  centerLat: null,
  centerLng: null,
  storeCount: 3,
  childCount: 0,
  createdAt: 'x',
  updatedAt: 'y',
};

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

describe('지역', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('권역 선택 → 하위 목록, 하위 추가·수정, 매장 있는 지역은 삭제 불가', async () => {
    const inputs: Record<string, unknown>[] = [];
    let created: unknown;
    let updated: unknown;
    let deleted: unknown;
    server.use(
      graphql.query('AdminRegions', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        inputs.push(input);
        return HttpResponse.json({
          data: {
            adminRegions: input.parentId === '1' ? [gangnam] : input.parentId ? [] : [seoul, busan],
          },
        });
      }),
      graphql.mutation('AdminCreateRegion', ({ variables }) => {
        created = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminCreateRegion: { id: '6' } } });
      }),
      graphql.mutation('AdminUpdateRegion', ({ variables }) => {
        updated = (variables as { input: unknown }).input;
        return HttpResponse.json({ data: { adminUpdateRegion: { id: '5' } } });
      }),
      graphql.mutation('AdminDeleteRegion', ({ variables }) => {
        deleted = variables;
        return HttpResponse.json({ data: { adminDeleteRegion: true } });
      }),
    );
    boot('/regions');
    expect(await screen.findByText('서울')).toBeInTheDocument();
    expect(inputs[0]).toEqual({ parentId: null, includeInactive: false });
    expect(screen.getByText('왼쪽에서 권역을 고르세요.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '서울 선택' }));
    expect(await screen.findByText('강남구')).toBeInTheDocument();
    expect(window.location.search).toContain('parent=');
    expect(screen.getByRole('button', { name: '강남구 삭제' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '하위 추가' }));
    let dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('서울 아래 2단계(시·군·구) 추가');
    await userEvent.type(within(dialog).getByLabelText('이름'), '서초구');
    await userEvent.type(within(dialog).getByLabelText('slug'), 'Seocho');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    expect(await within(dialog).findByText('소문자·숫자·- 만')).toBeInTheDocument();
    await userEvent.clear(within(dialog).getByLabelText('slug'));
    await userEvent.type(within(dialog).getByLabelText('slug'), 'seocho');
    await userEvent.type(within(dialog).getByLabelText('중심 위도'), '37.48');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    await vi.waitFor(() =>
      expect(created).toEqual({
        parentId: '1',
        name: '서초구',
        slug: 'seocho',
        sortOrder: 0,
        isActive: true,
        centerLat: '37.48',
        centerLng: null,
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: '강남구 수정' }));
    dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('switch', { name: '활성' }));
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    await vi.waitFor(() => expect(updated).toEqual({ regionId: '5', isActive: false }));

    await userEvent.click(screen.getByRole('button', { name: '부산 삭제' }));
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ regionId: '2' }));
  });

  it.each([
    { title: '선택한 권역이 활성이면 하위 추가 버튼을 보여준다', isActive: true, canAdd: true },
    { title: '선택한 권역이 비활성이면 버튼 대신 안내를 보여준다', isActive: false, canAdd: false },
  ])('$title', async ({ isActive, canAdd }) => {
    server.use(gqlOk('AdminRegions', { adminRegions: [{ ...seoul, isActive }] }));
    boot('/regions?parent=1&inactive=true');
    expect(await screen.findByText('서울 › 2단계')).toBeInTheDocument();
    expect(!!screen.queryByRole('button', { name: '하위 추가' })).toBe(canAdd);
    expect(!!screen.queryByText('비활성 권역에는 하위를 추가할 수 없습니다.')).toBe(!canAdd);
  });

  it('비활성 포함 스위치는 요청에 반영된다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminRegions', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({ data: { adminRegions: [seoul] } });
      }),
    );
    boot('/regions');
    await screen.findByText('서울');
    await userEvent.click(screen.getByRole('switch', { name: '비활성 포함' }));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toEqual({ parentId: null, includeInactive: true }),
    );
  });
});
