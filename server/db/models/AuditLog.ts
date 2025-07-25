import mongoose, { Schema, Document } from 'mongoose';
import { Role } from '../../../shared/auth.js';

export interface IAuditLog extends Document {
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  target?: string;
  targetId?: string;
  details?: any;
  ipAddress?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['main-admin', 'sub-admin', 'user'],
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  target: {
    type: String,
    trim: true
  },
  targetId: {
    type: String,
    trim: true
  },
  details: {
    type: Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'audit_logs'
});

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ userRole: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
