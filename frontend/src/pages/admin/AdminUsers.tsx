// frontend/src/pages/admin/AdminUsers.tsx
import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAdminUsers, useUpdateUserPlan } from '../../hooks/useAdmin';
import type { Plan } from '../../types';

const PLAN_BADGES: Record<Plan, string> = {
  free:      'bg-zinc-700 text-zinc-300',
  pro:       'bg-violet-600/30 text-violet-300',
  unlimited: 'bg-amber-500/20 text-amber-300',
};

const AdminUsers: FC = () => {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useAdminUsers(page, limit);
  const updatePlan = useUpdateUserPlan();

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const users = data?.data ?? [];

  return (
    <div className="p-4 lg:p-8 space-y-5 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-zinc-400 mt-1">{data?.total ?? '–'} total users</p>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Posts today</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Posts / month</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Accounts</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/10 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[200px]">{user.email}</p>
                      {user.full_name && <p className="text-zinc-500 text-xs mt-0.5">{user.full_name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.plan}
                        onChange={(e) => updatePlan.mutate({ id: user.id, plan: e.target.value as Plan })}
                        className={`text-xs font-semibold px-2 py-1 rounded-md border-0 cursor-pointer ${PLAN_BADGES[user.plan]} bg-transparent`}
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="free" className="bg-zinc-900 text-white">Free</option>
                        <option value="pro" className="bg-zinc-900 text-white">Pro</option>
                        <option value="unlimited" className="bg-zinc-900 text-white">Unlimited</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{user.daily_post_count}</td>
                    <td className="px-4 py-3 text-zinc-300">{user.monthly_post_count}</td>
                    <td className="px-4 py-3 text-zinc-300">{user.social_accounts_count}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="text-zinc-400 hover:text-white transition-colors"
                        aria-label={`View ${user.email}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))
          : users.map((user) => (
              <div key={user.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    {user.full_name && <p className="text-xs text-zinc-500 mt-0.5">{user.full_name}</p>}
                    <p className="text-xs text-zinc-600 mt-0.5">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  <Link
                    to={`/admin/users/${user.id}`}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                    aria-label={`View ${user.email}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={user.plan}
                    onChange={(e) => updatePlan.mutate({ id: user.id, plan: e.target.value as Plan })}
                    className={`text-xs font-semibold px-2 py-1 rounded-md border-0 cursor-pointer ${PLAN_BADGES[user.plan]} bg-transparent`}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="free" className="bg-zinc-900 text-white">Free</option>
                    <option value="pro" className="bg-zinc-900 text-white">Pro</option>
                    <option value="unlimited" className="bg-zinc-900 text-white">Unlimited</option>
                  </select>

                  <span className="text-xs text-zinc-500 border-l border-white/10 pl-2">
                    {user.daily_post_count} today
                  </span>
                  <span className="text-xs text-zinc-500 border-l border-white/10 pl-2">
                    {user.monthly_post_count} / mo
                  </span>
                  <span className="text-xs text-zinc-500 border-l border-white/10 pl-2">
                    {user.social_accounts_count} accounts
                  </span>
                </div>
              </div>
            ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
