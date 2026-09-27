const krw = new Intl.NumberFormat('ko-KR');

export function formatKrw(amount: number): string {
  return `${krw.format(amount)}원`;
}

export function formatCount(n: number): string {
  return krw.format(n);
}
