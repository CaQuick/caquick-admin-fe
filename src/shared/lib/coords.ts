/** 좌표 범위. BE decimal-parser와 같은 경계(포함)다. */
export interface CoordRange {
  min: number;
  max: number;
}
export const LATITUDE_RANGE: CoordRange = { min: -90, max: 90 };
export const LONGITUDE_RANGE: CoordRange = { min: -180, max: 180 };

// Number()는 '0x10'·'1e2'·'Infinity'도 숫자로 읽는다. 사람이 적는 십진 소수만 받는다
const DECIMAL = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

/** 범위 안의 십진 소수 문자열이면 그 값, 아니면 null. 앞뒤 공백은 무시한다. */
export function parseCoord(text: string, range: CoordRange): number | null {
  const t = text.trim();
  if (!DECIMAL.test(t)) return null;
  const n = Number(t);
  return n >= range.min && n <= range.max ? n : null;
}

/** DB 좌표 정밀도(Decimal(10,7))에 맞춘 문자열. */
export function toCoordString(n: number): string {
  return n.toFixed(7);
}

/** 위도·경도 두 칸이 모두 올바르면 숫자 쌍, 하나라도 비었거나 틀리면 null. */
export function parseCoordPair(lat: string, lng: string): { lat: number; lng: number } | null {
  const la = parseCoord(lat, LATITUDE_RANGE);
  const ln = parseCoord(lng, LONGITUDE_RANGE);
  return la === null || ln === null ? null : { lat: la, lng: ln };
}
