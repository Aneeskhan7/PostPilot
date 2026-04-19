// frontend/src/pages/Settings.tsx
import { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Linkedin, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Info } from 'lucide-react';

const FacebookIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
import Sidebar from '../components/Sidebar';
import AccountBadge from '../components/AccountBadge';
import { useAccounts, useDeleteAccount, useToggleAccount } from '../hooks/useAccounts';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useCreateCheckout, useCreatePortal } from '../hooks/useBilling';
import type { SocialAccount } from '../types';

const PRO_PRICE_ID = import.meta.env.VITE_STRIPE_PRO_PRICE_ID as string;
const UNLIMITED_PRICE_ID = import.meta.env.VITE_STRIPE_UNLIMITED_PRICE_ID as string;

const API = import.meta.env.VITE_API_URL as string;

interface PlatformCard {
  platform: 'facebook' | 'instagram' | 'linkedin';
  oauthKey: 'meta' | 'linkedin' | null;
  label: string;
  description: string;
  note?: string;
  Icon: FC<{ className?: string }>;
  iconBg: string;
}

const PLATFORMS: PlatformCard[] = [
  {
    platform: 'facebook',
    oauthKey: 'meta',
    label: 'Facebook',
    description: 'Personal profile or Page',
    Icon: FacebookIcon,
    iconBg: 'bg-blue-600',
  },
  {
    platform: 'instagram',
    oauthKey: 'meta',
    label: 'Instagram',
    description: 'Business or Creator account',
    note: 'Requires a Facebook Page with a linked Instagram Business or Creator account.',
    Icon: InstagramIcon,
    iconBg: 'bg-gradient-to-br from-pink-500 to-purple-600',
  },
  {
    platform: 'linkedin',
    oauthKey: 'linkedin',
    label: 'LinkedIn',
    description: 'Personal profile or Company page',
    Icon: Linkedin,
    iconBg: 'bg-sky-600',
  },
];

const PLAN_DAILY_LIMITS: Record<string, number | null> = { free: 2, pro: 8, unlimited: null };

const Settings: FC = () => {
  const [searchParams] = useSearchParams();
  const connected = searchParams.get('connected');
  const billing = searchParams.get('billing');
  const oauthError = searchParams.get('error');
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const createCheckout = useCreateCheckout();
  const createPortal = useCreatePortal();

  const { data: accounts = [], isLoading } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const toggleAccount = useToggleAccount();

  const connectPlatform = (oauthKey: 'meta' | 'linkedin') => {
    if (!session?.access_token) return;
    window.location.href = `${API}/auth/${oauthKey}?token=${session.access_token}`;
  };

  const connectedPlatforms = new Set((accounts as SocialAccount[]).map((a) => a.platform));

  const successMsg =
    connected === 'meta'
      ? connectedPlatforms.has('instagram')
        ? 'Facebook & Instagram connected successfully!'
        : 'Facebook connected! Instagram will connect automatically once you link a Business or Creator account to your Facebook Page.'
      : connected === 'instagram'
      ? 'Instagram connected successfully!'
      : connected === 'linkedin'
      ? 'LinkedIn connected successfully!'
      : null;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-60 p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Manage your connected social accounts</p>
        </div>

        {/* Error banner */}
        {oauthError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm mb-6">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-300">Connection failed</p>
              <p className="mt-0.5 text-red-400/80">
                {oauthError === 'rate_limited'
                  ? 'Too many requests. Please wait a few minutes and try again.'
                  : oauthError}
              </p>
            </div>
          </div>
        )}

        {/* Success banner */}
        {connected && successMsg && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm mb-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-400">{successMsg}</p>
          </div>
        )}

        {/* Platform connection cards */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Connect Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLATFORMS.map(({ platform, oauthKey, label, description, Icon, iconBg }) => {
              const isConnected = connectedPlatforms.has(platform);
              const isInstagram = platform === 'instagram';

              return (
                <div key={platform} className="flex flex-col gap-2">
                  <button
                    onClick={() => connectPlatform(isInstagram ? 'meta' : oauthKey!)}
                    className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors text-left w-full ${
                      isConnected
                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {isInstagram && !isConnected ? 'Connect via Facebook OAuth' : description}
                      </p>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      {isConnected
                        ? <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        : <Plus className="w-4 h-4 text-zinc-400" />}
                    </div>
                  </button>

                  {/* Status pill */}
                  <div className="flex items-center gap-1.5 px-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    <span className={`text-xs ${isConnected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {isConnected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>

                  {/* Instagram: explain requirement when not connected */}
                  {isInstagram && !isConnected && (
                    <div className="flex items-start gap-1.5 px-1">
                      <Info className="w-3 h-3 text-zinc-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-zinc-500 leading-snug">
                        Requires a Facebook Page with a linked Instagram Business or Creator account.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Billing banner */}
        {billing === 'success' && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm mb-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-400">Subscription activated! Your plan has been upgraded.</p>
          </div>
        )}

        {/* Billing */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-1">Billing</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Current plan: <span className="text-white font-medium capitalize">{profile?.plan ?? 'free'}</span>
            {profile && PLAN_DAILY_LIMITS[profile.plan] !== null && (
              <> · {PLAN_DAILY_LIMITS[profile.plan]} posts/day</>
            )}
            {profile?.plan === 'unlimited' && <> · Unlimited posts/day</>}
          </p>

          {(!profile || profile.plan === 'free') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-white/10 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white">Pro</p>
                  <p className="text-2xl font-bold text-white mt-0.5">$3<span className="text-sm font-normal text-zinc-400">/mo</span></p>
                  <p className="text-xs text-zinc-400 mt-1">8 posts per day · All platforms</p>
                </div>
                <button
                  onClick={() => createCheckout.mutate(PRO_PRICE_ID)}
                  disabled={createCheckout.isPending || !PRO_PRICE_ID}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {createCheckout.isPending ? 'Redirecting…' : 'Upgrade to Pro'}
                </button>
              </div>

              <div className="border border-amber-500/30 rounded-xl p-4 space-y-3 bg-amber-500/5">
                <div>
                  <p className="text-sm font-semibold text-white">Unlimited</p>
                  <p className="text-2xl font-bold text-white mt-0.5">$9<span className="text-sm font-normal text-zinc-400">/mo</span></p>
                  <p className="text-xs text-zinc-400 mt-1">Unlimited posts · All platforms</p>
                </div>
                <button
                  onClick={() => createCheckout.mutate(UNLIMITED_PRICE_ID)}
                  disabled={createCheckout.isPending || !UNLIMITED_PRICE_ID}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-medium rounded-lg transition-colors"
                >
                  {createCheckout.isPending ? 'Redirecting…' : 'Upgrade to Unlimited'}
                </button>
              </div>
            </div>
          )}

          {profile && profile.plan !== 'free' && (
            <button
              onClick={() => createPortal.mutate()}
              disabled={createPortal.isPending}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {createPortal.isPending ? 'Redirecting…' : 'Manage Subscription'}
            </button>
          )}
        </div>

        {/* Connected accounts list */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Connected Accounts</h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No accounts connected yet</p>
          ) : (
            <div className="space-y-2">
              {(accounts as SocialAccount[]).map((account) => (
                <div key={account.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <AccountBadge account={account} showStatus />

                  <div className="ml-auto flex items-center gap-2">
                    {account.token_expires_at &&
                      new Date(account.token_expires_at) < new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) && (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          Expiring soon
                        </span>
                      )}

                    <button
                      onClick={() => toggleAccount.mutate({ id: account.id, isActive: !account.is_active })}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        account.is_active
                          ? 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {account.is_active ? 'Pause' : 'Enable'}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Disconnect @${account.platform_username}?`)) {
                          deleteAccount.mutate(account.id);
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors"
                      aria-label={`Disconnect ${account.platform_username}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
