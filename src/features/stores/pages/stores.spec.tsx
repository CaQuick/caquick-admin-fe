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
const row = {
  id: '17',
  sellerAccountId: '20',
  storeName: '루미 케이크',
  storePhone: '02-1',
  addressFull: '서울 강남구',
  regionId: '5',
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};
const detail = (isActive = true) => ({
  store: {
    ...row,
    isActive,
    addressCity: '서울',
    addressDistrict: '강남구',
    addressNeighborhood: null,
    latitude: '37.5',
    longitude: '127.0',
    mapProvider: 'NAVER',
    websiteUrl: null,
    businessHoursText: '10:00-20:00',
    profileImageUrl: null,
    greetingMessage: null,
    pickupSlotIntervalMinutes: 30,
    minLeadTimeMinutes: 60,
    maxDaysAhead: 14,
  },
  seller: { accountId: '20', username: 'seller20', email: null, name: '박사장', status: 'ACTIVE' },
  productCount: 12,
  orderItemCount: 340,
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

describe('매장', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('목록: 활성 필터를 boolean으로 보낸다', async () => {
    let input: Record<string, unknown> | undefined;
    server.use(
      graphql.query('AdminStores', ({ variables }) => {
        input = (variables as { input: Record<string, unknown> }).input;
        return HttpResponse.json({
          data: { adminStores: { items: [row], totalCount: 1, hasMore: false, nextCursor: null } },
        });
      }),
    );
    boot('/stores?active=false&regionId=5');
    expect(await screen.findByRole('link', { name: '루미 케이크' })).toHaveAttribute(
      'href',
      '/stores/17',
    );
    expect(input).toMatchObject({ isActive: false, regionId: '5', keyword: null });
  });

  it('상세: 비활성화(사유 선택) → 활성화, 수정 탭은 바뀐 필드만 저장', async () => {
    let active = true;
    let setInput: unknown;
    let updateInput: unknown;
    server.use(
      graphql.query('AdminStore', () =>
        HttpResponse.json({ data: { adminStore: detail(active) } }),
      ),
      graphql.mutation('AdminSetStoreActive', ({ variables }) => {
        setInput = (variables as { input: { isActive: boolean } }).input;
        active = (variables as { input: { isActive: boolean } }).input.isActive;
        return HttpResponse.json({ data: { adminSetStoreActive: { id: '17', isActive: active } } });
      }),
      graphql.mutation('AdminUpdateStoreBasicInfo', ({ variables }) => {
        updateInput = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: { adminUpdateStoreBasicInfo: { id: '17', updatedAt: 'z' } },
        });
      }),
    );
    boot('/stores/17');
    expect(
      await screen.findByRole('heading', { level: 2, name: '루미 케이크' }),
    ).toBeInTheDocument();
    expect(screen.getByText('340건')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '매장 비활성화' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '비활성화' }));
    await vi.waitFor(() =>
      expect(setInput).toEqual({ storeId: '17', isActive: false, reason: null }),
    );
    expect(await screen.findByRole('button', { name: '매장 활성화' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '기본정보 수정' }));
    const name = await screen.findByLabelText(/^매장명/);
    await userEvent.clear(name);
    await userEvent.type(name, '루미 케이크 본점');
    await userEvent.clear(screen.getByLabelText('시/군/구'));
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await vi.waitFor(() =>
      expect(updateInput).toEqual({
        storeId: '17',
        storeName: '루미 케이크 본점',
        addressDistrict: null,
      }),
    );
  });

  it('수정 저장 실패는 폼 상단 오류', async () => {
    server.use(
      gqlOk('AdminStore', { adminStore: detail() }),
      gqlError('AdminUpdateStoreBasicInfo', {
        message: '지역이 없습니다.',
        code: 'REGION_NOT_FOUND',
        classification: 'BAD_USER_INPUT',
        statusCode: 400,
      }),
    );
    boot('/stores/17');
    await userEvent.click(await screen.findByRole('tab', { name: '기본정보 수정' }));
    await userEvent.type(await screen.findByLabelText(/^지역 ID/), '9');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('지역이 없습니다.');
  });

  it('없는 매장은 NOT_FOUND', async () => {
    server.use(
      gqlError('AdminStore', {
        message: '매장 없음',
        code: 'STORE_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/stores/999');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('매장 없음');
  });
});
