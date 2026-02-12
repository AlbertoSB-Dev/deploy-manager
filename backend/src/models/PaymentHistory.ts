import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentHistory extends Document {
  userId: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'confirmed' | 'received' | 'overdue' | 'refunded' | 'cancelled';
  paymentMethod: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'MANUAL';
  description: string;
  assasPaymentId?: string;
  assasInvoiceUrl?: string;
  dueDate?: Date;
  paymentDate?: Date;
  serversCount?: number;
  metadata?: {
    previousPlan?: string;
    newPlan?: string;
    changeType?: 'upgrade' | 'downgrade' | 'renewal' | 'new';
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentHistorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'received', 'overdue', 'refunded', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['CREDIT_CARD', 'BOLETO', 'PIX', 'MANUAL'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  assasPaymentId: {
    type: String,
  },
  assasInvoiceUrl: {
    type: String,
  },
  dueDate: {
    type: Date,
  },
  paymentDate: {
    type: Date,
  },
  serversCount: {
    type: Number,
    default: 1,
  },
  metadata: {
    previousPlan: String,
    newPlan: String,
    changeType: {
      type: String,
      enum: ['upgrade', 'downgrade', 'renewal', 'new'],
    },
  },
}, {
  timestamps: true,
});

// Índices para melhor performance
PaymentHistorySchema.index({ userId: 1, createdAt: -1 });
PaymentHistorySchema.index({ status: 1 });
PaymentHistorySchema.index({ assasPaymentId: 1 });

export default mongoose.model<IPaymentHistory>('PaymentHistory', PaymentHistorySchema);
