// frontend/src/hooks/usePosts.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePosts, useCreatePost } from './usePosts';
import * as postsApi from '../lib/api/posts';
import { useAuth } from './useAuth';

// Mock the API functions
vi.mock('../lib/api/posts');

// Mock the auth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockPostsApi = postsApi as any;
const mockUseAuth = useAuth as any;

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePosts hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      getAccessToken: vi.fn().mockReturnValue('mock-token'),
    });
  });

  describe('usePosts', () => {
    it('fetches posts successfully', async () => {
      const mockPosts = [
        { id: '1', content: 'Test post 1', status: 'draft' },
        { id: '2', content: 'Test post 2', status: 'published' },
      ];

      mockPostsApi.fetchPosts.mockResolvedValue(mockPosts);

      const { result } = renderHook(() => usePosts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPosts);
      expect(mockPostsApi.fetchPosts).toHaveBeenCalledWith('mock-token', undefined);
    });

    it('is disabled when no access token', () => {
      mockUseAuth.mockReturnValue({
        getAccessToken: vi.fn().mockReturnValue(null),
      });

      const { result } = renderHook(() => usePosts(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(mockPostsApi.fetchPosts).not.toHaveBeenCalled();
    });

    it('fetches posts by status', async () => {
      const mockPosts = [
        { id: '1', content: 'Draft post', status: 'draft' },
      ];

      mockPostsApi.fetchPosts.mockResolvedValue(mockPosts);

      const { result } = renderHook(() => usePosts('draft'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockPostsApi.fetchPosts).toHaveBeenCalledWith('mock-token', 'draft');
    });

    it('handles fetch error', async () => {
      mockPostsApi.fetchPosts.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => usePosts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useCreatePost', () => {
    it('creates post successfully', async () => {
      const newPost = { id: 'new-1', content: 'New post', status: 'draft' };
      const inputData = {
        content: 'New post content',
        platforms: ['instagram'],
        media_urls: [],
      };

      mockPostsApi.createPost.mockResolvedValue(newPost);

      const { result } = renderHook(() => useCreatePost(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(inputData as any);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(newPost);
      expect(mockPostsApi.createPost).toHaveBeenCalledWith('mock-token', inputData);
    });

    it('handles creation error', async () => {
      mockPostsApi.createPost.mockRejectedValue(new Error('Creation failed'));

      const inputData = {
        content: 'New post content',
        platforms: ['instagram'],
        media_urls: [],
      };

      const { result } = renderHook(() => useCreatePost(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(inputData as any);

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});