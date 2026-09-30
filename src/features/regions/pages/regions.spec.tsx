import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, graphql } from 'msw';

import { App } from '@/app/app';
import { useAuthStore } from '@/features/auth';
import { installFakePostcode, postcodeResult } from '@/test/fakes';
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
// 활성 하위가 없어 childCount는 0이지만 숨긴 하위가 있다 — BE는 삭제를 거절한다
const incheon = { ...seoul, id: '3', name: '인천', slug: 'incheon', childCount: 0 };
const ganghwa = {
  ...seoul,
  id: '8',
  parentId: '3',
  level: 2,
  name: '강화군',
  slug: 'sgg-28710',
  isActive: false,
  childCount: 0,
};
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

  it('권역 선택 → 하위 목록, 하위 추가·수정, 연결이 있는 지역은 이유와 함께 삭제를 막는다', async () => {
    const inputs: Record<string, unknown>[] = [];
    let created: unknown;
    let updated: unknown;
    let deleted: unknown;
    server.use(
      graphql.query('AdminRegions', ({ variables }) => {
        const input = (variables as { input: Record<string, unknown> }).input;
        inputs.push(input);
        // parentId를 주지 않으면 BE는 전체(권역·시군구)를 준다
        const all = input.includeInactive
          ? [seoul, busan, incheon, gangnam, ganghwa]
          : [seoul, busan, incheon, gangnam];
        return HttpResponse.json({
          data: {
            adminRegions: input.parentId === '1' ? [gangnam] : input.parentId ? [] : all,
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
    expect(inputs).toContainEqual({ parentId: null, includeInactive: false });
    expect(screen.getByText('권역을 선택해 주세요.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '서울 선택' }));
    expect(await screen.findByText('강남구')).toBeInTheDocument();
    expect(window.location.search).toContain('parent=');
    expect(screen.getByRole('link', { name: '매장 3곳' })).toHaveAttribute(
      'href',
      '/stores?regionId=5',
    );

    // 삭제 불가: 버튼은 포커스·툴팁을 받되 누르면 아무 일도 없다
    const blocked = [
      ['강남구 삭제', '연결된 매장이 3곳 있어 삭제할 수 없습니다.'],
      ['서울 삭제', '하위 지역이 1곳(숨긴 지역 포함) 있어 삭제할 수 없습니다.'],
      ['인천 삭제', '하위 지역이 1곳(숨긴 지역 포함) 있어 삭제할 수 없습니다.'],
    ] as const;
    for (const [name, reason] of blocked) {
      const button = await screen.findByRole('button', { name });
      await vi.waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'true'));
      expect(button).toHaveAccessibleDescription(reason);
      await userEvent.click(button);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    }

    await userEvent.click(screen.getByRole('button', { name: '하위 추가' }));
    let dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('서울 아래 시·군·구 추가');
    await userEvent.type(within(dialog).getByLabelText('이름'), '서초구');
    await userEvent.type(within(dialog).getByLabelText('영문 식별자'), 'Seocho');
    await userEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    expect(
      await within(dialog).findByText('영문 소문자, 숫자, 하이픈(-)만 입력해 주세요.'),
    ).toBeInTheDocument();
    await userEvent.clear(within(dialog).getByLabelText('영문 식별자'));
    await userEvent.type(within(dialog).getByLabelText('영문 식별자'), 'seocho');
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
    await userEvent.click(within(dialog).getByRole('switch', { name: '노출' }));
    await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
    await vi.waitFor(() => expect(updated).toEqual({ regionId: '5', isActive: false }));

    const busanDelete = screen.getByRole('button', { name: '부산 삭제' });
    expect(busanDelete).not.toHaveAttribute('aria-disabled');
    await userEvent.click(busanDelete);
    const confirm = await screen.findByRole('alertdialog');
    expect(confirm).toHaveTextContent('부산을 삭제할까요?');
    await userEvent.click(within(confirm).getByRole('button', { name: '삭제' }));
    await vi.waitFor(() => expect(deleted).toEqual({ regionId: '2' }));
  });

  it('로딩 중에는 빈 목록 문구 대신 자리 표시를 보여 준다', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    server.use(
      graphql.query('AdminRegions', async () => {
        await gate;
        return HttpResponse.json({ data: { adminRegions: [] } });
      }),
    );
    boot('/regions');
    await vi.waitFor(() => expect(document.querySelector('[aria-busy]')).not.toBeNull());
    expect(screen.queryByText('권역이 없습니다.')).not.toBeInTheDocument();
    expect(screen.queryByText('권역을 선택해 주세요.')).not.toBeInTheDocument();
    release();
    expect(await screen.findByText('권역이 없습니다.')).toBeInTheDocument();
    expect(document.querySelector('[aria-busy]')).toBeNull();
  });

  it.each([
    {
      title: '좌표를 찾으면 중심 좌표를 소수 7자리로 채운다',
      respond: () =>
        gqlOk('AdminGeocodeAddress', {
          adminGeocodeAddress: {
            latitude: 37.5172,
            longitude: 127.0473,
            sigunguCode: '11680',
            regionId: '5',
          },
        }),
      lat: '37.5172000',
      lng: '127.0473000',
      note: '서울 강남구 테헤란로 152의 좌표로 채웠습니다.',
    },
    {
      title: '좌표를 못 찾으면 직접 입력하라고 안내한다',
      respond: () => gqlOk('AdminGeocodeAddress', { adminGeocodeAddress: null }),
      lat: '',
      lng: '',
      note: '이 주소의 좌표를 찾지 못했습니다. 좌표를 직접 입력해 주세요.',
    },
    {
      title: '지오코딩이 실패하면 직접 입력하라고 안내한다',
      respond: () =>
        gqlError('AdminGeocodeAddress', {
          message: 'x',
          code: 'GEOCODE_UNAVAILABLE',
          classification: 'INTERNAL',
          statusCode: 503,
        }),
      lat: '',
      lng: '',
      note: '좌표를 자동으로 채우지 못했습니다. 좌표를 직접 입력해 주세요.',
    },
  ])('지역 중심 좌표 주소로 채우기: $title', async ({ respond, lat, lng, note }) => {
    installFakePostcode(postcodeResult());
    server.use(gqlOk('AdminRegions', { adminRegions: [seoul] }), respond());
    boot('/regions');
    await userEvent.click(await screen.findByRole('button', { name: '서울 수정' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.clear(within(dialog).getByLabelText('중심 위도'));
    await userEvent.click(within(dialog).getByRole('button', { name: '주소로 채우기' }));
    const search = await screen.findByRole('dialog', { name: '주소 검색' });
    await userEvent.click(await within(search).findByRole('button', { name: /테헤란로/ }));
    expect(await within(dialog).findByText(note)).toBeInTheDocument();
    expect(within(dialog).getByLabelText('중심 위도')).toHaveValue(lat);
    expect(within(dialog).getByLabelText('중심 경도')).toHaveValue(lng);
    delete window.kakao;
  });

  it('좌표를 기다리는 사이 다이얼로그를 닫았다 다시 열면 늦게 온 좌표를 버린다', async () => {
    installFakePostcode(postcodeResult());
    let release = (): void => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      gqlOk('AdminRegions', { adminRegions: [seoul] }),
      graphql.query('AdminGeocodeAddress', async () => {
        await held;
        return HttpResponse.json({
          data: {
            adminGeocodeAddress: {
              latitude: 37.5172,
              longitude: 127.0473,
              sigunguCode: '11680',
              regionId: '5',
            },
          },
        });
      }),
    );
    boot('/regions');
    await userEvent.click(await screen.findByRole('button', { name: '서울 수정' }));
    let dialog = await screen.findByRole('dialog');
    const originalLat = within(dialog).getByLabelText<HTMLInputElement>('중심 위도').value;
    await userEvent.click(within(dialog).getByRole('button', { name: '주소로 채우기' }));
    const search = await screen.findByRole('dialog', { name: '주소 검색' });
    await userEvent.click(await within(search).findByRole('button', { name: /테헤란로/ }));
    await within(dialog).findByText('주소로 좌표를 찾고 있습니다.');

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '서울 수정' }));
    dialog = await screen.findByRole('dialog');

    release();
    await new Promise((r) => setTimeout(r, 50));
    expect(within(dialog).getByLabelText('중심 위도')).toHaveValue(originalLat);
    expect(within(dialog).queryByText(/의 좌표로 채웠습니다/)).not.toBeInTheDocument();
    delete window.kakao;
  });

  it.each([
    { title: '선택한 권역이 노출 중이면 하위 추가 버튼을 보여 준다', isActive: true, canAdd: true },
    { title: '선택한 권역이 숨김이면 버튼 대신 안내를 보여 준다', isActive: false, canAdd: false },
  ])('$title', async ({ isActive, canAdd }) => {
    server.use(gqlOk('AdminRegions', { adminRegions: [{ ...seoul, isActive }] }));
    boot('/regions?parent=1&inactive=true');
    expect(await screen.findByText('서울 › 시·군·구')).toBeInTheDocument();
    expect(!!screen.queryByRole('button', { name: '하위 추가' })).toBe(canAdd);
    expect(!!screen.queryByText('숨긴 권역에는 하위 지역을 추가할 수 없습니다.')).toBe(!canAdd);
  });

  it('숨긴 지역 포함 스위치는 요청에 반영된다', async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AdminRegions', ({ variables }) => {
        inputs.push((variables as { input: Record<string, unknown> }).input);
        return HttpResponse.json({ data: { adminRegions: [seoul] } });
      }),
    );
    boot('/regions');
    await screen.findByText('서울');
    await userEvent.click(screen.getByRole('switch', { name: '숨긴 지역 포함' }));
    await vi.waitFor(() =>
      expect(inputs.at(-1)).toEqual({ parentId: null, includeInactive: true }),
    );
  });
});
