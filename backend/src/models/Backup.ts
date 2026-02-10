import mongoose, { Document, Schema } from 'mongoose';

export type BackupType = 'database' | 'project' | 'wordpress' | 'manual';
export type BackupStatus = 'creating' | 'completed' | 'failed' | 'restoring';
export type StorageType = 'local' | 'minio' | 's3';

export interface IBackup extends Document {
  name: string;
  type: BackupType;
  resourceId: string; // ID do banco/projeto/wordpress
  resourceName: string; // Nome do recurso
  size: number; // Tamanho em bytes
  status: BackupStatus;
  storageType: StorageType;
  localPath?: string; // Caminho local do backup
  remotePath?: string; // Caminho no MinIO/S3
  bucket?: string; // Bucket do MinIO/S3
  serverId?: string; // ID do servidor (se remoto)
  serverName?: string; // Nome do servidor
  metadata: {
    databaseType?: string; // mongodb, mysql, etc
    version?: string; // Versão do banco/projeto
    commit?: string; // Commit do projeto (se aplicável)
    compressed: boolean;
    encryption: boolean;
  };
  schedule?: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:mm para backups agendados
    retention: number; // Dias para manter o backup
  };
  userId: string; // ID do usuário dono
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

const BackupSchema = new Schema<IBackup>({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['database', 'project', 'wordpress', 'manual'] },
  resourceId: { type: String, required: true },
  resourceName: { type: String, required: true },
  size: { type: Number, default: 0 },
  status: { type: String, default: 'creating', enum: ['creating', 'completed', 'failed', 'restoring'] },
  storageType: { type: String, required: true, enum: ['local', 'minio', 's3'] },
  localPath: { type: String },
  remotePath: { type: String },
  bucket: { type: String },
  serverId: { type: String },
  serverName: { type: String },
  metadata: {
    databaseType: { type: String },
    version: { type: String },
    commit: { type: String },
    compressed: { type: Boolean, default: true },
    encryption: { type: Boolean, default: false }
  },
  schedule: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'] },
    time: { type: String },
    retention: { type: Number, default: 7 } // 7 dias padrão
  },
  userId: { type: String, required: true, index: true },
  completedAt: { type: Date },
  error: { type: String }
}, {
  timestamps: true
});

// Índices
BackupSchema.index({ resourceId: 1, userId: 1 });
BackupSchema.index({ type: 1, userId: 1 });
BackupSchema.index({ status: 1 });
BackupSchema.index({ createdAt: -1 });

export default mongoose.model<IBackup>('Backup', BackupSchema);
