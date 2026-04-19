// frontend/src/pages/Settings.tsx
import { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Facebook, Linkedin, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import AccountBadge from '../components/AccountBadge';
import { useAccounts, useDeleteAccount, useToggleAccount } from '../hooks/useAccounts';
import { useAuth } from '../hooks/useAuth';
import type { SocialAccount } from '../types';

const API = import.meta.env.VITE_API_URL as string;


const Settings: FC = () => {
  const [searchParams] = useSearchParams();
  const connected = searchParams.get('connected');
  const oauthError = searchParams.get('error');
  const { session } = useAuth();

  const { data: accounts = [], isLoading } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const toggleAccount = useToggleAccount();

  const connectPlatform = (platform: 'meta' | 'linkedin') => {
    if (!session?.access_token) return;
    window.location.href = `${API}/auth/${platform}?token=${session.access_token}`;
  };

  const connectedPlatforms = new Set((accounts as SocialAccount[]).map((a: SocialAccount) => a.platform));

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
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
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
        {connected && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-6">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {connected === 'meta'
              ? 'Facebook & Instagram connected successfully!'
              : 'LinkedIn connected successfully!'}
          </div>
        )}

        {/* Connect buttons */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Connect Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Meta (FB + IG) */}
            <button
              onClick={() => connectPlatform('meta')}
              className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Facebook className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Facebook & Instagram</p>
                <p className="text-xs text-zinc-500">Connect via Meta</p>
              </div>
              <Plus className="w-4 h-4 text-zinc-400 ml-auto" />
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => connectPlatform('linkedin')}
              disabled={connectedPlatforms.has('linkedin')}
              className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center flex-shrink-0">
                <Linkedin className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">LinkedIn</p>
                <p className="text-xs text-zinc-500">Personal profile</p>
              </div>
              {connectedPlatforms.has('linkedin')
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                : <Plus className="w-4 h-4 text-zinc-400 ml-auto" />}
            </button>
          </div>
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
              {(accounts as SocialAccount[]).map((account: SocialAccount) => (
                  <div key={account.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <AccountBadge account={account} showStatus />

                    <div className="ml-auto flex items-center gap-2">
                      {/* Token expiry warning */}
                      {account.token_expires_at && new Date(account.token_expires_at) < new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) && (
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
