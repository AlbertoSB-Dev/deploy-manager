import mongoose, { Schema, Document } from 'mongoose';

export interface IServer extends Document {
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key';
  password?: string;
  privateKey?: string;
  
  // Status de provisioning
  provisioningStatus: 'pending' | 'provisioning' | 'ready' | 'error';
  provisioningProgress: number;
  provisioningLogs: string[];
  provisioningError?: string;
  
  // Informações do sistema
  osType?: 'ubuntu' | 'debian' | 'centos' | 'rhel' | 'unknown';
  osVersion?: string;
  
  // Softwares instalados
  installedSoftware: {
    docker: boolean;
    dockerCompose: boolean;
    git: boolean;
    nodejs: boolean;
  };
  
  // Recursos
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  
  status: 'online' | 'offline' | 'error';
  lastCheck: Date;
  projects: string[];
  userId: string; // ID do usuário dono do servidor
  createdAt: Date;
  updatedAt: Date;
}

const ServerSchema = new Schema<IServer>({
  name: { type: String, required: true },
  host: { type: String, required: true },
  port: { type: Number, default: 22 },
  username: { type: String, required: true },
  authType: { type: String, enum: ['password', 'key'], default: 'password' },
  password: { type: String },
  privateKey: { type: String },
  
  provisioningStatus: { 
    type: String, 
    enum: ['pending', 'provisioning', 'ready', 'error'], 
    default: 'pending' 
  },
  provisioningProgress: { type: Number, default: 0 },
  provisioningLogs: [{ type: String }],
  provisioningError: { type: String },
  
  osType: { 
    type: String, 
    enum: ['ubuntu', 'debian', 'centos', 'rhel', 'unknown'] 
  },
  osVersion: { type: String },
  
  installedSoftware: {
    docker: { type: Boolean, default: false },
    dockerCompose: { type: Boolean, default: false },
    git: { type: Boolean, default: false },
    nodejs: { type: Boolean, default: false }
  },
  
  resources: {
    cpu: { type: Number, default: 0 },
    memory: { type: Number, default: 0 },
    disk: { type: Number, default: 0 }
  },
  
  status: { 
    type: String, 
    enum: ['online', 'offline', 'error'], 
    default: 'offline' 
  },
  lastCheck: { type: Date },
  projects: [{ type: String }],
  userId: { type: String, required: true, index: true } // ID do usuário dono
}, {
  timestamps: true
});

// Índice composto: nome único por usuário
ServerSchema.index({ name: 1, userId: 1 }, { unique: true });

export const Server = mongoose.model<IServer>('Server', ServerSchema);
