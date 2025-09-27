import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  UserCog,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  ScrollText,
  BookAIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      permission: "view_analytics",
    },
    {
      label: "User's Problems",
      href: "/dashboard/users-problems",
      icon: ScrollText,
      permission: "view_users_problems",
    },
    {
      label: "High Priority Problems",
      href: "/dashboard/high-priority-problems",
      icon: BookAIcon,
      permission: "view_high_priority_problems",
    },
    {
      label: "Sub-Admins",
      href: "/dashboard/sub-admins",
      icon: UserCog,
      permission: "create_sub_admin",
    },
    {
      label: "Users",
      href: "/dashboard/users",
      icon: Users,
      permission: "view_all_users",
    },
    {
      label: "DreamWalls",
      href: "/dashboard/dreamwalls",
      icon: Users,
      permission: "upload_dreamwalls",
    },
    {
      label: "Audit Logs",
      href: "/dashboard/audit-logs",
      icon: FileText,
      permission: "view_audit_logs",
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      permission: "edit_profile",
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission as any),
  );

  const Sidebar = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex flex-col items-center pt-4">
        <img
          src="/public/logo.png"
          alt="logo"
          className="h-12 w-12 rounded-full"
        />
        <span className="font-bold text-lg">Janseva Portal</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-md font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative border rounded-l-3xl shadow-accent">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b lg:px-6">
          <div className="flex items-center gap-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            <div>
              <h1 className="text-lg font-semibold">
                {navItems.find((item) => item.href === location.pathname)
                  ?.label || "Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm text-muted-foreground">
              Role:{" "}
              <span className="font-medium capitalize">
                {user?.role.replace("-", " ")}
              </span>
            </div>

            <NotificationCenter />
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={user?.name} />
                    <AvatarFallback>
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
