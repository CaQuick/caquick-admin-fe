/** 한국 시간(UTC+9, DST 없음) 날짜 계산. 표시·입력은 KST, 전송은 UTC ISO. */
const KST_OFFSET_MS = 9 * 3600_000;

export interface YmdDate {
  y: number;
  m: number; // 1~12
  d: number;
}

export function todayKst(now: Date = new Date()): YmdDate {
  const k = new Date(now.getTime() + KST_OFFSET_MS);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate() };
}

export function addDays(date: YmdDate, days: number): YmdDate {
  const t = Date.UTC(date.y, date.m - 1, date.d + days);
  const k = new Date(t);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate() };
}

export function formatYmd({ y, m, d }: YmdDate): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parseYmd(s: string): YmdDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const date = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  return formatYmd(addDays(date, 0)) === s ? date : null; // 2월 30일 같은 값 거부
}

/** KST 하루의 시작(00:00:00.000)을 UTC ISO로. */
export function kstDayStartIso(date: YmdDate): string {
  return new Date(Date.UTC(date.y, date.m - 1, date.d) - KST_OFFSET_MS).toISOString();
}

/** KST 하루의 끝(23:59:59.999)을 UTC ISO로. BE 기간 필터는 양끝 포함. */
export function kstDayEndIso(date: YmdDate): string {
  return new Date(Date.UTC(date.y, date.m - 1, date.d + 1) - KST_OFFSET_MS - 1).toISOString();
}

/** ISO(UTC) → KST 표시 문자열 `MM-DD HH:mm`. */
export function formatKst(iso: string, withYear = false): string {
  const k = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  const mmdd = `${String(k.getUTCMonth() + 1).padStart(2, '0')}-${String(k.getUTCDate()).padStart(2, '0')}`;
  const hhmm = `${String(k.getUTCHours()).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}`;
  return `${withYear ? `${k.getUTCFullYear()}-` : ''}${mmdd} ${hhmm}`;
}

/** datetime-local(KST) → UTC ISO. 빈 값은 null. */
export function localToIso(v: string): string | null {
  if (!v) return null;
  const [d, t] = v.split('T');
  const [y, m, day] = (d ?? '').split('-').map(Number);
  const [hh, mm] = (t ?? '00:00').split(':').map(Number);
  if (!y || !m || !day) return null;
  return new Date(Date.UTC(y, m - 1, day, hh ?? 0, mm ?? 0) - KST_OFFSET_MS).toISOString();
}
/** UTC ISO → datetime-local(KST) 값 */
export function isoToLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const k = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())}T${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
}
