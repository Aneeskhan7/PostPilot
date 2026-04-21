// frontend/src/pages/admin/AdminLayout.tsx
import { FC, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeft, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const AdminLayout: FC = () => {
  const { user, signOut } = useAuthStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
  ];

  const sidebarContent = (
    <aside className={`
      fixed inset-y-0 left-0 w-56 bg-zinc-900/95 border-r border-white/5 backdrop-blur-sm
      flex flex-col py-6 px-4 gap-1 flex-shrink-0 z-40
      transition-transform duration-300 ease-in-out
      ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="mb-6 px-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">Admin</p>
          </div>
          <p className="text-sm font-semibold text-white">PostPilot Panel</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = to === '/admin' ? pathname === '/admin' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5 space-y-1">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        <p className="px-3 pt-1 text-xs text-zinc-600 truncate">{user?.email}</p>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {sidebarContent}

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-zinc-900/95 border-b border-white/5 backdrop-blur-sm flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white">Admin Panel</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto lg:ml-56 pt-14 lg:pt-0 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
