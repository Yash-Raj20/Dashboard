import { useState, useEffect } from 'react';
import { AuthAuditLog } from '@shared/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Activity,
  Shield,
  Calendar,
  User,
  RefreshCw,
  Filter
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuthAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(100);
  const [offset] = useState(0);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`/api/dashboard/audit-logs?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view audit logs.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch audit logs (${response.status})`);
        }
      }

      const data = await response.json();
      setLogs(data.logs);
    } catch (err) {
      console.error('Audit logs fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'login':
        return 'default';
      case 'logout':
        return 'secondary';
      case 'create_sub_admin':
      case 'create_user':
        return 'default';
      case 'update_sub_admin':
      case 'update_user':
        return 'secondary';
      case 'delete_sub_admin':
      case 'delete_user':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'main-admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'sub-admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track all administrative actions and system events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchAuditLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
              <p className="text-xs text-muted-foreground">Logged actions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => {
                  const logDate = new Date(log.timestamp);
                  const now = new Date();
                  const diffHours = Math.abs(now.getTime() - logDate.getTime()) / 36e5;
                  return diffHours <= 24;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(logs.filter(log => log.userRole !== 'user').map(log => log.userId)).size}
              </div>
              <p className="text-xs text-muted-foreground">Unique administrators</p>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}. <Button variant="link" onClick={fetchAuditLogs} className="p-0 h-auto">
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Chronological record of all administrative actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[300px]" />
                      <Skeleton className="h-3 w-[200px]" />
                    </div>
                    <Skeleton className="h-6 w-[100px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No audit logs found</p>
                <p className="text-sm">System events will appear here as they occur</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-mono">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-3 w-3 text-primary-foreground" />
                          </div>
                          <span className="font-medium">{log.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getRoleColor(log.userRole)}
                        >
                          {log.userRole.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.target && (
                            <div className="flex items-center space-x-1">
                              <span className="text-muted-foreground">{log.target}</span>
                              {log.targetId && (
                                <span className="font-mono text-xs bg-muted px-1 rounded">
                                  {log.targetId.slice(-8)}
                                </span>
                              )}
                            </div>
                          )}
                          {log.details && typeof log.details === 'object' && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {log.details.email && `Email: ${log.details.email}`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono text-muted-foreground">
                          {log.ipAddress || 'N/A'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
