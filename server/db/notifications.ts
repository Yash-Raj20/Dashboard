import { Role } from "../../shared/auth.js";
import { Notification, INotification } from "./models/Notification.js";
import { withDatabase } from "./adapter.js";
import * as memoryNotifications from "./memory/notifications.js";

export interface NotificationData {
  id: string;
  targetRole?: Role | Role[];
  targetUserId?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: Role;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  action?: string;
  targetResource?: string;
  targetResourceId?: string;
  timestamp: Date;
  read: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  autoExpires?: Date;
}

// Role-based notification rules
export const NOTIFICATION_RULES = {
  // When main admin does these actions, notify sub-admins and users
  MAIN_ADMIN_ACTIONS: {
    create_sub_admin: {
      notifyRoles: ["sub-admin", "user"] as Role[],
      priority: "high" as const,
      template: (fromUser: string, targetName: string) => ({
        title: "New Sub-Admin Created",
        message: `${fromUser} has created a new sub-admin: ${targetName}`,
        type: "info" as const,
      }),
    },
    delete_sub_admin: {
      notifyRoles: ["sub-admin", "user"] as Role[],
      priority: "high" as const,
      template: (fromUser: string, targetName: string) => ({
        title: "Sub-Admin Removed",
        message: `${fromUser} has removed sub-admin: ${targetName}`,
        type: "warning" as const,
      }),
    },
    system_maintenance: {
      notifyRoles: ["sub-admin", "user"] as Role[],
      priority: "urgent" as const,
      template: (fromUser: string) => ({
        title: "System Maintenance Scheduled",
        message: `${fromUser} has scheduled system maintenance`,
        type: "warning" as const,
      }),
    },
    policy_update: {
      notifyRoles: ["sub-admin", "user"] as Role[],
      priority: "medium" as const,
      template: (fromUser: string) => ({
        title: "Policy Update",
        message: `${fromUser} has updated system policies`,
        type: "info" as const,
      }),
    },
  },

  // When sub-admin does these actions, notify main admin
  SUB_ADMIN_ACTIONS: {
    create_user: {
      notifyRoles: ["main-admin"] as Role[],
      priority: "medium" as const,
      template: (fromUser: string, targetName: string) => ({
        title: "New User Created",
        message: `Sub-admin ${fromUser} has created a new user: ${targetName}`,
        type: "info" as const,
      }),
    },
    delete_user: {
      notifyRoles: ["main-admin"] as Role[],
      priority: "high" as const,
      template: (fromUser: string, targetName: string) => ({
        title: "User Deleted",
        message: `Sub-admin ${fromUser} has deleted user: ${targetName}`,
        type: "warning" as const,
      }),
    },
    bulk_action: {
      notifyRoles: ["main-admin"] as Role[],
      priority: "high" as const,
      template: (fromUser: string, count: number) => ({
        title: "Bulk Action Performed",
        message: `Sub-admin ${fromUser} performed bulk action on ${count} users`,
        type: "warning" as const,
      }),
    },
    security_alert: {
      notifyRoles: ["main-admin"] as Role[],
      priority: "urgent" as const,
      template: (fromUser: string, details: string) => ({
        title: "Security Alert",
        message: `Sub-admin ${fromUser} reported: ${details}`,
        type: "error" as const,
      }),
    },
  },
};

export async function createNotification(
  data: Omit<NotificationData, "id" | "timestamp" | "read">,
): Promise<NotificationData> {
  return withDatabase(
    async () => {
      const notification = new Notification({
        ...data,
        read: false,
      });

      const savedNotification = await notification.save();

      return {
        id: savedNotification._id.toString(),
        targetRole: savedNotification.targetRole,
        targetUserId: savedNotification.targetUserId,
        fromUserId: savedNotification.fromUserId,
        fromUserName: savedNotification.fromUserName,
        fromUserRole: savedNotification.fromUserRole,
        type: savedNotification.type,
        title: savedNotification.title,
        message: savedNotification.message,
        action: savedNotification.action,
        targetResource: savedNotification.targetResource,
        targetResourceId: savedNotification.targetResourceId,
        timestamp: savedNotification.createdAt,
        read: savedNotification.read,
        priority: savedNotification.priority,
        autoExpires: savedNotification.autoExpires,
      };
    },
    () => memoryNotifications.createNotificationMemory(data)
  );
}

export async function createRoleBasedNotification(
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
): Promise<NotificationData[]> {
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
    try {
      const notification = await createNotification({
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
    } catch (error) {
      console.error('Error creating role-based notification:', error);
    }
  }

  return createdNotifications;
}

export async function getNotificationsForUser(
  userId: string,
  userRole: Role,
  limit: number = 50,
): Promise<NotificationData[]> {
  return withDatabase(
    async () => {
      const query = {
        $or: [
          { targetUserId: userId },
          { targetRole: userRole },
          { targetRole: { $in: [userRole] } }
        ]
      };

      const notifications = await Notification
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return notifications.map(notification => ({
        id: notification._id.toString(),
        targetRole: notification.targetRole,
        targetUserId: notification.targetUserId,
        fromUserId: notification.fromUserId,
        fromUserName: notification.fromUserName,
        fromUserRole: notification.fromUserRole,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        action: notification.action,
        targetResource: notification.targetResource,
        targetResourceId: notification.targetResourceId,
        timestamp: notification.createdAt,
        read: notification.read,
        priority: notification.priority,
        autoExpires: notification.autoExpires,
      }));
    },
    () => memoryNotifications.getNotificationsForUserMemory(userId, userRole, limit)
  );
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  return withDatabase(
    async () => {
      const result = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );
      return !!result;
    },
    () => memoryNotifications.markNotificationAsReadMemory(notificationId, userId)
  );
}

export async function markAllNotificationsAsRead(
  userId: string,
  userRole: Role,
): Promise<number> {
  return withDatabase(
    async () => {
      const query = {
        $or: [
          { targetUserId: userId },
          { targetRole: userRole },
          { targetRole: { $in: [userRole] } }
        ],
        read: false
      };

      const result = await Notification.updateMany(
        query,
        { read: true }
      );

      return result.modifiedCount || 0;
    },
    () => memoryNotifications.markAllNotificationsAsReadMemory(userId, userRole)
  );
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  return withDatabase(
    async () => {
      const result = await Notification.findByIdAndDelete(notificationId);
      return !!result;
    },
    () => memoryNotifications.deleteNotificationMemory(notificationId)
  );
}

export async function getUnreadCount(userId: string, userRole: Role): Promise<number> {
  return withDatabase(
    async () => {
      const query = {
        $or: [
          { targetUserId: userId },
          { targetRole: userRole },
          { targetRole: { $in: [userRole] } }
        ],
        read: false
      };

      const count = await Notification.countDocuments(query);
      return count;
    },
    () => memoryNotifications.getUnreadCountMemory(userId, userRole)
  );
}

export async function createNotificationForAll(
  fromUserId: string,
  fromUserName: string,
  fromUserRole: Role,
  title: string,
  message: string,
  type: "info" | "warning" | "success" | "error" = "info",
  priority: "low" | "medium" | "high" | "urgent" = "medium",
): Promise<NotificationData[]> {
  const createdNotifications: NotificationData[] = [];
  const allRoles: Role[] = ["main-admin", "sub-admin", "user"];

  // Create notification for each role
  for (const targetRole of allRoles) {
    try {
      const notification = await createNotification({
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
    } catch (error) {
      console.error('Error creating broadcast notification:', error);
    }
  }

  return createdNotifications;
}

// Auto-cleanup expired notifications using MongoDB TTL index
// This is automatically handled by MongoDB when autoExpires field is set
