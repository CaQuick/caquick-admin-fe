import { graphql } from '@/graphql/generated';
import { type AdminSendNotificationInput } from '@/graphql/generated/graphql';
import { gqlRequest } from '@/shared/api';

const AdminSendNotificationDocument = graphql(/* GraphQL */ `
  mutation AdminSendNotification($input: AdminSendNotificationInput!) {
    adminSendNotification(input: $input) {
      sentCount
      skippedAccountIds
    }
  }
`);

export async function sendNotification(input: AdminSendNotificationInput) {
  return (await gqlRequest(AdminSendNotificationDocument, { input })).adminSendNotification;
}
