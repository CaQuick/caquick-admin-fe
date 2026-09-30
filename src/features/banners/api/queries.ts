import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminBannerListInput,
  type AdminBannersVisibleQuery,
  type AdminCreateBannerInput,
  type AdminUpdateBannerInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';
import { MAX_KEYWORD_LENGTH } from '@/shared/lib/list-search';
import { type EntityOption } from '@/shared/ui/entity-picker';

export type LinkTargetKind = 'PRODUCT' | 'STORE' | 'CATEGORY';

const bannersKeys = {
  all: ['banners'] as const,
  lists: () => [...bannersKeys.all, 'list'] as const,
  list: (input: AdminBannerListInput) => [...bannersKeys.lists(), input] as const,
  /** 슬롯별 '현재 노출' 계산용 노출 배너 전부. lists() 아래라 저장·삭제 무효화에 함께 걸린다 */
  visible: () => [...bannersKeys.lists(), 'visible'] as const,
  detail: (bannerId: string) => [...bannersKeys.all, 'detail', bannerId] as const,
  linkOptions: (kind: LinkTargetKind, keyword: string) =>
    [...bannersKeys.all, 'link-options', kind, keyword] as const,
  linkLabel: (kind: LinkTargetKind, id: string) =>
    [...bannersKeys.all, 'link-label', kind, id] as const,
};

const AdminBannersDocument = graphql(/* GraphQL */ `
  query AdminBanners($input: AdminBannerListInput) {
    adminBanners(input: $input) {
      items {
        id
        placement
        title
        imageUrl
        linkType
        linkUrl
        linkProductId
        linkStoreId
        linkCategoryId
        startsAt
        endsAt
        sortOrder
        isActive
        createdAt
        updatedAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
const AdminBannerDocument = graphql(/* GraphQL */ `
  query AdminBanner($bannerId: ID!) {
    adminBanner(bannerId: $bannerId) {
      id
      placement
      title
      imageUrl
      linkType
      linkUrl
      linkProductId
      linkStoreId
      linkCategoryId
      startsAt
      endsAt
      sortOrder
      isActive
      createdAt
      updatedAt
    }
  }
`);
const AdminCreateBannerDocument = graphql(/* GraphQL */ `
  mutation AdminCreateBanner($input: AdminCreateBannerInput!) {
    adminCreateBanner(input: $input) {
      id
    }
  }
`);
const AdminUpdateBannerDocument = graphql(/* GraphQL */ `
  mutation AdminUpdateBanner($input: AdminUpdateBannerInput!) {
    adminUpdateBanner(input: $input) {
      id
      updatedAt
    }
  }
`);
const AdminDeleteBannerDocument = graphql(/* GraphQL */ `
  mutation AdminDeleteBanner($bannerId: ID!) {
    adminDeleteBanner(bannerId: $bannerId)
  }
`);

const AdminBannersVisibleDocument = graphql(/* GraphQL */ `
  query AdminBannersVisible($input: AdminBannerListInput) {
    adminBanners(input: $input) {
      items {
        id
        placement
        linkCategoryId
        startsAt
        endsAt
        sortOrder
        isActive
      }
      hasMore
      nextCursor
    }
  }
`);

const AdminBannerProductOptionsDocument = graphql(/* GraphQL */ `
  query AdminBannerProductOptions($input: AdminProductListInput) {
    adminProducts(input: $input) {
      items {
        id
        name
        storeName
        storeIsActive
      }
    }
  }
`);
const AdminBannerStoreOptionsDocument = graphql(/* GraphQL */ `
  query AdminBannerStoreOptions($input: AdminStoreListInput) {
    adminStores(input: $input) {
      items {
        id
        storeName
      }
    }
  }
`);
const AdminBannerCategoryOptionsDocument = graphql(/* GraphQL */ `
  query AdminBannerCategoryOptions($input: AdminCategoryListInput) {
    adminCategories(input: $input) {
      id
      name
      isActive
    }
  }
`);
const AdminBannerProductLabelDocument = graphql(/* GraphQL */ `
  query AdminBannerProductLabel($productId: ID!) {
    adminProduct(productId: $productId) {
      product {
        id
        name
      }
    }
  }
`);
const AdminBannerStoreLabelDocument = graphql(/* GraphQL */ `
  query AdminBannerStoreLabel($storeId: ID!) {
    adminStore(storeId: $storeId) {
      store {
        id
        storeName
      }
    }
  }
`);

export function bannersListQueryOptions(input: AdminBannerListInput) {
  return queryOptions({
    queryKey: bannersKeys.list(input),
    queryFn: async () => (await gqlRequest(AdminBannersDocument, { input })).adminBanners,
    placeholderData: (prev) => prev,
  });
}
export function bannerDetailQueryOptions(bannerId: string) {
  return queryOptions({
    queryKey: bannersKeys.detail(bannerId),
    queryFn: async () => (await gqlRequest(AdminBannerDocument, { bannerId })).adminBanner,
  });
}

/** 노출 설정된 배너를 끝까지 읽는다. 배너는 수가 적어 페이지 몇 번이면 끝나고, 상한으로 무한 반복을 막는다 */
const VISIBLE_PAGE_LIMIT = 100;
const VISIBLE_MAX_PAGES = 20;
export function visibleBannersQueryOptions() {
  return queryOptions({
    queryKey: bannersKeys.visible(),
    queryFn: async () => {
      const items: AdminBannersVisibleQuery['adminBanners']['items'] = [];
      let cursor: string | null = null;
      for (let page = 0; page < VISIBLE_MAX_PAGES; page++) {
        const r: AdminBannersVisibleQuery['adminBanners'] = (
          await gqlRequest(AdminBannersVisibleDocument, {
            input: { isActive: true, limit: VISIBLE_PAGE_LIMIT, cursor },
          })
        ).adminBanners;
        items.push(...r.items);
        if (!r.hasMore || !r.nextCursor) break;
        cursor = r.nextCursor;
      }
      return items;
    },
  });
}

const keywordInput = (keyword: string) =>
  keyword === '' ? null : [...keyword].slice(0, MAX_KEYWORD_LENGTH).join('');

/**
 * 링크 대상 검색. 숨김·삭제 대상은 저장이 거절되므로 노출 중인 것만 찾는다.
 * 상품은 매장이 숨김이어도 구매자에게 보이지 않아 함께 뺀다
 */
export function linkOptionsQueryOptions(kind: LinkTargetKind, keyword: string) {
  return queryOptions({
    queryKey: bannersKeys.linkOptions(kind, keyword),
    queryFn: async (): Promise<EntityOption[]> => {
      if (kind === 'PRODUCT') {
        const r = await gqlRequest(AdminBannerProductOptionsDocument, {
          input: { keyword: keywordInput(keyword), isActive: true, limit: 20 },
        });
        return r.adminProducts.items
          .filter((p) => p.storeIsActive)
          .map((p) => ({
            id: p.id,
            label: p.name,
            description: `${p.storeName} · ID ${p.id}`,
          }));
      }
      if (kind === 'STORE') {
        const r = await gqlRequest(AdminBannerStoreOptionsDocument, {
          input: { keyword: keywordInput(keyword), isActive: true, limit: 20 },
        });
        return r.adminStores.items.map((s) => ({
          id: s.id,
          label: s.storeName,
          description: `ID ${s.id}`,
        }));
      }
      // 카테고리 목록은 검색어를 받지 않고 수가 적다 — 전부 받아 이름으로 거른다
      const r = await gqlRequest(AdminBannerCategoryOptionsDocument, {
        input: { categoryType: 'EVENT' },
      });
      return r.adminCategories
        .filter((c) => c.isActive && c.name.includes(keyword))
        .map((c) => ({ id: c.id, label: c.name, description: `ID ${c.id}` }));
    },
  });
}

/** 저장된 링크 대상의 이름. 대상이 삭제됐으면 오류가 나고, 선택기는 #ID로 보인다 */
export function linkLabelQueryOptions(kind: LinkTargetKind, id: string) {
  return queryOptions({
    queryKey: bannersKeys.linkLabel(kind, id),
    queryFn: async (): Promise<string | null> => {
      if (kind === 'PRODUCT') {
        return (await gqlRequest(AdminBannerProductLabelDocument, { productId: id })).adminProduct
          .product.name;
      }
      if (kind === 'STORE') {
        return (await gqlRequest(AdminBannerStoreLabelDocument, { storeId: id })).adminStore.store
          .storeName;
      }
      const r = await gqlRequest(AdminBannerCategoryOptionsDocument, {
        input: { categoryType: 'EVENT', includeInactive: true },
      });
      return r.adminCategories.find((c) => c.id === id)?.name ?? null;
    },
    retry: false,
  });
}

async function invalidate(qc: QueryClient, bannerId?: string) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: bannersKeys.lists() }),
    bannerId ? qc.invalidateQueries({ queryKey: bannersKeys.detail(bannerId) }) : Promise.resolve(),
  ]);
}

export async function createBanner(qc: QueryClient, input: AdminCreateBannerInput) {
  const r = (await gqlRequest(AdminCreateBannerDocument, { input })).adminCreateBanner;
  await invalidate(qc);
  return r;
}
export async function updateBanner(qc: QueryClient, input: AdminUpdateBannerInput) {
  const r = (await gqlRequest(AdminUpdateBannerDocument, { input })).adminUpdateBanner;
  await invalidate(qc, String(input.bannerId));
  return r;
}
export async function deleteBanner(qc: QueryClient, bannerId: string) {
  const r = (await gqlRequest(AdminDeleteBannerDocument, { bannerId })).adminDeleteBanner;
  // 상세 화면에서 지우면 곧 목록으로 나간다 — 지운 배너를 다시 읽어 '없음' 오류를 띄우지 않는다
  await Promise.all([
    qc.invalidateQueries({ queryKey: bannersKeys.lists() }),
    qc.invalidateQueries({ queryKey: bannersKeys.detail(bannerId), refetchType: 'none' }),
  ]);
  return r;
}
