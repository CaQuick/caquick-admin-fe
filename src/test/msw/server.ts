import { setupServer } from 'msw/node';

import { gqlOk } from './graphql';

/** 셸 사이드바가 모든 화면에서 부르는 처리 대기 건수. 건수를 보는 spec은 server.use로 덮어쓴다 */
const emptyTaskCounts = {
  claimedPayments: 0,
  pendingPayments: 0,
  refundsAwaitingAccount: 0,
  refundsAwaitingTransfer: 0,
  pendingSettlements: 0,
};

/** 전역 MSW 서버. 핸들러는 각 spec이 server.use로 등록한다(계약별 헬퍼는 ./graphql). */
export const server = setupServer(gqlOk('AdminTaskCounts', { adminTaskCounts: emptyTaskCounts }));
