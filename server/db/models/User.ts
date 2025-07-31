import mongoose, { Schema, Document } from "mongoose";
import { Permission, Role } from "../../../shared/auth.js";

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  role: Role;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLogin?: Date;
  createdBy?: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["main-admin", "sub-admin", "user"],
      required: true,
      index: true,
    },
    permissions: [
      {
        type: String,
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

