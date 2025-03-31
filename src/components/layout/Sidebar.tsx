
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  ListTodo, 
  Moon, 
  Settings,
  Sun, 
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/contexts/AccountContext';
import AccountSelector from '@/components/accounts/AccountSelector';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { selectedAccount } = useAccounts();
  const location = useLocation();

  const navItems = [
    {
      title: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      path: '/',
    },
    {
      title: 'Calendar',
      icon: <Calendar className="h-5 w-5" />,
      path: '/calendar',
    },
    {
      title: 'Trades',
      icon: <ListTodo className="h-5 w-5" />,
      path: '/trades',
    },
    {
      title: 'Journal',
      icon: <BookOpen className="h-5 w-5" />,
      path: '/journal',
    },
    {
      title: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/analytics',
    },
    {
      title: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      path: '/settings',
    },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-background h-screen transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 h-16 border-b">
        {!collapsed && (
          <h1 className="text-xl font-bold truncate">Trading Journal</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('ml-auto')}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {!collapsed && (
        <div className="p-4 border-b">
          <AccountSelector />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center py-2 px-3 rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted',
                  collapsed ? 'justify-center' : 'justify-start space-x-3'
                )
              }
            >
              {item.icon}
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t flex flex-col gap-2">
        <Button
          variant="outline"
          size={collapsed ? 'icon' : 'default'}
          onClick={toggleTheme}
          className="w-full"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-5 w-5" />
              {!collapsed && <span className="ml-2">Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="h-5 w-5" />
              {!collapsed && <span className="ml-2">Dark Mode</span>}
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          size={collapsed ? 'icon' : 'default'}
          onClick={handleLogout}
          className="w-full"
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          ) : (
            <span>Logout</span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
