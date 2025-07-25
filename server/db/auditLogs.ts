import { AuditLog as AuditLogInterface, Role } from "../../shared/auth.js";
import { AuditLog, IAuditLog } from "./models/AuditLog.js";
import { withDatabase } from "./adapter.js";
import * as memoryAuditLogs from "./memory/auditLogs.js";

export async function createAuditLog(
  userId: string,
  userName: string,
  userRole: Role,
  action: string,
  target?: string,
  targetId?: string,
  details?: any,
  ipAddress?: string,
): Promise<AuditLogInterface | null> {
  return withDatabase(
    async () => {
      const log = new AuditLog({
        userId,
        userName,
        userRole,
        action,
        target,
        targetId,
        details,
        ipAddress,
      });

      const savedLog = await log.save();

      return {
        id: savedLog._id.toString(),
        userId: savedLog.userId,
        userName: savedLog.userName,
        userRole: savedLog.userRole,
        action: savedLog.action,
        target: savedLog.target,
        targetId: savedLog.targetId,
        details: savedLog.details,
        timestamp: savedLog.timestamp,
        ipAddress: savedLog.ipAddress,
      };
    },
    () => memoryAuditLogs.createAuditLogMemory(userId, userName, userRole, action, target, targetId, details, ipAddress)
  );
}

export async function getAuditLogs(
  limit: number = 100,
  offset: number = 0,
): Promise<AuditLogInterface[]> {
  try {
    const logs = await AuditLog
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return logs.map(log => ({
      id: log._id.toString(),
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      action: log.action,
      target: log.target,
      targetId: log.targetId,
      details: log.details,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
    }));
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return [];
  }
}

export async function getAuditLogsByUser(
  userId: string,
  limit: number = 50,
): Promise<AuditLogInterface[]> {
  try {
    const logs = await AuditLog
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return logs.map(log => ({
      id: log._id.toString(),
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      action: log.action,
      target: log.target,
      targetId: log.targetId,
      details: log.details,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
    }));
  } catch (error) {
    console.error('Error getting audit logs by user:', error);
    return [];
  }
}

export async function getAuditLogsByAction(
  action: string,
  limit: number = 50,
): Promise<AuditLogInterface[]> {
  try {
    const logs = await AuditLog
      .find({ action })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return logs.map(log => ({
      id: log._id.toString(),
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      action: log.action,
      target: log.target,
      targetId: log.targetId,
      details: log.details,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
    }));
  } catch (error) {
    console.error('Error getting audit logs by action:', error);
    return [];
  }
}

export async function getRecentAuditLogs(hours: number = 24): Promise<AuditLogInterface[]> {
  try {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const logs = await AuditLog
      .find({ timestamp: { $gte: cutoffTime } })
      .sort({ timestamp: -1 })
      .lean();

    return logs.map(log => ({
      id: log._id.toString(),
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      action: log.action,
      target: log.target,
      targetId: log.targetId,
      details: log.details,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
    }));
  } catch (error) {
    console.error('Error getting recent audit logs:', error);
    return [];
  }
}
