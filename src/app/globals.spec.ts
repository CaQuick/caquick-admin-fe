import css from './globals.css?raw';

function tokens(selector: ':root' | '.dark'): Record<string, string> {
  const block =
    new RegExp(`^${selector.replace('.', '\\.')} \\{([^}]*)\\}`, 'm').exec(css)?.[1] ?? '';
  const entries = [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map(
    (m): [string, string] => [m[1]!, m[2]!],
  );
  return Object.fromEntries(entries);
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** 보조 텍스트(설명·메타·빈 상태)는 본문 크기라 WCAG AA 4.5:1이 기준이다. */
describe('디자인 토큰 대비', () => {
  it.each([
    [':root', 'background'],
    [':root', 'card'],
    [':root', 'muted'],
    [':root', 'popover'],
    ['.dark', 'background'],
    ['.dark', 'card'],
  ] as const)('%s 보조 텍스트는 %s 위에서 4.5:1 이상이다', (selector, surface) => {
    const t = tokens(selector);
    expect(t['muted-foreground']).toBeDefined();
    expect(t[surface]).toBeDefined();
    expect(contrast(t['muted-foreground']!, t[surface]!)).toBeGreaterThanOrEqual(4.5);
  });
});
