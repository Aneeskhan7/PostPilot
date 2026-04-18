// frontend/src/components/PlatformPreview.tsx
import { FC } from 'react';
import { Instagram, Facebook, Linkedin, Heart, MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import type { Platform } from '../types';

interface PlatformPreviewProps {
  platform: Platform;
  content: string;
  mediaUrls: string[];
  username: string;
  avatarUrl?: string | null;
}

const CHAR_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
};

const InstagramPreview: FC<Omit<PlatformPreviewProps, 'platform'>> = ({
  content, mediaUrls, username, avatarUrl,
}) => (
  <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 max-w-sm w-full">
    {/* Header */}
    <div className="flex items-center gap-3 p-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center overflow-hidden flex-shrink-0">
        {avatarUrl
          ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          : <Instagram className="w-4 h-4 text-white" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{username || 'your_account'}</p>
      </div>
      <div className="ml-auto text-zinc-400">···</div>
    </div>

    {/* Image */}
    {mediaUrls[0] ? (
      <img src={mediaUrls[0]} alt="" className="w-full aspect-square object-cover bg-zinc-800" />
    ) : (
      <div className="w-full aspect-square bg-zinc-800 flex items-center justify-center">
        <Instagram className="w-10 h-10 text-zinc-600" />
      </div>
    )}

    {/* Actions */}
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-4 text-zinc-400">
        <Heart className="w-6 h-6" />
        <MessageCircle className="w-6 h-6" />
        <Share2 className="w-6 h-6" />
      </div>
      <p className="text-sm text-zinc-300 line-clamp-3">
        <span className="font-semibold text-white mr-1">{username || 'your_account'}</span>
        {content || <span className="text-zinc-500 italic">Your caption will appear here…</span>}
      </p>
    </div>
  </div>
);

const FacebookPreview: FC<Omit<PlatformPreviewProps, 'platform'>> = ({
  content, mediaUrls, username, avatarUrl,
}) => (
  <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 max-w-sm w-full">
    {/* Header */}
    <div className="flex items-center gap-3 p-4">
      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
        {avatarUrl
          ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          : <Facebook className="w-5 h-5 text-white" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{username || 'Your Page'}</p>
        <p className="text-xs text-zinc-500">Just now · 🌐</p>
      </div>
    </div>

    {/* Content */}
    <div className="px-4 pb-3">
      <p className="text-sm text-zinc-300 line-clamp-4">
        {content || <span className="text-zinc-500 italic">Your post will appear here…</span>}
      </p>
    </div>

    {/* Image */}
    {mediaUrls[0] && (
      <img src={mediaUrls[0]} alt="" className="w-full aspect-video object-cover bg-zinc-800" />
    )}

    {/* Actions */}
    <div className="flex items-center gap-1 p-3 border-t border-white/5 text-zinc-400 text-sm">
      <button className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5 transition-colors">
        <ThumbsUp className="w-4 h-4" /> Like
      </button>
      <button className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5 transition-colors">
        <MessageCircle className="w-4 h-4" /> Comment
      </button>
      <button className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5 transition-colors">
        <Share2 className="w-4 h-4" /> Share
      </button>
    </div>
  </div>
);

const LinkedInPreview: FC<Omit<PlatformPreviewProps, 'platform'>> = ({
  content, mediaUrls, username, avatarUrl,
}) => (
  <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 max-w-sm w-full">
    {/* Header */}
    <div className="flex items-start gap-3 p-4">
      <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center overflow-hidden flex-shrink-0">
        {avatarUrl
          ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          : <Linkedin className="w-6 h-6 text-white" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{username || 'Your Name'}</p>
        <p className="text-xs text-zinc-500">Just now · 🌐</p>
      </div>
    </div>

    {/* Content */}
    <div className="px-4 pb-3">
      <p className="text-sm text-zinc-300 line-clamp-5">
        {content || <span className="text-zinc-500 italic">Your post will appear here…</span>}
      </p>
    </div>

    {/* Image */}
    {mediaUrls[0] && (
      <img src={mediaUrls[0]} alt="" className="w-full aspect-video object-cover bg-zinc-800" />
    )}

    {/* Actions */}
    <div className="flex items-center gap-1 p-3 border-t border-white/5 text-zinc-400 text-sm">
      <button className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5 transition-colors">
        <ThumbsUp className="w-4 h-4" /> Like
      </button>
      <button className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5 transition-colors">
        <MessageCircle className="w-4 h-4" /> Comment
      </button>
      <button className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5 transition-colors">
        <Share2 className="w-4 h-4" /> Share
      </button>
    </div>
  </div>
);

const PlatformPreview: FC<PlatformPreviewProps> = (props) => {
  const limit = CHAR_LIMITS[props.platform];
  const count = props.content.length;
  const over = count > limit;

  return (
    <div className="space-y-3">
      {props.platform === 'instagram' && <InstagramPreview {...props} />}
      {props.platform === 'facebook'  && <FacebookPreview {...props} />}
      {props.platform === 'linkedin'  && <LinkedInPreview {...props} />}

      {/* Char count */}
      <div className="flex justify-end">
        <span className={`text-xs ${over ? 'text-red-400' : 'text-zinc-500'}`}>
          {count.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default PlatformPreview;
