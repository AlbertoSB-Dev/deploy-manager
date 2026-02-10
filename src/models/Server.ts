import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

// Chave de criptografia (deve estar no .env em produção)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!'; // Deve ter 32 caracteres
const ALGORITHM = 'aes-256-cbc';

// Função para criptografar
function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Função para descriptografar
function decrypt(text: string): string {
  if (!text) return '';
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export interface IServer extends Document {
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key';
  password?: string;
  privateKey?: string;
  
  // Métodos para obter credenciais descriptografadas
  getPassword(): string;
  getPrivateKey(): string;
  
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
  groupId?: string; // ID do grupo ao qual o servidor pertence
  createdAt: Date;
  updatedAt: Date;
}

const ServerSchema = new Schema<IServer>({
  name: { type: String, required: true },
  host: { type: String, required: true },
  port: { type: Number, default: 22 },
  username: { type: String, required: true },
  authType: { type: String, enum: ['password', 'key'], default: 'password' },
  password: { type: String }, // Será criptografado
  privateKey: { type: String }, // Será criptografado
  
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
  userId: { type: String, required: true, index: true }, // ID do usuário dono
  groupId: { type: String, index: true } // ID do grupo ao qual o servidor pertence
}, {
  timestamps: true
});

// Middleware para criptografar antes de salvar
ServerSchema.pre('save', function(next) {
  if (this.isModified('password') && this.password) {
    this.password = encrypt(this.password);
  }
  if (this.isModified('privateKey') && this.privateKey) {
    this.privateKey = encrypt(this.privateKey);
  }
  next();
});

// Método para obter senha descriptografada
ServerSchema.methods.getPassword = function(): string {
  return this.password ? decrypt(this.password) : '';
};

// Método para obter chave privada descriptografada
ServerSchema.methods.getPrivateKey = function(): string {
  return this.privateKey ? decrypt(this.privateKey) : '';
};

// Remover credenciais do JSON quando retornar para o frontend
ServerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.privateKey;
  return obj;
};

// Índice composto: nome único por usuário
ServerSchema.index({ name: 1, userId: 1 }, { unique: true });

export const Server = mongoose.model<IServer>('Server', ServerSchema);

