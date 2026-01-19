import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, FileText, Search, BarChart3, Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from './ThemeProvider';
import { TokenUsageBadge } from './ui/TokenUsageBadge';
import { useState, useEffect, useRef } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions', icon: MessageSquare },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Statistics', href: '/statistics', icon: BarChart3 }
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname.startsWith(href);
}

export function Layout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside
        ref={sidebarRef}
        onKeyDown={(e) => {
          if (!sidebarCollapsed && e.key === 'Escape') {
            setSidebarCollapsed(true);
          }
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 border-r bg-background transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
        <div className="flex flex-col h-full relative">
          <div className="flex h-14 items-center border-b px-4 justify-between flex-shrink-0">
            <div className="flex items-center min-w-0">
              {!sidebarCollapsed && (
                <Link to="/" className="flex items-center">
                  <span className="font-bold text-lg truncate">Claude Code Daily</span>
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-accent transition-colors flex-shrink-0"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
          <div
            onMouseDown={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute right-0 top-0 bottom-0 w-0.5 cursor-col-resize hover:w-1.5 transition-all bg-transparent hover:bg-muted-foreground/30 z-10"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          />

          <nav className={cn(
            "flex-1 px-3 py-4",
            sidebarCollapsed ? "space-y-1 items-center" : "space-y-1"
          )}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(location.pathname, item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full',
                    sidebarCollapsed && 'justify-center',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4 space-y-2 flex-shrink-0">
            {!sidebarCollapsed && <TokenUsageBadge />}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Toggle theme"
              title={sidebarCollapsed ? theme === 'light' ? 'Dark Mode' : 'Light Mode' : undefined}
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Dark Mode</span>}
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Light Mode</span>}
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      <main className={cn(
        "flex-1 transition-all duration-300 overflow-y-auto overflow-x-hidden",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="container mx-auto px-6 py-8 min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
