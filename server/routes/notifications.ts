import { RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  createRoleBasedNotification,
  createNotificationForAll,
} from "../db/notifications";
import { findUserById } from "../db/users";

export const handleGetNotifications: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const notifications = await getNotificationsForUser(req.user.id, req.user.role);
    const unreadCount = await getUnreadCount(req.user.id, req.user.role);

    // Convert timestamps to strings for JSON serialization
    const serializedNotifications = notifications.map((notification) => ({
      ...notification,
      timestamp: notification.timestamp.toISOString(),
      autoExpires: notification.autoExpires?.toISOString(),
    }));

    res.json({
      notifications: serializedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleMarkAsRead: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ error: "Notification ID is required" });
    }

    const success = await markNotificationAsRead(notificationId, req.user.id);

    if (!success) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const unreadCount = await getUnreadCount(req.user.id, req.user.role);

    res.json({
      message: "Notification marked as read",
      unreadCount,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleMarkAllAsRead: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const markedCount = await markAllNotificationsAsRead(req.user.id, req.user.role);

    res.json({
      message: `${markedCount} notifications marked as read`,
      markedCount,
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteNotification: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ error: "Notification ID is required" });
    }

    const success = await deleteNotification(notificationId);

    if (!success) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const unreadCount = await getUnreadCount(req.user.id, req.user.role);

    res.json({
      message: "Notification deleted",
      unreadCount,
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to trigger notifications when actions happen
export const triggerNotification = async (
  fromUserId: string,
  action: string,
  targetDetails?: {
    name?: string;
    id?: string;
    count?: number;
    details?: string;
  },
) => {
  try {
    const fromUser = await findUserById(fromUserId);
    if (!fromUser) {
      console.error("User not found for notification trigger:", fromUserId);
      return [];
    }

    const notifications = await createRoleBasedNotification(
      fromUserId,
      fromUser.name,
      fromUser.role,
      action,
      targetDetails,
    );

    console.log(
      `Created ${notifications.length} notifications for action: ${action}`,
    );
    return notifications;
  } catch (error) {
    console.error("Error triggering notification:", error);
    return [];
  }
};

export const handleTestNotification: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { action, targetName } = req.body;

    const notifications = await triggerNotification(
      req.user.id,
      action || "create_user",
      { name: targetName || "Test User" },
    );

    res.json({
      message: "Test notification triggered",
      notifications: notifications?.length || 0,
    });
  } catch (error) {
    console.error("Test notification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
