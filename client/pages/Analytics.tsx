import { useState, useEffect } from "react";
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
import {
  AnalyticsFilterBar,
  AnalyticsFilters,
} from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  Users,
  UserCog,
  Activity,
  Clock,
  Calendar,
  Shield,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Analytics() {
  const { logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  // Sample data for charts
  const userGrowthData = [
    { month: "Jan", users: 12, admins: 2 },
    { month: "Feb", users: 19, admins: 3 },
    { month: "Mar", users: 25, admins: 3 },
    { month: "Apr", users: 32, admins: 4 },
    { month: "May", users: 45, admins: 5 },
    { month: "Jun", users: 58, admins: 6 },
  ];

  const loginActivityData = [
    { day: "Mon", logins: 24 },
    { day: "Tue", logins: 31 },
    { day: "Wed", logins: 18 },
    { day: "Thu", logins: 42 },
    { day: "Fri", logins: 56 },
    { day: "Sat", logins: 23 },
    { day: "Sun", logins: 15 },
  ];

  const roleDistributionData = [
    { name: "Users", value: 45, color: "#8884d8" },
    { name: "Sub-Admins", value: 6, color: "#82ca9d" },
    { name: "Main Admins", value: 1, color: "#ffc658" },
  ];

  const activityTrendsData = [
    { time: "00:00", activity: 5 },
    { time: "04:00", activity: 2 },
    { time: "08:00", activity: 15 },
    { time: "12:00", activity: 25 },
    { time: "16:00", activity: 30 },
    { time: "20:00", activity: 18 },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      setLoading(!isRefresh);
      setError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Authentication failed - clear tokens and redirect to login
          localStorage.removeItem("auth_token");
          logout();
          throw new Error("Session expired. Please log in again.");
        } else if (response.status === 403) {
          throw new Error(
            "Access denied. You do not have permission to view analytics.",
          );
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Failed to fetch analytics data (${response.status})`,
          );
        }
      }

      const data = await response.json();
      setStats(data);

      // Update role distribution with real data
      if (data) {
        roleDistributionData[0].value = data.totalUsers || 45;
        roleDistributionData[1].value = data.totalSubAdmins || 6;
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  const exportData = (format: "csv" | "pdf") => {
    // Mock export functionality
    const data = {
      totalUsers: stats?.totalUsers || 0,
      totalSubAdmins: stats?.totalSubAdmins || 0,
      activeUsers: stats?.activeUsers || 0,
      todayLogins: stats?.todayLogins || 0,
      exportDate: new Date().toISOString(),
    };

    if (format === "csv") {
      const csvContent = Object.entries(data)
        .map(([key, value]) => `${key},${value}`)
        .join("\\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // PDF export would require a library like jsPDF
      alert("PDF export functionality would be implemented with jsPDF library");
    }
  };

  const MetricCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div
            className={`flex items-center mt-2 text-xs ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend.isPositive ? "+" : ""}
            {trend.value}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              📊 Advanced Analytics
            </h1>
            <p className="text-muted-foreground">
              Interactive insights and metrics for your admin portal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => exportData("csv")}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportData("pdf")}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <Card>
          <CardContent className="pt-6">
            <AnalyticsFilterBar
              filters={filters}
              onFiltersChange={setFilters}
            />
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}.{" "}
              <button
                onClick={() => fetchAnalytics()}
                className="underline hover:no-underline"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
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
              <MetricCard
                title="Total Users"
                value={stats.totalUsers}
                description="Registered users in system"
                icon={Users}
                trend={{ value: 12, isPositive: true }}
              />
              <MetricCard
                title="Sub-Admins"
                value={stats.totalSubAdmins}
                description="Active administrators"
                icon={UserCog}
                trend={{ value: 8, isPositive: true }}
              />
              <MetricCard
                title="Active Accounts"
                value={stats.activeUsers}
                description="Currently active users"
                icon={Activity}
                trend={{ value: 3, isPositive: true }}
              />
              <MetricCard
                title="Today's Logins"
                value={stats.todayLogins}
                description="Login sessions today"
                icon={Clock}
                trend={{ value: 15, isPositive: true }}
              />
            </>
          ) : null}
        </div>

        {/* Interactive Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                User Growth Trends
              </CardTitle>
              <CardDescription>
                User and admin registration trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="admins"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Admins"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Login Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Weekly Login Activity
              </CardTitle>
              <CardDescription>Daily login patterns this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={loginActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="logins"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Role Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Role Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of user roles in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {roleDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activity Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                24-Hour Activity Trends
              </CardTitle>
              <CardDescription>Hourly activity patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="activity"
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity Summary
            </CardTitle>
            <CardDescription>
              Latest administrative actions with trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentActions && stats.recentActions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActions.slice(0, 5).map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {action.userName} • {action.action.replace("_", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(action.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
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
