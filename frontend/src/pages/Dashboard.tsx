// frontend/src/pages/Dashboard.tsx
import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenSquare, Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { usePosts, useDeletePost, useCancelPost } from '../hooks/usePosts';
import { useAccounts } from '../hooks/useAccounts';
import { useAuth } from '../hooks/useAuth';
import type { Post } from '../types';

const StatCard: FC<{ label: string; value: number | string; icon: FC<{ className?: string }>; color: string }> = ({
  label, value, icon: Icon, color,
}) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: posts = [], isLoading: postsLoading } = usePosts();
  const { data: accounts = [] } = useAccounts();
  const deletePost = useDeletePost();
  const cancelPost = useCancelPost();

  const scheduled = posts.filter((p: Post) => p.status === 'scheduled');
  const published = posts.filter((p: Post) => p.status === 'published');
  const failed    = posts.filter((p: Post) => p.status === 'failed');
  const recent = [...posts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 6);

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 ml-60 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/composer')}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-600/25"
          >
            <PenSquare className="w-4 h-4" />
            New Post
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Scheduled"
            value={scheduled.length}
            icon={({ className }) => <Clock className={className} />}
            color="bg-violet-500/20 text-violet-400"
          />
          <StatCard
            label="Published"
            value={published.length}
            icon={({ className }) => <CheckCircle2 className={className} />}
            color="bg-emerald-500/20 text-emerald-400"
          />
          <StatCard
            label="Failed"
            value={failed.length}
            icon={({ className }) => <AlertCircle className={className} />}
            color="bg-red-500/20 text-red-400"
          />
          <StatCard
            label="Connected"
            value={accounts.filter((a) => a.is_active).length}
            icon={({ className }) => <TrendingUp className={className} />}
            color="bg-sky-500/20 text-sky-400"
          />
        </div>

        {/* Recent Posts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Recent Posts</h2>
            <button
              onClick={() => navigate('/history')}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              View all
            </button>
          </div>

          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-3 w-1/3" />
                  <div className="h-3 bg-white/10 rounded mb-2" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <PenSquare className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm">No posts yet</p>
              <button
                onClick={() => navigate('/composer')}
                className="mt-3 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                Create your first post →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {recent.map((post: Post) => (
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
      </main>
    </div>
  );
};

export default Dashboard;
