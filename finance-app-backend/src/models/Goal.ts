import mongoose, { Document, Schema } from 'mongoose';

export interface IGoalMember {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'contributor' | 'viewer';
  contributionLimit?: number;
  currentContribution: number;
  joinedAt: Date;
}

export interface IGoalInvite {
  email: string;
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  role: 'admin' | 'contributor' | 'viewer';
  contributionLimit?: number;
}

export interface IGoal extends Document {
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  categoryId?: string;
  isCompleted: boolean;
  isShared: boolean;
  autoSplit: boolean;
  members: IGoalMember[];
  invites: IGoalInvite[];
  progressHistory: Array<{
    amount: number;
    addedBy: string;
    addedByName: string;
    date: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  isCompleted: { type: Boolean, default: false },
  isShared: { type: Boolean, default: false },
  autoSplit: { type: Boolean, default: true },
  members: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    email: String,
    name: String,
    role: { 
      type: String, 
      enum: ['owner', 'admin', 'contributor', 'viewer'], 
      default: 'viewer' 
    },
    contributionLimit: { type: Number },
    currentContribution: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now }
  }],
  invites: [{
    email: String,
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    invitedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    role: { 
      type: String, 
      enum: ['admin', 'contributor', 'viewer'], 
      default: 'viewer' 
    },
    contributionLimit: { type: Number }
  }],
  progressHistory: [{
    amount: Number,
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    addedByName: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

GoalSchema.index({ userId: 1 });
GoalSchema.index({ 'members.userId': 1 });
GoalSchema.index({ 'invites.email': 1 });

GoalSchema.virtual('targetPerMember').get(function() {
  if (!this.autoSplit || this.members.length === 0) return this.targetAmount;
  return this.targetAmount / this.members.length;
});

GoalSchema.methods.toJSON = function() {
  const obj = this.toObject({ virtuals: true });
  return obj;
};

export default mongoose.model<IGoal>('Goal', GoalSchema);