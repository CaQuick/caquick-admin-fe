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
    "\n  query AdminUsers($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        email\n        name\n        status\n        nickname\n        phoneNumber\n        onboardingCompleted\n        identityProviders\n        orderCount\n        reviewCount\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminUsersDocument,
    "\n  query AdminUser($accountId: ID!) {\n    adminUser(accountId: $accountId) {\n      accountId\n      email\n      name\n      status\n      nickname\n      phoneNumber\n      onboardingCompleted\n      identityProviders\n      orderCount\n      reviewCount\n      createdAt\n    }\n  }\n": typeof types.AdminUserDocument,
    "\n  mutation AdminSuspendAccount($input: AdminSuspendAccountInput!) {\n    adminSuspendAccount(input: $input) {\n      accountId\n      accountType\n      status\n    }\n  }\n": typeof types.AdminSuspendAccountDocument,
    "\n  mutation AdminReinstateAccount($accountId: ID!) {\n    adminReinstateAccount(accountId: $accountId) {\n      accountId\n      accountType\n      status\n    }\n  }\n": typeof types.AdminReinstateAccountDocument,
    "\n  query AdminDashboardSummary($input: AdminDashboardSummaryInput!) {\n    adminDashboardSummary(input: $input) {\n      from\n      to\n      newUserCount\n      newSellerCount\n      orderCounts {\n        submitted\n        confirmed\n        made\n        pickedUp\n        canceled\n      }\n      orderAmountSum\n      activeStoreCount\n      activeProductCount\n      pendingReportCount\n    }\n  }\n": typeof types.AdminDashboardSummaryDocument,
    "\n  query AdminSearchKeywordSnapshot($input: AdminSearchKeywordSnapshotInput) {\n    adminSearchKeywordSnapshot(input: $input) {\n      rankedAt\n      items {\n        rank\n        keyword\n        searchCount\n      }\n    }\n  }\n": typeof types.AdminSearchKeywordSnapshotDocument,
    "\n  query AdminOrders($input: AdminOrderListInput) {\n    adminOrders(input: $input) {\n      items {\n        id\n        orderNumber\n        accountId\n        storeId\n        status\n        pickupAt\n        buyerName\n        buyerPhone\n        totalPrice\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminOrdersDocument,
    "\n  query AdminOrder($orderId: ID!) {\n    adminOrder(orderId: $orderId) {\n      id\n      orderNumber\n      buyer {\n        accountId\n        email\n        nickname\n        status\n      }\n      status\n      pickupAt\n      buyerName\n      buyerPhone\n      subtotalPrice\n      discountPrice\n      totalPrice\n      submittedAt\n      confirmedAt\n      madeAt\n      pickedUpAt\n      canceledAt\n      createdAt\n      updatedAt\n      items {\n        id\n        storeId\n        productId\n        productName\n        regularPrice\n        salePrice\n        quantity\n        itemSubtotalPrice\n        optionItems {\n          id\n          groupName\n          optionTitle\n          priceDelta\n        }\n        customTexts {\n          id\n          tokenKey\n          defaultText\n          valueText\n          sortOrder\n        }\n        freeEdits {\n          id\n          cropImageUrl\n          descriptionText\n          sortOrder\n          attachments {\n            id\n            imageUrl\n            sortOrder\n          }\n        }\n      }\n      statusHistories {\n        id\n        fromStatus\n        toStatus\n        changedAt\n        note\n      }\n    }\n  }\n": typeof types.AdminOrderDocument,
    "\n  mutation AdminCancelOrder($input: AdminCancelOrderInput!) {\n    adminCancelOrder(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.AdminCancelOrderDocument,
    "\n  query AdminSellers($input: AdminSellerListInput) {\n    adminSellers(input: $input) {\n      items {\n        accountId\n        username\n        email\n        name\n        status\n        mustChangePassword\n        lastLoginAt\n        profile {\n          businessName\n          businessPhone\n          websiteUrl\n        }\n        store {\n          id\n          storeName\n          storePhone\n          addressFull\n          isActive\n        }\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminSellersDocument,
    "\n  query AdminSeller($accountId: ID!) {\n    adminSeller(accountId: $accountId) {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      profile {\n        businessName\n        businessPhone\n        websiteUrl\n      }\n      store {\n        id\n        storeName\n        storePhone\n        addressFull\n        isActive\n      }\n      createdAt\n    }\n  }\n": typeof types.AdminSellerDocument,
    "\n  mutation AdminCreateSeller($input: AdminCreateSellerInput!) {\n    adminCreateSeller(input: $input) {\n      accountId\n      username\n    }\n  }\n": typeof types.AdminCreateSellerDocument,
    "\n  mutation AdminResetSellerPassword($input: AdminResetSellerPasswordInput!) {\n    adminResetSellerPassword(input: $input)\n  }\n": typeof types.AdminResetSellerPasswordDocument,
    "\n  query AdminStores($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        sellerAccountId\n        storeName\n        storePhone\n        addressFull\n        regionId\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminStoresDocument,
    "\n  query AdminStore($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        sellerAccountId\n        storeName\n        storePhone\n        addressFull\n        addressCity\n        addressDistrict\n        addressNeighborhood\n        regionId\n        latitude\n        longitude\n        mapProvider\n        websiteUrl\n        businessHoursText\n        profileImageUrl\n        greetingMessage\n        pickupSlotIntervalMinutes\n        minLeadTimeMinutes\n        maxDaysAhead\n        isActive\n        createdAt\n        updatedAt\n      }\n      seller {\n        accountId\n        username\n        email\n        name\n        status\n      }\n      productCount\n      orderItemCount\n    }\n  }\n": typeof types.AdminStoreDocument,
    "\n  mutation AdminSetStoreActive($input: AdminSetStoreActiveInput!) {\n    adminSetStoreActive(input: $input) {\n      id\n      isActive\n    }\n  }\n": typeof types.AdminSetStoreActiveDocument,
    "\n  mutation AdminUpdateStoreBasicInfo($input: AdminUpdateStoreBasicInfoInput!) {\n    adminUpdateStoreBasicInfo(input: $input) {\n      id\n      updatedAt\n    }\n  }\n": typeof types.AdminUpdateStoreBasicInfoDocument,
    "\n  mutation AdminCreateUploadUrl($input: AdminCreateUploadUrlInput!) {\n    adminCreateUploadUrl(input: $input) {\n      uploadUrl\n      publicUrl\n      key\n      expiresInSeconds\n    }\n  }\n": typeof types.AdminCreateUploadUrlDocument,
};
const documents: Documents = {
    "\n  query AdminMe {\n    adminMe {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      createdAt\n    }\n  }\n": types.AdminMeDocument,
    "\n  query AdminUsers($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        email\n        name\n        status\n        nickname\n        phoneNumber\n        onboardingCompleted\n        identityProviders\n        orderCount\n        reviewCount\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminUsersDocument,
    "\n  query AdminUser($accountId: ID!) {\n    adminUser(accountId: $accountId) {\n      accountId\n      email\n      name\n      status\n      nickname\n      phoneNumber\n      onboardingCompleted\n      identityProviders\n      orderCount\n      reviewCount\n      createdAt\n    }\n  }\n": types.AdminUserDocument,
    "\n  mutation AdminSuspendAccount($input: AdminSuspendAccountInput!) {\n    adminSuspendAccount(input: $input) {\n      accountId\n      accountType\n      status\n    }\n  }\n": types.AdminSuspendAccountDocument,
    "\n  mutation AdminReinstateAccount($accountId: ID!) {\n    adminReinstateAccount(accountId: $accountId) {\n      accountId\n      accountType\n      status\n    }\n  }\n": types.AdminReinstateAccountDocument,
    "\n  query AdminDashboardSummary($input: AdminDashboardSummaryInput!) {\n    adminDashboardSummary(input: $input) {\n      from\n      to\n      newUserCount\n      newSellerCount\n      orderCounts {\n        submitted\n        confirmed\n        made\n        pickedUp\n        canceled\n      }\n      orderAmountSum\n      activeStoreCount\n      activeProductCount\n      pendingReportCount\n    }\n  }\n": types.AdminDashboardSummaryDocument,
    "\n  query AdminSearchKeywordSnapshot($input: AdminSearchKeywordSnapshotInput) {\n    adminSearchKeywordSnapshot(input: $input) {\n      rankedAt\n      items {\n        rank\n        keyword\n        searchCount\n      }\n    }\n  }\n": types.AdminSearchKeywordSnapshotDocument,
    "\n  query AdminOrders($input: AdminOrderListInput) {\n    adminOrders(input: $input) {\n      items {\n        id\n        orderNumber\n        accountId\n        storeId\n        status\n        pickupAt\n        buyerName\n        buyerPhone\n        totalPrice\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminOrdersDocument,
    "\n  query AdminOrder($orderId: ID!) {\n    adminOrder(orderId: $orderId) {\n      id\n      orderNumber\n      buyer {\n        accountId\n        email\n        nickname\n        status\n      }\n      status\n      pickupAt\n      buyerName\n      buyerPhone\n      subtotalPrice\n      discountPrice\n      totalPrice\n      submittedAt\n      confirmedAt\n      madeAt\n      pickedUpAt\n      canceledAt\n      createdAt\n      updatedAt\n      items {\n        id\n        storeId\n        productId\n        productName\n        regularPrice\n        salePrice\n        quantity\n        itemSubtotalPrice\n        optionItems {\n          id\n          groupName\n          optionTitle\n          priceDelta\n        }\n        customTexts {\n          id\n          tokenKey\n          defaultText\n          valueText\n          sortOrder\n        }\n        freeEdits {\n          id\n          cropImageUrl\n          descriptionText\n          sortOrder\n          attachments {\n            id\n            imageUrl\n            sortOrder\n          }\n        }\n      }\n      statusHistories {\n        id\n        fromStatus\n        toStatus\n        changedAt\n        note\n      }\n    }\n  }\n": types.AdminOrderDocument,
    "\n  mutation AdminCancelOrder($input: AdminCancelOrderInput!) {\n    adminCancelOrder(input: $input) {\n      id\n      status\n    }\n  }\n": types.AdminCancelOrderDocument,
    "\n  query AdminSellers($input: AdminSellerListInput) {\n    adminSellers(input: $input) {\n      items {\n        accountId\n        username\n        email\n        name\n        status\n        mustChangePassword\n        lastLoginAt\n        profile {\n          businessName\n          businessPhone\n          websiteUrl\n        }\n        store {\n          id\n          storeName\n          storePhone\n          addressFull\n          isActive\n        }\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminSellersDocument,
    "\n  query AdminSeller($accountId: ID!) {\n    adminSeller(accountId: $accountId) {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      profile {\n        businessName\n        businessPhone\n        websiteUrl\n      }\n      store {\n        id\n        storeName\n        storePhone\n        addressFull\n        isActive\n      }\n      createdAt\n    }\n  }\n": types.AdminSellerDocument,
    "\n  mutation AdminCreateSeller($input: AdminCreateSellerInput!) {\n    adminCreateSeller(input: $input) {\n      accountId\n      username\n    }\n  }\n": types.AdminCreateSellerDocument,
    "\n  mutation AdminResetSellerPassword($input: AdminResetSellerPasswordInput!) {\n    adminResetSellerPassword(input: $input)\n  }\n": types.AdminResetSellerPasswordDocument,
    "\n  query AdminStores($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        sellerAccountId\n        storeName\n        storePhone\n        addressFull\n        regionId\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminStoresDocument,
    "\n  query AdminStore($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        sellerAccountId\n        storeName\n        storePhone\n        addressFull\n        addressCity\n        addressDistrict\n        addressNeighborhood\n        regionId\n        latitude\n        longitude\n        mapProvider\n        websiteUrl\n        businessHoursText\n        profileImageUrl\n        greetingMessage\n        pickupSlotIntervalMinutes\n        minLeadTimeMinutes\n        maxDaysAhead\n        isActive\n        createdAt\n        updatedAt\n      }\n      seller {\n        accountId\n        username\n        email\n        name\n        status\n      }\n      productCount\n      orderItemCount\n    }\n  }\n": types.AdminStoreDocument,
    "\n  mutation AdminSetStoreActive($input: AdminSetStoreActiveInput!) {\n    adminSetStoreActive(input: $input) {\n      id\n      isActive\n    }\n  }\n": types.AdminSetStoreActiveDocument,
    "\n  mutation AdminUpdateStoreBasicInfo($input: AdminUpdateStoreBasicInfoInput!) {\n    adminUpdateStoreBasicInfo(input: $input) {\n      id\n      updatedAt\n    }\n  }\n": types.AdminUpdateStoreBasicInfoDocument,
    "\n  mutation AdminCreateUploadUrl($input: AdminCreateUploadUrlInput!) {\n    adminCreateUploadUrl(input: $input) {\n      uploadUrl\n      publicUrl\n      key\n      expiresInSeconds\n    }\n  }\n": types.AdminCreateUploadUrlDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminMe {\n    adminMe {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      createdAt\n    }\n  }\n"): typeof import('./graphql').AdminMeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminUsers($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        email\n        name\n        status\n        nickname\n        phoneNumber\n        onboardingCompleted\n        identityProviders\n        orderCount\n        reviewCount\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminUsersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminUser($accountId: ID!) {\n    adminUser(accountId: $accountId) {\n      accountId\n      email\n      name\n      status\n      nickname\n      phoneNumber\n      onboardingCompleted\n      identityProviders\n      orderCount\n      reviewCount\n      createdAt\n    }\n  }\n"): typeof import('./graphql').AdminUserDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminSuspendAccount($input: AdminSuspendAccountInput!) {\n    adminSuspendAccount(input: $input) {\n      accountId\n      accountType\n      status\n    }\n  }\n"): typeof import('./graphql').AdminSuspendAccountDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminReinstateAccount($accountId: ID!) {\n    adminReinstateAccount(accountId: $accountId) {\n      accountId\n      accountType\n      status\n    }\n  }\n"): typeof import('./graphql').AdminReinstateAccountDocument;
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
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminSellers($input: AdminSellerListInput) {\n    adminSellers(input: $input) {\n      items {\n        accountId\n        username\n        email\n        name\n        status\n        mustChangePassword\n        lastLoginAt\n        profile {\n          businessName\n          businessPhone\n          websiteUrl\n        }\n        store {\n          id\n          storeName\n          storePhone\n          addressFull\n          isActive\n        }\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminSellersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminSeller($accountId: ID!) {\n    adminSeller(accountId: $accountId) {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      profile {\n        businessName\n        businessPhone\n        websiteUrl\n      }\n      store {\n        id\n        storeName\n        storePhone\n        addressFull\n        isActive\n      }\n      createdAt\n    }\n  }\n"): typeof import('./graphql').AdminSellerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCreateSeller($input: AdminCreateSellerInput!) {\n    adminCreateSeller(input: $input) {\n      accountId\n      username\n    }\n  }\n"): typeof import('./graphql').AdminCreateSellerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminResetSellerPassword($input: AdminResetSellerPasswordInput!) {\n    adminResetSellerPassword(input: $input)\n  }\n"): typeof import('./graphql').AdminResetSellerPasswordDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminStores($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        sellerAccountId\n        storeName\n        storePhone\n        addressFull\n        regionId\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminStoresDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminStore($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        sellerAccountId\n        storeName\n        storePhone\n        addressFull\n        addressCity\n        addressDistrict\n        addressNeighborhood\n        regionId\n        latitude\n        longitude\n        mapProvider\n        websiteUrl\n        businessHoursText\n        profileImageUrl\n        greetingMessage\n        pickupSlotIntervalMinutes\n        minLeadTimeMinutes\n        maxDaysAhead\n        isActive\n        createdAt\n        updatedAt\n      }\n      seller {\n        accountId\n        username\n        email\n        name\n        status\n      }\n      productCount\n      orderItemCount\n    }\n  }\n"): typeof import('./graphql').AdminStoreDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminSetStoreActive($input: AdminSetStoreActiveInput!) {\n    adminSetStoreActive(input: $input) {\n      id\n      isActive\n    }\n  }\n"): typeof import('./graphql').AdminSetStoreActiveDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminUpdateStoreBasicInfo($input: AdminUpdateStoreBasicInfoInput!) {\n    adminUpdateStoreBasicInfo(input: $input) {\n      id\n      updatedAt\n    }\n  }\n"): typeof import('./graphql').AdminUpdateStoreBasicInfoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCreateUploadUrl($input: AdminCreateUploadUrlInput!) {\n    adminCreateUploadUrl(input: $input) {\n      uploadUrl\n      publicUrl\n      key\n      expiresInSeconds\n    }\n  }\n"): typeof import('./graphql').AdminCreateUploadUrlDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
