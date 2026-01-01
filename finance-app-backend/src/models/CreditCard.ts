import mongoose from 'mongoose';

const creditCardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      enum: ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other'],
      default: 'other',
    },
    limit: {
      type: Number,
      required: true,
    },
    closingDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    dueDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    color: {
      type: String,
      default: '#007AFF',
    },
    lastFourDigits: {
      type: String,
      maxlength: 4,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

creditCardSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model('CreditCard', creditCardSchema);