// frontend/src/lib/queryKeys.ts
export const QUERY_KEYS = {
  posts: ['posts'] as const,
  post: (id: string) => ['posts', id] as const,
  postsByStatus: (status: string) => ['posts', { status }] as const,
  accounts: ['accounts'] as const,
};
