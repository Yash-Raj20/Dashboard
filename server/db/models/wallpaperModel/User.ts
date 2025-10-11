// models/User.ts (Updated to properly reference Wallpaper)
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  picture: string;
  likes: mongoose.Types.ObjectId[];
  downloads: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema = new Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
    default: '',
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'Wallpaper', 
  }],
  downloads: [{
    type: Schema.Types.ObjectId,
    ref: 'Wallpaper',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook for updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);