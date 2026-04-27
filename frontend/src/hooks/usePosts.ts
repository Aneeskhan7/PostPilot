// frontend/src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { QUERY_KEYS } from '../lib/queryKeys';
import * as postsApi from '../lib/api/posts';
import type { CreatePostInput, UpdatePostInput } from '../types';

function useToken() {
  return useAuthStore((s) => s.session?.access_token ?? null);
}

export function usePosts(status?: string) {
  const token = useToken();

  return useQuery({
    queryKey: status ? QUERY_KEYS.postsByStatus(status) : QUERY_KEYS.posts,
    queryFn: () => postsApi.fetchPosts(token!, status),
    enabled: !!token,
  });
}

export function usePost(id: string) {
  const token = useToken();

  return useQuery({
    queryKey: QUERY_KEYS.post(id),
    queryFn: () => postsApi.fetchPost(token!, id),
    enabled: !!id && !!token,
  });
}

export function useCreatePost() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => {
      if (!token) throw new Error('Not authenticated');
      return postsApi.createPost(token, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
    },
  });
}

export function useUpdatePost() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePostInput }) => {
      if (!token) throw new Error('Not authenticated');
      return postsApi.updatePost(token, id, input);
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.post(id) });
    },
  });
}

export function useDeletePost() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('Not authenticated');
      return postsApi.deletePost(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
    },
  });
}

export function useCancelPost() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('Not authenticated');
      return postsApi.cancelPost(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
    },
  });
}
