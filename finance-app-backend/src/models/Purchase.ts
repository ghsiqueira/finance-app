import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    creditCardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreditCard',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    installments: {
      total: {
        type: Number,
        default: 1,
        min: 1,
        max: 24,
      },
      current: {
        type: Number,
        default: 1,
      },
    },
    // Parcela mãe (se for parcelado)
    parentPurchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
    },
    invoiceMonth: {
      type: String, // Format: YYYY-MM
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

purchaseSchema.index({ userId: 1, creditCardId: 1 });
purchaseSchema.index({ userId: 1, invoiceMonth: 1 });
purchaseSchema.index({ userId: 1, status: 1 });

export default mongoose.model('Purchase', purchaseSchema);