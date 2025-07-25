import { AuditLog as AuditLogInterface, Role } from "../../../shared/auth.js";

// In-memory audit logs storage
const memoryAuditLogs: AuditLogInterface[] = [];

export function createAuditLogMemory(
  userId: string,
  userName: string,
  userRole: Role,
  action: string,
  target?: string,
  targetId?: string,
  details?: any,
  ipAddress?: string,
): AuditLogInterface {
  const log: AuditLogInterface = {
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

  memoryAuditLogs.push(log);
  return log;
}

export function getAuditLogsMemory(
  limit: number = 100,
  offset: number = 0,
): AuditLogInterface[] {
  return memoryAuditLogs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(offset, offset + limit);
}

export function getAuditLogsByUserMemory(
  userId: string,
  limit: number = 50,
): AuditLogInterface[] {
  return memoryAuditLogs
    .filter((log) => log.userId === userId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function getAuditLogsByActionMemory(
  action: string,
  limit: number = 50,
): AuditLogInterface[] {
  return memoryAuditLogs
    .filter((log) => log.action === action)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function getRecentAuditLogsMemory(hours: number = 24): AuditLogInterface[] {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return memoryAuditLogs
    .filter((log) => log.timestamp > cutoffTime)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
