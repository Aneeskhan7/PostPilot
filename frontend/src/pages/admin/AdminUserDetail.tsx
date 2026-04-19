// frontend/src/pages/admin/AdminUserDetail.tsx
import { FC, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Instagram, Facebook, Linkedin, ExternalLink } from 'lucide-react';
import { useAdminUser, useUpdateUserPlan } from '../../hooks/useAdmin';
import type { Plan, Platform } from '../../types';

const PLATFORM_ICONS: Record<Platform, FC<{ className?: string }>> = {
  instagram: ({ className }) => <Instagram className={className} />,
  facebook: ({ className }) => <Facebook className={className} />,
  linkedin: ({ className }) => <Linkedin className={className} />,
};

const PLAN_LABELS: Record<Plan, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-zinc-700 text-zinc-300' },
  pro: { label: 'Pro · $3/mo', color: 'bg-violet-600/30 text-violet-300' },
  unlimited: { label: 'Unlimited · $9/mo', color: 'bg-amber-500/20 text-amber-300' },
};

const AdminUserDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useAdminUser(id ?? '');
  const updatePlan = useUpdateUserPlan();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  if (isLoading || !user) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  const currentPlan = selectedPlan ?? user.plan;

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to users
      </Link>

      {/* Profile */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{user.full_name ?? user.email}</h1>
            <p className="text-sm text-zinc-400 mt-0.5">{user.email}</p>
            <p className="text-xs text-zinc-600 mt-1">Joined {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_LABELS[user.plan].color}`}>
            {PLAN_LABELS[user.plan].label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/5">
          <div>
            <p className="text-xs text-zinc-500">Posts today</p>
            <p className="text-lg font-semibold text-white mt-0.5">{user.daily_post_count}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Posts this month</p>
            <p className="text-lg font-semibold text-white mt-0.5">{user.monthly_post_count}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total posts</p>
            <p className="text-lg font-semibold text-white mt-0.5">{user.total_posts}</p>
          </div>
        </div>

        {/* Plan change */}
        <div className="pt-2 border-t border-white/5 flex items-center gap-3">
          <select
            value={currentPlan}
            onChange={(e) => setSelectedPlan(e.target.value as Plan)}
            className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            style={{ colorScheme: 'dark' }}
          >
            <option value="free">Free</option>
            <option value="pro">Pro ($3/mo)</option>
            <option value="unlimited">Unlimited ($9/mo)</option>
          </select>
          <button
            onClick={() => {
              if (currentPlan !== user.plan) {
                updatePlan.mutate({ id: user.id, plan: currentPlan });
                setSelectedPlan(null);
              }
            }}
            disabled={currentPlan === user.plan || updatePlan.isPending}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {updatePlan.isPending ? 'Saving…' : 'Save Plan'}
          </button>
          {user.stripe_customer_id && (
            <a
              href={`https://dashboard.stripe.com/customers/${user.stripe_customer_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Stripe
            </a>
          )}
        </div>
      </div>

      {/* Social accounts */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Connected Accounts ({user.social_accounts.length})</h2>
        {user.social_accounts.length === 0 ? (
          <p className="text-sm text-zinc-500">No accounts connected.</p>
        ) : (
          <div className="space-y-2">
            {user.social_accounts.map((acc) => {
              const Icon = PLATFORM_ICONS[acc.platform];
              const expiring = acc.token_expires_at && new Date(acc.token_expires_at) < new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
              return (
                <div key={acc.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <Icon className="w-4 h-4 text-zinc-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">@{acc.platform_username}</p>
                    {acc.page_name && <p className="text-xs text-zinc-500">{acc.page_name}</p>}
                  </div>
                  {expiring && <span className="text-xs text-amber-400">Token expiring</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${acc.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                    {acc.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserDetail;
