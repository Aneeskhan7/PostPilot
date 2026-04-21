// frontend/src/pages/admin/AdminLayout.tsx
import { FC } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeft, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const AdminLayout: FC = () => {
  const { user, signOut } = useAuthStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/5 flex flex-col py-6 px-4 gap-1 flex-shrink-0">
        <div className="mb-6 px-2">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">PostPilot</p>
          <p className="text-sm font-semibold text-white mt-0.5">Admin Panel</p>
        </div>

        {navItems.map(({ to, label, icon: Icon }) => {
          const active = to === '/admin' ? pathname === '/admin' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}

        <div className="mt-auto pt-4 border-t border-white/5">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full mt-1"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <p className="px-3 mt-2 text-xs text-zinc-600 truncate">{user?.email}</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
