import { RequestHandler } from "express";
import { DashboardStats, AuthAuditLog } from "../../shared/auth.js";
import { getAllUsers } from "../db/users";
import { getAuditLogs, getRecentAuditLogs } from "../db/auditLogs";
import { AuthRequest } from "../middleware/auth";

export const handleGetAnalytics: RequestHandler = (
  req: AuthRequest,
  res,
) => {
  try {
    const users = getAllUsers();
    const recentLogs = getRecentAuditLogs(24);

    const totalUsers = users.filter((user) => user.role === "user").length;
    const totalSubAdmins = users.filter(
      (user) => user.role === "sub-admin",
    ).length;
    const activeUsers = users.filter((user) => user.isActive).length;

    // Count logins today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogins = recentLogs.filter(
      (log) => log.action === "login" && log.timestamp >= today,
    ).length;

    // Get recent actions (last 10)
    const recentActions: AuthAuditLog[] = recentLogs
      .slice(0, 10)
      .map((log) => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      }));

    const stats: DashboardStats = {
      totalUsers,
      totalSubAdmins,
      activeUsers,
      todayLogins,
      recentActions,
    };

    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetAuditLogs: RequestHandler = (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = getAuditLogs(limit, offset);
    const authLogs: AuthAuditLog[] = logs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));

    res.json({ logs: authLogs, total: logs.length });
  } catch (error) {
    console.error("Audit logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetMetrics: RequestHandler = (req: AuthRequest, res) => {
  // Delegate to analytics for now
  handleGetAnalytics(req, res);
};

export const handleGetChartData: RequestHandler = (req: AuthRequest, res) => {
  // Delegate to analytics for now
  handleGetAnalytics(req, res);
};
