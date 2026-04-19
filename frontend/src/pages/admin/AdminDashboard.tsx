// frontend/src/pages/admin/AdminDashboard.tsx
import { FC } from 'react';
import { Users, FileText, TrendingUp, CalendarDays } from 'lucide-react';
import { useAdminStats } from '../../hooks/useAdmin';

const AdminDashboard: FC = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats?.total_users ?? 0, icon: Users, color: 'text-violet-400' },
    { label: 'Total Posts', value: stats?.total_posts ?? 0, icon: FileText, color: 'text-sky-400' },
    { label: 'Posts Today', value: stats?.posts_today ?? 0, icon: CalendarDays, color: 'text-emerald-400' },
    { label: 'Paid Users', value: (stats?.plan_distribution?.pro ?? 0) + (stats?.plan_distribution?.unlimited ?? 0), icon: TrendingUp, color: 'text-amber-400' },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Overview of PostPilot activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-400">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Plan Distribution</h2>
        <div className="space-y-3">
          {(['free', 'pro', 'unlimited'] as const).map((plan) => {
            const count = stats?.plan_distribution?.[plan] ?? 0;
            const total = stats?.total_users ?? 1;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const colors: Record<string, string> = {
              free: 'bg-zinc-500',
              pro: 'bg-violet-500',
              unlimited: 'bg-amber-500',
            };
            return (
              <div key={plan}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-zinc-300 capitalize">{plan}</span>
                  <span className="text-sm text-zinc-400">{count} users · {pct}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colors[plan]}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
