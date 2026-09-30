import { copyText } from './clipboard';

describe('copyText', () => {
  const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  afterEach(() => {
    if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
    vi.restoreAllMocks();
  });
  const setClipboard = (value: unknown) =>
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
  // jsdom에는 execCommand가 없다 — 브라우저처럼 붙여 두고 호출을 본다
  const stubExec = (result: boolean | Error) => {
    const exec = vi.fn((_command: string) => {
      if (result instanceof Error) throw result;
      return result;
    });
    Object.defineProperty(document, 'execCommand', { value: exec, configurable: true });
    return exec;
  };

  it('Clipboard API가 있으면 그것으로 복사한다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const exec = stubExec(true);
    await expect(copyText('Abc23456')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('Abc23456');
    expect(exec).not.toHaveBeenCalled();
  });

  it.each([
    ['API 없음(http LAN)', undefined],
    ['권한 거부', { writeText: vi.fn().mockRejectedValue(new Error('denied')) }],
  ])('%s 이면 선택 복사로 대신하고 임시 칸을 치운다', async (_, value) => {
    setClipboard(value);
    let copied: string | undefined;
    const exec = stubExec(true);
    exec.mockImplementation(() => {
      copied = document.querySelector('textarea')?.value;
      return true;
    });
    await expect(copyText('Abc23456')).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
    expect(copied).toBe('Abc23456');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('대화 상자 안에서 부르면 임시 칸을 그 안에 붙인다(포커스 가둠 때문)', async () => {
    setClipboard(undefined);
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const button = document.createElement('button');
    dialog.append(button);
    document.body.append(dialog);
    button.focus();
    let parent: Element | null | undefined;
    stubExec(true).mockImplementation(() => {
      parent = document.querySelector('textarea')?.parentElement;
      return true;
    });
    await copyText('x');
    expect(parent).toBe(dialog);
    dialog.remove();
  });

  it.each([
    ['false 반환', false],
    ['예외', new Error('blocked')],
  ])('선택 복사도 실패(%s)하면 false', async (_, result) => {
    setClipboard(undefined);
    stubExec(result);
    await expect(copyText('x')).resolves.toBe(false);
    expect(document.querySelector('textarea')).toBeNull();
  });
});
