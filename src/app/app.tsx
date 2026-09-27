import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useState } from 'react';

import { createQueryClient } from '@/app/query-client';
import { createAppRouter } from '@/app/router';
import { initTheme } from '@/shared/theme';
import { Toaster } from '@/shared/ui/sonner';

export function App() {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(() => createAppRouter(queryClient));
  useState(() => {
    initTheme();
    return null;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
