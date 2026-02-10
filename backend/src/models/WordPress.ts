import mongoose, { Document, Schema } from 'mongoose';

export interface IWordPress extends Document {
  userId: mongoose.Types.ObjectId;
  serverId: mongoose.Types.ObjectId;
  name: string;
  domain: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbRootPassword: string;
  wpAdminUser: string;
  wpAdminPassword: string;
  wpAdminEmail: string;
  containerName: string;
  dbContainerName: string;
  networkName: string;
  status: 'installing' | 'running' | 'stopped' | 'error';
  installationLog: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WordPressSchema = new Schema<IWordPress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serverId: {
      type: Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    dbName: {
      type: String,
      required: true,
    },
    dbUser: {
      type: String,
      required: true,
    },
    dbPassword: {
      type: String,
      required: true,
    },
    dbRootPassword: {
      type: String,
      required: true,
    },
    wpAdminUser: {
      type: String,
      required: true,
    },
    wpAdminPassword: {
      type: String,
      required: true,
    },
    wpAdminEmail: {
      type: String,
      required: true,
    },
    containerName: {
      type: String,
      required: true,
      unique: true,
    },
    dbContainerName: {
      type: String,
      required: true,
      unique: true,
    },
    networkName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['installing', 'running', 'stopped', 'error'],
      default: 'installing',
    },
    installationLog: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Índice composto para garantir nomes únicos por usuário
WordPressSchema.index({ userId: 1, name: 1 }, { unique: true });

export const WordPress = mongoose.model<IWordPress>('WordPress', WordPressSchema);
