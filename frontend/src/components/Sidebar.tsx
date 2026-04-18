// frontend/src/components/Sidebar.tsx
import { FC } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PenSquare,
  CalendarDays,
  History,
  Settings,
  LogOut,
  Rocket,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  to: string;
  icon: FC<{ className?: string }>;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',          icon: ({ className }) => <LayoutDashboard className={className} />, label: 'Dashboard' },
  { to: '/composer',  icon: ({ className }) => <PenSquare className={className} />,      label: 'Composer'  },
  { to: '/calendar',  icon: ({ className }) => <CalendarDays className={className} />,   label: 'Calendar'  },
  { to: '/history',   icon: ({ className }) => <History className={className} />,        label: 'History'   },
  { to: '/settings',  icon: ({ className }) => <Settings className={className} />,       label: 'Settings'  },
];

const Sidebar: FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-zinc-900/80 border-r border-white/5 backdrop-blur-sm flex flex-col z-40">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">PostPilot</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-400' : ''}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-white truncate">{user?.email}</p>
          <p className="text-xs text-zinc-500">Free plan</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
