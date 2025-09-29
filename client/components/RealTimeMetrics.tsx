import { useRealTimeData } from "@/hooks/useRealTimeData";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Users,
  Shield,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Gauge,
} from "lucide-react";

interface RealTimeMetricsProps {
  className?: string;
}

export function RealTimeMetrics({ className }: RealTimeMetricsProps) {
  const { data, isConnected, error, refetch } = useRealTimeData({
    endpoint: "localhost:8080/api/real-time/stats",
    interval: 10000, // Update every 10 seconds
    enabled: true,
  });

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 10) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getSystemLoadColor = (load: number) => {
    if (load < 30) return "text-green-500";
    if (load < 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getSystemLoadVariant = (load: number) => {
    if (load < 30) return "default";
    if (load < 70) return "secondary";
    return "destructive";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Real-Time Metrics
            </CardTitle>
            <CardDescription>Live system activity and usage</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? "default" : "destructive"}
              className="text-xs"
            >
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="text-center py-4 text-destructive">
            <WifiOff className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.activeUsers}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.onlineAdmins}</p>
                  <p className="text-xs text-muted-foreground">Online Admins</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.recentLogins}</p>
                  <p className="text-xs text-muted-foreground">Recent Logins</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                  <Gauge className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p
                    className={`text-2xl font-bold ${getSystemLoadColor(data.systemLoad)}`}
                  >
                    {data.systemLoad}%
                  </p>
                  <p className="text-xs text-muted-foreground">System Load</p>
                </div>
              </div>
            </div>

            {/* System Load Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Performance</span>
                <Badge
                  variant={getSystemLoadVariant(data.systemLoad)}
                  className="text-xs"
                >
                  {data.systemLoad < 30
                    ? "Good"
                    : data.systemLoad < 70
                      ? "Moderate"
                      : "High"}
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    data.systemLoad < 30
                      ? "bg-green-500"
                      : data.systemLoad < 70
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(data.systemLoad, 100)}%` }}
                />
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-center text-xs text-muted-foreground pt-2 border-t">
              <Clock className="h-3 w-3 mr-1" />
              Last updated: {formatLastUpdated(data.lastUpdated)}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="w-8 h-8 bg-muted rounded-full" />
                    <div className="space-y-1">
                      <div className="h-6 w-12 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
