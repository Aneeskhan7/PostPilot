// frontend/src/components/Layout.tsx
import { FC, ReactNode, useState } from 'react';
import { Menu, Rocket } from 'lucide-react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-zinc-900/95 border-b border-white/5 backdrop-blur-sm flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Rocket className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">PostPilot</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
