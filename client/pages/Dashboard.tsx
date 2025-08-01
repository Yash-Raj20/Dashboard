import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardStats } from "@shared/auth";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RealTimeMetrics } from "@/components/RealTimeMetrics";
import { CreateNotification } from "@/components/CreateNotification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  UserCog,
  Activity,
  TrendingUp,
  Clock,
  Shield,
  Plus,
  Eye,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "login":
        return "default";
      case "logout":
        return "secondary";
      case "create_sub_admin":
      case "create_user":
        return "default";
      case "update_sub_admin":
      case "update_user":
        return "secondary";
      case "delete_sub_admin":
      case "delete_user":
        return "destructive";
      default:
        return "outline";
    }
  };

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    action,
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: { value: number; isPositive: boolean };
    action?: { label: string; href: string };
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <div
              className={cn(
                "flex items-center text-xs",
                trend.isPositive ? "text-green-600" : "text-red-600",
              )}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend.value}%
            </div>
          )}
        </div>
        {action && (
          <Button asChild size="sm" variant="outline" className="w-full mt-3">
            <Link to={action.href}>{action.label}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}. Here's what's happening in your Janseva
              portal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              <Shield className="h-3 w-3 mr-1" />
              {user?.role.replace("-", " ")}
            </Badge>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}.{" "}
              <Button
                variant="link"
                onClick={fetchDashboardStats}
                className="p-0 h-auto"
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[60px] mb-2" />
                  <Skeleton className="h-4 w-[120px]" />
                </CardContent>
              </Card>
            ))
          ) : stats ? (
            <>
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                description="Registered users"
                icon={Users}
                action={
                  hasPermission("view_all_users")
                    ? { label: "View Users", href: "/dashboard/users" }
                    : undefined
                }
              />
              <StatCard
                title="Sub-Admins"
                value={stats.totalSubAdmins}
                description="Active sub-administrators"
                icon={UserCog}
                action={
                  hasPermission("create_sub_admin")
                    ? {
                        label: "Manage Sub-Admins",
                        href: "/dashboard/sub-admins",
                      }
                    : undefined
                }
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers}
                description="Currently active accounts"
                icon={Activity}
              />
              <StatCard
                title="Today's Logins"
                value={stats.todayLogins}
                description="Login sessions today"
                icon={Clock}
              />
            </>
          ) : null}
        </div>

        {/* Real-Time Metrics */}
        <RealTimeMetrics />

        {/* Create Notification - Only for Main Admin */}
        {user?.role === "main-admin" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Send Notification</h2>
            <CreateNotification />
          </div>
        )}

        {/* Quick Actions */}
        {hasPermission("create_sub_admin") && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/dashboard/sub-admins">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sub-Admin
                  </Link>
                </Button>
                {hasPermission("view_all_users") && (
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/users">
                      <Eye className="h-4 w-4 mr-2" />
                      View All Users
                    </Link>
                  </Button>
                )}
                {hasPermission("view_audit_logs") && (
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/audit-logs">
                      <Activity className="h-4 w-4 mr-2" />
                      View Audit Logs
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions performed by administrators
              </CardDescription>
            </div>
            {hasPermission("view_audit_logs") && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/audit-logs">View All</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-6 w-[80px]" />
                  </div>
                ))}
              </div>
            ) : stats?.recentActions && stats.recentActions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <Activity className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {action.userName} • {action.action.replace("_", " ")}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(action.timestamp)}
                          </p>
                          {action.target && (
                            <Badge variant="outline" className="text-xs">
                              {action.target}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={getActionBadgeVariant(action.action)}
                      className="text-xs"
                    >
                      {action.action.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
