/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
/** 계정 상태. ACTIVE가 아니면 로그인·API 접근이 거부된다. */
export type AccountStatus =
  /** 정상. */
  | 'ACTIVE'
  /** 가입 대기. 현재 생성 경로가 없는 예약값이다. */
  | 'PENDING'
  /** 운영자가 정지한 상태. 모든 API 접근이 FORBIDDEN이고 refresh 세션도 폐기된다. */
  | 'SUSPENDED';

/** 계정 종류. JWT 발급 시 결정되며 접근 가능한 API 영역을 가른다. */
export type AccountType =
  /** 운영자. admin* API를 쓴다. */
  | 'ADMIN'
  /** 판매자. 매장 1곳을 보유하며 seller* API를 쓴다. */
  | 'SELLER'
  /** 구매자. 주문·찜·리뷰 등 구매자 API를 쓴다. */
  | 'USER';

/** 주문 강제 취소 입력. */
export type AdminCancelOrderInput = {
  /** 취소 사유. 필수. 최대 494자('[관리자] ' 접두를 붙여 500자 이내로 이력에 남는다). 감사 로그에도 기록된다. */
  note: string;
  orderId: string | number;
};

/** 판매자 온보딩 입력. 계정·자격증명·사업자 프로필·매장을 한 번에 만든다. */
export type AdminCreateSellerInput = {
  /** 상호. */
  businessName: string;
  /** 사업자 연락처. */
  businessPhone: string;
  /** 계정 이메일. 선택. */
  email?: string | null | undefined;
  /** 계정 이름(운영자명). 선택. */
  name?: string | null | undefined;
  /** 초기 비밀번호. 8~64자에 대문자·소문자·숫자·특수문자를 각각 1개 이상 포함. 최초 로그인 시 변경이 강제된다. */
  password: string;
  /** 매장 기본 정보. */
  store: AdminCreateSellerStoreInput;
  /** 로그인 username. 4~80자, 소문자·숫자·`.`·`_`·`-`만 허용. 이미 쓰이고 있으면 BAD_USER_INPUT. */
  username: string;
  /** 홈페이지·SNS URL. 선택. */
  websiteUrl?: string | null | undefined;
};

/** 온보딩 시 만들 매장 기본 정보. 영업시간·픽업 정책은 판매자가 이후 직접 설정한다. */
export type AdminCreateSellerStoreInput = {
  /** 시·도 단위. 선택. */
  addressCity?: string | null | undefined;
  /** 시·군·구 단위. 선택. */
  addressDistrict?: string | null | undefined;
  /** 전체 주소 문자열. */
  addressFull: string;
  /** 읍·면·동 단위. 선택. */
  addressNeighborhood?: string | null | undefined;
  /** 위도. 정밀도 손실을 피하려고 문자열로 받는다. 선택. */
  latitude?: string | null | undefined;
  /** 경도. 정밀도 손실을 피하려고 문자열로 받는다. 선택. */
  longitude?: string | null | undefined;
  /** 지도 진입에 쓸 provider. 기본 NONE. */
  mapProvider?: StoreMapProvider | null | undefined;
  /** 지역 필터용 2차 지역(시군구) ID. 활성 2차 지역이 아니면 BAD_USER_INPUT. 선택. */
  regionId?: string | number | null | undefined;
  /** 매장명. */
  storeName: string;
  /** 매장 대표 연락처. */
  storePhone: string;
};

/** 관리자 업로드 URL 발급 입력. */
export type AdminCreateUploadUrlInput = {
  /** 파일 크기(바이트). 1 이상 5MB 이하, 아니면 BAD_USER_INPUT. */
  contentLength: number;
  /** 파일 MIME 타입. image/jpeg·image/png·image/webp만 허용, 아니면 BAD_USER_INPUT. */
  contentType: string;
  /** 업로드 용도. */
  purpose: UploadPurpose;
};

/** 집계 기간 입력. */
export type AdminDashboardSummaryInput = {
  /** 집계 시작(이상). */
  from: string;
  /** 집계 종료(이하). */
  to: string;
};

/** 주문 목록 조회 조건. 모든 필터는 AND로 결합된다. */
export type AdminOrderListInput = {
  /** 구매자 계정 ID 필터. 미지정 시 전체. */
  accountId?: string | number | null | undefined;
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** 주문 생성 시각 하한(이상). */
  fromCreatedAt?: string | null | undefined;
  /** 주문번호·주문자 이름·연락처 부분일치 검색. 최대 100자. */
  keyword?: string | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
  /** 주문 상태 필터. 미지정 시 전체. */
  status?: OrderStatusType | null | undefined;
  /** 매장 ID 필터(품목 기준). 미지정 시 전체. */
  storeId?: string | number | null | undefined;
  /** 주문 생성 시각 상한(이하). */
  toCreatedAt?: string | null | undefined;
};

/** 상품 목록 조회 조건. */
export type AdminProductListInput = {
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** 노출 여부 필터. 미지정 시 전체. */
  isActive?: boolean | null | undefined;
  /** 상품명 부분일치 검색어. 최대 100자. 미지정 시 전체. */
  keyword?: string | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
  /** 소속 매장 ID 필터. 미지정 시 전체. */
  storeId?: string | number | null | undefined;
};

/** 판매자 비밀번호 초기화 입력. */
export type AdminResetSellerPasswordInput = {
  /** 대상 판매자 계정 ID. */
  accountId: string | number;
  /** 새 비밀번호. 8~64자에 대문자·소문자·숫자·특수문자를 각각 1개 이상 포함. */
  newPassword: string;
};

/** 인기 검색어 스냅샷 조회 입력. */
export type AdminSearchKeywordSnapshotInput = {
  /** 가져올 순위 수. 기본 20, 1~100. */
  limit?: number | null | undefined;
  /** 스냅샷 시각(정각). 미지정 시 최신. */
  rankedAt?: string | null | undefined;
};

/** 판매자 목록 조회 조건. */
export type AdminSellerListInput = {
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** username·이메일·이름·매장명 부분일치 검색어. 최대 100자. 미지정 시 전체. */
  keyword?: string | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
  /** 계정 상태 필터. 미지정 시 전체. */
  status?: AccountStatus | null | undefined;
};

/** 상품 노출 여부 변경 입력. */
export type AdminSetProductActiveInput = {
  /** 노출 여부. */
  isActive: boolean;
  productId: string | number;
  /** 변경 사유. 감사 로그에 기록된다. 최대 500자. 선택. */
  reason?: string | null | undefined;
};

/** 매장 노출 여부 변경 입력. */
export type AdminSetStoreActiveInput = {
  /** 노출 여부. */
  isActive: boolean;
  /** 변경 사유. 감사 로그에 기록된다. 최대 500자. 선택. */
  reason?: string | null | undefined;
  storeId: string | number;
};

/** 매장 목록 조회 조건. */
export type AdminStoreListInput = {
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** 노출 여부 필터. 미지정 시 전체. */
  isActive?: boolean | null | undefined;
  /** 매장명 부분일치 검색어. 최대 100자. 미지정 시 전체. */
  keyword?: string | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
  /** 2차 지역 ID 필터. 미지정 시 전체. */
  regionId?: string | number | null | undefined;
};

/** 계정 정지 입력. */
export type AdminSuspendAccountInput = {
  /** 대상 계정 ID(USER 또는 SELLER). */
  accountId: string | number;
  /** 정지 사유. 감사 로그에 기록된다. 최대 500자. */
  reason: string;
};

/** 매장 기본 정보 대리 수정 입력. 전달한 필드만 변경된다(부분 수정). */
export type AdminUpdateStoreBasicInfoInput = {
  /** 시·도 단위. null이면 제거. */
  addressCity?: string | null | undefined;
  /** 시·군·구 단위. null이면 제거. */
  addressDistrict?: string | null | undefined;
  /** 전체 주소 문자열. */
  addressFull?: string | null | undefined;
  /** 읍·면·동 단위. null이면 제거. */
  addressNeighborhood?: string | null | undefined;
  /** 영업시간 안내 문구. null이면 제거. */
  businessHoursText?: string | null | undefined;
  /** 문의 채팅 인사말 템플릿. null이면 기본 문구로 되돌린다. */
  greetingMessage?: string | null | undefined;
  /** 위도(문자열). null이면 제거. */
  latitude?: string | null | undefined;
  /** 경도(문자열). null이면 제거. */
  longitude?: string | null | undefined;
  /** 지도 진입에 쓸 provider. */
  mapProvider?: StoreMapProvider | null | undefined;
  /** 매장 프로필(로고) 이미지 URL. null이면 제거. adminCreateUploadUrl(STORE_IMAGE)로 이 계정에 발급된 publicUrl만 허용, 아니면 BAD_USER_INPUT. */
  profileImageUrl?: string | null | undefined;
  /** 지역 필터용 2차 지역 ID. 활성 2차 지역만 허용, null이면 연결 해제. */
  regionId?: string | number | null | undefined;
  storeId: string | number;
  /** 매장명. */
  storeName?: string | null | undefined;
  /** 매장 대표 연락처. */
  storePhone?: string | null | undefined;
  /** 매장 홈페이지·SNS URL. null이면 제거. */
  websiteUrl?: string | null | undefined;
};

/** 구매자 목록 조회 조건. */
export type AdminUserListInput = {
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** 닉네임·이메일·이름 부분일치 검색어. 최대 100자. 미지정 시 전체. */
  keyword?: string | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
  /** 계정 상태 필터. 미지정 시 전체. */
  status?: AccountStatus | null | undefined;
};

/** 소셜 로그인 Provider 종류 */
export type IdentityProvider =
  /** 구글 OIDC. */
  | 'GOOGLE'
  /** 카카오 OIDC. */
  | 'KAKAO';

/**
 * 주문 상태. 구매자·판매자 API가 공용으로 쓴다.
 *
 * 전이는 `SUBMITTED → CONFIRMED → MADE → PICKED_UP` 한 방향이며 각 단계는 직전
 * 상태에서만 진입할 수 있다. `CANCELED`는 `PICKED_UP` 이전 세 상태에서만 가능하고,
 * 어떤 상태에서도 `SUBMITTED`로 되돌아갈 수 없다.
 */
export type OrderStatusType =
  /** 취소된 종료 상태. 취소 처리에는 사유(note)가 필수다. */
  | 'CANCELED'
  /** 판매자가 주문을 확인·수락한 상태. 제작 대기. */
  | 'CONFIRMED'
  /** 판매자가 제작을 완료해 픽업을 기다리는 상태. "주문 생성됨"이 아니다. */
  | 'MADE'
  /** 구매자가 수령을 마친 종료 상태. 이후 상태 변경 불가. */
  | 'PICKED_UP'
  /** 구매자가 주문을 넣은 직후의 초기 상태. 판매자 확인 대기. */
  | 'SUBMITTED';

/** 매장 지도 연동 provider. 구매자·판매자 API가 공용으로 쓴다. */
export type StoreMapProvider =
  /** 카카오맵 딥링크를 쓴다. */
  | 'KAKAO'
  /** 네이버 지도 딥링크를 쓴다. */
  | 'NAVER'
  /** 지도 연결 없음. 지도 진입 동선을 노출하지 않는다. */
  | 'NONE';

/**
 * 업로드 용도. 용도마다 저장 경로가 다르고, 저장 입력은 같은 용도로 발급된 URL만 받는다.
 * 역할별 허용 범위: 판매자 PRODUCT_IMAGE·STORE_IMAGE, 관리자 BANNER_IMAGE·STORE_IMAGE(밖이면 BAD_USER_INPUT).
 */
export type UploadPurpose =
  /** 플랫폼 배너 이미지(관리자). */
  | 'BANNER_IMAGE'
  /** 상품 이미지·커스텀 도안 바탕·옵션 선택지 이미지·커스텀 템플릿 바탕(판매자). */
  | 'PRODUCT_IMAGE'
  /** 매장 프로필(로고) 이미지(판매자·관리자). */
  | 'STORE_IMAGE';

export type AdminMeQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminMeQuery = { adminMe: { accountId: string, username: string | null, email: string | null, name: string | null, status: AccountStatus, mustChangePassword: boolean, lastLoginAt: string | null, createdAt: string } };

export type AdminUsersQueryVariables = Exact<{
  input?: AdminUserListInput | null | undefined;
}>;


export type AdminUsersQuery = { adminUsers: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ accountId: string, email: string | null, name: string | null, status: AccountStatus, nickname: string | null, phoneNumber: string | null, onboardingCompleted: boolean, identityProviders: Array<IdentityProvider>, orderCount: number, reviewCount: number, createdAt: string }> } };

export type AdminUserQueryVariables = Exact<{
  accountId: string | number;
}>;


export type AdminUserQuery = { adminUser: { accountId: string, email: string | null, name: string | null, status: AccountStatus, nickname: string | null, phoneNumber: string | null, onboardingCompleted: boolean, identityProviders: Array<IdentityProvider>, orderCount: number, reviewCount: number, createdAt: string } };

export type AdminSuspendAccountMutationVariables = Exact<{
  input: AdminSuspendAccountInput;
}>;


export type AdminSuspendAccountMutation = { adminSuspendAccount: { accountId: string, accountType: AccountType, status: AccountStatus } };

export type AdminReinstateAccountMutationVariables = Exact<{
  accountId: string | number;
}>;


export type AdminReinstateAccountMutation = { adminReinstateAccount: { accountId: string, accountType: AccountType, status: AccountStatus } };

export type AdminDashboardSummaryQueryVariables = Exact<{
  input: AdminDashboardSummaryInput;
}>;


export type AdminDashboardSummaryQuery = { adminDashboardSummary: { from: string, to: string, newUserCount: number, newSellerCount: number, orderAmountSum: number, activeStoreCount: number, activeProductCount: number, pendingReportCount: number, orderCounts: { submitted: number, confirmed: number, made: number, pickedUp: number, canceled: number } } };

export type AdminSearchKeywordSnapshotQueryVariables = Exact<{
  input?: AdminSearchKeywordSnapshotInput | null | undefined;
}>;


export type AdminSearchKeywordSnapshotQuery = { adminSearchKeywordSnapshot: { rankedAt: string | null, items: Array<{ rank: number, keyword: string, searchCount: number }> } };

export type AdminOrdersQueryVariables = Exact<{
  input?: AdminOrderListInput | null | undefined;
}>;


export type AdminOrdersQuery = { adminOrders: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ id: string, orderNumber: string, accountId: string, storeId: string | null, status: OrderStatusType, pickupAt: string, buyerName: string, buyerPhone: string, totalPrice: number, createdAt: string }> } };

export type AdminOrderQueryVariables = Exact<{
  orderId: string | number;
}>;


export type AdminOrderQuery = { adminOrder: { id: string, orderNumber: string, status: OrderStatusType, pickupAt: string, buyerName: string, buyerPhone: string, subtotalPrice: number, discountPrice: number, totalPrice: number, submittedAt: string | null, confirmedAt: string | null, madeAt: string | null, pickedUpAt: string | null, canceledAt: string | null, createdAt: string, updatedAt: string, buyer: { accountId: string, email: string | null, nickname: string | null, status: AccountStatus }, items: Array<{ id: string, storeId: string, productId: string, productName: string, regularPrice: number, salePrice: number | null, quantity: number, itemSubtotalPrice: number, optionItems: Array<{ id: string, groupName: string, optionTitle: string, priceDelta: number }>, customTexts: Array<{ id: string, tokenKey: string, defaultText: string, valueText: string, sortOrder: number }>, freeEdits: Array<{ id: string, cropImageUrl: string, descriptionText: string, sortOrder: number, attachments: Array<{ id: string, imageUrl: string, sortOrder: number }> }> }>, statusHistories: Array<{ id: string, fromStatus: OrderStatusType | null, toStatus: OrderStatusType, changedAt: string, note: string | null }> } };

export type AdminCancelOrderMutationVariables = Exact<{
  input: AdminCancelOrderInput;
}>;


export type AdminCancelOrderMutation = { adminCancelOrder: { id: string, status: OrderStatusType } };

export type AdminProductsQueryVariables = Exact<{
  input?: AdminProductListInput | null | undefined;
}>;


export type AdminProductsQuery = { adminProducts: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ id: string, storeId: string, storeName: string, name: string, regularPrice: number, salePrice: number | null, currency: string, baseDesignImageUrl: string | null, isActive: boolean, createdAt: string, updatedAt: string }> } };

export type AdminProductQueryVariables = Exact<{
  productId: string | number;
}>;


export type AdminProductQuery = { adminProduct: { storeIsActive: boolean, description: string | null, purchaseNotice: string | null, preparationTimeMinutes: number, imageUrls: Array<string>, reviewCount: number, orderItemCount: number, product: { id: string, storeId: string, storeName: string, name: string, regularPrice: number, salePrice: number | null, currency: string, baseDesignImageUrl: string | null, isActive: boolean, createdAt: string, updatedAt: string } } };

export type AdminSetProductActiveMutationVariables = Exact<{
  input: AdminSetProductActiveInput;
}>;


export type AdminSetProductActiveMutation = { adminSetProductActive: { id: string, isActive: boolean } };

export type AdminSellersQueryVariables = Exact<{
  input?: AdminSellerListInput | null | undefined;
}>;


export type AdminSellersQuery = { adminSellers: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ accountId: string, username: string | null, email: string | null, name: string | null, status: AccountStatus, mustChangePassword: boolean, lastLoginAt: string | null, createdAt: string, profile: { businessName: string, businessPhone: string, websiteUrl: string | null } | null, store: { id: string, storeName: string, storePhone: string, addressFull: string, isActive: boolean } | null }> } };

export type AdminSellerQueryVariables = Exact<{
  accountId: string | number;
}>;


export type AdminSellerQuery = { adminSeller: { accountId: string, username: string | null, email: string | null, name: string | null, status: AccountStatus, mustChangePassword: boolean, lastLoginAt: string | null, createdAt: string, profile: { businessName: string, businessPhone: string, websiteUrl: string | null } | null, store: { id: string, storeName: string, storePhone: string, addressFull: string, isActive: boolean } | null } };

export type AdminCreateSellerMutationVariables = Exact<{
  input: AdminCreateSellerInput;
}>;


export type AdminCreateSellerMutation = { adminCreateSeller: { accountId: string, username: string | null } };

export type AdminResetSellerPasswordMutationVariables = Exact<{
  input: AdminResetSellerPasswordInput;
}>;


export type AdminResetSellerPasswordMutation = { adminResetSellerPassword: boolean };

export type AdminStoresQueryVariables = Exact<{
  input?: AdminStoreListInput | null | undefined;
}>;


export type AdminStoresQuery = { adminStores: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ id: string, sellerAccountId: string, storeName: string, storePhone: string, addressFull: string, regionId: string | null, isActive: boolean, createdAt: string, updatedAt: string }> } };

export type AdminStoreQueryVariables = Exact<{
  storeId: string | number;
}>;


export type AdminStoreQuery = { adminStore: { productCount: number, orderItemCount: number, store: { id: string, sellerAccountId: string, storeName: string, storePhone: string, addressFull: string, addressCity: string | null, addressDistrict: string | null, addressNeighborhood: string | null, regionId: string | null, latitude: string | null, longitude: string | null, mapProvider: StoreMapProvider, websiteUrl: string | null, businessHoursText: string | null, profileImageUrl: string | null, greetingMessage: string | null, pickupSlotIntervalMinutes: number, minLeadTimeMinutes: number, maxDaysAhead: number, isActive: boolean, createdAt: string, updatedAt: string }, seller: { accountId: string, username: string | null, email: string | null, name: string | null, status: AccountStatus } } };

export type AdminSetStoreActiveMutationVariables = Exact<{
  input: AdminSetStoreActiveInput;
}>;


export type AdminSetStoreActiveMutation = { adminSetStoreActive: { id: string, isActive: boolean } };

export type AdminUpdateStoreBasicInfoMutationVariables = Exact<{
  input: AdminUpdateStoreBasicInfoInput;
}>;


export type AdminUpdateStoreBasicInfoMutation = { adminUpdateStoreBasicInfo: { id: string, updatedAt: string } };

export type AdminCreateUploadUrlMutationVariables = Exact<{
  input: AdminCreateUploadUrlInput;
}>;


export type AdminCreateUploadUrlMutation = { adminCreateUploadUrl: { uploadUrl: string, publicUrl: string, key: string, expiresInSeconds: number } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const AdminMeDocument = new TypedDocumentString(`
    query AdminMe {
  adminMe {
    accountId
    username
    email
    name
    status
    mustChangePassword
    lastLoginAt
    createdAt
  }
}
    `) as unknown as TypedDocumentString<AdminMeQuery, AdminMeQueryVariables>;
export const AdminUsersDocument = new TypedDocumentString(`
    query AdminUsers($input: AdminUserListInput) {
  adminUsers(input: $input) {
    items {
      accountId
      email
      name
      status
      nickname
      phoneNumber
      onboardingCompleted
      identityProviders
      orderCount
      reviewCount
      createdAt
    }
    totalCount
    hasMore
    nextCursor
  }
}
    `) as unknown as TypedDocumentString<AdminUsersQuery, AdminUsersQueryVariables>;
export const AdminUserDocument = new TypedDocumentString(`
    query AdminUser($accountId: ID!) {
  adminUser(accountId: $accountId) {
    accountId
    email
    name
    status
    nickname
    phoneNumber
    onboardingCompleted
    identityProviders
    orderCount
    reviewCount
    createdAt
  }
}
    `) as unknown as TypedDocumentString<AdminUserQuery, AdminUserQueryVariables>;
export const AdminSuspendAccountDocument = new TypedDocumentString(`
    mutation AdminSuspendAccount($input: AdminSuspendAccountInput!) {
  adminSuspendAccount(input: $input) {
    accountId
    accountType
    status
  }
}
    `) as unknown as TypedDocumentString<AdminSuspendAccountMutation, AdminSuspendAccountMutationVariables>;
export const AdminReinstateAccountDocument = new TypedDocumentString(`
    mutation AdminReinstateAccount($accountId: ID!) {
  adminReinstateAccount(accountId: $accountId) {
    accountId
    accountType
    status
  }
}
    `) as unknown as TypedDocumentString<AdminReinstateAccountMutation, AdminReinstateAccountMutationVariables>;
export const AdminDashboardSummaryDocument = new TypedDocumentString(`
    query AdminDashboardSummary($input: AdminDashboardSummaryInput!) {
  adminDashboardSummary(input: $input) {
    from
    to
    newUserCount
    newSellerCount
    orderCounts {
      submitted
      confirmed
      made
      pickedUp
      canceled
    }
    orderAmountSum
    activeStoreCount
    activeProductCount
    pendingReportCount
  }
}
    `) as unknown as TypedDocumentString<AdminDashboardSummaryQuery, AdminDashboardSummaryQueryVariables>;
export const AdminSearchKeywordSnapshotDocument = new TypedDocumentString(`
    query AdminSearchKeywordSnapshot($input: AdminSearchKeywordSnapshotInput) {
  adminSearchKeywordSnapshot(input: $input) {
    rankedAt
    items {
      rank
      keyword
      searchCount
    }
  }
}
    `) as unknown as TypedDocumentString<AdminSearchKeywordSnapshotQuery, AdminSearchKeywordSnapshotQueryVariables>;
export const AdminOrdersDocument = new TypedDocumentString(`
    query AdminOrders($input: AdminOrderListInput) {
  adminOrders(input: $input) {
    items {
      id
      orderNumber
      accountId
      storeId
      status
      pickupAt
      buyerName
      buyerPhone
      totalPrice
      createdAt
    }
    totalCount
    hasMore
    nextCursor
  }
}
    `) as unknown as TypedDocumentString<AdminOrdersQuery, AdminOrdersQueryVariables>;
export const AdminOrderDocument = new TypedDocumentString(`
    query AdminOrder($orderId: ID!) {
  adminOrder(orderId: $orderId) {
    id
    orderNumber
    buyer {
      accountId
      email
      nickname
      status
    }
    status
    pickupAt
    buyerName
    buyerPhone
    subtotalPrice
    discountPrice
    totalPrice
    submittedAt
    confirmedAt
    madeAt
    pickedUpAt
    canceledAt
    createdAt
    updatedAt
    items {
      id
      storeId
      productId
      productName
      regularPrice
      salePrice
      quantity
      itemSubtotalPrice
      optionItems {
        id
        groupName
        optionTitle
        priceDelta
      }
      customTexts {
        id
        tokenKey
        defaultText
        valueText
        sortOrder
      }
      freeEdits {
        id
        cropImageUrl
        descriptionText
        sortOrder
        attachments {
          id
          imageUrl
          sortOrder
        }
      }
    }
    statusHistories {
      id
      fromStatus
      toStatus
      changedAt
      note
    }
  }
}
    `) as unknown as TypedDocumentString<AdminOrderQuery, AdminOrderQueryVariables>;
export const AdminCancelOrderDocument = new TypedDocumentString(`
    mutation AdminCancelOrder($input: AdminCancelOrderInput!) {
  adminCancelOrder(input: $input) {
    id
    status
  }
}
    `) as unknown as TypedDocumentString<AdminCancelOrderMutation, AdminCancelOrderMutationVariables>;
export const AdminProductsDocument = new TypedDocumentString(`
    query AdminProducts($input: AdminProductListInput) {
  adminProducts(input: $input) {
    items {
      id
      storeId
      storeName
      name
      regularPrice
      salePrice
      currency
      baseDesignImageUrl
      isActive
      createdAt
      updatedAt
    }
    totalCount
    hasMore
    nextCursor
  }
}
    `) as unknown as TypedDocumentString<AdminProductsQuery, AdminProductsQueryVariables>;
export const AdminProductDocument = new TypedDocumentString(`
    query AdminProduct($productId: ID!) {
  adminProduct(productId: $productId) {
    product {
      id
      storeId
      storeName
      name
      regularPrice
      salePrice
      currency
      baseDesignImageUrl
      isActive
      createdAt
      updatedAt
    }
    storeIsActive
    description
    purchaseNotice
    preparationTimeMinutes
    imageUrls
    reviewCount
    orderItemCount
  }
}
    `) as unknown as TypedDocumentString<AdminProductQuery, AdminProductQueryVariables>;
export const AdminSetProductActiveDocument = new TypedDocumentString(`
    mutation AdminSetProductActive($input: AdminSetProductActiveInput!) {
  adminSetProductActive(input: $input) {
    id
    isActive
  }
}
    `) as unknown as TypedDocumentString<AdminSetProductActiveMutation, AdminSetProductActiveMutationVariables>;
export const AdminSellersDocument = new TypedDocumentString(`
    query AdminSellers($input: AdminSellerListInput) {
  adminSellers(input: $input) {
    items {
      accountId
      username
      email
      name
      status
      mustChangePassword
      lastLoginAt
      profile {
        businessName
        businessPhone
        websiteUrl
      }
      store {
        id
        storeName
        storePhone
        addressFull
        isActive
      }
      createdAt
    }
    totalCount
    hasMore
    nextCursor
  }
}
    `) as unknown as TypedDocumentString<AdminSellersQuery, AdminSellersQueryVariables>;
export const AdminSellerDocument = new TypedDocumentString(`
    query AdminSeller($accountId: ID!) {
  adminSeller(accountId: $accountId) {
    accountId
    username
    email
    name
    status
    mustChangePassword
    lastLoginAt
    profile {
      businessName
      businessPhone
      websiteUrl
    }
    store {
      id
      storeName
      storePhone
      addressFull
      isActive
    }
    createdAt
  }
}
    `) as unknown as TypedDocumentString<AdminSellerQuery, AdminSellerQueryVariables>;
export const AdminCreateSellerDocument = new TypedDocumentString(`
    mutation AdminCreateSeller($input: AdminCreateSellerInput!) {
  adminCreateSeller(input: $input) {
    accountId
    username
  }
}
    `) as unknown as TypedDocumentString<AdminCreateSellerMutation, AdminCreateSellerMutationVariables>;
export const AdminResetSellerPasswordDocument = new TypedDocumentString(`
    mutation AdminResetSellerPassword($input: AdminResetSellerPasswordInput!) {
  adminResetSellerPassword(input: $input)
}
    `) as unknown as TypedDocumentString<AdminResetSellerPasswordMutation, AdminResetSellerPasswordMutationVariables>;
export const AdminStoresDocument = new TypedDocumentString(`
    query AdminStores($input: AdminStoreListInput) {
  adminStores(input: $input) {
    items {
      id
      sellerAccountId
      storeName
      storePhone
      addressFull
      regionId
      isActive
      createdAt
      updatedAt
    }
    totalCount
    hasMore
    nextCursor
  }
}
    `) as unknown as TypedDocumentString<AdminStoresQuery, AdminStoresQueryVariables>;
export const AdminStoreDocument = new TypedDocumentString(`
    query AdminStore($storeId: ID!) {
  adminStore(storeId: $storeId) {
    store {
      id
      sellerAccountId
      storeName
      storePhone
      addressFull
      addressCity
      addressDistrict
      addressNeighborhood
      regionId
      latitude
      longitude
      mapProvider
      websiteUrl
      businessHoursText
      profileImageUrl
      greetingMessage
      pickupSlotIntervalMinutes
      minLeadTimeMinutes
      maxDaysAhead
      isActive
      createdAt
      updatedAt
    }
    seller {
      accountId
      username
      email
      name
      status
    }
    productCount
    orderItemCount
  }
}
    `) as unknown as TypedDocumentString<AdminStoreQuery, AdminStoreQueryVariables>;
export const AdminSetStoreActiveDocument = new TypedDocumentString(`
    mutation AdminSetStoreActive($input: AdminSetStoreActiveInput!) {
  adminSetStoreActive(input: $input) {
    id
    isActive
  }
}
    `) as unknown as TypedDocumentString<AdminSetStoreActiveMutation, AdminSetStoreActiveMutationVariables>;
export const AdminUpdateStoreBasicInfoDocument = new TypedDocumentString(`
    mutation AdminUpdateStoreBasicInfo($input: AdminUpdateStoreBasicInfoInput!) {
  adminUpdateStoreBasicInfo(input: $input) {
    id
    updatedAt
  }
}
    `) as unknown as TypedDocumentString<AdminUpdateStoreBasicInfoMutation, AdminUpdateStoreBasicInfoMutationVariables>;
export const AdminCreateUploadUrlDocument = new TypedDocumentString(`
    mutation AdminCreateUploadUrl($input: AdminCreateUploadUrlInput!) {
  adminCreateUploadUrl(input: $input) {
    uploadUrl
    publicUrl
    key
    expiresInSeconds
  }
}
    `) as unknown as TypedDocumentString<AdminCreateUploadUrlMutation, AdminCreateUploadUrlMutationVariables>;