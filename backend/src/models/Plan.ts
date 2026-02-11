import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  description: string;
  pricePerServer: number; // Preço por servidor
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    maxProjects: number; // Projetos ilimitados por servidor
    maxDatabases: number;
    maxStorage: number; // GB por servidor
  };
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
    limits: {
      maxProjects: {
        type: Number,
        required: true,
        default: 100, // Projetos ilimitados por servidor
      },
      maxDatabases: {
        type: Number,
        required: true,
        default: 50,
      },
      maxStorage: {
        type: Number,
        required: true,
        default: 100, // GB por servidor
      },
    },
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
