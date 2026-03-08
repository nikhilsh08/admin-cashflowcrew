import React, { useState, createContext, useContext } from 'react';
import {
  Users,
  LayoutDashboard,
  BookOpen,
  Settings,
  LogOut,
  User,
  ChevronsUpDown,
  Plus,
  Command,
  Frame,
  PieChart,
  Map,
  BarChart3,
  Menu,
  ChevronLeft,
  ChevronRight,
  BadgeDollarSign,
  Images,
  FileText,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useLocation } from 'react-router-dom';

// Sidebar Context
export interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: (_collapsed: boolean) => { }
});

// Sidebar Provider Component - NEW
interface SidebarProviderProps {
  children: React.ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Types
interface AdminUser {
  name?: string;
  email?: string;
  isAdmin?: boolean;
}

// Sidebar Navigation Items
const navMain = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Users Management",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Masterclasses",
    url: "/admin/masterclasses",
    icon: BookOpen,
  },
  {
    title: "Coupons",
    url: "/admin/coupons",
    icon: BadgeDollarSign,
  },
  {
    title: "Categories",
    url: "/admin/categories",
    icon: Frame, // Using Frame icon as a placeholder for Categories
  },
  {
    title: "Images",
    url: "/admin/images",
    icon: Images,
  },
  {
    title: "Blogs",
    url: "/admin/blogs",
    icon: FileText,
  },
];

const projects = [
  {
    name: "Mutual Funds Masterclass",
    url: "/admin/projects/mutual-funds",
    icon: Frame,
  },
  {
    name: "Risk Analysis Workshop",
    url: "/admin/projects/risk-analysis",
    icon: PieChart,
  },
  {
    name: "Portfolio Management",
    url: "/admin/projects/portfolio",
    icon: Map,
  },
  {
    name: "Trading Fundamentals",
    url: "/admin/projects/trading",
    icon: BarChart3,
  },
];

// Sidebar Content Component
interface SidebarContentProps {
  user?: AdminUser;
  onLogout?: () => void;
  onNavigate?: (url: string) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

const SidebarContent = ({ user, onLogout, onNavigate, onClose, isMobile = false }: SidebarContentProps) => {
  const { collapsed, setCollapsed } = useContext(SidebarContext);
  const location = useLocation();
  const [activeTeam] = useState({
    name: "CashFlow Crew",
    logo: Command,
    plan: "Enterprise",
  });

  interface HandleNavigationProps {
    url: string;
  }

  const handleNavigation = (url: HandleNavigationProps['url']) => {
    if (onNavigate) {
      onNavigate(url);
    }
    if (onClose) {
      onClose();
    }
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  console.log('collapsed sidebar:', collapsed);

  return (
    <div className={`flex flex-col h-full bg-slate-50 border-r border-slate-200 transition-all duration-300 ease-in-out ${!isMobile && collapsed ? 'w-16' : 'w-full'
      }`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          {(!collapsed || isMobile) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="flex-1 cursor-pointer justify-start gap-3 h-12 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-blue-600">
                    <activeTeam.logo className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                    <span className="truncate font-semibold">
                      {activeTeam.name}
                    </span>
                    <span className="truncate text-xs text-blue-100">
                      {activeTeam.plan}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg mt-2"
                align="start"
                side="bottom"
              >
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <activeTeam.logo className="size-4 shrink-0" />
                  </div>
                  {activeTeam.name}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {collapsed && !isMobile && (
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white mx-auto">
              <activeTeam.logo className="size-4" />
            </div>
          )}

          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className={`h-8 w-8 flex-shrink-0 hover:bg-slate-200 ${collapsed ? 'mx-auto mt-2' : 'ml-2'}`}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Platform Navigation */}
          <div>
            {(!collapsed || isMobile) && (
              <h4 className="mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Platform
              </h4>
            )}
            <nav className="space-y-1">
              {navMain.map((item) => (
                <div key={item.title} className="relative group">
                  <Button
                    variant={location.pathname === item.url ? "secondary" : "ghost"}
                    className={`w-full h-10 transition-all duration-200 ${collapsed && !isMobile
                      ? 'justify-center px-2'
                      : 'justify-start gap-3 px-3'
                      } ${location.pathname === item.url
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    onClick={() => handleNavigation(item.url)}
                  >
                    <item.icon className="size-4 flex-shrink-0" />
                    {(!collapsed || isMobile) && (
                      <span className="truncate">{item.title}</span>
                    )}
                  </Button>
                  {/* Tooltip for collapsed state */}
                  {collapsed && !isMobile && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                      {item.title}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Projects */}
          <div className='hidden'>
            {(!collapsed || isMobile) && (
              <h4 className="mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Active Projects
              </h4>
            )}
            <nav className="space-y-1 hidden">
              {projects.map((item) => (
                <div key={item.name} className="relative group">
                  <Button
                    variant="ghost"
                    className={`w-full h-10 transition-all duration-200 text-slate-700 hover:bg-slate-100 ${collapsed && !isMobile
                      ? 'justify-center px-2'
                      : 'justify-start gap-3 px-3'
                      }`}
                    onClick={() => handleNavigation(item.url)}
                  >
                    <item.icon className="size-4 flex-shrink-0" />
                    {(!collapsed || isMobile) && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </Button>
                  {/* Tooltip for collapsed state */}
                  {collapsed && !isMobile && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </div>
              ))}
              <div className="relative group">
                <Button
                  variant="ghost"
                  className={`w-full h-10 text-slate-500 hover:bg-slate-100 transition-all duration-200 ${collapsed && !isMobile
                    ? 'justify-center px-2'
                    : 'justify-start gap-3 px-3'
                    }`}
                >
                  <Plus className="size-4 flex-shrink-0" />
                  {(!collapsed || isMobile) && (
                    <span>Add Project</span>
                  )}
                </Button>
                {/* Tooltip for collapsed state */}
                {collapsed && !isMobile && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                    Add Project
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        {(!collapsed || isMobile) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-3 hover:bg-slate-100"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${user?.email || 'admin'}.png`}
                    alt={user?.name || 'Admin User'}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {user?.name ? user.name.split(' ').map((n: any) => n[0]).join('').toUpperCase() : 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                  <span className="truncate font-semibold text-slate-900">
                    {user?.name || 'Admin User'}
                  </span>
                  <span className="truncate text-xs text-slate-500">
                    {user?.email || 'admin@cashflowcrew.com'}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 flex-shrink-0 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-lg mb-2"
              side="top"
              align="end"
            >
              <DropdownMenuItem onClick={() => handleNavigation('/admin/profile')}>
                <User className="size-4 mr-2" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigation('/admin/settings')}>
                <Settings className="size-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="size-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {collapsed && !isMobile && (
          <div className="relative group">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center p-2 h-12 hover:bg-slate-100"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${user?.email || 'admin'}.png`}
                      alt={user?.name || 'Admin User'}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg mb-2"
                side="right"
                align="end"
              >
                <div className="px-2 py-1.5 text-sm font-medium text-slate-900">
                  {user?.name || 'Admin User'}
                </div>
                <div className="px-2 py-1.5 text-xs text-slate-500">
                  {user?.email || 'admin@cashflowcrew.com'}
                </div>
                <DropdownMenuItem onClick={() => handleNavigation('/admin/profile')}>
                  <User className="size-4 mr-2" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/admin/settings')}>
                  <Settings className="size-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="size-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};

// Mobile Sidebar Component
interface MobileSidebarProps {
  user?: AdminUser;
  onLogout?: () => void;
  onNavigate?: (url: string) => void;
}

export const MobileSidebar = ({ user, onLogout, onNavigate }: MobileSidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SidebarContent
          user={user}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onClose={() => setOpen(false)}
          isMobile={true}
        />
      </SheetContent>
    </Sheet>
  );
};

// Desktop Sidebar Component - MODIFIED
interface DesktopSidebarProps {
  user?: AdminUser;
  onLogout?: () => void;
  onNavigate?: (url: string) => void;
}

export const DesktopSidebar = ({ user, onLogout, onNavigate }: DesktopSidebarProps) => {
  const { collapsed } = useContext(SidebarContext);

  return (
    <div className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ease-in-out ${collapsed ? 'md:w-28' : 'md:w-64'
      }`}>
      <SidebarContent
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export const useSidebar = () => useContext(SidebarContext);