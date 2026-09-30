import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NAVER_MAP_SCRIPT_ORIGIN, resetNaverMapsForTest } from '@/shared/lib/naver-maps';
import { installFakeNaverMaps } from '@/test/fakes';

import { NaverMap } from './naver-map';

const scripts = () =>
  [...document.querySelectorAll<HTMLScriptElement>('script')].filter((s) =>
    s.src.startsWith(NAVER_MAP_SCRIPT_ORIGIN),
  );

afterEach(() => {
  vi.unstubAllEnvs();
  delete window.naver;
  scripts().forEach((s) => s.remove());
  resetNaverMapsForTest();
});

describe('NaverMap', () => {
  it.each(['', '   '])('키가 %j 이면 스크립트를 받지 않고 안내만 보여 준다', (key) => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', key);
    render(<NaverMap label="지도" position={{ lat: 37.5, lng: 127 }} />);
    expect(
      screen.getByText('지도 미리보기를 쓸 수 없습니다. 지도 키가 설정되지 않았습니다.'),
    ).toBeInTheDocument();
    expect(scripts()).toHaveLength(0);
  });

  it('스크립트를 불러오지 못하면 알리고, 다시 시도하면 지도를 만든다', async () => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', 'k');
    render(<NaverMap label="지도" position={{ lat: 37.5, lng: 127 }} />);
    expect(screen.getByText('지도를 불러오고 있습니다.')).toBeInTheDocument();
    scripts()[0]!.dispatchEvent(new Event('error'));
    expect(await screen.findByRole('alert')).toHaveTextContent('지도를 불러오지 못했습니다.');

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    const fake = installFakeNaverMaps();
    scripts()[0]!.dispatchEvent(new Event('load'));
    await vi.waitFor(() => expect(fake.maps).toHaveLength(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fake.markers[0]!.getPosition().lat()).toBe(37.5);
  });

  it('지우면 이벤트를 떼고 지도를 정리한다', async () => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', 'k');
    const fake = installFakeNaverMaps();
    const { unmount } = render(<NaverMap label="지도" position={null} onMove={() => undefined} />);
    await vi.waitFor(() => expect(fake.listeners.size).toBe(2));
    unmount();
    expect(fake.listeners.size).toBe(0);
    expect(fake.maps[0]!.destroy).toHaveBeenCalled();
    expect(fake.markers[0]!.map).toBeNull();
  });

  it('좌표가 바뀌면 핀만 옮기고 onMove는 부르지 않는다', async () => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', 'k');
    const fake = installFakeNaverMaps();
    const onMove = vi.fn();
    const { rerender } = render(
      <NaverMap label="지도" position={{ lat: 37.5, lng: 127 }} onMove={onMove} />,
    );
    await vi.waitFor(() => expect(fake.markers).toHaveLength(1));
    rerender(<NaverMap label="지도" position={{ lat: 37.6, lng: 127.1 }} onMove={onMove} />);
    await vi.waitFor(() => expect(fake.markers[0]!.getPosition().lat()).toBe(37.6));
    expect(fake.maps[0]!.panTo).toHaveBeenCalled();
    rerender(<NaverMap label="지도" position={null} onMove={onMove} />);
    await vi.waitFor(() => expect(fake.markers[0]!.map).toBeNull());
    expect(onMove).not.toHaveBeenCalled();
  });
});
