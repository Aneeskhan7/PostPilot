// frontend/src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { QUERY_KEYS } from '../lib/queryKeys';
import * as postsApi from '../lib/api/posts';
import type { CreatePostInput, UpdatePostInput } from '../types';

export function usePosts(status?: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: status ? QUERY_KEYS.postsByStatus(status) : QUERY_KEYS.posts,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return postsApi.fetchPosts(token, status);
    },
  });
}

export function usePost(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.post(id),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return postsApi.fetchPost(token, id);
    },
    enabled: !!id,
  });
}

export function useCreatePost() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return postsApi.createPost(token, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
    },
  });
}

export function useUpdatePost() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdatePostInput }) => {
      const token = await getToken();
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
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return postsApi.deletePost(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
    },
  });
}

export function useCancelPost() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return postsApi.cancelPost(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
    },
  });
}
