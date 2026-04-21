// frontend/src/pages/admin/AdminDashboard.tsx
import { FC } from 'react';
import { Users, FileText, TrendingUp, CalendarDays } from 'lucide-react';
import { useAdminStats } from '../../hooks/useAdmin';

const AdminDashboard: FC = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Users',  value: stats?.total_users ?? 0,  icon: Users,        color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Total Posts',  value: stats?.total_posts ?? 0,  icon: FileText,     color: 'text-sky-400',    bg: 'bg-sky-500/10'    },
    { label: 'Posts Today',  value: stats?.posts_today ?? 0,  icon: CalendarDays, color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
    {
      label: 'Paid Users',
      value: (stats?.plan_distribution?.pro ?? 0) + (stats?.plan_distribution?.unlimited ?? 0),
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  const planConfig: Record<string, { bar: string; badge: string }> = {
    free:      { bar: 'bg-zinc-500',    badge: 'bg-zinc-700 text-zinc-300' },
    pro:       { bar: 'bg-violet-500',  badge: 'bg-violet-600/30 text-violet-300' },
    unlimited: { bar: 'bg-amber-500',   badge: 'bg-amber-500/20 text-amber-300' },
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Overview of PostPilot activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-400 leading-snug">{label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-white">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 lg:p-6">
        <h2 className="text-sm font-semibold text-white mb-5">Plan Distribution</h2>
        <div className="space-y-4">
          {(['free', 'pro', 'unlimited'] as const).map((plan) => {
            const count = stats?.plan_distribution?.[plan] ?? 0;
            const total = stats?.total_users ?? 1;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const { bar, badge } = planConfig[plan];
            return (
              <div key={plan}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${badge}`}>{plan}</span>
                  </div>
                  <span className="text-sm text-zinc-400 tabular-nums">
                    {count} user{count !== 1 ? 's' : ''} · {pct}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${bar}`}
                    style={{ width: `${pct}%` }}
                  />
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
