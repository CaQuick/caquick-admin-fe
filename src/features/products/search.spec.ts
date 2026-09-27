import { hasProductFilters, productsSearchSchema, toProductListInput } from './search';

describe('products search', () => {
  it('변환과 필터 판정', () => {
    expect(toProductListInput(productsSearchSchema.parse({}))).toEqual({
      limit: 20,
      cursor: null,
      keyword: null,
      storeId: null,
      isActive: null,
    });
    const s = productsSearchSchema.parse({ q: '케이크', storeId: 17, active: false });
    expect(toProductListInput(s)).toMatchObject({
      keyword: '케이크',
      storeId: '17',
      isActive: false,
    });
    expect(hasProductFilters(s)).toBe(true);
    expect(hasProductFilters(productsSearchSchema.parse({}))).toBe(false);
  });
});
