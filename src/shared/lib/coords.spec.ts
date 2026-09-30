import {
  LATITUDE_RANGE,
  LONGITUDE_RANGE,
  parseCoord,
  parseCoordPair,
  toCoordString,
} from './coords';

describe('parseCoord', () => {
  it.each([
    ['37.5', 37.5],
    [' 37.5 ', 37.5],
    ['-90', -90],
    ['90', 90],
    ['+12.', 12],
    ['.5', 0.5],
    ['0', 0],
    ['90.0000001', null],
    ['-90.1', null],
    ['', null],
    ['abc', null],
    ['1e1', null],
    ['0x10', null],
    ['Infinity', null],
    ['NaN', null],
    ['37.5.1', null],
    ['- 37', null],
  ])('위도 %j → %s', (text, expected) => {
    expect(parseCoord(text, LATITUDE_RANGE)).toBe(expected);
  });

  it.each([
    ['180', 180],
    ['-180', -180],
    ['180.0000001', null],
    ['127.0276368', 127.0276368],
  ])('경도 %j → %s', (text, expected) => {
    expect(parseCoord(text, LONGITUDE_RANGE)).toBe(expected);
  });
});

describe('toCoordString', () => {
  it.each([
    [37.5, '37.5000000'],
    [127.02763684, '127.0276368'],
    [127.02763686, '127.0276369'],
    [0, '0.0000000'],
  ])('%s → %s (소수 7자리)', (n, s) => {
    expect(toCoordString(n)).toBe(s);
  });
});

describe('parseCoordPair', () => {
  it.each([
    ['37.5', '127', { lat: 37.5, lng: 127 }],
    ['37.5', '', null],
    ['', '127', null],
    ['91', '127', null],
    ['37.5', '181', null],
    ['', '', null],
  ])('%j, %j → %j', (lat, lng, expected) => {
    expect(parseCoordPair(lat, lng)).toEqual(expected);
  });
});
