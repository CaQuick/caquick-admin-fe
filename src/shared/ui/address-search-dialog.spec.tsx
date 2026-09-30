import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  POSTCODE_SCRIPT_URL,
  type PostcodeConstructor,
  type PostcodeOptions,
  type RawPostcodeData,
} from '@/shared/lib/kakao-postcode';

import { AddressSearchDialog } from './address-search-dialog';
import { Button } from './button';

const picked: RawPostcodeData = {
  roadAddress: '',
  autoRoadAddress: '경기 성남시 분당구 판교역로 166',
  jibunAddress: '경기 성남시 분당구 백현동 532',
  sido: '경기',
  sigungu: '성남시 분당구',
  bname: '백현동',
  sigunguCode: '41135',
  zonecode: '13529',
};

const embeds: { q?: string }[] = [];

/** 실제 스크립트 대신 embed한 자리에 결과 버튼을 그린다 */
class FakePostcode {
  private options: PostcodeOptions;
  constructor(options: PostcodeOptions) {
    this.options = options;
  }
  embed(el: HTMLElement, opts?: { q?: string }) {
    embeds.push({ q: opts?.q });
    const button = document.createElement('button');
    button.textContent = '판교역로 166';
    button.addEventListener('click', () => this.options.oncomplete(picked));
    el.appendChild(button);
  }
}

const postcodeScript = () =>
  [...document.querySelectorAll<HTMLScriptElement>('script')].find(
    (s) => s.src === POSTCODE_SCRIPT_URL,
  );

function setup(initialQuery?: string) {
  const onSelect = vi.fn();
  render(
    <AddressSearchDialog
      trigger={<Button>주소 검색</Button>}
      onSelect={onSelect}
      initialQuery={initialQuery}
    />,
  );
  return { onSelect };
}

describe('AddressSearchDialog', () => {
  afterEach(() => {
    delete window.kakao;
    postcodeScript()?.remove();
    embeds.length = 0;
  });

  it('열면 우편번호 검색을 안에 띄우고, 고르면 주소를 넘기고 닫는다', async () => {
    window.kakao = { Postcode: FakePostcode as unknown as PostcodeConstructor };
    const { onSelect } = setup('판교역로');
    await userEvent.click(screen.getByRole('button', { name: '주소 검색' }));
    expect(screen.getByRole('dialog', { name: '주소 검색' })).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: '판교역로 166' }));
    expect(embeds).toEqual([{ q: '판교역로' }]);
    expect(onSelect).toHaveBeenCalledWith({
      roadAddress: '경기 성남시 분당구 판교역로 166',
      jibunAddress: '경기 성남시 분당구 백현동 532',
      sido: '경기',
      sigungu: '성남시 분당구',
      bname: '백현동',
      sigunguCode: '41135',
      zonecode: '13529',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('스크립트를 불러오는 동안 안내하고, 실패하면 다시 시도할 수 있다', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: '주소 검색' }));
    expect(screen.getByText('주소 검색 창을 불러오고 있습니다.')).toBeInTheDocument();

    postcodeScript()!.dispatchEvent(new Event('error'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '주소 검색 창을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    );

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    window.kakao = { Postcode: FakePostcode as unknown as PostcodeConstructor };
    postcodeScript()!.dispatchEvent(new Event('load'));
    expect(await screen.findByRole('button', { name: '판교역로 166' })).toBeInTheDocument();
    expect(screen.queryByText('주소 검색 창을 불러오고 있습니다.')).not.toBeInTheDocument();
  });

  it('닫았다 다시 열면 검색 창을 새로 띄운다', async () => {
    window.kakao = { Postcode: FakePostcode as unknown as PostcodeConstructor };
    setup();
    await userEvent.click(screen.getByRole('button', { name: '주소 검색' }));
    await screen.findByRole('button', { name: '판교역로 166' });
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: '주소 검색' }));
    expect(await screen.findAllByRole('button', { name: '판교역로 166' })).toHaveLength(1);
    expect(embeds).toHaveLength(2);
  });
});
