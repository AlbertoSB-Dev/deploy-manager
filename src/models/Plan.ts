import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    maxProjects: number;
    maxServers: number;
    maxDatabases: number;
    maxStorage: number; // GB
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
    price: {
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
        default: 5,
      },
      maxServers: {
        type: Number,
        required: true,
        default: 2,
      },
      maxDatabases: {
        type: Number,
        required: true,
        default: 5,
      },
      maxStorage: {
        type: Number,
        required: true,
        default: 10,
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
