import { AuditLog, Role } from "../../shared/auth.js";

// In-memory audit logs storage
// In production, replace with a real database
export const auditLogs: AuditLog[] = [];

export function createAuditLog(
  userId: string,
  userName: string,
  userRole: Role,
  action: string,
  target?: string,
  targetId?: string,
  details?: any,
  ipAddress?: string,
): AuditLog {
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userName,
    userRole,
    action,
    target,
    targetId,
    details,
    timestamp: new Date(),
    ipAddress,
  };

  auditLogs.push(log);
  return log;
}

export function getAuditLogs(
  limit: number = 100,
  offset: number = 0,
): AuditLog[] {
  return auditLogs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(offset, offset + limit);
}

export function getAuditLogsByUser(
  userId: string,
  limit: number = 50,
): AuditLog[] {
  return auditLogs
    .filter((log) => log.userId === userId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function getAuditLogsByAction(
  action: string,
  limit: number = 50,
): AuditLog[] {
  return auditLogs
    .filter((log) => log.action === action)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function getRecentAuditLogs(hours: number = 24): AuditLog[] {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return auditLogs
    .filter((log) => log.timestamp > cutoffTime)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
