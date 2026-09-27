import { createFileRoute } from '@tanstack/react-router';

import { AuditLogsPage, auditSearchSchema } from '@/features/audit-logs';

export const Route = createFileRoute('/_authed/_shell/audit-logs')({
  validateSearch: auditSearchSchema,
  component: AuditLogsRoute,
});

function AuditLogsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <AuditLogsPage search={search} onSearchChange={(next) => void navigate({ search: next })} />
  );
}
