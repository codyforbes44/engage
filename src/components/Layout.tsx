import { Outlet, Link, useLocation } from 'react-router';
import { User } from 'firebase/auth';
import { auth, signOut } from '../firebase';
import { LayoutDashboard, PenSquare, MessageCircleReply, Settings as SettingsIcon, LogOut, Twitter, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout({ user }: { user: User }) {
  const location = useLocation();

  const handleSignOut = () => {
    signOut(auth);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Source', path: '/source', icon: Search },
    { name: 'Create Post', path: '/create', icon: PenSquare },
    { name: 'Engage', path: '/engage', icon: MessageCircleReply },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <Twitter className="w-6 h-6 text-blue-400" />
          <span className="font-semibold text-lg tracking-tight">xAI Engage</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-zinc-800 text-zinc-50" 
                    : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                {user.email?.[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
