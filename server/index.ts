import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleLogout, handleVerifyToken } from "./routes/auth";
import {
  handleGetAllUsers,
  handleGetSubAdmins,
  handleCreateSubAdmin,
  handleUpdateSubAdmin,
  handleDeleteSubAdmin,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
} from "./routes/users";
import {
  handleGetDashboardStats,
  handleGetAuditLogs,
} from "./routes/dashboard";
import {
  handleGetNotifications,
  handleMarkAsRead,
  handleMarkAllAsRead,
  handleDeleteNotification,
  handleTestNotification
} from "./routes/notifications";
import {
  authenticateToken,
  requireRole,
  requirePermission,
} from "./middleware/auth";
import { initializeDefaultAdmin } from "./db/users";

export function createServer() {
  const app = express();

  // Initialize default admin user
  initializeDefaultAdmin();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", authenticateToken, handleLogout);
  app.get("/api/auth/verify", authenticateToken, handleVerifyToken);

  // Dashboard routes
  app.get(
    "/api/dashboard/stats",
    authenticateToken,
    requirePermission("view_analytics"),
    handleGetDashboardStats,
  );
  app.get(
    "/api/dashboard/audit-logs",
    authenticateToken,
    requirePermission("view_audit_logs"),
    handleGetAuditLogs,
  );

  // User management routes
  app.get(
    "/api/users",
    authenticateToken,
    requirePermission("view_all_users"),
    handleGetAllUsers,
  );
  app.post(
    "/api/users",
    authenticateToken,
    requirePermission("edit_user"),
    handleCreateUser,
  );
  app.put(
    "/api/users/:id",
    authenticateToken,
    requirePermission("edit_user"),
    handleUpdateUser,
  );
  app.delete(
    "/api/users/:id",
    authenticateToken,
    requirePermission("delete_user"),
    handleDeleteUser,
  );

  // Sub-admin management routes
  app.get(
    "/api/sub-admins",
    authenticateToken,
    requirePermission("create_sub_admin"),
    handleGetSubAdmins,
  );
  app.post(
    "/api/sub-admins",
    authenticateToken,
    requirePermission("create_sub_admin"),
    handleCreateSubAdmin,
  );
  app.put(
    "/api/sub-admins/:id",
    authenticateToken,
    requirePermission("edit_sub_admin"),
    handleUpdateSubAdmin,
  );
  app.delete(
    "/api/sub-admins/:id",
    authenticateToken,
    requirePermission("delete_sub_admin"),
    handleDeleteSubAdmin,
  );

  // Notification routes
  app.get("/api/notifications", authenticateToken, handleGetNotifications);
  app.put("/api/notifications/:notificationId/read", authenticateToken, handleMarkAsRead);
  app.put("/api/notifications/mark-all-read", authenticateToken, handleMarkAllAsRead);
  app.delete("/api/notifications/:notificationId", authenticateToken, handleDeleteNotification);
  app.post("/api/notifications/test", authenticateToken, handleTestNotification);

  return app;
}
