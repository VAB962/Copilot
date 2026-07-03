'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Code2,
  LayoutDashboard,
  GitBranch,
  Shield,
  FileText,
  Layers,
  BarChart3,
  MessageSquare,
  Settings,
  User,
  Bell,
  LogOut,
  ChevronLeft,
  Menu,
  Users,
  Activity,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/repositories', label: 'Repositories', icon: GitBranch },
  { href: '/dashboard/analysis', label: 'AI Analysis', icon: Activity },
  { href: '/dashboard/documentation', label: 'Documentation', icon: FileText },
  { href: '/dashboard/architecture', label: 'Architecture', icon: Layers },
  { href: '/dashboard/security', label: 'Security', icon: Shield },
  { href: '/dashboard/technical-debt', label: 'Technical Debt', icon: BarChart3 },
  { href: '/dashboard/chat', label: 'AI Chat', icon: MessageSquare },
];

const adminItems = [
  { href: '/admin', label: 'Admin Dashboard', icon: Users },
  { href: '/admin/users', label: 'Users', icon: User },
  { href: '/admin/analytics', label: 'Analytics', icon: Activity },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isAdmin = profile?.role === 'admin';
  const isTeamLead = profile?.role === 'team_lead';

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : profile?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary" />
            <span className="font-bold">CodePilot</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed top-16 left-0 bottom-0 w-72 bg-background border-r animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <ScrollArea className="h-full py-4">
              <nav className="space-y-1 px-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              {(isAdmin || isTeamLead) && (
                <>
                  <Separator className="my-4" />
                  <div className="px-3 py-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Admin
                    </span>
                  </div>
                  <nav className="space-y-1 px-3">
                    {adminItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </>
              )}
              <Separator className="my-4" />
              <nav className="space-y-1 px-3">
                <Link href="/dashboard/settings" className="sidebar-item" onClick={() => setMobileOpen(false)}>
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                <Link href="/dashboard/profile" className="sidebar-item" onClick={() => setMobileOpen(false)}>
                  <User className="w-5 h-5" />
                  Profile
                </Link>
                <button
                  onClick={() => signOut()}
                  className="sidebar-item w-full text-left text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </nav>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r bg-background transition-all duration-300 ${
          collapsed ? 'w-[70px]' : 'w-[280px]'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Code2 className="w-8 h-8 text-primary shrink-0" />
            {!collapsed && <span className="font-bold text-lg">CodePilot AI</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`sidebar-item ${pathname === item.href ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <item.icon className={`w-5 h-5 shrink-0 ${collapsed ? '' : ''}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="font-normal">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </nav>

          {(isAdmin || isTeamLead) && (
            <>
              <Separator className="my-4" />
              {!collapsed && (
                <div className="px-3 py-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </span>
                </div>
              )}
              <nav className="space-y-1 px-3">
                {adminItems.map((item) => (
                  <TooltipProvider key={item.href} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={`sidebar-item ${pathname === item.href ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                        </Link>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="font-normal">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </nav>
            </>
          )}
        </ScrollArea>

        {/* Bottom Section */}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full ${collapsed ? 'justify-center px-0 h-10 w-10 mx-auto' : 'justify-start'}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="ml-3 text-left flex-1">
                    <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? 'center' : 'end'} className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${collapsed ? 'lg:ml-[70px]' : 'lg:ml-[280px]'} pt-16 lg:pt-0`}>
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
