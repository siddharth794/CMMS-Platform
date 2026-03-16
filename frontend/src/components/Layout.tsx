// @ts-nocheck
import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import {
  LayoutDashboard, ClipboardList, Box, Calendar, BarChart3, Settings,
  LogOut, Menu, Sun, Moon, Bell, Search, User, Building2, ChevronDown, Package, Shield, Lock, Users, MapPin
} from 'lucide-react';

const Sidebar = ({ className = '' }) => {
  const location = useLocation();
  const { user, isTechnician, hasRole, isAdmin } = useAuth();
  const isTech = isTechnician();
  const isRestricted = hasRole(['technician', 'requestor']);

  const navigation = [
    { name: isTech ? 'My Dashboard' : 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Work Orders', href: '/work-orders', icon: ClipboardList, hideFromRequester: true },
    { name: 'Assets', href: '/assets', icon: Box, hideFromRequester: true },
    { name: 'Inventory', href: '/inventory', icon: Package, hideFromRequester: true },
    { name: 'PM Schedules', href: '/pm-schedules', icon: Calendar, managerOnly: true },
    
    { name: 'Organizations', href: '/organizations', icon: Building2, superAdminOnly: true },
    { name: 'Sites', href: '/sites', icon: MapPin, adminOnly: true },
    { name: 'Roles', href: '/roles', icon: Shield, adminOnly: true },
    { name: 'Groups', href: '/groups', icon: Users, adminOnly: true },
    { name: 'Accesses', href: '/accesses', icon: Lock, superAdminOnly: true },
    { name: 'Users', href: '/users', icon: User, adminOnly: true },

    { name: isTech ? 'My Analytics' : 'Analytics', href: '/analytics', icon: BarChart3, hideFromRequester: true },
    { name: 'Profile', href: '/profile', icon: User },
  ].filter(item => {
    if (item.superAdminOnly && !hasRole(['super_admin'])) return false;
    if (item.adminOnly && !isAdmin()) return false;
    if (item.managerOnly && isRestricted) return false;
    if (item.hideFromRequester && hasRole(['requestor', 'requester'])) return false;
    return true;
  });

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">{user?.Organization?.name || user?.organization?.name || 'FMS'}</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground'}`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role?.name?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotification();
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => {
    const orgName = user?.Organization?.name || user?.organization?.name;
    if (orgName) {
      document.title = `${orgName} | FMS`;
    }
  }, [user]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-card lg:block">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" data-testid="mobile-menu-btn">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 rounded-lg border bg-background px-3 py-2 w-80">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                data-testid="search-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-btn">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <DropdownMenuLabel className="p-0 font-medium">Notifications</DropdownMenuLabel>
                  {notifications.length > 0 && (
                    <div className="flex gap-2">
                      <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">Mark all read</button>
                      <button onClick={clearAll} className="text-xs text-destructive hover:underline">Clear</button>
                    </div>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex flex-col gap-1 p-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-sm ${!notification.read ? 'font-medium' : 'text-muted-foreground'}`}>
                              {notification.message}
                            </span>
                            {!notification.read && (
                              <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-btn">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm">{user?.first_name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.first_name} {user?.last_name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer" data-testid="logout-btn">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
