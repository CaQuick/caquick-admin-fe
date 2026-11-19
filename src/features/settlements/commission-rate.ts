/** 수수료율 상한(100%) */
const MAX_BPS = 10_000;

/**
 * 퍼센트 입력('5.55') → bp 정수(555). 소수 둘째 자리까지, 0~100만 받고 나머지는 null.
 * 문자열로 자릿수를 옮긴다 — 5.55 * 100은 부동소수점으로 554.999…가 된다.
 */
export function percentToBps(text: string): number | null {
  const m = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!m) return null;
  const bps = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return bps <= MAX_BPS ? bps : null;
}

/** bp 정수(555) → 퍼센트 문자열('5.55'). 끝의 0은 지운다(550 → '5.5', 500 → '5') */
export function bpsToPercent(bps: number): string {
  const whole = Math.floor(bps / 100);
  const frac = String(bps % 100)
    .padStart(2, '0')
    .replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : String(whole);
}
