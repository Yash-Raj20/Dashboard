import mongoose, { Schema, Document } from 'mongoose';
import { Role } from '../../../shared/auth.js';

export interface INotification extends Document {
  targetRole?: Role | Role[];
  targetUserId?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: Role;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  action?: string;
  targetResource?: string;
  targetResourceId?: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  targetRole: {
    type: Schema.Types.Mixed,
    validate: {
      validator: function(value: any) {
        if (!value) return true;
        const validRoles = ['main-admin', 'sub-admin', 'user'];
        if (Array.isArray(value)) {
          return value.every(role => validRoles.includes(role));
        }
        return validRoles.includes(value);
      },
      message: 'Invalid role(s) specified'
    },
    index: true
  },
  targetUserId: {
    type: String,
    index: true,
    sparse: true
  },
  fromUserId: {
    type: String,
    required: true,
    index: true
  },
  fromUserName: {
    type: String,
    required: true
  },
  fromUserRole: {
    type: String,
    enum: ['main-admin', 'sub-admin', 'user'],
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    required: true,
    default: 'info'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    trim: true,
    index: true
  },
  targetResource: {
    type: String,
    trim: true
  },
  targetResourceId: {
    type: String,
    trim: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true,
    default: 'medium',
    index: true
  },
  autoExpires: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

notificationSchema.index({ targetRole: 1, read: 1, createdAt: -1 });
notificationSchema.index({ targetUserId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ fromUserId: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
