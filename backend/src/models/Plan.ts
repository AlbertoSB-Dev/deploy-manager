import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  description: string;
  pricePerServer: number; // Preço por servidor
  interval: 'monthly' | 'yearly';
  features: string[];
  discountTiers: Array<{
    minServers: number;
    discountPercent: number; // Percentual de desconto (ex: 10 = 10%)
  }>;
  isActive: boolean;
  isPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    pricePerServer: {
      type: Number,
      required: true,
      min: 0,
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    features: [{
      type: String,
    }],
    discountTiers: [{
      minServers: {
        type: Number,
        required: true,
        min: 1,
      },
      discountPercent: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPlan>('Plan', PlanSchema);
