import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import database connection
import { dbConnection } from "./db/connection.js";
import { initializeDefaultAdmin } from "./db/users.js";
import { setDatabaseMode } from "./db/adapter.js";

// Import authentication
import { authenticateToken } from "./middleware/auth.js";

// Import routes
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

import { handleDemoData } from "./routes/demo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200
  }));
  app.use(express.json());

  // Add explicit JSON response headers for API routes
  app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Request logging for API routes
  app.use('/api', (req, res, next) => {
    console.log(`API Request: ${req.method} ${req.path}`);
    next();
  });

  // Only serve static files in production
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    app.use(express.static(join(__dirname, "../spa")));
  }

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbConnection.getConnectionStatus()
        ? "connected"
        : "disconnected",
    });
  });

  // Simple test endpoint to verify API routing
  app.get("/api/test", (req, res) => {
    res.json({ message: "API routing is working", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", authenticateToken, handleLogout);
  app.get("/api/auth/profile", authenticateToken, handleProfile);
  app.get("/api/auth/verify", authenticateToken, handleProfile); // Alias for profile
  app.post("/api/auth/refresh", handleRefreshToken);

  // User management routes
  app.get("/api/users", authenticateToken, handleGetUsers);
  app.post("/api/users", authenticateToken, handleCreateUser);
  app.put("/api/users/:userId", authenticateToken, handleUpdateUser);
  app.delete("/api/users/:userId", authenticateToken, handleDeleteUser);
  app.get("/api/users/sub-admins", authenticateToken, handleGetSubAdmins);

  // Sub-admin specific routes
  app.get("/api/sub-admins", authenticateToken, handleGetSubAdmins);
  app.post("/api/sub-admins", authenticateToken, handleCreateSubAdmin);
  app.put("/api/sub-admins/:id", authenticateToken, handleUpdateSubAdmin);
  app.delete("/api/sub-admins/:id", authenticateToken, handleDeleteSubAdmin);

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, handleGetAnalytics);
  app.get("/api/dashboard/analytics", authenticateToken, handleGetAnalytics);
  app.get("/api/dashboard/metrics", authenticateToken, handleGetMetrics);
  app.get("/api/dashboard/chart-data", authenticateToken, handleGetChartData);
  app.get("/api/dashboard/audit-logs", authenticateToken, handleGetAuditLogs);

  // Notification routes
  app.get("/api/notifications", authenticateToken, handleGetNotifications);
  app.post("/api/notifications", authenticateToken, handleCreateNotification);
  app.put(
    "/api/notifications/:notificationId/read",
    authenticateToken,
    handleMarkAsRead,
  );
  app.put(
    "/api/notifications/mark-all-read",
    authenticateToken,
    handleMarkAllAsRead,
  );
  app.delete(
    "/api/notifications/:notificationId",
    authenticateToken,
    handleDeleteNotification,
  );
  app.post(
    "/api/notifications/test",
    authenticateToken,
    handleTestNotification,
  );

  // Demo data routes
  app.get("/api/demo/*", handleDemoData);

  // API error handler - catch any unhandled API routes
  app.use("/api/*", (req, res) => {
    console.error(`API route not found: ${req.method} ${req.path}`);
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Global error handler for API routes
  app.use((error: any, req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/')) {
      console.error('API Error:', error);
      res.status(500).json({ error: "Internal server error" });
    } else {
      next(error);
    }
  });

  // Catch all handler: send back React's index.html file for client-side routing
  app.get("*", (req, res) => {
    // Log any non-static file requests that hit this catch-all
    if (!req.path.match(/\.(js|css|png|jpg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      console.log(`Serving HTML for route: ${req.path}`);
    }
    res.sendFile(join(__dirname, "../spa/index.html"));
  });

  return app;
}

// Initialize database and start server
async function startServer() {
  try {
    // Get MongoDB URI from environment or use default
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/admin-dashboard";

    // Try to connect to MongoDB, but continue if it fails
    let usingMongoDB = false;
    try {
      await dbConnection.connect({ mongoUri });
      setDatabaseMode("mongodb");
      usingMongoDB = true;
      console.log("✅ Connected to MongoDB - using MongoDB storage");
    } catch (mongoError) {
      setDatabaseMode("memory");
      console.warn("⚠️ MongoDB connection failed, using in-memory storage");
      console.warn(
        "💡 To use MongoDB, make sure it's running on localhost:27017",
      );
      console.warn(
        "💡 Or start it with: docker run -d --name mongodb -p 27017:27017 mongo:latest",
      );
      console.warn("💡 Data will be lost when server restarts in memory mode");
    }

    // Initialize default admin user (works with both MongoDB and in-memory)
    await initializeDefaultAdmin();

    // Create and start server
    const app = createServer();
    const port = process.env.PORT || 3000;

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(
        `��� Database mode: ${usingMongoDB ? "MongoDB" : "In-Memory"}`,
      );
      console.log(`📱 Health check: http://localhost:${port}/health`);
      console.log(`🔗 Admin login: http://localhost:${port}`);
      console.log(`📧 Default admin: admin@example.com / Admin123!`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  await dbConnection.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  await dbConnection.disconnect();
  process.exit(0);
});

// Start the server if this file is executed directly
if (import.meta.url === `file://${__filename}`) {
  startServer();
}
