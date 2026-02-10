import mongoose, { Document, Schema } from 'mongoose';

export type DatabaseType = 'mongodb' | 'mysql' | 'mariadb' | 'postgresql' | 'redis' | 'minio';

export interface IDatabase extends Document {
  name: string;
  displayName: string;
  type: DatabaseType;
  version: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  containerId?: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  serverId?: string;
  serverName?: string;
  connectionString: string;
  volumePath: string;
  // Campos específicos do MinIO
  consolePort?: number;
  accessKey?: string;
  secretKey?: string;
  apiUrl?: string;      // Para MinIO: API S3
  consoleUrl?: string;  // Para MinIO: Console Web
  // Painel administrativo
  adminPanel?: {
    enabled: boolean;
    type: 'phpmyadmin' | 'adminer' | 'mongo-express' | 'redis-commander' | 'minio-console';
    containerId?: string;
    domain?: string;
    port?: number;
  };
  adminUrl?: string;    // URL do painel admin (phpMyAdmin, Adminer, etc)
  userId: string; // ID do usuário dono do banco
  createdAt: Date;
  updatedAt: Date;
}

const DatabaseSchema = new Schema<IDatabase>({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  type: { type: String, required: true, enum: ['mongodb', 'mysql', 'mariadb', 'postgresql', 'redis', 'minio'] },
  version: { type: String, required: true },
  host: { type: String, required: true },
  port: { type: Number, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  database: { type: String, required: true },
  containerId: { type: String },
  status: { type: String, default: 'creating', enum: ['creating', 'running', 'stopped', 'error'] },
  serverId: { type: String },
  serverName: { type: String },
  connectionString: { type: String, required: true },
  volumePath: { type: String, required: true },
  // Campos específicos do MinIO
  consolePort: { type: Number },
  accessKey: { type: String },
  secretKey: { type: String },
  apiUrl: { type: String },
  consoleUrl: { type: String },
  // Painel administrativo
  adminPanel: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['phpmyadmin', 'adminer', 'mongo-express', 'redis-commander', 'minio-console'] },
    containerId: { type: String },
    domain: { type: String },
    port: { type: Number }
  },
  adminUrl: { type: String },
  userId: { type: String, required: true, index: true }, // ID do usuário dono
}, {
  timestamps: true
});

// Índice composto: nome único por usuário
DatabaseSchema.index({ name: 1, userId: 1 }, { unique: true });

export default mongoose.model<IDatabase>('Database', DatabaseSchema);
