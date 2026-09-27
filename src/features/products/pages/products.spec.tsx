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
const product = (isActive = true) => ({
  id: '99',
  storeId: '17',
  storeName: '루미 케이크',
  name: '레터링 케이크',
  regularPrice: 45000,
  salePrice: 39000,
  currency: 'KRW',
  baseDesignImageUrl: 'https://img.test/base.png',
  isActive,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
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

describe('상품', () => {
  beforeEach(() =>
    useAuthStore.setState({ status: 'unknown', accessToken: null, mustChangePassword: false }),
  );

  it('목록: 판매가·정가 표시, 매장 ID 필터', async () => {
    let input: Record<string, unknown> | undefined;
    server.use(
      graphql.query('AdminProducts', ({ variables }) => {
        input = (variables as { input: Record<string, unknown> }).input;
        return HttpResponse.json({
          data: {
            adminProducts: { items: [product()], totalCount: 1, hasMore: false, nextCursor: null },
          },
        });
      }),
    );
    boot('/products?storeId=17&active=true');
    expect(await screen.findByRole('link', { name: '레터링 케이크' })).toHaveAttribute(
      'href',
      '/products/99',
    );
    expect(screen.getByText('39,000원')).toBeInTheDocument();
    expect(input).toMatchObject({ storeId: '17', isActive: true });
  });

  it('상세: 숨김 처리(사유 선택)와 매장 비활성 표시', async () => {
    let active = true;
    let setInput: unknown;
    server.use(
      graphql.query('AdminProduct', () =>
        HttpResponse.json({
          data: {
            adminProduct: {
              product: product(active),
              storeIsActive: false,
              description: '부드러운 생크림',
              purchaseNotice: null,
              preparationTimeMinutes: 120,
              imageUrls: ['https://img.test/1.png', 'https://img.test/2.png'],
              reviewCount: 8,
              orderItemCount: 55,
            },
          },
        }),
      ),
      graphql.mutation('AdminSetProductActive', ({ variables }) => {
        setInput = (variables as { input: { isActive: boolean } }).input;
        active = (variables as { input: { isActive: boolean } }).input.isActive;
        return HttpResponse.json({
          data: { adminSetProductActive: { id: '99', isActive: active } },
        });
      }),
    );
    boot('/products/99');
    expect(
      await screen.findByRole('heading', { level: 2, name: '레터링 케이크' }),
    ).toBeInTheDocument();
    expect(screen.getByText('매장 비활성')).toBeInTheDocument();
    expect(screen.getByText('이미지 2장')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '상품 숨김' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/^사유/), '규정 위반 이미지');
    await userEvent.click(within(dialog).getByRole('button', { name: '숨김' }));
    await vi.waitFor(() =>
      expect(setInput).toEqual({ productId: '99', isActive: false, reason: '규정 위반 이미지' }),
    );
    expect(await screen.findByRole('button', { name: '상품 노출' })).toBeInTheDocument();
  });

  it('없는 상품은 NOT_FOUND', async () => {
    server.use(
      gqlError('AdminProduct', {
        message: '상품 없음',
        code: 'PRODUCT_NOT_FOUND',
        classification: 'NOT_FOUND',
        statusCode: 404,
      }),
    );
    boot('/products/1');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('상품 없음');
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/products');
  });
});
