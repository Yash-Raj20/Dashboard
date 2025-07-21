import { Role } from '../../shared/auth.js';

export interface Notification {
  id: string;
  targetRole?: Role | Role[]; // Which roles should receive this notification
  targetUserId?: string; // Specific user (optional)
  fromUserId: string; // Who triggered the notification
  fromUserName: string;
  fromUserRole: Role;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  action?: string; // What action was performed
  targetResource?: string; // What was affected (user, sub-admin, etc.)
  targetResourceId?: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoExpires?: Date; // Optional auto-expiry
}

// In-memory notifications storage
// In production, replace with a real database
export const notifications: Notification[] = [];

// Role-based notification rules
export const NOTIFICATION_RULES = {
  // When main admin does these actions, notify sub-admins and users
  MAIN_ADMIN_ACTIONS: {
    'create_sub_admin': {
      notifyRoles: ['sub-admin', 'user'] as Role[],
      priority: 'high' as const,
      template: (fromUser: string, targetName: string) => ({
        title: 'New Sub-Admin Created',
        message: `${fromUser} has created a new sub-admin: ${targetName}`,
        type: 'info' as const
      })
    },
    'delete_sub_admin': {
      notifyRoles: ['sub-admin', 'user'] as Role[],
      priority: 'high' as const,
      template: (fromUser: string, targetName: string) => ({
        title: 'Sub-Admin Removed',
        message: `${fromUser} has removed sub-admin: ${targetName}`,
        type: 'warning' as const
      })
    },
    'system_maintenance': {
      notifyRoles: ['sub-admin', 'user'] as Role[],
      priority: 'urgent' as const,
      template: (fromUser: string) => ({
        title: 'System Maintenance Scheduled',
        message: `${fromUser} has scheduled system maintenance`,
        type: 'warning' as const
      })
    },
    'policy_update': {
      notifyRoles: ['sub-admin', 'user'] as Role[],
      priority: 'medium' as const,
      template: (fromUser: string) => ({
        title: 'Policy Update',
        message: `${fromUser} has updated system policies`,
        type: 'info' as const
      })
    }
  },
  
  // When sub-admin does these actions, notify main admin
  SUB_ADMIN_ACTIONS: {
    'create_user': {
      notifyRoles: ['main-admin'] as Role[],
      priority: 'medium' as const,
      template: (fromUser: string, targetName: string) => ({
        title: 'New User Created',
        message: `Sub-admin ${fromUser} has created a new user: ${targetName}`,
        type: 'info' as const
      })
    },
    'delete_user': {
      notifyRoles: ['main-admin'] as Role[],
      priority: 'high' as const,
      template: (fromUser: string, targetName: string) => ({
        title: 'User Deleted',
        message: `Sub-admin ${fromUser} has deleted user: ${targetName}`,
        type: 'warning' as const
      })
    },
    'bulk_action': {
      notifyRoles: ['main-admin'] as Role[],
      priority: 'high' as const,
      template: (fromUser: string, count: number) => ({
        title: 'Bulk Action Performed',
        message: `Sub-admin ${fromUser} performed bulk action on ${count} users`,
        type: 'warning' as const
      })
    },
    'security_alert': {
      notifyRoles: ['main-admin'] as Role[],
      priority: 'urgent' as const,
      template: (fromUser: string, details: string) => ({
        title: 'Security Alert',
        message: `Sub-admin ${fromUser} reported: ${details}`,
        type: 'error' as const
      })
    }
  }
};

export function createNotification(data: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    timestamp: new Date(),
    read: false
  };

  notifications.unshift(notification); // Add to beginning
  
  // Keep only last 100 notifications per role
  if (notifications.length > 100) {
    notifications.splice(100);
  }

  return notification;
}

export function createRoleBasedNotification(
  fromUserId: string,
  fromUserName: string,
  fromUserRole: Role,
  action: string,
  targetDetails?: {
    name?: string;
    id?: string;
    count?: number;
    details?: string;
  }
): Notification[] {
  const createdNotifications: Notification[] = [];
  let rule: any = null;
  
  // Determine which rule to apply based on role and action
  if (fromUserRole === 'main-admin' && NOTIFICATION_RULES.MAIN_ADMIN_ACTIONS[action]) {
    rule = NOTIFICATION_RULES.MAIN_ADMIN_ACTIONS[action];
  } else if (fromUserRole === 'sub-admin' && NOTIFICATION_RULES.SUB_ADMIN_ACTIONS[action]) {
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
    targetDetails?.details
  );

  // Create notification for each target role
  for (const targetRole of rule.notifyRoles) {
    const notification = createNotification({
      targetRole: targetRole,
      fromUserId,
      fromUserName,
      fromUserRole,
      type: content.type,
      title: content.title,
      message: content.message,
      action,
      targetResource: targetDetails?.name ? 'user' : undefined,
      targetResourceId: targetDetails?.id,
      priority: rule.priority
    });
    
    createdNotifications.push(notification);
  }

  return createdNotifications;
}

export function getNotificationsForUser(userId: string, userRole: Role): Notification[] {
  return notifications
    .filter(notification => {
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
    .slice(0, 50); // Limit to 50 notifications
}

export function markNotificationAsRead(notificationId: string, userId: string): boolean {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    return true;
  }
  return false;
}

export function markAllNotificationsAsRead(userId: string, userRole: Role): number {
  const userNotifications = getNotificationsForUser(userId, userRole);
  let count = 0;
  
  for (const notification of userNotifications) {
    if (!notification.read) {
      notification.read = true;
      count++;
    }
  }
  
  return count;
}

export function deleteNotification(notificationId: string): boolean {
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications.splice(index, 1);
    return true;
  }
  return false;
}

export function getUnreadCount(userId: string, userRole: Role): number {
  return getNotificationsForUser(userId, userRole).filter(n => !n.read).length;
}

// Auto-cleanup expired notifications
setInterval(() => {
  const now = new Date();
  const expiredIndices: number[] = [];
  
  notifications.forEach((notification, index) => {
    if (notification.autoExpires && notification.autoExpires < now) {
      expiredIndices.push(index);
    }
  });
  
  // Remove expired notifications (in reverse order to maintain indices)
  expiredIndices.reverse().forEach(index => {
    notifications.splice(index, 1);
  });
}, 60000); // Check every minute
