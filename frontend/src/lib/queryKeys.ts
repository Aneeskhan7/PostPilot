// frontend/src/lib/queryKeys.ts
export const QUERY_KEYS = {
  posts: ['posts'] as const,
  post: (id: string) => ['posts', id] as const,
  postsByStatus: (status: string) => ['posts', { status }] as const,
  accounts: ['accounts'] as const,
  profile: ['profile'] as const,
  adminStats: ['admin', 'stats'] as const,
  adminUsers: (page: number) => ['admin', 'users', page] as const,
  adminUser: (id: string) => ['admin', 'users', id] as const,
};
