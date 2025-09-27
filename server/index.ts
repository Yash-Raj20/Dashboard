import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";

import { initializeDefaultAdmin } from "./db/users.js";
import { authenticateToken } from "./middleware/auth.js";

import {
  handleLogin,
  handleLogout,
  handleProfile,
  handleRefreshToken,
} from "./routes/auth.js";

import {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  handleGetSubAdmins,
  handleCreateSubAdmin,
  handleUpdateSubAdmin,
  handleDeleteSubAdmin,
} from "./routes/users.js";

import {
  handleGetNotifications,
  handleMarkAsRead,
  handleMarkAllAsRead,
  handleDeleteNotification,
  handleTestNotification,
  handleCreateNotification,
} from "./routes/notifications.js";

import {
  handleGetAnalytics,
  handleGetMetrics,
  handleGetChartData,
  handleGetAuditLogs,
} from "./routes/dashboard.js";

import wallpaperRoutes from "./routes/wallpaperRoutes/wallpaperRoutes.js"

// Load environment
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createServer() {
  const app = express();

  // Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not defined in .env");
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");

  // Create default admin
  await initializeDefaultAdmin();

  app.use(
    cors({
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );
  app.use(express.json());

  app.use("/api", (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    // console.log(`API Request: ${req.method} ${req.path}`);
    next();
  });

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  });

  app.get("/api/debug/admin", async (req, res) => {
    try {
      const { findUserByEmail } = await import("./db/users.js");
      const user = await findUserByEmail("ratnesh@gmail.com");
      res.json({
        adminExists: !!user,
        adminEmail: user?.email,
        adminActive: user?.isActive,
        defaultCredentials: {
          email: "ratnesh@gmail.com",
          password: "Admin@123",
        },
      });
    } catch {
      res.status(500).json({ error: "Failed to check admin user" });
    }
  });

  //WallPaper Routes
  app.use('/api/wallpapers', wallpaperRoutes);

  // Auth Routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", authenticateToken, handleLogout);
  app.get("/api/auth/profile", authenticateToken, handleProfile);
  app.get("/api/auth/verify", authenticateToken, handleProfile);
  app.post("/api/auth/refresh", handleRefreshToken);

  // Users
  app.get("/api/users", authenticateToken, handleGetUsers);
  app.post("/api/users", authenticateToken, handleCreateUser);
  app.put("/api/users/:userId", authenticateToken, handleUpdateUser);
  app.delete("/api/users/:userId", authenticateToken, handleDeleteUser);
  app.get("/api/users/sub-admins", authenticateToken, handleGetSubAdmins);
  app.get("/api/sub-admins", authenticateToken, handleGetSubAdmins);
  app.post("/api/sub-admins", authenticateToken, handleCreateSubAdmin);
  app.put("/api/sub-admins/:id", authenticateToken, handleUpdateSubAdmin);
  app.delete("/api/sub-admins/:id", authenticateToken, handleDeleteSubAdmin);

  // Dashboard
  app.get("/api/dashboard/stats", authenticateToken, handleGetAnalytics);
  app.get("/api/dashboard/analytics", authenticateToken, handleGetAnalytics);
  app.get("/api/dashboard/metrics", authenticateToken, handleGetMetrics);
  app.get("/api/dashboard/chart-data", authenticateToken, handleGetChartData);
  app.get("/api/dashboard/audit-logs", authenticateToken, handleGetAuditLogs);

  // Notifications
  app.get("/api/notifications", authenticateToken, handleGetNotifications);
  app.post("/api/notifications", authenticateToken, handleCreateNotification);
  app.put("/api/notifications/:notificationId/read", authenticateToken, handleMarkAsRead);
  app.put("/api/notifications/mark-all-read", authenticateToken, handleMarkAllAsRead);
  app.delete("/api/notifications/:notificationId", authenticateToken, handleDeleteNotification);
  app.post("/api/notifications/test", authenticateToken, handleTestNotification);


  app.use((error, req, res, next) => {
    if (req.path.startsWith("/api/")) {
      console.error("API Error:", error);
      res.status(500).json({ error: "Internal server error" });
    } else {
      next(error);
    }
  });

  // Production SPA support
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(join(__dirname, "../spa")));
    app.get("*", (req, res) => {
      if (!req.path.match(/\.(js|css|png|jpg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        console.log(`Serving HTML for route: ${req.path}`);
      }
      res.sendFile(join(__dirname, "../spa/index.html"));
    });
  }

  return app;
}