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
    "\n  query AdminAdmins($input: CursorInput) {\n    adminAdmins(input: $input) {\n      items {\n        accountId\n        username\n        email\n        name\n        status\n        mustChangePassword\n        lastLoginAt\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminAdminsDocument,
    "\n  mutation AdminCreateAdmin($input: AdminCreateAdminInput!) {\n    adminCreateAdmin(input: $input) {\n      accountId\n      username\n    }\n  }\n": typeof types.AdminCreateAdminDocument,
    "\n  mutation AdminResetAdminPassword($input: AdminResetAdminPasswordInput!) {\n    adminResetAdminPassword(input: $input)\n  }\n": typeof types.AdminResetAdminPasswordDocument,
    "\n  query AdminMe {\n    adminMe {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      createdAt\n    }\n  }\n": typeof types.AdminMeDocument,
    "\n  query AdminUsers($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        email\n        name\n        status\n        nickname\n        phoneNumber\n        onboardingCompleted\n        identityProviders\n        orderCount\n        reviewCount\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminUsersDocument,
    "\n  query AdminUser($accountId: ID!) {\n    adminUser(accountId: $accountId) {\n      accountId\n      email\n      name\n      status\n      nickname\n      phoneNumber\n      onboardingCompleted\n      identityProviders\n      orderCount\n      reviewCount\n      createdAt\n    }\n  }\n": typeof types.AdminUserDocument,
    "\n  mutation AdminSuspendAccount($input: AdminSuspendAccountInput!) {\n    adminSuspendAccount(input: $input) {\n      accountId\n      accountType\n      status\n    }\n  }\n": typeof types.AdminSuspendAccountDocument,
    "\n  mutation AdminReinstateAccount($accountId: ID!) {\n    adminReinstateAccount(accountId: $accountId) {\n      accountId\n      accountType\n      status\n    }\n  }\n": typeof types.AdminReinstateAccountDocument,
    "\n  query AdminAuditLogs($input: AdminAuditLogListInput) {\n    adminAuditLogs(input: $input) {\n      items {\n        id\n        actorAccountId\n        actorAccountType\n        actorLabel\n        storeId\n        targetType\n        targetId\n        action\n        beforeJson\n        afterJson\n        ipAddress\n        userAgent\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminAuditLogsDocument,
    "\n  query AdminAuditStorePicker($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n": typeof types.AdminAuditStorePickerDocument,
    "\n  query AdminAuditActorPicker($sellers: AdminSellerListInput, $admins: CursorInput) {\n    adminSellers(input: $sellers) {\n      items {\n        accountId\n        username\n        name\n      }\n    }\n    adminAdmins(input: $admins) {\n      items {\n        accountId\n        username\n        name\n      }\n    }\n  }\n": typeof types.AdminAuditActorPickerDocument,
    "\n  query AdminBanners($input: AdminBannerListInput) {\n    adminBanners(input: $input) {\n      items {\n        id\n        placement\n        title\n        imageUrl\n        linkType\n        linkUrl\n        linkProductId\n        linkStoreId\n        linkCategoryId\n        startsAt\n        endsAt\n        sortOrder\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminBannersDocument,
    "\n  query AdminBanner($bannerId: ID!) {\n    adminBanner(bannerId: $bannerId) {\n      id\n      placement\n      title\n      imageUrl\n      linkType\n      linkUrl\n      linkProductId\n      linkStoreId\n      linkCategoryId\n      startsAt\n      endsAt\n      sortOrder\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.AdminBannerDocument,
    "\n  mutation AdminCreateBanner($input: AdminCreateBannerInput!) {\n    adminCreateBanner(input: $input) {\n      id\n    }\n  }\n": typeof types.AdminCreateBannerDocument,
    "\n  mutation AdminUpdateBanner($input: AdminUpdateBannerInput!) {\n    adminUpdateBanner(input: $input) {\n      id\n      updatedAt\n    }\n  }\n": typeof types.AdminUpdateBannerDocument,
    "\n  mutation AdminDeleteBanner($bannerId: ID!) {\n    adminDeleteBanner(bannerId: $bannerId)\n  }\n": typeof types.AdminDeleteBannerDocument,
    "\n  query AdminBannersVisible($input: AdminBannerListInput) {\n    adminBanners(input: $input) {\n      items {\n        id\n        placement\n        linkCategoryId\n        startsAt\n        endsAt\n        sortOrder\n        isActive\n      }\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminBannersVisibleDocument,
    "\n  query AdminBannerProductOptions($input: AdminProductListInput) {\n    adminProducts(input: $input) {\n      items {\n        id\n        name\n        storeName\n      }\n    }\n  }\n": typeof types.AdminBannerProductOptionsDocument,
    "\n  query AdminBannerStoreOptions($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n      }\n    }\n  }\n": typeof types.AdminBannerStoreOptionsDocument,
    "\n  query AdminBannerCategoryOptions($input: AdminCategoryListInput) {\n    adminCategories(input: $input) {\n      id\n      name\n      isActive\n    }\n  }\n": typeof types.AdminBannerCategoryOptionsDocument,
    "\n  query AdminBannerProductLabel($productId: ID!) {\n    adminProduct(productId: $productId) {\n      product {\n        id\n        name\n      }\n    }\n  }\n": typeof types.AdminBannerProductLabelDocument,
    "\n  query AdminBannerStoreLabel($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        storeName\n      }\n    }\n  }\n": typeof types.AdminBannerStoreLabelDocument,
    "\n  query AdminDashboardSummary($input: AdminDashboardSummaryInput!) {\n    adminDashboardSummary(input: $input) {\n      from\n      to\n      newUserCount\n      newSellerCount\n      orderCounts {\n        submitted\n        confirmed\n        made\n        pickedUp\n        canceled\n      }\n      orderAmountSum\n      activeStoreCount\n      activeProductCount\n      pendingReportCount\n    }\n  }\n": typeof types.AdminDashboardSummaryDocument,
    "\n  query AdminSearchKeywordSnapshot($input: AdminSearchKeywordSnapshotInput) {\n    adminSearchKeywordSnapshot(input: $input) {\n      rankedAt\n      items {\n        rank\n        keyword\n        searchCount\n      }\n    }\n  }\n": typeof types.AdminSearchKeywordSnapshotDocument,
    "\n  query AdminNotificationBroadcasts($input: AdminNotificationBroadcastListInput) {\n    adminNotificationBroadcasts(input: $input) {\n      items {\n        id\n        type\n        title\n        body\n        targetKind\n        targetCount\n        skippedCount\n        deliveredCount\n        status\n        actorAccountId\n        actorLabel\n        requestedAt\n        completedAt\n        targetAccountIds\n        skippedAccountIds\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminNotificationBroadcastsDocument,
    "\n  query AdminNotificationBroadcast($broadcastId: ID!) {\n    adminNotificationBroadcast(broadcastId: $broadcastId) {\n      id\n      type\n      title\n      body\n      targetKind\n      targetCount\n      skippedCount\n      deliveredCount\n      status\n      actorAccountId\n      actorLabel\n      requestedAt\n      completedAt\n      targetAccountIds\n      skippedAccountIds\n    }\n  }\n": typeof types.AdminNotificationBroadcastDocument,
    "\n  mutation AdminSendNotification($input: AdminSendNotificationInput!) {\n    adminSendNotification(input: $input) {\n      sentCount\n      skippedAccountIds\n      broadcastId\n    }\n  }\n": typeof types.AdminSendNotificationDocument,
    "\n  query AdminNotificationActiveUserCount {\n    adminUsers(input: { status: ACTIVE, limit: 1 }) {\n      totalCount\n    }\n  }\n": typeof types.AdminNotificationActiveUserCountDocument,
    "\n  query AdminNotificationUserOptions($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        nickname\n        name\n        email\n      }\n    }\n  }\n": typeof types.AdminNotificationUserOptionsDocument,
    "\n  query AdminOrders($input: AdminOrderListInput) {\n    adminOrders(input: $input) {\n      items {\n        id\n        orderNumber\n        accountId\n        storeId\n        storeName\n        status\n        pickupAt\n        buyerName\n        buyerPhone\n        totalPrice\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminOrdersDocument,
    "\n  query AdminOrder($orderId: ID!) {\n    adminOrder(orderId: $orderId) {\n      id\n      orderNumber\n      buyer {\n        accountId\n        email\n        nickname\n        status\n      }\n      status\n      pickupAt\n      buyerName\n      buyerPhone\n      subtotalPrice\n      discountPrice\n      totalPrice\n      submittedAt\n      confirmedAt\n      madeAt\n      pickedUpAt\n      canceledAt\n      createdAt\n      updatedAt\n      items {\n        id\n        storeId\n        productId\n        productName\n        regularPrice\n        salePrice\n        quantity\n        itemSubtotalPrice\n        optionItems {\n          id\n          groupName\n          optionTitle\n          priceDelta\n        }\n        customTexts {\n          id\n          tokenKey\n          defaultText\n          valueText\n          sortOrder\n        }\n        freeEdits {\n          id\n          cropImageUrl\n          descriptionText\n          sortOrder\n          attachments {\n            id\n            imageUrl\n            sortOrder\n          }\n        }\n      }\n      statusHistories {\n        id\n        fromStatus\n        toStatus\n        changedAt\n        note\n      }\n    }\n  }\n": typeof types.AdminOrderDocument,
    "\n  query AdminOrdersStoreOptions($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n": typeof types.AdminOrdersStoreOptionsDocument,
    "\n  query AdminOrdersBuyerOptions($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        nickname\n        name\n        email\n      }\n    }\n  }\n": typeof types.AdminOrdersBuyerOptionsDocument,
    "\n  query AdminOrdersStoreName($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        storeName\n      }\n    }\n  }\n": typeof types.AdminOrdersStoreNameDocument,
    "\n  query AdminOrdersBuyerName($accountId: ID!) {\n    adminUser(accountId: $accountId) {\n      accountId\n      nickname\n      name\n      email\n    }\n  }\n": typeof types.AdminOrdersBuyerNameDocument,
    "\n  mutation AdminCancelOrder($input: AdminCancelOrderInput!) {\n    adminCancelOrder(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.AdminCancelOrderDocument,
    "\n  query AdminProducts($input: AdminProductListInput) {\n    adminProducts(input: $input) {\n      items {\n        id\n        storeId\n        storeName\n        name\n        regularPrice\n        salePrice\n        currency\n        baseDesignImageUrl\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminProductsDocument,
    "\n  query AdminProduct($productId: ID!) {\n    adminProduct(productId: $productId) {\n      product {\n        id\n        storeId\n        storeName\n        name\n        regularPrice\n        salePrice\n        currency\n        baseDesignImageUrl\n        isActive\n        createdAt\n        updatedAt\n      }\n      storeIsActive\n      description\n      purchaseNotice\n      preparationTimeMinutes\n      imageUrls\n      reviewCount\n      orderItemCount\n      categories {\n        id\n        categoryType\n        name\n        isActive\n      }\n      tags {\n        id\n        name\n      }\n      optionGroups {\n        id\n        name\n        description\n        isRequired\n        minSelect\n        maxSelect\n        optionRequiresDescription\n        optionRequiresImage\n        sortOrder\n        isActive\n        optionItems {\n          id\n          title\n          description\n          imageUrl\n          priceDelta\n          sortOrder\n          isActive\n        }\n      }\n      customTemplate {\n        id\n        baseImageUrl\n        isActive\n        textTokens {\n          id\n          tokenKey\n          defaultText\n          maxLength\n          sortOrder\n          isRequired\n        }\n      }\n    }\n  }\n": typeof types.AdminProductDocument,
    "\n  query AdminProductStoreOptions($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n": typeof types.AdminProductStoreOptionsDocument,
    "\n  mutation AdminSetProductActive($input: AdminSetProductActiveInput!) {\n    adminSetProductActive(input: $input) {\n      id\n      isActive\n    }\n  }\n": typeof types.AdminSetProductActiveDocument,
    "\n  query AdminRegions($input: AdminRegionListInput) {\n    adminRegions(input: $input) {\n      id\n      parentId\n      level\n      name\n      slug\n      sortOrder\n      isActive\n      centerLat\n      centerLng\n      storeCount\n      childCount\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.AdminRegionsDocument,
    "\n  query AdminGeocodeAddress($query: String!) {\n    adminGeocodeAddress(query: $query) {\n      latitude\n      longitude\n      sigunguCode\n      regionId\n    }\n  }\n": typeof types.AdminGeocodeAddressDocument,
    "\n  mutation AdminCreateRegion($input: AdminCreateRegionInput!) {\n    adminCreateRegion(input: $input) {\n      id\n    }\n  }\n": typeof types.AdminCreateRegionDocument,
    "\n  mutation AdminUpdateRegion($input: AdminUpdateRegionInput!) {\n    adminUpdateRegion(input: $input) {\n      id\n    }\n  }\n": typeof types.AdminUpdateRegionDocument,
    "\n  mutation AdminDeleteRegion($regionId: ID!) {\n    adminDeleteRegion(regionId: $regionId)\n  }\n": typeof types.AdminDeleteRegionDocument,
    "\n  query AdminReviews($input: AdminReviewListInput) {\n    adminReviews(input: $input) {\n      items {\n        id\n        storeId\n        storeName\n        productId\n        productName\n        authorAccountId\n        authorNickname\n        rating\n        content\n        commentCount\n        likeCount\n        deleted\n        media {\n          mediaType\n          mediaUrl\n          thumbnailUrl\n          sortOrder\n        }\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminReviewsDocument,
    "\n  query AdminReviewComments($input: AdminReviewCommentListInput) {\n    adminReviewComments(input: $input) {\n      items {\n        id\n        reviewId\n        authorAccountId\n        authorNickname\n        content\n        deleted\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminReviewCommentsDocument,
    "\n  query AdminReviewReports($input: AdminReviewReportListInput) {\n    adminReviewReports(input: $input) {\n      items {\n        id\n        targetType\n        targetId\n        reporterAccountId\n        reporterNickname\n        reporterWithdrawn\n        reason\n        detail\n        contentSnapshot\n        status\n        resolvedByAccountId\n        resolvedByLabel\n        resolvedAt\n        resolutionNote\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminReviewReportsDocument,
    "\n  query AdminReviewReport($reportId: ID!) {\n    adminReviewReport(reportId: $reportId) {\n      report {\n        id\n        targetType\n        targetId\n        reporterAccountId\n        reporterNickname\n        reporterWithdrawn\n        reason\n        detail\n        contentSnapshot\n        status\n        resolvedByAccountId\n        resolvedByLabel\n        resolvedAt\n        resolutionNote\n        createdAt\n      }\n      target {\n        id\n        reviewId\n        authorAccountId\n        authorNickname\n        content\n        storeId\n        storeName\n        deleted\n        media {\n          mediaType\n          mediaUrl\n          thumbnailUrl\n          sortOrder\n        }\n      }\n    }\n  }\n": typeof types.AdminReviewReportDocument,
    "\n  query AdminReviewStorePicker($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n": typeof types.AdminReviewStorePickerDocument,
    "\n  query AdminReviewAuthorPicker($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        nickname\n        name\n        email\n      }\n    }\n  }\n": typeof types.AdminReviewAuthorPickerDocument,
    "\n  mutation AdminDeleteReview($input: AdminDeleteReviewInput!) {\n    adminDeleteReview(input: $input)\n  }\n": typeof types.AdminDeleteReviewDocument,
    "\n  mutation AdminDeleteReviewComment($input: AdminDeleteReviewCommentInput!) {\n    adminDeleteReviewComment(input: $input)\n  }\n": typeof types.AdminDeleteReviewCommentDocument,
    "\n  mutation AdminResolveReviewReport($input: AdminResolveReviewReportInput!) {\n    adminResolveReviewReport(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.AdminResolveReviewReportDocument,
    "\n  query AdminSellers($input: AdminSellerListInput) {\n    adminSellers(input: $input) {\n      items {\n        accountId\n        username\n        email\n        name\n        status\n        mustChangePassword\n        lastLoginAt\n        profile {\n          businessName\n          businessPhone\n          websiteUrl\n        }\n        store {\n          id\n          storeName\n          storePhone\n          addressFull\n          isActive\n        }\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminSellersDocument,
    "\n  query AdminSeller($accountId: ID!) {\n    adminSeller(accountId: $accountId) {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      profile {\n        businessName\n        businessPhone\n        websiteUrl\n      }\n      store {\n        id\n        storeName\n        storePhone\n        addressFull\n        isActive\n      }\n      createdAt\n    }\n  }\n": typeof types.AdminSellerDocument,
    "\n  mutation AdminCreateSeller($input: AdminCreateSellerInput!) {\n    adminCreateSeller(input: $input) {\n      accountId\n      username\n    }\n  }\n": typeof types.AdminCreateSellerDocument,
    "\n  mutation AdminResetSellerPassword($input: AdminResetSellerPasswordInput!) {\n    adminResetSellerPassword(input: $input)\n  }\n": typeof types.AdminResetSellerPasswordDocument,
    "\n  query AdminStores($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        sellerAccountId\n        sellerLabel\n        storeName\n        storePhone\n        addressFull\n        regionId\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminStoresDocument,
    "\n  query AdminStore($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        sellerAccountId\n        sellerLabel\n        storeName\n        storePhone\n        addressFull\n        addressCity\n        addressDistrict\n        addressNeighborhood\n        regionId\n        latitude\n        longitude\n        mapProvider\n        websiteUrl\n        businessHoursText\n        profileImageUrl\n        greetingMessage\n        pickupSlotIntervalMinutes\n        minLeadTimeMinutes\n        maxDaysAhead\n        isActive\n        createdAt\n        updatedAt\n      }\n      seller {\n        accountId\n        username\n        email\n        name\n        status\n      }\n      productCount\n      orderItemCount\n    }\n  }\n": typeof types.AdminStoreDocument,
    "\n  mutation AdminSetStoreActive($input: AdminSetStoreActiveInput!) {\n    adminSetStoreActive(input: $input) {\n      id\n      isActive\n    }\n  }\n": typeof types.AdminSetStoreActiveDocument,
    "\n  mutation AdminUpdateStoreBasicInfo($input: AdminUpdateStoreBasicInfoInput!) {\n    adminUpdateStoreBasicInfo(input: $input) {\n      id\n      updatedAt\n    }\n  }\n": typeof types.AdminUpdateStoreBasicInfoDocument,
    "\n  query AdminCategories($input: AdminCategoryListInput) {\n    adminCategories(input: $input) {\n      id\n      categoryType\n      name\n      description\n      sortOrder\n      isActive\n      productCount\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.AdminCategoriesDocument,
    "\n  mutation AdminCreateCategory($input: AdminCreateCategoryInput!) {\n    adminCreateCategory(input: $input) {\n      id\n    }\n  }\n": typeof types.AdminCreateCategoryDocument,
    "\n  mutation AdminUpdateCategory($input: AdminUpdateCategoryInput!) {\n    adminUpdateCategory(input: $input) {\n      id\n    }\n  }\n": typeof types.AdminUpdateCategoryDocument,
    "\n  mutation AdminDeleteCategory($categoryId: ID!) {\n    adminDeleteCategory(categoryId: $categoryId)\n  }\n": typeof types.AdminDeleteCategoryDocument,
    "\n  query AdminTags($input: AdminTagListInput) {\n    adminTags(input: $input) {\n      items {\n        id\n        name\n        productCount\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": typeof types.AdminTagsDocument,
    "\n  mutation AdminCreateTag($input: AdminCreateTagInput!) {\n    adminCreateTag(input: $input) {\n      id\n    }\n  }\n": typeof types.AdminCreateTagDocument,
    "\n  mutation AdminUpdateTag($input: AdminUpdateTagInput!) {\n    adminUpdateTag(input: $input) {\n      id\n    }\n  }\n": typeof types.AdminUpdateTagDocument,
    "\n  mutation AdminDeleteTag($tagId: ID!) {\n    adminDeleteTag(tagId: $tagId)\n  }\n": typeof types.AdminDeleteTagDocument,
    "\n  mutation AdminCreateUploadUrl($input: AdminCreateUploadUrlInput!) {\n    adminCreateUploadUrl(input: $input) {\n      uploadUrl\n      publicUrl\n      key\n      expiresInSeconds\n    }\n  }\n": typeof types.AdminCreateUploadUrlDocument,
};
const documents: Documents = {
    "\n  query AdminAdmins($input: CursorInput) {\n    adminAdmins(input: $input) {\n      items {\n        accountId\n        username\n        email\n        name\n        status\n        mustChangePassword\n        lastLoginAt\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminAdminsDocument,
    "\n  mutation AdminCreateAdmin($input: AdminCreateAdminInput!) {\n    adminCreateAdmin(input: $input) {\n      accountId\n      username\n    }\n  }\n": types.AdminCreateAdminDocument,
    "\n  mutation AdminResetAdminPassword($input: AdminResetAdminPasswordInput!) {\n    adminResetAdminPassword(input: $input)\n  }\n": types.AdminResetAdminPasswordDocument,
    "\n  query AdminMe {\n    adminMe {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      createdAt\n    }\n  }\n": types.AdminMeDocument,
    "\n  query AdminUsers($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        email\n        name\n        status\n        nickname\n        phoneNumber\n        onboardingCompleted\n        identityProviders\n        orderCount\n        reviewCount\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminUsersDocument,
    "\n  query AdminUser($accountId: ID!) {\n    adminUser(accountId: $accountId) {\n      accountId\n      email\n      name\n      status\n      nickname\n      phoneNumber\n      onboardingCompleted\n      identityProviders\n      orderCount\n      reviewCount\n      createdAt\n    }\n  }\n": types.AdminUserDocument,
    "\n  mutation AdminSuspendAccount($input: AdminSuspendAccountInput!) {\n    adminSuspendAccount(input: $input) {\n      accountId\n      accountType\n      status\n    }\n  }\n": types.AdminSuspendAccountDocument,
    "\n  mutation AdminReinstateAccount($accountId: ID!) {\n    adminReinstateAccount(accountId: $accountId) {\n      accountId\n      accountType\n      status\n    }\n  }\n": types.AdminReinstateAccountDocument,
    "\n  query AdminAuditLogs($input: AdminAuditLogListInput) {\n    adminAuditLogs(input: $input) {\n      items {\n        id\n        actorAccountId\n        actorAccountType\n        actorLabel\n        storeId\n        targetType\n        targetId\n        action\n        beforeJson\n        afterJson\n        ipAddress\n        userAgent\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminAuditLogsDocument,
    "\n  query AdminAuditStorePicker($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n": types.AdminAuditStorePickerDocument,
    "\n  query AdminAuditActorPicker($sellers: AdminSellerListInput, $admins: CursorInput) {\n    adminSellers(input: $sellers) {\n      items {\n        accountId\n        username\n        name\n      }\n    }\n    adminAdmins(input: $admins) {\n      items {\n        accountId\n        username\n        name\n      }\n    }\n  }\n": types.AdminAuditActorPickerDocument,
    "\n  query AdminBanners($input: AdminBannerListInput) {\n    adminBanners(input: $input) {\n      items {\n        id\n        placement\n        title\n        imageUrl\n        linkType\n        linkUrl\n        linkProductId\n        linkStoreId\n        linkCategoryId\n        startsAt\n        endsAt\n        sortOrder\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminBannersDocument,
    "\n  query AdminBanner($bannerId: ID!) {\n    adminBanner(bannerId: $bannerId) {\n      id\n      placement\n      title\n      imageUrl\n      linkType\n      linkUrl\n      linkProductId\n      linkStoreId\n      linkCategoryId\n      startsAt\n      endsAt\n      sortOrder\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n": types.AdminBannerDocument,
    "\n  mutation AdminCreateBanner($input: AdminCreateBannerInput!) {\n    adminCreateBanner(input: $input) {\n      id\n    }\n  }\n": types.AdminCreateBannerDocument,
    "\n  mutation AdminUpdateBanner($input: AdminUpdateBannerInput!) {\n    adminUpdateBanner(input: $input) {\n      id\n      updatedAt\n    }\n  }\n": types.AdminUpdateBannerDocument,
    "\n  mutation AdminDeleteBanner($bannerId: ID!) {\n    adminDeleteBanner(bannerId: $bannerId)\n  }\n": types.AdminDeleteBannerDocument,
    "\n  query AdminBannersVisible($input: AdminBannerListInput) {\n    adminBanners(input: $input) {\n      items {\n        id\n        placement\n        linkCategoryId\n        startsAt\n        endsAt\n        sortOrder\n        isActive\n      }\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminBannersVisibleDocument,
    "\n  query AdminBannerProductOptions($input: AdminProductListInput) {\n    adminProducts(input: $input) {\n      items {\n        id\n        name\n        storeName\n      }\n    }\n  }\n": types.AdminBannerProductOptionsDocument,
    "\n  query AdminBannerStoreOptions($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n      }\n    }\n  }\n": types.AdminBannerStoreOptionsDocument,
    "\n  query AdminBannerCategoryOptions($input: AdminCategoryListInput) {\n    adminCategories(input: $input) {\n      id\n      name\n      isActive\n    }\n  }\n": types.AdminBannerCategoryOptionsDocument,
    "\n  query AdminBannerProductLabel($productId: ID!) {\n    adminProduct(productId: $productId) {\n      product {\n        id\n        name\n      }\n    }\n  }\n": types.AdminBannerProductLabelDocument,
    "\n  query AdminBannerStoreLabel($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        storeName\n      }\n    }\n  }\n": types.AdminBannerStoreLabelDocument,
    "\n  query AdminDashboardSummary($input: AdminDashboardSummaryInput!) {\n    adminDashboardSummary(input: $input) {\n      from\n      to\n      newUserCount\n      newSellerCount\n      orderCounts {\n        submitted\n        confirmed\n        made\n        pickedUp\n        canceled\n      }\n      orderAmountSum\n      activeStoreCount\n      activeProductCount\n      pendingReportCount\n    }\n  }\n": types.AdminDashboardSummaryDocument,
    "\n  query AdminSearchKeywordSnapshot($input: AdminSearchKeywordSnapshotInput) {\n    adminSearchKeywordSnapshot(input: $input) {\n      rankedAt\n      items {\n        rank\n        keyword\n        searchCount\n      }\n    }\n  }\n": types.AdminSearchKeywordSnapshotDocument,
    "\n  query AdminNotificationBroadcasts($input: AdminNotificationBroadcastListInput) {\n    adminNotificationBroadcasts(input: $input) {\n      items {\n        id\n        type\n        title\n        body\n        targetKind\n        targetCount\n        skippedCount\n        deliveredCount\n        status\n        actorAccountId\n        actorLabel\n        requestedAt\n        completedAt\n        targetAccountIds\n        skippedAccountIds\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminNotificationBroadcastsDocument,
    "\n  query AdminNotificationBroadcast($broadcastId: ID!) {\n    adminNotificationBroadcast(broadcastId: $broadcastId) {\n      id\n      type\n      title\n      body\n      targetKind\n      targetCount\n      skippedCount\n      deliveredCount\n      status\n      actorAccountId\n      actorLabel\n      requestedAt\n      completedAt\n      targetAccountIds\n      skippedAccountIds\n    }\n  }\n": types.AdminNotificationBroadcastDocument,
    "\n  mutation AdminSendNotification($input: AdminSendNotificationInput!) {\n    adminSendNotification(input: $input) {\n      sentCount\n      skippedAccountIds\n      broadcastId\n    }\n  }\n": types.AdminSendNotificationDocument,
    "\n  query AdminNotificationActiveUserCount {\n    adminUsers(input: { status: ACTIVE, limit: 1 }) {\n      totalCount\n    }\n  }\n": types.AdminNotificationActiveUserCountDocument,
    "\n  query AdminNotificationUserOptions($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        nickname\n        name\n        email\n      }\n    }\n  }\n": types.AdminNotificationUserOptionsDocument,
    "\n  query AdminOrders($input: AdminOrderListInput) {\n    adminOrders(input: $input) {\n      items {\n        id\n        orderNumber\n        accountId\n        storeId\n        storeName\n        status\n        pickupAt\n        buyerName\n        buyerPhone\n        totalPrice\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminOrdersDocument,
    "\n  query AdminOrder($orderId: ID!) {\n    adminOrder(orderId: $orderId) {\n      id\n      orderNumber\n      buyer {\n        accountId\n        email\n        nickname\n        status\n      }\n      status\n      pickupAt\n      buyerName\n      buyerPhone\n      subtotalPrice\n      discountPrice\n      totalPrice\n      submittedAt\n      confirmedAt\n      madeAt\n      pickedUpAt\n      canceledAt\n      createdAt\n      updatedAt\n      items {\n        id\n        storeId\n        productId\n        productName\n        regularPrice\n        salePrice\n        quantity\n        itemSubtotalPrice\n        optionItems {\n          id\n          groupName\n          optionTitle\n          priceDelta\n        }\n        customTexts {\n          id\n          tokenKey\n          defaultText\n          valueText\n          sortOrder\n        }\n        freeEdits {\n          id\n          cropImageUrl\n          descriptionText\n          sortOrder\n          attachments {\n            id\n            imageUrl\n            sortOrder\n          }\n        }\n      }\n      statusHistories {\n        id\n        fromStatus\n        toStatus\n        changedAt\n        note\n      }\n    }\n  }\n": types.AdminOrderDocument,
    "\n  query AdminOrdersStoreOptions($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n": types.AdminOrdersStoreOptionsDocument,
    "\n  query AdminOrdersBuyerOptions($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        nickname\n        name\n        email\n      }\n    }\n  }\n": types.AdminOrdersBuyerOptionsDocument,
    "\n  query AdminOrdersStoreName($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        storeName\n      }\n    }\n  }\n": types.AdminOrdersStoreNameDocument,
    "\n  query AdminOrdersBuyerName($accountId: ID!) {\n    adminUser(accountId: $accountId) {\n      accountId\n      nickname\n      name\n      email\n    }\n  }\n": types.AdminOrdersBuyerNameDocument,
    "\n  mutation AdminCancelOrder($input: AdminCancelOrderInput!) {\n    adminCancelOrder(input: $input) {\n      id\n      status\n    }\n  }\n": types.AdminCancelOrderDocument,
    "\n  query AdminProducts($input: AdminProductListInput) {\n    adminProducts(input: $input) {\n      items {\n        id\n        storeId\n        storeName\n        name\n        regularPrice\n        salePrice\n        currency\n        baseDesignImageUrl\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminProductsDocument,
    "\n  query AdminProduct($productId: ID!) {\n    adminProduct(productId: $productId) {\n      product {\n        id\n        storeId\n        storeName\n        name\n        regularPrice\n        salePrice\n        currency\n        baseDesignImageUrl\n        isActive\n        createdAt\n        updatedAt\n      }\n      storeIsActive\n      description\n      purchaseNotice\n      preparationTimeMinutes\n      imageUrls\n      reviewCount\n      orderItemCount\n      categories {\n        id\n        categoryType\n        name\n        isActive\n      }\n      tags {\n        id\n        name\n      }\n      optionGroups {\n        id\n        name\n        description\n        isRequired\n        minSelect\n        maxSelect\n        optionRequiresDescription\n        optionRequiresImage\n        sortOrder\n        isActive\n        optionItems {\n          id\n          title\n          description\n          imageUrl\n          priceDelta\n          sortOrder\n          isActive\n        }\n      }\n      customTemplate {\n        id\n        baseImageUrl\n        isActive\n        textTokens {\n          id\n          tokenKey\n          defaultText\n          maxLength\n          sortOrder\n          isRequired\n        }\n      }\n    }\n  }\n": types.AdminProductDocument,
    "\n  query AdminProductStoreOptions($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n": types.AdminProductStoreOptionsDocument,
    "\n  mutation AdminSetProductActive($input: AdminSetProductActiveInput!) {\n    adminSetProductActive(input: $input) {\n      id\n      isActive\n    }\n  }\n": types.AdminSetProductActiveDocument,
    "\n  query AdminRegions($input: AdminRegionListInput) {\n    adminRegions(input: $input) {\n      id\n      parentId\n      level\n      name\n      slug\n      sortOrder\n      isActive\n      centerLat\n      centerLng\n      storeCount\n      childCount\n      createdAt\n      updatedAt\n    }\n  }\n": types.AdminRegionsDocument,
    "\n  query AdminGeocodeAddress($query: String!) {\n    adminGeocodeAddress(query: $query) {\n      latitude\n      longitude\n      sigunguCode\n      regionId\n    }\n  }\n": types.AdminGeocodeAddressDocument,
    "\n  mutation AdminCreateRegion($input: AdminCreateRegionInput!) {\n    adminCreateRegion(input: $input) {\n      id\n    }\n  }\n": types.AdminCreateRegionDocument,
    "\n  mutation AdminUpdateRegion($input: AdminUpdateRegionInput!) {\n    adminUpdateRegion(input: $input) {\n      id\n    }\n  }\n": types.AdminUpdateRegionDocument,
    "\n  mutation AdminDeleteRegion($regionId: ID!) {\n    adminDeleteRegion(regionId: $regionId)\n  }\n": types.AdminDeleteRegionDocument,
    "\n  query AdminReviews($input: AdminReviewListInput) {\n    adminReviews(input: $input) {\n      items {\n        id\n        storeId\n        storeName\n        productId\n        productName\n        authorAccountId\n        authorNickname\n        rating\n        content\n        commentCount\n        likeCount\n        deleted\n        media {\n          mediaType\n          mediaUrl\n          thumbnailUrl\n          sortOrder\n        }\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminReviewsDocument,
    "\n  query AdminReviewComments($input: AdminReviewCommentListInput) {\n    adminReviewComments(input: $input) {\n      items {\n        id\n        reviewId\n        authorAccountId\n        authorNickname\n        content\n        deleted\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminReviewCommentsDocument,
    "\n  query AdminReviewReports($input: AdminReviewReportListInput) {\n    adminReviewReports(input: $input) {\n      items {\n        id\n        targetType\n        targetId\n        reporterAccountId\n        reporterNickname\n        reporterWithdrawn\n        reason\n        detail\n        contentSnapshot\n        status\n        resolvedByAccountId\n        resolvedByLabel\n        resolvedAt\n        resolutionNote\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminReviewReportsDocument,
    "\n  query AdminReviewReport($reportId: ID!) {\n    adminReviewReport(reportId: $reportId) {\n      report {\n        id\n        targetType\n        targetId\n        reporterAccountId\n        reporterNickname\n        reporterWithdrawn\n        reason\n        detail\n        contentSnapshot\n        status\n        resolvedByAccountId\n        resolvedByLabel\n        resolvedAt\n        resolutionNote\n        createdAt\n      }\n      target {\n        id\n        reviewId\n        authorAccountId\n        authorNickname\n        content\n        storeId\n        storeName\n        deleted\n        media {\n          mediaType\n          mediaUrl\n          thumbnailUrl\n          sortOrder\n        }\n      }\n    }\n  }\n": types.AdminReviewReportDocument,
    "\n  query AdminReviewStorePicker($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n": types.AdminReviewStorePickerDocument,
    "\n  query AdminReviewAuthorPicker($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        nickname\n        name\n        email\n      }\n    }\n  }\n": types.AdminReviewAuthorPickerDocument,
    "\n  mutation AdminDeleteReview($input: AdminDeleteReviewInput!) {\n    adminDeleteReview(input: $input)\n  }\n": types.AdminDeleteReviewDocument,
    "\n  mutation AdminDeleteReviewComment($input: AdminDeleteReviewCommentInput!) {\n    adminDeleteReviewComment(input: $input)\n  }\n": types.AdminDeleteReviewCommentDocument,
    "\n  mutation AdminResolveReviewReport($input: AdminResolveReviewReportInput!) {\n    adminResolveReviewReport(input: $input) {\n      id\n      status\n    }\n  }\n": types.AdminResolveReviewReportDocument,
    "\n  query AdminSellers($input: AdminSellerListInput) {\n    adminSellers(input: $input) {\n      items {\n        accountId\n        username\n        email\n        name\n        status\n        mustChangePassword\n        lastLoginAt\n        profile {\n          businessName\n          businessPhone\n          websiteUrl\n        }\n        store {\n          id\n          storeName\n          storePhone\n          addressFull\n          isActive\n        }\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminSellersDocument,
    "\n  query AdminSeller($accountId: ID!) {\n    adminSeller(accountId: $accountId) {\n      accountId\n      username\n      email\n      name\n      status\n      mustChangePassword\n      lastLoginAt\n      profile {\n        businessName\n        businessPhone\n        websiteUrl\n      }\n      store {\n        id\n        storeName\n        storePhone\n        addressFull\n        isActive\n      }\n      createdAt\n    }\n  }\n": types.AdminSellerDocument,
    "\n  mutation AdminCreateSeller($input: AdminCreateSellerInput!) {\n    adminCreateSeller(input: $input) {\n      accountId\n      username\n    }\n  }\n": types.AdminCreateSellerDocument,
    "\n  mutation AdminResetSellerPassword($input: AdminResetSellerPasswordInput!) {\n    adminResetSellerPassword(input: $input)\n  }\n": types.AdminResetSellerPasswordDocument,
    "\n  query AdminStores($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        sellerAccountId\n        sellerLabel\n        storeName\n        storePhone\n        addressFull\n        regionId\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminStoresDocument,
    "\n  query AdminStore($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        sellerAccountId\n        sellerLabel\n        storeName\n        storePhone\n        addressFull\n        addressCity\n        addressDistrict\n        addressNeighborhood\n        regionId\n        latitude\n        longitude\n        mapProvider\n        websiteUrl\n        businessHoursText\n        profileImageUrl\n        greetingMessage\n        pickupSlotIntervalMinutes\n        minLeadTimeMinutes\n        maxDaysAhead\n        isActive\n        createdAt\n        updatedAt\n      }\n      seller {\n        accountId\n        username\n        email\n        name\n        status\n      }\n      productCount\n      orderItemCount\n    }\n  }\n": types.AdminStoreDocument,
    "\n  mutation AdminSetStoreActive($input: AdminSetStoreActiveInput!) {\n    adminSetStoreActive(input: $input) {\n      id\n      isActive\n    }\n  }\n": types.AdminSetStoreActiveDocument,
    "\n  mutation AdminUpdateStoreBasicInfo($input: AdminUpdateStoreBasicInfoInput!) {\n    adminUpdateStoreBasicInfo(input: $input) {\n      id\n      updatedAt\n    }\n  }\n": types.AdminUpdateStoreBasicInfoDocument,
    "\n  query AdminCategories($input: AdminCategoryListInput) {\n    adminCategories(input: $input) {\n      id\n      categoryType\n      name\n      description\n      sortOrder\n      isActive\n      productCount\n      createdAt\n      updatedAt\n    }\n  }\n": types.AdminCategoriesDocument,
    "\n  mutation AdminCreateCategory($input: AdminCreateCategoryInput!) {\n    adminCreateCategory(input: $input) {\n      id\n    }\n  }\n": types.AdminCreateCategoryDocument,
    "\n  mutation AdminUpdateCategory($input: AdminUpdateCategoryInput!) {\n    adminUpdateCategory(input: $input) {\n      id\n    }\n  }\n": types.AdminUpdateCategoryDocument,
    "\n  mutation AdminDeleteCategory($categoryId: ID!) {\n    adminDeleteCategory(categoryId: $categoryId)\n  }\n": types.AdminDeleteCategoryDocument,
    "\n  query AdminTags($input: AdminTagListInput) {\n    adminTags(input: $input) {\n      items {\n        id\n        name\n        productCount\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n": types.AdminTagsDocument,
    "\n  mutation AdminCreateTag($input: AdminCreateTagInput!) {\n    adminCreateTag(input: $input) {\n      id\n    }\n  }\n": types.AdminCreateTagDocument,
    "\n  mutation AdminUpdateTag($input: AdminUpdateTagInput!) {\n    adminUpdateTag(input: $input) {\n      id\n    }\n  }\n": types.AdminUpdateTagDocument,
    "\n  mutation AdminDeleteTag($tagId: ID!) {\n    adminDeleteTag(tagId: $tagId)\n  }\n": types.AdminDeleteTagDocument,
    "\n  mutation AdminCreateUploadUrl($input: AdminCreateUploadUrlInput!) {\n    adminCreateUploadUrl(input: $input) {\n      uploadUrl\n      publicUrl\n      key\n      expiresInSeconds\n    }\n  }\n": types.AdminCreateUploadUrlDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminAdmins($input: CursorInput) {\n    adminAdmins(input: $input) {\n      items {\n        accountId\n        username\n        email\n        name\n        status\n        mustChangePassword\n        lastLoginAt\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminAdminsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCreateAdmin($input: AdminCreateAdminInput!) {\n    adminCreateAdmin(input: $input) {\n      accountId\n      username\n    }\n  }\n"): typeof import('./graphql').AdminCreateAdminDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminResetAdminPassword($input: AdminResetAdminPasswordInput!) {\n    adminResetAdminPassword(input: $input)\n  }\n"): typeof import('./graphql').AdminResetAdminPasswordDocument;
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
export function graphql(source: "\n  query AdminAuditLogs($input: AdminAuditLogListInput) {\n    adminAuditLogs(input: $input) {\n      items {\n        id\n        actorAccountId\n        actorAccountType\n        actorLabel\n        storeId\n        targetType\n        targetId\n        action\n        beforeJson\n        afterJson\n        ipAddress\n        userAgent\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminAuditLogsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminAuditStorePicker($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n"): typeof import('./graphql').AdminAuditStorePickerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminAuditActorPicker($sellers: AdminSellerListInput, $admins: CursorInput) {\n    adminSellers(input: $sellers) {\n      items {\n        accountId\n        username\n        name\n      }\n    }\n    adminAdmins(input: $admins) {\n      items {\n        accountId\n        username\n        name\n      }\n    }\n  }\n"): typeof import('./graphql').AdminAuditActorPickerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminBanners($input: AdminBannerListInput) {\n    adminBanners(input: $input) {\n      items {\n        id\n        placement\n        title\n        imageUrl\n        linkType\n        linkUrl\n        linkProductId\n        linkStoreId\n        linkCategoryId\n        startsAt\n        endsAt\n        sortOrder\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminBannersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminBanner($bannerId: ID!) {\n    adminBanner(bannerId: $bannerId) {\n      id\n      placement\n      title\n      imageUrl\n      linkType\n      linkUrl\n      linkProductId\n      linkStoreId\n      linkCategoryId\n      startsAt\n      endsAt\n      sortOrder\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n"): typeof import('./graphql').AdminBannerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCreateBanner($input: AdminCreateBannerInput!) {\n    adminCreateBanner(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').AdminCreateBannerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminUpdateBanner($input: AdminUpdateBannerInput!) {\n    adminUpdateBanner(input: $input) {\n      id\n      updatedAt\n    }\n  }\n"): typeof import('./graphql').AdminUpdateBannerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminDeleteBanner($bannerId: ID!) {\n    adminDeleteBanner(bannerId: $bannerId)\n  }\n"): typeof import('./graphql').AdminDeleteBannerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminBannersVisible($input: AdminBannerListInput) {\n    adminBanners(input: $input) {\n      items {\n        id\n        placement\n        linkCategoryId\n        startsAt\n        endsAt\n        sortOrder\n        isActive\n      }\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminBannersVisibleDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminBannerProductOptions($input: AdminProductListInput) {\n    adminProducts(input: $input) {\n      items {\n        id\n        name\n        storeName\n      }\n    }\n  }\n"): typeof import('./graphql').AdminBannerProductOptionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminBannerStoreOptions($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n      }\n    }\n  }\n"): typeof import('./graphql').AdminBannerStoreOptionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminBannerCategoryOptions($input: AdminCategoryListInput) {\n    adminCategories(input: $input) {\n      id\n      name\n      isActive\n    }\n  }\n"): typeof import('./graphql').AdminBannerCategoryOptionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminBannerProductLabel($productId: ID!) {\n    adminProduct(productId: $productId) {\n      product {\n        id\n        name\n      }\n    }\n  }\n"): typeof import('./graphql').AdminBannerProductLabelDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminBannerStoreLabel($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        storeName\n      }\n    }\n  }\n"): typeof import('./graphql').AdminBannerStoreLabelDocument;
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
export function graphql(source: "\n  query AdminNotificationBroadcasts($input: AdminNotificationBroadcastListInput) {\n    adminNotificationBroadcasts(input: $input) {\n      items {\n        id\n        type\n        title\n        body\n        targetKind\n        targetCount\n        skippedCount\n        deliveredCount\n        status\n        actorAccountId\n        actorLabel\n        requestedAt\n        completedAt\n        targetAccountIds\n        skippedAccountIds\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminNotificationBroadcastsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminNotificationBroadcast($broadcastId: ID!) {\n    adminNotificationBroadcast(broadcastId: $broadcastId) {\n      id\n      type\n      title\n      body\n      targetKind\n      targetCount\n      skippedCount\n      deliveredCount\n      status\n      actorAccountId\n      actorLabel\n      requestedAt\n      completedAt\n      targetAccountIds\n      skippedAccountIds\n    }\n  }\n"): typeof import('./graphql').AdminNotificationBroadcastDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminSendNotification($input: AdminSendNotificationInput!) {\n    adminSendNotification(input: $input) {\n      sentCount\n      skippedAccountIds\n      broadcastId\n    }\n  }\n"): typeof import('./graphql').AdminSendNotificationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminNotificationActiveUserCount {\n    adminUsers(input: { status: ACTIVE, limit: 1 }) {\n      totalCount\n    }\n  }\n"): typeof import('./graphql').AdminNotificationActiveUserCountDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminNotificationUserOptions($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        nickname\n        name\n        email\n      }\n    }\n  }\n"): typeof import('./graphql').AdminNotificationUserOptionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminOrders($input: AdminOrderListInput) {\n    adminOrders(input: $input) {\n      items {\n        id\n        orderNumber\n        accountId\n        storeId\n        storeName\n        status\n        pickupAt\n        buyerName\n        buyerPhone\n        totalPrice\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminOrdersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminOrder($orderId: ID!) {\n    adminOrder(orderId: $orderId) {\n      id\n      orderNumber\n      buyer {\n        accountId\n        email\n        nickname\n        status\n      }\n      status\n      pickupAt\n      buyerName\n      buyerPhone\n      subtotalPrice\n      discountPrice\n      totalPrice\n      submittedAt\n      confirmedAt\n      madeAt\n      pickedUpAt\n      canceledAt\n      createdAt\n      updatedAt\n      items {\n        id\n        storeId\n        productId\n        productName\n        regularPrice\n        salePrice\n        quantity\n        itemSubtotalPrice\n        optionItems {\n          id\n          groupName\n          optionTitle\n          priceDelta\n        }\n        customTexts {\n          id\n          tokenKey\n          defaultText\n          valueText\n          sortOrder\n        }\n        freeEdits {\n          id\n          cropImageUrl\n          descriptionText\n          sortOrder\n          attachments {\n            id\n            imageUrl\n            sortOrder\n          }\n        }\n      }\n      statusHistories {\n        id\n        fromStatus\n        toStatus\n        changedAt\n        note\n      }\n    }\n  }\n"): typeof import('./graphql').AdminOrderDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminOrdersStoreOptions($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n"): typeof import('./graphql').AdminOrdersStoreOptionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminOrdersBuyerOptions($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        nickname\n        name\n        email\n      }\n    }\n  }\n"): typeof import('./graphql').AdminOrdersBuyerOptionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminOrdersStoreName($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        storeName\n      }\n    }\n  }\n"): typeof import('./graphql').AdminOrdersStoreNameDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminOrdersBuyerName($accountId: ID!) {\n    adminUser(accountId: $accountId) {\n      accountId\n      nickname\n      name\n      email\n    }\n  }\n"): typeof import('./graphql').AdminOrdersBuyerNameDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCancelOrder($input: AdminCancelOrderInput!) {\n    adminCancelOrder(input: $input) {\n      id\n      status\n    }\n  }\n"): typeof import('./graphql').AdminCancelOrderDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminProducts($input: AdminProductListInput) {\n    adminProducts(input: $input) {\n      items {\n        id\n        storeId\n        storeName\n        name\n        regularPrice\n        salePrice\n        currency\n        baseDesignImageUrl\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminProductsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminProduct($productId: ID!) {\n    adminProduct(productId: $productId) {\n      product {\n        id\n        storeId\n        storeName\n        name\n        regularPrice\n        salePrice\n        currency\n        baseDesignImageUrl\n        isActive\n        createdAt\n        updatedAt\n      }\n      storeIsActive\n      description\n      purchaseNotice\n      preparationTimeMinutes\n      imageUrls\n      reviewCount\n      orderItemCount\n      categories {\n        id\n        categoryType\n        name\n        isActive\n      }\n      tags {\n        id\n        name\n      }\n      optionGroups {\n        id\n        name\n        description\n        isRequired\n        minSelect\n        maxSelect\n        optionRequiresDescription\n        optionRequiresImage\n        sortOrder\n        isActive\n        optionItems {\n          id\n          title\n          description\n          imageUrl\n          priceDelta\n          sortOrder\n          isActive\n        }\n      }\n      customTemplate {\n        id\n        baseImageUrl\n        isActive\n        textTokens {\n          id\n          tokenKey\n          defaultText\n          maxLength\n          sortOrder\n          isRequired\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').AdminProductDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminProductStoreOptions($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n"): typeof import('./graphql').AdminProductStoreOptionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminSetProductActive($input: AdminSetProductActiveInput!) {\n    adminSetProductActive(input: $input) {\n      id\n      isActive\n    }\n  }\n"): typeof import('./graphql').AdminSetProductActiveDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminRegions($input: AdminRegionListInput) {\n    adminRegions(input: $input) {\n      id\n      parentId\n      level\n      name\n      slug\n      sortOrder\n      isActive\n      centerLat\n      centerLng\n      storeCount\n      childCount\n      createdAt\n      updatedAt\n    }\n  }\n"): typeof import('./graphql').AdminRegionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminGeocodeAddress($query: String!) {\n    adminGeocodeAddress(query: $query) {\n      latitude\n      longitude\n      sigunguCode\n      regionId\n    }\n  }\n"): typeof import('./graphql').AdminGeocodeAddressDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCreateRegion($input: AdminCreateRegionInput!) {\n    adminCreateRegion(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').AdminCreateRegionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminUpdateRegion($input: AdminUpdateRegionInput!) {\n    adminUpdateRegion(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').AdminUpdateRegionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminDeleteRegion($regionId: ID!) {\n    adminDeleteRegion(regionId: $regionId)\n  }\n"): typeof import('./graphql').AdminDeleteRegionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminReviews($input: AdminReviewListInput) {\n    adminReviews(input: $input) {\n      items {\n        id\n        storeId\n        storeName\n        productId\n        productName\n        authorAccountId\n        authorNickname\n        rating\n        content\n        commentCount\n        likeCount\n        deleted\n        media {\n          mediaType\n          mediaUrl\n          thumbnailUrl\n          sortOrder\n        }\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminReviewsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminReviewComments($input: AdminReviewCommentListInput) {\n    adminReviewComments(input: $input) {\n      items {\n        id\n        reviewId\n        authorAccountId\n        authorNickname\n        content\n        deleted\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminReviewCommentsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminReviewReports($input: AdminReviewReportListInput) {\n    adminReviewReports(input: $input) {\n      items {\n        id\n        targetType\n        targetId\n        reporterAccountId\n        reporterNickname\n        reporterWithdrawn\n        reason\n        detail\n        contentSnapshot\n        status\n        resolvedByAccountId\n        resolvedByLabel\n        resolvedAt\n        resolutionNote\n        createdAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminReviewReportsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminReviewReport($reportId: ID!) {\n    adminReviewReport(reportId: $reportId) {\n      report {\n        id\n        targetType\n        targetId\n        reporterAccountId\n        reporterNickname\n        reporterWithdrawn\n        reason\n        detail\n        contentSnapshot\n        status\n        resolvedByAccountId\n        resolvedByLabel\n        resolvedAt\n        resolutionNote\n        createdAt\n      }\n      target {\n        id\n        reviewId\n        authorAccountId\n        authorNickname\n        content\n        storeId\n        storeName\n        deleted\n        media {\n          mediaType\n          mediaUrl\n          thumbnailUrl\n          sortOrder\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').AdminReviewReportDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminReviewStorePicker($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        storeName\n        isActive\n      }\n    }\n  }\n"): typeof import('./graphql').AdminReviewStorePickerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminReviewAuthorPicker($input: AdminUserListInput) {\n    adminUsers(input: $input) {\n      items {\n        accountId\n        nickname\n        name\n        email\n      }\n    }\n  }\n"): typeof import('./graphql').AdminReviewAuthorPickerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminDeleteReview($input: AdminDeleteReviewInput!) {\n    adminDeleteReview(input: $input)\n  }\n"): typeof import('./graphql').AdminDeleteReviewDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminDeleteReviewComment($input: AdminDeleteReviewCommentInput!) {\n    adminDeleteReviewComment(input: $input)\n  }\n"): typeof import('./graphql').AdminDeleteReviewCommentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminResolveReviewReport($input: AdminResolveReviewReportInput!) {\n    adminResolveReviewReport(input: $input) {\n      id\n      status\n    }\n  }\n"): typeof import('./graphql').AdminResolveReviewReportDocument;
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
export function graphql(source: "\n  query AdminStores($input: AdminStoreListInput) {\n    adminStores(input: $input) {\n      items {\n        id\n        sellerAccountId\n        sellerLabel\n        storeName\n        storePhone\n        addressFull\n        regionId\n        isActive\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminStoresDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminStore($storeId: ID!) {\n    adminStore(storeId: $storeId) {\n      store {\n        id\n        sellerAccountId\n        sellerLabel\n        storeName\n        storePhone\n        addressFull\n        addressCity\n        addressDistrict\n        addressNeighborhood\n        regionId\n        latitude\n        longitude\n        mapProvider\n        websiteUrl\n        businessHoursText\n        profileImageUrl\n        greetingMessage\n        pickupSlotIntervalMinutes\n        minLeadTimeMinutes\n        maxDaysAhead\n        isActive\n        createdAt\n        updatedAt\n      }\n      seller {\n        accountId\n        username\n        email\n        name\n        status\n      }\n      productCount\n      orderItemCount\n    }\n  }\n"): typeof import('./graphql').AdminStoreDocument;
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
export function graphql(source: "\n  query AdminCategories($input: AdminCategoryListInput) {\n    adminCategories(input: $input) {\n      id\n      categoryType\n      name\n      description\n      sortOrder\n      isActive\n      productCount\n      createdAt\n      updatedAt\n    }\n  }\n"): typeof import('./graphql').AdminCategoriesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCreateCategory($input: AdminCreateCategoryInput!) {\n    adminCreateCategory(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').AdminCreateCategoryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminUpdateCategory($input: AdminUpdateCategoryInput!) {\n    adminUpdateCategory(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').AdminUpdateCategoryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminDeleteCategory($categoryId: ID!) {\n    adminDeleteCategory(categoryId: $categoryId)\n  }\n"): typeof import('./graphql').AdminDeleteCategoryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminTags($input: AdminTagListInput) {\n    adminTags(input: $input) {\n      items {\n        id\n        name\n        productCount\n        createdAt\n        updatedAt\n      }\n      totalCount\n      hasMore\n      nextCursor\n    }\n  }\n"): typeof import('./graphql').AdminTagsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCreateTag($input: AdminCreateTagInput!) {\n    adminCreateTag(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').AdminCreateTagDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminUpdateTag($input: AdminUpdateTagInput!) {\n    adminUpdateTag(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').AdminUpdateTagDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminDeleteTag($tagId: ID!) {\n    adminDeleteTag(tagId: $tagId)\n  }\n"): typeof import('./graphql').AdminDeleteTagDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCreateUploadUrl($input: AdminCreateUploadUrlInput!) {\n    adminCreateUploadUrl(input: $input) {\n      uploadUrl\n      publicUrl\n      key\n      expiresInSeconds\n    }\n  }\n"): typeof import('./graphql').AdminCreateUploadUrlDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
