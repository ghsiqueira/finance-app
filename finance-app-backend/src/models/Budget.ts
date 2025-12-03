import mongoose, { Document, Schema } from 'mongoose';

export interface IBudget extends Document {
  userId: string;
  categoryId: string;
  name: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  renewalDay: number;
  rollover: boolean;
}

const BudgetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  renewalDay: { type: Number, default: 1, min: 1, max: 31 },
  rollover: { type: Boolean, default: false }
});

export default mongoose.model<IBudget>('Budget', BudgetSchema);