import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import database connection
import { dbConnection } from "./db/connection.js";
import { initializeDefaultAdmin } from "./db/users.js";

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
} from "./routes/dashboard.js";

import { handleDemoData } from "./routes/demo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Serve static files from the spa dist
  app.use(express.static(join(__dirname, "../spa")));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: dbConnection.getConnectionStatus() ? "connected" : "disconnected"
    });
  });

  // Auth routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", authenticateToken, handleLogout);
  app.get("/api/auth/profile", authenticateToken, handleProfile);
  app.post("/api/auth/refresh", handleRefreshToken);

  // User management routes
  app.get("/api/users", authenticateToken, handleGetUsers);
  app.post("/api/users", authenticateToken, handleCreateUser);
  app.put("/api/users/:userId", authenticateToken, handleUpdateUser);
  app.delete("/api/users/:userId", authenticateToken, handleDeleteUser);
  app.get("/api/users/sub-admins", authenticateToken, handleGetSubAdmins);

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, handleGetAnalytics);
  app.get("/api/dashboard/analytics", authenticateToken, handleGetAnalytics);
  app.get("/api/dashboard/metrics", authenticateToken, handleGetMetrics);
  app.get("/api/dashboard/chart-data", authenticateToken, handleGetChartData);

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

  // Catch all handler: send back React's index.html file for client-side routing
  app.get("*", (req, res) => {
    res.sendFile(join(__dirname, "../spa/index.html"));
  });

  return app;
}

// Initialize database and start server
async function startServer() {
  try {
    // Get MongoDB URI from environment or use default
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/admin-dashboard";
    
    // Connect to MongoDB
    await dbConnection.connect({ mongoUri });
    
    // Initialize default admin user
    await initializeDefaultAdmin();
    
    // Create and start server
    const app = createServer();
    const port = process.env.PORT || 3000;
    
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📱 Health check: http://localhost:${port}/health`);
    });
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await dbConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await dbConnection.disconnect();
  process.exit(0);
});

// Start the server if this file is executed directly
if (import.meta.url === `file://${__filename}`) {
  startServer();
}
