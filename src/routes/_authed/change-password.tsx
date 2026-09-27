import { createFileRoute } from '@tanstack/react-router';

import { ChangePasswordPage } from '@/features/auth';

export const Route = createFileRoute('/_authed/change-password')({ component: ChangePasswordPage });
