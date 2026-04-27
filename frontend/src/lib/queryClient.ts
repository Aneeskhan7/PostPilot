// frontend/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,       // 1 min — serve cached data, revalidate in background
      gcTime: 10 * 60_000,     // 10 min — keep cache alive across navigation
      retry: 1,
      refetchOnWindowFocus: false, // avoid re-fetch every tab switch
    },
  },
});
