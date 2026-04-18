// frontend/src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { QUERY_KEYS } from '../lib/queryKeys';
import * as postsApi from '../lib/api/posts';
import type { CreatePostInput, UpdatePostInput } from '../types';

export function usePosts(status?: string) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: status ? QUERY_KEYS.postsByStatus(status) : QUERY_KEYS.posts,
    queryFn: () => postsApi.fetchPosts(getAccessToken()!, status),
    enabled: !!getAccessToken(),
  });
}

export function usePost(id: string) {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.post(id),
    queryFn: () => postsApi.fetchPost(getAccessToken()!, id),
    enabled: !!getAccessToken() && !!id,
  });
}

export function useCreatePost() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => postsApi.createPost(getAccessToken()!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
    },
  });
}

export function useUpdatePost() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePostInput }) =>
      postsApi.updatePost(getAccessToken()!, id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.post(id) });
    },
  });
}

export function useDeletePost() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postsApi.deletePost(getAccessToken()!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
    },
  });
}

export function useCancelPost() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postsApi.cancelPost(getAccessToken()!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
    },
  });
}
