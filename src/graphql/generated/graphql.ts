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

/** 감사 로그 조회 조건. 모든 필터는 AND로 결합된다. */
export type AdminAuditLogListInput = {
  /** 행위 종류 필터. */
  action?: AuditActionType | null | undefined;
  /** 조작한 계정 ID 필터. */
  actorAccountId?: string | number | null | undefined;
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** 기록 시각 하한(이상). */
  fromCreatedAt?: string | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
  /** 관련 매장 ID 필터. */
  storeId?: string | number | null | undefined;
  /** 대상 ID 필터(targetType과 함께 쓰면 특정 리소스의 이력). */
  targetId?: string | number | null | undefined;
  /** 대상 종류 필터. */
  targetType?: AuditTargetType | null | undefined;
  /** 기록 시각 상한(이하). */
  toCreatedAt?: string | null | undefined;
};

/** 배너 목록 조회 조건. */
export type AdminBannerListInput = {
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** 노출 여부 필터. 미지정 시 전체. */
  isActive?: boolean | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
  /** 노출 슬롯 필터. 미지정 시 전체. */
  placement?: BannerPlacement | null | undefined;
};

/** 주문 강제 취소 입력. */
export type AdminCancelOrderInput = {
  /** 취소 사유. 필수. 최대 494자('[관리자] ' 접두를 붙여 500자 이내로 이력에 남는다). 감사 로그에도 기록된다. */
  note: string;
  orderId: string | number;
};

/** 카테고리 목록 조회 조건. */
export type AdminCategoryListInput = {
  /** 종류 필터. 미지정 시 전체. */
  categoryType?: CategoryType | null | undefined;
  /** 비활성 포함 여부. 기본 false. */
  includeInactive?: boolean | null | undefined;
};

/** 관리자 계정 생성 입력. */
export type AdminCreateAdminInput = {
  /** 이메일. 선택. */
  email?: string | null | undefined;
  /** 이름. 선택. */
  name?: string | null | undefined;
  /** 초기 비밀번호. 8~64자(공백만으로는 불가). 최초 로그인 시 변경이 강제되므로 조합 규칙은 없다. */
  password: string;
  /** 로그인 username. 4~80자, 소문자·숫자·`.`·`_`·`-`만 허용. 이미 쓰이고 있으면 BAD_USER_INPUT. */
  username: string;
};

/** 배너 등록 입력. linkType에 맞는 링크 필드를 함께 보내야 한다. */
export type AdminCreateBannerInput = {
  /** 노출 종료 일시. 생략 시 종료 제한 없음. */
  endsAt?: string | null | undefined;
  /** 배너 이미지 URL. adminCreateUploadUrl(BANNER_IMAGE)로 이 계정에 발급된 publicUrl만 허용, 아니면 BAD_USER_INPUT. */
  imageUrl: string;
  /** 노출 여부. 기본 true. */
  isActive?: boolean | null | undefined;
  /** linkType이 CATEGORY일 때 쓸 카테고리 ID. */
  linkCategoryId?: string | number | null | undefined;
  /** linkType이 PRODUCT일 때 쓸 상품 ID. */
  linkProductId?: string | number | null | undefined;
  /** linkType이 STORE일 때 쓸 매장 ID. */
  linkStoreId?: string | number | null | undefined;
  /** 이동 대상 타입. 기본 NONE(이동 없음). */
  linkType?: BannerLinkType | null | undefined;
  /** linkType이 URL일 때 쓸 이동 URL. */
  linkUrl?: string | null | undefined;
  /** 노출 슬롯. */
  placement: BannerPlacement;
  /** 같은 슬롯 안에서의 노출 순서. 미지정 시 0. */
  sortOrder?: number | null | undefined;
  /** 노출 시작 일시. 생략 시 시작 제한 없음. */
  startsAt?: string | null | undefined;
  /** 배너 문구. */
  title?: string | null | undefined;
};

/** 카테고리 생성 입력. */
export type AdminCreateCategoryInput = {
  /** 종류. */
  categoryType: CategoryType;
  /** 설명. 최대 255자. 선택. */
  description?: string | null | undefined;
  /** 노출 여부. 기본 true. */
  isActive?: boolean | null | undefined;
  /** 이름. 1~100자, 같은 종류 안에서 유일. */
  name: string;
  /** 노출 순서. 미지정 시 0. */
  sortOrder?: number | null | undefined;
};

/** 지역 생성 입력. */
export type AdminCreateRegionInput = {
  /** 중심 위도(문자열, -90~90). 선택. */
  centerLat?: string | null | undefined;
  /** 중심 경도(문자열, -180~180). 선택. */
  centerLng?: string | null | undefined;
  /** 노출 여부. 기본 true. */
  isActive?: boolean | null | undefined;
  /** 이름. 1~80자. */
  name: string;
  /** 상위 1차 지역 ID. 없으면 1차 지역을 만든다. */
  parentId?: string | number | null | undefined;
  /** 고유 키. 1~120자, 소문자·숫자·`-`만. */
  slug: string;
  /** 노출 순서. 미지정 시 0. */
  sortOrder?: number | null | undefined;
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
  /** 초기 비밀번호. 8~64자(공백만으로는 불가). 최초 로그인 시 변경이 강제되므로 조합 규칙은 없다. */
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

/** 태그 생성 입력. */
export type AdminCreateTagInput = {
  /** 이름. 1~80자, 전역 유일. */
  name: string;
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

/** 리뷰 댓글 강제 삭제 입력. */
export type AdminDeleteReviewCommentInput = {
  commentId: string | number;
  /** 삭제 사유. 감사 로그와 닫히는 신고의 메모에 기록된다. 최대 500자. */
  reason: string;
};

/** 리뷰 강제 삭제 입력. */
export type AdminDeleteReviewInput = {
  /** 삭제 사유. 감사 로그와 닫히는 신고의 메모에 기록된다. 최대 500자. */
  reason: string;
  reviewId: string | number;
};

/** 발송 대상 지정 방식. */
export type AdminNotificationTargetKind =
  /** accountIds로 지정한 계정. */
  | 'ACCOUNT_IDS'
  /** 활성(ACTIVE·미탈퇴) USER 전체. */
  | 'ALL_USERS';

/** 관리자가 보낼 수 있는 알림 분류. 주문·리뷰 이벤트 알림은 시스템이 만든다. */
export type AdminNotificationType =
  /** 마케팅. */
  | 'MARKETING'
  /** 운영 공지. */
  | 'SYSTEM';

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

/** 지역 목록 조회 조건. */
export type AdminRegionListInput = {
  /** 비활성 포함 여부. 기본 false. */
  includeInactive?: boolean | null | undefined;
  /** 상위 지역 ID. 지정하면 그 아래 2차 지역만, 미지정 시 전체. */
  parentId?: string | number | null | undefined;
};

/** 판매자 비밀번호 초기화 입력. */
export type AdminResetSellerPasswordInput = {
  /** 대상 판매자 계정 ID. */
  accountId: string | number;
  /** 새 초기 비밀번호. 8~64자(공백만으로는 불가). 최초 로그인 시 변경이 강제되므로 조합 규칙은 없다. */
  newPassword: string;
};

/** 신고 처리 입력. */
export type AdminResolveReviewReportInput = {
  /** 처리 방식. */
  action: AdminReviewReportAction;
  /** 처리 메모. 최대 500자. 선택. */
  note?: string | null | undefined;
  reportId: string | number;
};

/** 리뷰 댓글 목록 조회 조건. */
export type AdminReviewCommentListInput = {
  /** 작성자 계정 ID 필터. 미지정 시 전체. */
  accountId?: string | number | null | undefined;
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** 삭제된 댓글 포함 여부. 기본 false. */
  includeDeleted?: boolean | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
  /** 소속 리뷰 ID 필터. 미지정 시 전체. */
  reviewId?: string | number | null | undefined;
};

/** 리뷰 목록 조회 조건. */
export type AdminReviewListInput = {
  /** 작성자 계정 ID 필터. 미지정 시 전체. */
  accountId?: string | number | null | undefined;
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** 삭제된 리뷰 포함 여부. 기본 false. */
  includeDeleted?: boolean | null | undefined;
  /** 본문 부분일치 검색어. 최대 100자. 미지정 시 전체. */
  keyword?: string | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
  /** 리뷰 ID 필터. 지정하면 그 리뷰 1건만(삭제 리뷰는 includeDeleted일 때만). 미지정 시 전체. */
  reviewId?: string | number | null | undefined;
  /** 매장 ID 필터. 미지정 시 전체. */
  storeId?: string | number | null | undefined;
};

/** 신고 처리 방식. */
export type AdminReviewReportAction =
  /** 대상을 삭제하고 같은 대상의 미처리 신고를 모두 RESOLVED로 닫는다. */
  | 'DELETE_TARGET'
  /** 이 신고만 REJECTED로 닫고 대상은 유지한다. */
  | 'REJECT';

/** 신고 목록 조회 조건. */
export type AdminReviewReportListInput = {
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
  /** 처리 상태 필터. 기본 PENDING. 전체를 보려면 null을 명시한다. */
  status?: ReviewReportStatus | null | undefined;
  /** 대상 종류 필터. 미지정 시 전체. */
  targetType?: AdminReviewReportTargetType | null | undefined;
};

/** 신고 대상 종류. */
export type AdminReviewReportTargetType =
  /** 리뷰. */
  | 'REVIEW'
  /** 리뷰 댓글. */
  | 'REVIEW_COMMENT';

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

/** 알림 발송 입력. */
export type AdminSendNotificationInput = {
  /** targetKind가 ACCOUNT_IDS일 때 대상 계정 ID. 1~500개, 중복은 한 번으로 센다. ALL_USERS면 무시된다. */
  accountIds?: Array<string | number> | null | undefined;
  /** 본문. 1~2000자. */
  body: string;
  /** 발송 요청 멱등 키. 8~64자, 공백 불가. 같은 관리자·같은 키의 재요청은 처음 결과를 재생한다(중복 발송 없음). */
  idempotencyKey: string;
  /** 대상 지정 방식. */
  targetKind: AdminNotificationTargetKind;
  /** 제목. 1~200자. */
  title: string;
  /** 알림 분류. */
  type: AdminNotificationType;
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

/** 태그 목록 조회 조건. */
export type AdminTagListInput = {
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string | null | undefined;
  /** 이름 부분일치 검색어. 최대 100자. 미지정 시 전체. */
  keyword?: string | null | undefined;
  /** 한 번에 가져올 개수. 기본 20, 1~100만 허용하며 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
};

/** 배너 수정 입력. 전달한 필드만 변경된다(부분 수정). */
export type AdminUpdateBannerInput = {
  bannerId: string | number;
  /** 노출 종료 일시. */
  endsAt?: string | null | undefined;
  /** 배너 이미지 URL. adminCreateUploadUrl(BANNER_IMAGE)로 이 계정에 발급된 publicUrl만 허용, 아니면 BAD_USER_INPUT. */
  imageUrl?: string | null | undefined;
  /** 노출 여부. */
  isActive?: boolean | null | undefined;
  /** linkType이 CATEGORY일 때 쓸 카테고리 ID. */
  linkCategoryId?: string | number | null | undefined;
  /** linkType이 PRODUCT일 때 쓸 상품 ID. */
  linkProductId?: string | number | null | undefined;
  /** linkType이 STORE일 때 쓸 매장 ID. */
  linkStoreId?: string | number | null | undefined;
  /** 이동 대상 타입. */
  linkType?: BannerLinkType | null | undefined;
  /** linkType이 URL일 때 쓸 이동 URL. */
  linkUrl?: string | null | undefined;
  /** 노출 슬롯. */
  placement?: BannerPlacement | null | undefined;
  /** 같은 슬롯 안에서의 노출 순서. */
  sortOrder?: number | null | undefined;
  /** 노출 시작 일시. */
  startsAt?: string | null | undefined;
  /** 배너 문구. */
  title?: string | null | undefined;
};

/** 카테고리 수정 입력. 전달한 필드만 변경된다. */
export type AdminUpdateCategoryInput = {
  categoryId: string | number;
  /** 설명. null이면 제거. */
  description?: string | null | undefined;
  /** 노출 여부. */
  isActive?: boolean | null | undefined;
  /** 이름. 1~100자. */
  name?: string | null | undefined;
  /** 노출 순서. */
  sortOrder?: number | null | undefined;
};

/** 지역 수정 입력. 전달한 필드만 변경된다. */
export type AdminUpdateRegionInput = {
  /** 중심 위도. null이면 제거. */
  centerLat?: string | null | undefined;
  /** 중심 경도. null이면 제거. */
  centerLng?: string | null | undefined;
  /** 노출 여부. */
  isActive?: boolean | null | undefined;
  /** 이름. */
  name?: string | null | undefined;
  regionId: string | number;
  /** 고유 키. */
  slug?: string | null | undefined;
  /** 노출 순서. */
  sortOrder?: number | null | undefined;
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

/** 태그 수정 입력. */
export type AdminUpdateTagInput = {
  /** 이름. 1~80자, 전역 유일. */
  name: string;
  tagId: string | number;
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

/** 감사 로그에 기록된 행위 종류. */
export type AuditActionType =
  /** 생성. */
  | 'CREATE'
  /** 삭제(soft-delete 포함). */
  | 'DELETE'
  /** 상태 전이. */
  | 'STATUS_CHANGE'
  /** 수정. */
  | 'UPDATE';

/** 감사 로그가 가리키는 대상 종류. 판매자 화면(sellerAuditLogs)은 STORE·PRODUCT·ORDER·CONVERSATION·CHANGE_PASSWORD만 노출하고 필터 입력도 그 범위만 받는다. */
export type AuditTargetType =
  /** 계정(관리자·판매자 생성, 정지/복구, 비밀번호 초기화). */
  | 'ACCOUNT'
  /** 플랫폼 배너. */
  | 'BANNER'
  /** 카테고리 마스터. */
  | 'CATEGORY'
  /** 비밀번호 변경. targetId는 바꾼 계정 ID. */
  | 'CHANGE_PASSWORD'
  /** 구매자 문의 대화. */
  | 'CONVERSATION'
  /** 관리자 알림 발송. */
  | 'NOTIFICATION'
  /** 주문 상태 변경. */
  | 'ORDER'
  /** 상품과 그 하위. */
  | 'PRODUCT'
  /** 지역 마스터. */
  | 'REGION'
  /** 리뷰 강제 삭제. */
  | 'REVIEW'
  /** 리뷰 댓글 강제 삭제. */
  | 'REVIEW_COMMENT'
  /** 신고 처리. */
  | 'REVIEW_REPORT'
  /** 매장 설정·콘텐츠. */
  | 'STORE'
  /** 태그 마스터. */
  | 'TAG';

/**
 * 배너 클릭 시 이동할 대상 타입. 구매자 노출·판매자 관리 API가 공용으로 쓴다.
 *
 * 값에 따라 읽어야 할 링크 필드가 정해진다. 구매자 조회(HomeBanner)에서는 서버가
 * 나머지 링크 필드를 null로 비워서 내려주지만, 판매자 조회(SellerBanner)는 저장된
 * 값을 그대로 반환한다 — 판매자 화면에서는 linkType과 맞지 않는 필드에 값이 남아
 * 있을 수 있으므로 linkType을 기준으로 판단해야 한다.
 */
export type BannerLinkType =
  /** `linkCategoryId`만 채워진다. */
  | 'CATEGORY'
  /** 이동 없음. 구매자 조회에서는 링크 필드가 전부 null로 내려온다. */
  | 'NONE'
  /**
   * 상품으로 이동. 구매자 배너(HomeBanner)는 `linkProductId`와 `linkProductStoreId`가
   * 함께 채워진다(상품 상세 경로에 매장 ID가 필요). 판매자 배너는 `linkProductId`만 있고
   * `linkProductStoreId` 필드 자체가 없다.
   */
  | 'PRODUCT'
  /** `linkStoreId`만 채워진다. */
  | 'STORE'
  /** `linkUrl`만 채워진다. */
  | 'URL';

/**
 * 배너가 노출될 자리. 구매자 API가 실제로 읽는 값은 HOME_MAIN·CATEGORY·SEARCH 셋이고,
 * 나머지는 아직 소비처가 없는 예약값이다.
 */
export type BannerPlacement =
  /**
   * 홈 '상황별 인기 케이크' 배너 중 특정 카테고리 칩을 선택했을 때 노출되는 것.
   * 해당 카테고리로 연결된 배너만 뽑히므로 linkCategoryId를 함께 지정해야 한다.
   * 카테고리 진입 화면의 배너가 아니다.
   */
  | 'CATEGORY'
  /** 홈 '상황별 인기 케이크' 배너. 카테고리 칩이 '전체'일 때 노출된다. */
  | 'HOME_MAIN'
  /** 예약값. 이 자리를 읽는 구매자 쿼리가 없어 등록해도 노출되지 않는다. */
  | 'HOME_SUB'
  /** 검색 진입 화면 배너 슬롯 */
  | 'SEARCH'
  /** 예약값. 이 자리를 읽는 구매자 쿼리가 없어 등록해도 노출되지 않는다. */
  | 'STORE';

/** 상품 카테고리 분류. */
export type CategoryType =
  /** 상황·이벤트 기준 분류(생일, 기념일 등). 홈 화면 칩에는 이 분류만 노출된다. */
  | 'EVENT'
  /** 위 둘로 분류되지 않는 그 밖의 분류. 조회 필터로도 쓸 수 있다. */
  | 'OTHER'
  /** 디자인·스타일 기준 분류. */
  | 'STYLE';

/** 커서 페이지네이션 공통 입력. 필터가 필요한 목록은 같은 두 필드를 가진 전용 input을 쓴다. */
export type CursorInput = {
  /** 이전 페이지의 nextCursor. 불투명 토큰이라 정렬 기준이 바뀌면 무효. 형식이 어긋나면 BAD_USER_INPUT. */
  cursor?: string | null | undefined;
  /** 페이지 크기. 1~100, 기본 20. 벗어나면 BAD_USER_INPUT. */
  limit?: number | null | undefined;
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

/** 신고 사유. */
export type ReviewReportReason =
  /** 욕설·비방. */
  | 'ABUSE'
  /** 부적절한 내용(음란·혐오 등). */
  | 'INAPPROPRIATE'
  /** 기타. detail에 사유를 적는다. */
  | 'OTHER'
  /** 광고·도배. */
  | 'SPAM';

/** 신고 처리 상태. */
export type ReviewReportStatus =
  /** 접수됨. 운영자 확인 대기. */
  | 'PENDING'
  /** 기각됨(대상 유지). */
  | 'REJECTED'
  /** 처리됨(대상 삭제). */
  | 'RESOLVED';

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

export type AdminAdminsQueryVariables = Exact<{
  input?: CursorInput | null | undefined;
}>;


export type AdminAdminsQuery = { adminAdmins: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ accountId: string, username: string | null, email: string | null, name: string | null, status: AccountStatus, mustChangePassword: boolean, lastLoginAt: string | null, createdAt: string }> } };

export type AdminCreateAdminMutationVariables = Exact<{
  input: AdminCreateAdminInput;
}>;


export type AdminCreateAdminMutation = { adminCreateAdmin: { accountId: string, username: string | null } };

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

export type AdminAuditLogsQueryVariables = Exact<{
  input?: AdminAuditLogListInput | null | undefined;
}>;


export type AdminAuditLogsQuery = { adminAuditLogs: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ id: string, actorAccountId: string, actorAccountType: AccountType | null, storeId: string | null, targetType: AuditTargetType, targetId: string, action: AuditActionType, beforeJson: string | null, afterJson: string | null, ipAddress: string | null, userAgent: string | null, createdAt: string }> } };

export type AdminBannersQueryVariables = Exact<{
  input?: AdminBannerListInput | null | undefined;
}>;


export type AdminBannersQuery = { adminBanners: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ id: string, placement: BannerPlacement, title: string | null, imageUrl: string, linkType: BannerLinkType, linkUrl: string | null, linkProductId: string | null, linkStoreId: string | null, linkCategoryId: string | null, startsAt: string | null, endsAt: string | null, sortOrder: number, isActive: boolean, createdAt: string, updatedAt: string }> } };

export type AdminBannerQueryVariables = Exact<{
  bannerId: string | number;
}>;


export type AdminBannerQuery = { adminBanner: { id: string, placement: BannerPlacement, title: string | null, imageUrl: string, linkType: BannerLinkType, linkUrl: string | null, linkProductId: string | null, linkStoreId: string | null, linkCategoryId: string | null, startsAt: string | null, endsAt: string | null, sortOrder: number, isActive: boolean, createdAt: string, updatedAt: string } };

export type AdminCreateBannerMutationVariables = Exact<{
  input: AdminCreateBannerInput;
}>;


export type AdminCreateBannerMutation = { adminCreateBanner: { id: string } };

export type AdminUpdateBannerMutationVariables = Exact<{
  input: AdminUpdateBannerInput;
}>;


export type AdminUpdateBannerMutation = { adminUpdateBanner: { id: string, updatedAt: string } };

export type AdminDeleteBannerMutationVariables = Exact<{
  bannerId: string | number;
}>;


export type AdminDeleteBannerMutation = { adminDeleteBanner: boolean };

export type AdminDashboardSummaryQueryVariables = Exact<{
  input: AdminDashboardSummaryInput;
}>;


export type AdminDashboardSummaryQuery = { adminDashboardSummary: { from: string, to: string, newUserCount: number, newSellerCount: number, orderAmountSum: number, activeStoreCount: number, activeProductCount: number, pendingReportCount: number, orderCounts: { submitted: number, confirmed: number, made: number, pickedUp: number, canceled: number } } };

export type AdminSearchKeywordSnapshotQueryVariables = Exact<{
  input?: AdminSearchKeywordSnapshotInput | null | undefined;
}>;


export type AdminSearchKeywordSnapshotQuery = { adminSearchKeywordSnapshot: { rankedAt: string | null, items: Array<{ rank: number, keyword: string, searchCount: number }> } };

export type AdminSendNotificationMutationVariables = Exact<{
  input: AdminSendNotificationInput;
}>;


export type AdminSendNotificationMutation = { adminSendNotification: { sentCount: number, skippedAccountIds: Array<string> } };

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

export type AdminRegionsQueryVariables = Exact<{
  input?: AdminRegionListInput | null | undefined;
}>;


export type AdminRegionsQuery = { adminRegions: Array<{ id: string, parentId: string | null, level: number, name: string, slug: string, sortOrder: number, isActive: boolean, centerLat: string | null, centerLng: string | null, storeCount: number, childCount: number, createdAt: string, updatedAt: string }> };

export type AdminCreateRegionMutationVariables = Exact<{
  input: AdminCreateRegionInput;
}>;


export type AdminCreateRegionMutation = { adminCreateRegion: { id: string } };

export type AdminUpdateRegionMutationVariables = Exact<{
  input: AdminUpdateRegionInput;
}>;


export type AdminUpdateRegionMutation = { adminUpdateRegion: { id: string } };

export type AdminDeleteRegionMutationVariables = Exact<{
  regionId: string | number;
}>;


export type AdminDeleteRegionMutation = { adminDeleteRegion: boolean };

export type AdminReviewsQueryVariables = Exact<{
  input?: AdminReviewListInput | null | undefined;
}>;


export type AdminReviewsQuery = { adminReviews: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ id: string, storeId: string, storeName: string, productId: string, authorAccountId: string, authorNickname: string | null, rating: number, content: string | null, commentCount: number, likeCount: number, deleted: boolean, createdAt: string }> } };

export type AdminReviewCommentsQueryVariables = Exact<{
  input?: AdminReviewCommentListInput | null | undefined;
}>;


export type AdminReviewCommentsQuery = { adminReviewComments: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ id: string, reviewId: string, authorAccountId: string, authorNickname: string | null, content: string, deleted: boolean, createdAt: string }> } };

export type AdminReviewReportsQueryVariables = Exact<{
  input?: AdminReviewReportListInput | null | undefined;
}>;


export type AdminReviewReportsQuery = { adminReviewReports: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ id: string, targetType: AdminReviewReportTargetType, targetId: string, reporterAccountId: string, reason: ReviewReportReason, detail: string | null, contentSnapshot: string | null, status: ReviewReportStatus, resolvedByAccountId: string | null, resolvedAt: string | null, resolutionNote: string | null, createdAt: string }> } };

export type AdminReviewReportQueryVariables = Exact<{
  reportId: string | number;
}>;


export type AdminReviewReportQuery = { adminReviewReport: { report: { id: string, targetType: AdminReviewReportTargetType, targetId: string, reporterAccountId: string, reason: ReviewReportReason, detail: string | null, contentSnapshot: string | null, status: ReviewReportStatus, resolvedByAccountId: string | null, resolvedAt: string | null, resolutionNote: string | null, createdAt: string }, target: { id: string, reviewId: string | null, authorAccountId: string, authorNickname: string | null, content: string | null, storeId: string, deleted: boolean } } };

export type AdminDeleteReviewMutationVariables = Exact<{
  input: AdminDeleteReviewInput;
}>;


export type AdminDeleteReviewMutation = { adminDeleteReview: boolean };

export type AdminDeleteReviewCommentMutationVariables = Exact<{
  input: AdminDeleteReviewCommentInput;
}>;


export type AdminDeleteReviewCommentMutation = { adminDeleteReviewComment: boolean };

export type AdminResolveReviewReportMutationVariables = Exact<{
  input: AdminResolveReviewReportInput;
}>;


export type AdminResolveReviewReportMutation = { adminResolveReviewReport: { id: string, status: ReviewReportStatus } };

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

export type AdminCategoriesQueryVariables = Exact<{
  input?: AdminCategoryListInput | null | undefined;
}>;


export type AdminCategoriesQuery = { adminCategories: Array<{ id: string, categoryType: CategoryType, name: string, description: string | null, sortOrder: number, isActive: boolean, productCount: number, createdAt: string, updatedAt: string }> };

export type AdminCreateCategoryMutationVariables = Exact<{
  input: AdminCreateCategoryInput;
}>;


export type AdminCreateCategoryMutation = { adminCreateCategory: { id: string } };

export type AdminUpdateCategoryMutationVariables = Exact<{
  input: AdminUpdateCategoryInput;
}>;


export type AdminUpdateCategoryMutation = { adminUpdateCategory: { id: string } };

export type AdminDeleteCategoryMutationVariables = Exact<{
  categoryId: string | number;
}>;


export type AdminDeleteCategoryMutation = { adminDeleteCategory: boolean };

export type AdminTagsQueryVariables = Exact<{
  input?: AdminTagListInput | null | undefined;
}>;


export type AdminTagsQuery = { adminTags: { totalCount: number, hasMore: boolean, nextCursor: string | null, items: Array<{ id: string, name: string, productCount: number, createdAt: string, updatedAt: string }> } };

export type AdminCreateTagMutationVariables = Exact<{
  input: AdminCreateTagInput;
}>;


export type AdminCreateTagMutation = { adminCreateTag: { id: string } };

export type AdminUpdateTagMutationVariables = Exact<{
  input: AdminUpdateTagInput;
}>;


export type AdminUpdateTagMutation = { adminUpdateTag: { id: string } };

export type AdminDeleteTagMutationVariables = Exact<{
  tagId: string | number;
}>;


export type AdminDeleteTagMutation = { adminDeleteTag: boolean };

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

export const AdminAdminsDocument = new TypedDocumentString(`
    query AdminAdmins($input: CursorInput) {
  adminAdmins(input: $input) {
    items {
      accountId
      username
      email
      name
      status
      mustChangePassword
      lastLoginAt
      createdAt
    }
    totalCount
    hasMore
    nextCursor
  }
}
    `) as unknown as TypedDocumentString<AdminAdminsQuery, AdminAdminsQueryVariables>;
export const AdminCreateAdminDocument = new TypedDocumentString(`
    mutation AdminCreateAdmin($input: AdminCreateAdminInput!) {
  adminCreateAdmin(input: $input) {
    accountId
    username
  }
}
    `) as unknown as TypedDocumentString<AdminCreateAdminMutation, AdminCreateAdminMutationVariables>;
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
export const AdminAuditLogsDocument = new TypedDocumentString(`
    query AdminAuditLogs($input: AdminAuditLogListInput) {
  adminAuditLogs(input: $input) {
    items {
      id
      actorAccountId
      actorAccountType
      storeId
      targetType
      targetId
      action
      beforeJson
      afterJson
      ipAddress
      userAgent
      createdAt
    }
    totalCount
    hasMore
    nextCursor
  }
}
    `) as unknown as TypedDocumentString<AdminAuditLogsQuery, AdminAuditLogsQueryVariables>;
export const AdminBannersDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<AdminBannersQuery, AdminBannersQueryVariables>;
export const AdminBannerDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<AdminBannerQuery, AdminBannerQueryVariables>;
export const AdminCreateBannerDocument = new TypedDocumentString(`
    mutation AdminCreateBanner($input: AdminCreateBannerInput!) {
  adminCreateBanner(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<AdminCreateBannerMutation, AdminCreateBannerMutationVariables>;
export const AdminUpdateBannerDocument = new TypedDocumentString(`
    mutation AdminUpdateBanner($input: AdminUpdateBannerInput!) {
  adminUpdateBanner(input: $input) {
    id
    updatedAt
  }
}
    `) as unknown as TypedDocumentString<AdminUpdateBannerMutation, AdminUpdateBannerMutationVariables>;
export const AdminDeleteBannerDocument = new TypedDocumentString(`
    mutation AdminDeleteBanner($bannerId: ID!) {
  adminDeleteBanner(bannerId: $bannerId)
}
    `) as unknown as TypedDocumentString<AdminDeleteBannerMutation, AdminDeleteBannerMutationVariables>;
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
export const AdminSendNotificationDocument = new TypedDocumentString(`
    mutation AdminSendNotification($input: AdminSendNotificationInput!) {
  adminSendNotification(input: $input) {
    sentCount
    skippedAccountIds
  }
}
    `) as unknown as TypedDocumentString<AdminSendNotificationMutation, AdminSendNotificationMutationVariables>;
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
export const AdminRegionsDocument = new TypedDocumentString(`
    query AdminRegions($input: AdminRegionListInput) {
  adminRegions(input: $input) {
    id
    parentId
    level
    name
    slug
    sortOrder
    isActive
    centerLat
    centerLng
    storeCount
    childCount
    createdAt
    updatedAt
  }
}
    `) as unknown as TypedDocumentString<AdminRegionsQuery, AdminRegionsQueryVariables>;
export const AdminCreateRegionDocument = new TypedDocumentString(`
    mutation AdminCreateRegion($input: AdminCreateRegionInput!) {
  adminCreateRegion(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<AdminCreateRegionMutation, AdminCreateRegionMutationVariables>;
export const AdminUpdateRegionDocument = new TypedDocumentString(`
    mutation AdminUpdateRegion($input: AdminUpdateRegionInput!) {
  adminUpdateRegion(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<AdminUpdateRegionMutation, AdminUpdateRegionMutationVariables>;
export const AdminDeleteRegionDocument = new TypedDocumentString(`
    mutation AdminDeleteRegion($regionId: ID!) {
  adminDeleteRegion(regionId: $regionId)
}
    `) as unknown as TypedDocumentString<AdminDeleteRegionMutation, AdminDeleteRegionMutationVariables>;
export const AdminReviewsDocument = new TypedDocumentString(`
    query AdminReviews($input: AdminReviewListInput) {
  adminReviews(input: $input) {
    items {
      id
      storeId
      storeName
      productId
      authorAccountId
      authorNickname
      rating
      content
      commentCount
      likeCount
      deleted
      createdAt
    }
    totalCount
    hasMore
    nextCursor
  }
}
    `) as unknown as TypedDocumentString<AdminReviewsQuery, AdminReviewsQueryVariables>;
export const AdminReviewCommentsDocument = new TypedDocumentString(`
    query AdminReviewComments($input: AdminReviewCommentListInput) {
  adminReviewComments(input: $input) {
    items {
      id
      reviewId
      authorAccountId
      authorNickname
      content
      deleted
      createdAt
    }
    totalCount
    hasMore
    nextCursor
  }
}
    `) as unknown as TypedDocumentString<AdminReviewCommentsQuery, AdminReviewCommentsQueryVariables>;
export const AdminReviewReportsDocument = new TypedDocumentString(`
    query AdminReviewReports($input: AdminReviewReportListInput) {
  adminReviewReports(input: $input) {
    items {
      id
      targetType
      targetId
      reporterAccountId
      reason
      detail
      contentSnapshot
      status
      resolvedByAccountId
      resolvedAt
      resolutionNote
      createdAt
    }
    totalCount
    hasMore
    nextCursor
  }
}
    `) as unknown as TypedDocumentString<AdminReviewReportsQuery, AdminReviewReportsQueryVariables>;
export const AdminReviewReportDocument = new TypedDocumentString(`
    query AdminReviewReport($reportId: ID!) {
  adminReviewReport(reportId: $reportId) {
    report {
      id
      targetType
      targetId
      reporterAccountId
      reason
      detail
      contentSnapshot
      status
      resolvedByAccountId
      resolvedAt
      resolutionNote
      createdAt
    }
    target {
      id
      reviewId
      authorAccountId
      authorNickname
      content
      storeId
      deleted
    }
  }
}
    `) as unknown as TypedDocumentString<AdminReviewReportQuery, AdminReviewReportQueryVariables>;
export const AdminDeleteReviewDocument = new TypedDocumentString(`
    mutation AdminDeleteReview($input: AdminDeleteReviewInput!) {
  adminDeleteReview(input: $input)
}
    `) as unknown as TypedDocumentString<AdminDeleteReviewMutation, AdminDeleteReviewMutationVariables>;
export const AdminDeleteReviewCommentDocument = new TypedDocumentString(`
    mutation AdminDeleteReviewComment($input: AdminDeleteReviewCommentInput!) {
  adminDeleteReviewComment(input: $input)
}
    `) as unknown as TypedDocumentString<AdminDeleteReviewCommentMutation, AdminDeleteReviewCommentMutationVariables>;
export const AdminResolveReviewReportDocument = new TypedDocumentString(`
    mutation AdminResolveReviewReport($input: AdminResolveReviewReportInput!) {
  adminResolveReviewReport(input: $input) {
    id
    status
  }
}
    `) as unknown as TypedDocumentString<AdminResolveReviewReportMutation, AdminResolveReviewReportMutationVariables>;
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
export const AdminCategoriesDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<AdminCategoriesQuery, AdminCategoriesQueryVariables>;
export const AdminCreateCategoryDocument = new TypedDocumentString(`
    mutation AdminCreateCategory($input: AdminCreateCategoryInput!) {
  adminCreateCategory(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<AdminCreateCategoryMutation, AdminCreateCategoryMutationVariables>;
export const AdminUpdateCategoryDocument = new TypedDocumentString(`
    mutation AdminUpdateCategory($input: AdminUpdateCategoryInput!) {
  adminUpdateCategory(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<AdminUpdateCategoryMutation, AdminUpdateCategoryMutationVariables>;
export const AdminDeleteCategoryDocument = new TypedDocumentString(`
    mutation AdminDeleteCategory($categoryId: ID!) {
  adminDeleteCategory(categoryId: $categoryId)
}
    `) as unknown as TypedDocumentString<AdminDeleteCategoryMutation, AdminDeleteCategoryMutationVariables>;
export const AdminTagsDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<AdminTagsQuery, AdminTagsQueryVariables>;
export const AdminCreateTagDocument = new TypedDocumentString(`
    mutation AdminCreateTag($input: AdminCreateTagInput!) {
  adminCreateTag(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<AdminCreateTagMutation, AdminCreateTagMutationVariables>;
export const AdminUpdateTagDocument = new TypedDocumentString(`
    mutation AdminUpdateTag($input: AdminUpdateTagInput!) {
  adminUpdateTag(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<AdminUpdateTagMutation, AdminUpdateTagMutationVariables>;
export const AdminDeleteTagDocument = new TypedDocumentString(`
    mutation AdminDeleteTag($tagId: ID!) {
  adminDeleteTag(tagId: $tagId)
}
    `) as unknown as TypedDocumentString<AdminDeleteTagMutation, AdminDeleteTagMutationVariables>;
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