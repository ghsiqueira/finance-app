import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  seen: boolean;
}

const AchievementSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  achievementId: {
    type: String,
    required: true,
    index: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  seen: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

AchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export default mongoose.model<IAchievement>('Achievement', AchievementSchema);