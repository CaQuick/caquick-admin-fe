import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminBannerListInput,
  type AdminCreateBannerInput,
  type AdminUpdateBannerInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const bannersKeys = {
  all: ['banners'] as const,
  lists: () => [...bannersKeys.all, 'list'] as const,
  list: (input: AdminBannerListInput) => [...bannersKeys.lists(), input] as const,
  detail: (bannerId: string) => [...bannersKeys.all, 'detail', bannerId] as const,
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
  await invalidate(qc, bannerId);
  return r;
}
