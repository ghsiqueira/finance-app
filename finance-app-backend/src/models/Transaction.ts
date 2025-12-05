import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  categoryId: string;
  budgetId?: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  originalAmount?: number;
  currency?: string;
  description: string;
  date: Date;
  isRecurring: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    dayOfMonth?: number;
    isBusinessDay?: boolean;
  };
  location?: string;
  receipt?: string;
  wasConverted?: boolean;
}

const TransactionSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  categoryId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category', 
    required: false,
    index: true 
  },
  budgetId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Budget',
    index: true 
  },
  type: { 
    type: String, 
    enum: ['expense', 'income', 'transfer'], 
    required: true,
    index: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  originalAmount: {
    type: Number,
    required: false 
  },
  currency: {
    type: String,
    required: false,
    default: 'BRL',
    uppercase: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  date: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  isRecurring: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  recurringConfig: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'yearly']
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    isBusinessDay: {
      type: Boolean,
      default: false
    }
  },
  location: String,
  receipt: String
}, {
  timestamps: true
});

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, categoryId: 1 });
TransactionSchema.index({ userId: 1, budgetId: 1 });

TransactionSchema.virtual('wasConverted').get(function(this: ITransaction) {
  return this.currency && this.currency !== 'BRL' && this.originalAmount;
});

TransactionSchema.pre('save', function(next) {
  if (!this.originalAmount) {
    this.originalAmount = this.amount;
  }
  
  if (!this.currency) {
    this.currency = 'BRL';
  }

  if (this.recurringConfig && this.recurringConfig.frequency) {
    this.isRecurring = true;
  }
});

TransactionSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  if (this.wasConverted) {
    obj.conversionInfo = {
      originalAmount: this.originalAmount,
      originalCurrency: this.currency,
      convertedAmount: this.amount,
      convertedCurrency: 'BRL'
    };
  }
  
  return obj;
};

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);