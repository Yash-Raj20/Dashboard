import { Role } from "../../shared/auth.js";
import { Notification, INotification } from "./models/Notification.js";

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

// === Rules ===
export const NOTIFICATION_RULES = {
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

// === Services ===

export async function createNotification(
  data: Omit<NotificationData, "id" | "timestamp" | "read">,
): Promise<NotificationData> {
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

  if (fromUserRole === "main-admin" && NOTIFICATION_RULES.MAIN_ADMIN_ACTIONS[action]) {
    rule = NOTIFICATION_RULES.MAIN_ADMIN_ACTIONS[action];
  } else if (fromUserRole === "sub-admin" && NOTIFICATION_RULES.SUB_ADMIN_ACTIONS[action]) {
    rule = NOTIFICATION_RULES.SUB_ADMIN_ACTIONS[action];
  }

  if (!rule) return [];

  const content = rule.template(
    fromUserName,
    targetDetails?.name,
    targetDetails?.count,
    targetDetails?.details,
  );

  for (const targetRole of rule.notifyRoles) {
    try {
      const notification = await createNotification({
        targetRole,
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
    } catch (err) {
      console.error("Failed to create role-based notification:", err);
    }
  }

  return createdNotifications;
}

export async function getNotificationsForUser(
  userId: string,
  userRole: Role,
  limit = 50,
): Promise<NotificationData[]> {
  const query = {
    $or: [
      { targetUserId: userId },
      { targetRole: userRole },
      { targetRole: { $in: [userRole] } },
    ],
  };

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return notifications.map((n) => ({
    id: n._id.toString(),
    targetRole: n.targetRole,
    targetUserId: n.targetUserId,
    fromUserId: n.fromUserId,
    fromUserName: n.fromUserName,
    fromUserRole: n.fromUserRole,
    type: n.type,
    title: n.title,
    message: n.message,
    action: n.action,
    targetResource: n.targetResource,
    targetResourceId: n.targetResourceId,
    timestamp: n.createdAt,
    read: n.read,
    priority: n.priority,
    autoExpires: n.autoExpires,
  }));
}

export async function markNotificationAsRead(
notificationId: string, id: string,
): Promise<boolean> {
  const result = await Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true },
  );
  return !!result;
}

export async function markAllNotificationsAsRead(
  userId: string,
  userRole: Role,
): Promise<number> {
  const query = {
    $or: [
      { targetUserId: userId },
      { targetRole: userRole },
      { targetRole: { $in: [userRole] } },
    ],
    read: false,
  };

  const result = await Notification.updateMany(query, { read: true });
  return result.modifiedCount || 0;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const result = await Notification.findByIdAndDelete(notificationId);
  return !!result;
}

export async function getUnreadCount(
  userId: string,
  userRole: Role,
): Promise<number> {
  const query = {
    $or: [
      { targetUserId: userId },
      { targetRole: userRole },
      { targetRole: { $in: [userRole] } },
    ],
    read: false,
  };

  const count = await Notification.countDocuments(query);
  return count;
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
  const allRoles: Role[] = ["main-admin", "sub-admin", "user"];
  const notifications: NotificationData[] = [];

  for (const role of allRoles) {
    const notification = await createNotification({
      targetRole: role,
      fromUserId,
      fromUserName,
      fromUserRole,
      type,
      title,
      message,
      action: "broadcast_message",
      priority,
    });

    notifications.push(notification);
  }

  return notifications;
}