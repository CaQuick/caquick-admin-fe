import { type QueryClient, queryOptions } from '@tanstack/react-query';

import { graphql } from '@/graphql/generated';
import {
  type AdminCategoryListInput,
  type AdminCreateCategoryInput,
  type AdminCreateTagInput,
  type AdminTagListInput,
  type AdminUpdateCategoryInput,
  type AdminUpdateTagInput,
} from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const taxonomyKeys = {
  categories: (input: AdminCategoryListInput) => ['categories', input] as const,
  allCategories: () => ['categories'] as const,
  tags: (input: AdminTagListInput) => ['tags', 'list', input] as const,
  allTags: () => ['tags'] as const,
};

const AdminCategoriesDocument = graphql(/* GraphQL */ `
  query AdminCategories($input: AdminCategoryListInput) {
    adminCategories(input: $input) {
      id
      categoryType
      name
      description
      sortOrder
      isActive
      productCount
      createdAt
      updatedAt
    }
  }
`);
const AdminCreateCategoryDocument = graphql(/* GraphQL */ `
  mutation AdminCreateCategory($input: AdminCreateCategoryInput!) {
    adminCreateCategory(input: $input) {
      id
    }
  }
`);
const AdminUpdateCategoryDocument = graphql(/* GraphQL */ `
  mutation AdminUpdateCategory($input: AdminUpdateCategoryInput!) {
    adminUpdateCategory(input: $input) {
      id
    }
  }
`);
const AdminDeleteCategoryDocument = graphql(/* GraphQL */ `
  mutation AdminDeleteCategory($categoryId: ID!) {
    adminDeleteCategory(categoryId: $categoryId)
  }
`);

const AdminTagsDocument = graphql(/* GraphQL */ `
  query AdminTags($input: AdminTagListInput) {
    adminTags(input: $input) {
      items {
        id
        name
        productCount
        createdAt
        updatedAt
      }
      totalCount
      hasMore
      nextCursor
    }
  }
`);
const AdminCreateTagDocument = graphql(/* GraphQL */ `
  mutation AdminCreateTag($input: AdminCreateTagInput!) {
    adminCreateTag(input: $input) {
      id
    }
  }
`);
const AdminUpdateTagDocument = graphql(/* GraphQL */ `
  mutation AdminUpdateTag($input: AdminUpdateTagInput!) {
    adminUpdateTag(input: $input) {
      id
    }
  }
`);
const AdminDeleteTagDocument = graphql(/* GraphQL */ `
  mutation AdminDeleteTag($tagId: ID!) {
    adminDeleteTag(tagId: $tagId)
  }
`);

export function categoriesQueryOptions(input: AdminCategoryListInput) {
  return queryOptions({
    queryKey: taxonomyKeys.categories(input),
    queryFn: async () => (await gqlRequest(AdminCategoriesDocument, { input })).adminCategories,
  });
}
export function tagsQueryOptions(input: AdminTagListInput) {
  return queryOptions({
    queryKey: taxonomyKeys.tags(input),
    queryFn: async () => (await gqlRequest(AdminTagsDocument, { input })).adminTags,
    placeholderData: (prev) => prev,
  });
}

export const categoryMutations = {
  create: async (qc: QueryClient, input: AdminCreateCategoryInput) => {
    const r = (await gqlRequest(AdminCreateCategoryDocument, { input })).adminCreateCategory;
    await qc.invalidateQueries({ queryKey: taxonomyKeys.allCategories() });
    return r;
  },
  update: async (qc: QueryClient, input: AdminUpdateCategoryInput) => {
    const r = (await gqlRequest(AdminUpdateCategoryDocument, { input })).adminUpdateCategory;
    await qc.invalidateQueries({ queryKey: taxonomyKeys.allCategories() });
    return r;
  },
  remove: async (qc: QueryClient, categoryId: string) => {
    const r = (await gqlRequest(AdminDeleteCategoryDocument, { categoryId })).adminDeleteCategory;
    await qc.invalidateQueries({ queryKey: taxonomyKeys.allCategories() });
    return r;
  },
};

export const tagMutations = {
  create: async (qc: QueryClient, input: AdminCreateTagInput) => {
    const r = (await gqlRequest(AdminCreateTagDocument, { input })).adminCreateTag;
    await qc.invalidateQueries({ queryKey: taxonomyKeys.allTags() });
    return r;
  },
  update: async (qc: QueryClient, input: AdminUpdateTagInput) => {
    const r = (await gqlRequest(AdminUpdateTagDocument, { input })).adminUpdateTag;
    await qc.invalidateQueries({ queryKey: taxonomyKeys.allTags() });
    return r;
  },
  remove: async (qc: QueryClient, tagId: string) => {
    const r = (await gqlRequest(AdminDeleteTagDocument, { tagId })).adminDeleteTag;
    await qc.invalidateQueries({ queryKey: taxonomyKeys.allTags() });
    return r;
  },
};
