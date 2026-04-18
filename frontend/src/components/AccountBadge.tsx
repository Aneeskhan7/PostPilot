// frontend/src/components/AccountBadge.tsx
import { FC } from 'react';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import type { SocialAccount, Platform } from '../types';

interface AccountBadgeProps {
  account: SocialAccount;
  showStatus?: boolean;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: 'from-pink-500 to-orange-400',
  facebook: 'bg-blue-600',
  linkedin: 'bg-sky-600',
};

const PLATFORM_ICONS: Record<Platform, FC<{ className?: string }>> = {
  instagram: ({ className }) => <Instagram className={className} />,
  facebook: ({ className }) => <Facebook className={className} />,
  linkedin: ({ className }) => <Linkedin className={className} />,
};

const AccountBadge: FC<AccountBadgeProps> = ({ account, showStatus = false }) => {
  const Icon = PLATFORM_ICONS[account.platform];
  const isInstagram = account.platform === 'instagram';

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        {account.platform_avatar_url ? (
          <img
            src={account.platform_avatar_url}
            alt={account.platform_username}
            loading="lazy"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isInstagram ? `bg-gradient-to-br ${PLATFORM_COLORS.instagram}` : PLATFORM_COLORS[account.platform]}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        )}
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border border-zinc-900 ${isInstagram ? `bg-gradient-to-br ${PLATFORM_COLORS.instagram}` : PLATFORM_COLORS[account.platform]}`}>
          <Icon className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">@{account.platform_username}</p>
        {account.page_name && (
          <p className="text-xs text-zinc-500 truncate">{account.page_name}</p>
        )}
      </div>

      {showStatus && (
        <div className={`ml-auto flex-shrink-0 w-2 h-2 rounded-full ${account.is_active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
      )}
    </div>
  );
};

export default AccountBadge;
