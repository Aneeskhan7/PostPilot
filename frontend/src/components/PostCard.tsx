// frontend/src/components/PostCard.tsx
import { FC } from 'react';
import { Instagram, Facebook, Linkedin, Clock, CheckCircle2, XCircle, Loader2, Ban, FileEdit } from 'lucide-react';
import type { Post, Platform, PostStatus } from '../types';

interface PostCardProps {
  post: Post;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const PLATFORM_ICONS: Record<Platform, FC<{ className?: string }>> = {
  instagram: ({ className }) => <Instagram className={className} />,
  facebook:  ({ className }) => <Facebook className={className} />,
  linkedin:  ({ className }) => <Linkedin className={className} />,
};

const STATUS_CONFIG: Record<PostStatus, { label: string; color: string; icon: FC<{ className?: string }> }> = {
  draft:      { label: 'Draft',      color: 'text-zinc-400 bg-zinc-800',          icon: ({ className }) => <FileEdit className={className} /> },
  scheduled:  { label: 'Scheduled',  color: 'text-violet-400 bg-violet-500/10',   icon: ({ className }) => <Clock className={className} /> },
  publishing: { label: 'Publishing', color: 'text-amber-400 bg-amber-500/10',     icon: ({ className }) => <Loader2 className={`${className} animate-spin`} /> },
  published:  { label: 'Published',  color: 'text-emerald-400 bg-emerald-500/10', icon: ({ className }) => <CheckCircle2 className={className} /> },
  failed:     { label: 'Failed',     color: 'text-red-400 bg-red-500/10',         icon: ({ className }) => <XCircle className={className} /> },
  cancelled:  { label: 'Cancelled',  color: 'text-zinc-500 bg-zinc-800',          icon: ({ className }) => <Ban className={className} /> },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const PostCard: FC<PostCardProps> = ({ post, onCancel, onDelete, onEdit }) => {
  const status = STATUS_CONFIG[post.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {post.platforms.map((p) => {
            const Icon = PLATFORM_ICONS[p];
            return (
              <div key={p} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center" title={p}>
                <Icon className="w-3.5 h-3.5 text-zinc-300" />
              </div>
            );
          })}
        </div>

        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-zinc-300 line-clamp-3 mb-3">{post.content}</p>

      {/* Media thumbnails */}
      {post.media_urls.length > 0 && (
        <div className="flex gap-2 mb-3">
          {post.media_urls.slice(0, 3).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              loading="lazy"
              className="w-14 h-14 rounded-lg object-cover bg-zinc-800"
            />
          ))}
          {post.media_urls.length > 3 && (
            <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
              +{post.media_urls.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="text-xs text-zinc-500">
          {post.status === 'scheduled' && post.scheduled_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(post.scheduled_at)}
            </span>
          )}
          {post.status === 'published' && post.published_at && (
            <span>Published {formatDate(post.published_at)}</span>
          )}
          {post.status === 'failed' && post.failure_reason && (
            <span className="text-red-400 truncate max-w-[200px]" title={post.failure_reason}>
              {post.failure_reason}
            </span>
          )}
          {post.status === 'draft' && (
            <span>Created {formatDate(post.created_at)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onEdit && ['draft', 'scheduled'].includes(post.status) && (
            <button
              onClick={() => onEdit(post.id)}
              className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              Edit
            </button>
          )}
          {onCancel && post.status === 'scheduled' && (
            <button
              onClick={() => onCancel(post.id)}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
            >
              Cancel
            </button>
          )}
          {onDelete && ['draft', 'cancelled', 'failed'].includes(post.status) && (
            <button
              onClick={() => onDelete(post.id)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
