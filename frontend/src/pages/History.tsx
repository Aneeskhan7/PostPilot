// frontend/src/pages/History.tsx
import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Ban, FileEdit, Search } from 'lucide-react';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import { usePosts, useDeletePost, useCancelPost } from '../hooks/usePosts';
import type { PostStatus, Post } from '../types';

const FILTERS: { label: string; value: PostStatus | 'all' }[] = [
  { label: 'All',       value: 'all'      },
  { label: 'Published', value: 'published'},
  { label: 'Scheduled', value: 'scheduled'},
  { label: 'Failed',    value: 'failed'   },
  { label: 'Draft',     value: 'draft'    },
  { label: 'Cancelled', value: 'cancelled'},
];

const STATUS_ICONS: Partial<Record<PostStatus, FC<{ className?: string }>>> = {
  published:  ({ className }) => <CheckCircle2 className={className} />,
  failed:     ({ className }) => <XCircle className={className} />,
  scheduled:  ({ className }) => <Clock className={className} />,
  cancelled:  ({ className }) => <Ban className={className} />,
  draft:      ({ className }) => <FileEdit className={className} />,
};

const History: FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PostStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: posts = [], isLoading } = usePosts();
  const deletePost = useDeletePost();
  const cancelPost = useCancelPost();

  const filtered = (posts as Post[]).filter((p: Post) => {
    const matchesStatus = filter === 'all' || p.status === filter;
    const matchesSearch = search === '' || p.content.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <Layout>
      <div className="p-4 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl font-bold text-white">History</h1>
          <p className="text-sm text-zinc-400 mt-0.5">All your posts in one place</p>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(({ label, value }) => {
              const Icon = value !== 'all' ? STATUS_ICONS[value] : null;
              return (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    filter === value
                      ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                      : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5 hover:border-white/10'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="search"
              placeholder="Search posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition w-56"
            />
          </div>
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-sm">No posts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((post: Post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={(id) => navigate(`/composer?edit=${id}`)}
                onCancel={(id) => cancelPost.mutate(id)}
                onDelete={(id) => deletePost.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default History;
