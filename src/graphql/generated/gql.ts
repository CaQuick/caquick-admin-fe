/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query AdminMe {\n    adminMe {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      createdAt\n    }\n  }\n": typeof types.AdminMeDocument,
    "\n  query AdminDashboardSummary($input: AdminDashboardSummaryInput!) {\n    adminDashboardSummary(input: $input) {\n      from\n      to\n      newUserCount\n      newSellerCount\n      orderCounts {\n        submitted\n        confirmed\n        made\n        pickedUp\n        canceled\n      }\n      orderAmountSum\n      activeStoreCount\n      activeProductCount\n      pendingReportCount\n    }\n  }\n": typeof types.AdminDashboardSummaryDocument,
    "\n  query AdminSearchKeywordSnapshot($input: AdminSearchKeywordSnapshotInput) {\n    adminSearchKeywordSnapshot(input: $input) {\n      rankedAt\n      items {\n        rank\n        keyword\n        searchCount\n      }\n    }\n  }\n": typeof types.AdminSearchKeywordSnapshotDocument,
    "\n  query AdminOrders($input: AdminOrderListInput) {\n    adminOrders(input: $input) {\n      items {\n        id\n        orderNumber\n        accountId\n        storeId\n        status\n        pickupAt\n        buyerName\n        buyerPhone\n        totalPrice\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminOrdersDocument,
    "\n  query AdminOrder($orderId: ID!) {\n    adminOrder(orderId: $orderId) {\n      id\n      orderNumber\n      buyer {\n        accountId\n        email\n        nickname\n        status\n      }\n      status\n      pickupAt\n      buyerName\n      buyerPhone\n      subtotalPrice\n      discountPrice\n      totalPrice\n      submittedAt\n      confirmedAt\n      madeAt\n      pickedUpAt\n      canceledAt\n      createdAt\n      updatedAt\n      items {\n        id\n        storeId\n        productId\n        productName\n        regularPrice\n        salePrice\n        quantity\n        itemSubtotalPrice\n        optionItems {\n          id\n          groupName\n          optionTitle\n          priceDelta\n        }\n        customTexts {\n          id\n          tokenKey\n          defaultText\n          valueText\n          sortOrder\n        }\n        freeEdits {\n          id\n          cropImageUrl\n          descriptionText\n          sortOrder\n          attachments {\n            id\n            imageUrl\n            sortOrder\n          }\n        }\n      }\n      statusHistories {\n        id\n        fromStatus\n        toStatus\n        changedAt\n        note\n      }\n    }\n  }\n": typeof types.AdminOrderDocument,
    "\n  mutation AdminCancelOrder($input: AdminCancelOrderInput!) {\n    adminCancelOrder(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.AdminCancelOrderDocument,
};
const documents: Documents = {
    "\n  query AdminMe {\n    adminMe {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      createdAt\n    }\n  }\n": types.AdminMeDocument,
    "\n  query AdminDashboardSummary($input: AdminDashboardSummaryInput!) {\n    adminDashboardSummary(input: $input) {\n      from\n      to\n      newUserCount\n      newSellerCount\n      orderCounts {\n        submitted\n        confirmed\n        made\n        pickedUp\n        canceled\n      }\n      orderAmountSum\n      activeStoreCount\n      activeProductCount\n      pendingReportCount\n    }\n  }\n": types.AdminDashboardSummaryDocument,
    "\n  query AdminSearchKeywordSnapshot($input: AdminSearchKeywordSnapshotInput) {\n    adminSearchKeywordSnapshot(input: $input) {\n      rankedAt\n      items {\n        rank\n        keyword\n        searchCount\n      }\n    }\n  }\n": types.AdminSearchKeywordSnapshotDocument,
    "\n  query AdminOrders($input: AdminOrderListInput) {\n    adminOrders(input: $input) {\n      items {\n        id\n        orderNumber\n        accountId\n        storeId\n        status\n        pickupAt\n        buyerName\n        buyerPhone\n        totalPrice\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminOrdersDocument,
    "\n  query AdminOrder($orderId: ID!) {\n    adminOrder(orderId: $orderId) {\n      id\n      orderNumber\n      buyer {\n        accountId\n        email\n        nickname\n        status\n      }\n      status\n      pickupAt\n      buyerName\n      buyerPhone\n      subtotalPrice\n      discountPrice\n      totalPrice\n      submittedAt\n      confirmedAt\n      madeAt\n      pickedUpAt\n      canceledAt\n      createdAt\n      updatedAt\n      items {\n        id\n        storeId\n        productId\n        productName\n        regularPrice\n        salePrice\n        quantity\n        itemSubtotalPrice\n        optionItems {\n          id\n          groupName\n          optionTitle\n          priceDelta\n        }\n        customTexts {\n          id\n          tokenKey\n          defaultText\n          valueText\n          sortOrder\n        }\n        freeEdits {\n          id\n          cropImageUrl\n          descriptionText\n          sortOrder\n          attachments {\n            id\n            imageUrl\n            sortOrder\n          }\n        }\n      }\n      statusHistories {\n        id\n        fromStatus\n        toStatus\n        changedAt\n        note\n      }\n    }\n  }\n": types.AdminOrderDocument,
    "\n  mutation AdminCancelOrder($input: AdminCancelOrderInput!) {\n    adminCancelOrder(input: $input) {\n      id\n      status\n    }\n  }\n": types.AdminCancelOrderDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminMe {\n    adminMe {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      createdAt\n    }\n  }\n"): typeof import('./graphql').AdminMeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminDashboardSummary($input: AdminDashboardSummaryInput!) {\n    adminDashboardSummary(input: $input) {\n      from\n      to\n      newUserCount\n      newSellerCount\n      orderCounts {\n        submitted\n        confirmed\n        made\n        pickedUp\n        canceled\n      }\n      orderAmountSum\n      activeStoreCount\n      activeProductCount\n      pendingReportCount\n    }\n  }\n"): typeof import('./graphql').AdminDashboardSummaryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminSearchKeywordSnapshot($input: AdminSearchKeywordSnapshotInput) {\n    adminSearchKeywordSnapshot(input: $input) {\n      rankedAt\n      items {\n        rank\n        keyword\n        searchCount\n      }\n    }\n  }\n"): typeof import('./graphql').AdminSearchKeywordSnapshotDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminOrders($input: AdminOrderListInput) {\n    adminOrders(input: $input) {\n      items {\n        id\n        orderNumber\n        accountId\n        storeId\n        status\n        pickupAt\n        buyerName\n        buyerPhone\n        totalPrice\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminOrdersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminOrder($orderId: ID!) {\n    adminOrder(orderId: $orderId) {\n      id\n      orderNumber\n      buyer {\n        accountId\n        email\n        nickname\n        status\n      }\n      status\n      pickupAt\n      buyerName\n      buyerPhone\n      subtotalPrice\n      discountPrice\n      totalPrice\n      submittedAt\n      confirmedAt\n      madeAt\n      pickedUpAt\n      canceledAt\n      createdAt\n      updatedAt\n      items {\n        id\n        storeId\n        productId\n        productName\n        regularPrice\n        salePrice\n        quantity\n        itemSubtotalPrice\n        optionItems {\n          id\n          groupName\n          optionTitle\n          priceDelta\n        }\n        customTexts {\n          id\n          tokenKey\n          defaultText\n          valueText\n          sortOrder\n        }\n        freeEdits {\n          id\n          cropImageUrl\n          descriptionText\n          sortOrder\n          attachments {\n            id\n            imageUrl\n            sortOrder\n          }\n        }\n      }\n      statusHistories {\n        id\n        fromStatus\n        toStatus\n        changedAt\n        note\n      }\n    }\n  }\n"): typeof import('./graphql').AdminOrderDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCancelOrder($input: AdminCancelOrderInput!) {\n    adminCancelOrder(input: $input) {\n      id\n      status\n    }\n  }\n"): typeof import('./graphql').AdminCancelOrderDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
