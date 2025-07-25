import { Role } from "../../../shared/auth.js";
import { NotificationData, NOTIFICATION_RULES } from "../notifications.js";

// In-memory notifications storage
const memoryNotifications: NotificationData[] = [];

export function createNotificationMemory(
  data: Omit<NotificationData, "id" | "timestamp" | "read">,
): NotificationData {
  const notification: NotificationData = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    timestamp: new Date(),
    read: false,
  };

  memoryNotifications.unshift(notification); // Add to beginning

  // Keep only last 100 notifications
  if (memoryNotifications.length > 100) {
    memoryNotifications.splice(100);
  }

  return notification;
}

export function createRoleBasedNotificationMemory(
  fromUserId: string,
  fromUserName: string,
  fromUserRole: Role,
  action: string,
  targetDetails?: {
    name?: string;
    id?: string;
    count?: number;
    details?: string;
  },
): NotificationData[] {
  const createdNotifications: NotificationData[] = [];
  let rule: any = null;

  // Determine which rule to apply based on role and action
  if (
    fromUserRole === "main-admin" &&
    NOTIFICATION_RULES.MAIN_ADMIN_ACTIONS[action]
  ) {
    rule = NOTIFICATION_RULES.MAIN_ADMIN_ACTIONS[action];
  } else if (
    fromUserRole === "sub-admin" &&
    NOTIFICATION_RULES.SUB_ADMIN_ACTIONS[action]
  ) {
    rule = NOTIFICATION_RULES.SUB_ADMIN_ACTIONS[action];
  }

  if (!rule) {
    return []; // No rule found for this action
  }

  // Generate notification content using template
  const content = rule.template(
    fromUserName,
    targetDetails?.name,
    targetDetails?.count,
    targetDetails?.details,
  );

  // Create notification for each target role
  for (const targetRole of rule.notifyRoles) {
    const notification = createNotificationMemory({
      targetRole: targetRole,
      fromUserId,
      fromUserName,
      fromUserRole,
      type: content.type,
      title: content.title,
      message: content.message,
      action,
      targetResource: targetDetails?.name ? "user" : undefined,
      targetResourceId: targetDetails?.id,
      priority: rule.priority,
    });

    createdNotifications.push(notification);
  }

  return createdNotifications;
}

export function createNotificationForAllMemory(
  fromUserId: string,
  fromUserName: string,
  fromUserRole: Role,
  title: string,
  message: string,
  type: "info" | "warning" | "success" | "error" = "info",
  priority: "low" | "medium" | "high" | "urgent" = "medium",
): NotificationData[] {
  const createdNotifications: NotificationData[] = [];
  const allRoles: Role[] = ["main-admin", "sub-admin", "user"];

  // Create notification for each role
  for (const targetRole of allRoles) {
    const notification = createNotificationMemory({
      targetRole: targetRole,
      fromUserId,
      fromUserName,
      fromUserRole,
      type,
      title,
      message,
      action: "broadcast_message",
      priority,
    });

    createdNotifications.push(notification);
  }

  return createdNotifications;
}

export function getNotificationsForUserMemory(
  userId: string,
  userRole: Role,
  limit: number = 50,
): NotificationData[] {
  return memoryNotifications
    .filter((notification) => {
      // Check if notification is targeted to this user specifically
      if (notification.targetUserId === userId) {
        return true;
      }

      // Check if notification is targeted to this user's role
      if (notification.targetRole) {
        if (Array.isArray(notification.targetRole)) {
          return notification.targetRole.includes(userRole);
        }
        return notification.targetRole === userRole;
      }

      return false;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Most recent first
    .slice(0, limit); // Limit to specified number
}

export function markNotificationAsReadMemory(
  notificationId: string,
  userId: string,
): boolean {
  const notification = memoryNotifications.find((n) => n.id === notificationId);
  if (notification) {
    notification.read = true;
    return true;
  }
  return false;
}

export function markAllNotificationsAsReadMemory(
  userId: string,
  userRole: Role,
): number {
  const userNotifications = getNotificationsForUserMemory(userId, userRole);
  let count = 0;

  for (const notification of userNotifications) {
    if (!notification.read) {
      notification.read = true;
      count++;
    }
  }

  return count;
}

export function deleteNotificationMemory(notificationId: string): boolean {
  const index = memoryNotifications.findIndex((n) => n.id === notificationId);
  if (index !== -1) {
    memoryNotifications.splice(index, 1);
    return true;
  }
  return false;
}

export function getUnreadCountMemory(userId: string, userRole: Role): number {
  return getNotificationsForUserMemory(userId, userRole).filter((n) => !n.read).length;
}
