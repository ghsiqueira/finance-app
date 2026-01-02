import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  profilePhoto?: string | undefined; 
  resetPasswordToken?: string | undefined;
  resetPasswordExpires?: Date | undefined;
  theme: 'light' | 'dark';
  currency: string;
  createdAt: Date;
}

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePhoto: {        
    type: String,
    default: null,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  theme: { type: String, default: 'light' },
  currency: { type: String, default: 'BRL' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);