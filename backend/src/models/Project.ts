import mongoose, { Schema, Document } from 'mongoose';

export interface IDeployment {
  version: string;
  branch: string;
  commit: string;
  deployedAt: Date;
  status: 'success' | 'failed' | 'deploying';
  logs: string;
  deployedBy: string;
  containerId?: string; // ID do container Docker criado neste deploy
}

export interface IGitAuth {
  type: 'none' | 'ssh' | 'token' | 'basic';
  sshKeyPath?: string;
  token?: string;
  username?: string;
  password?: string;
}

export interface IProject extends Document {
  name: string;
  displayName: string;
  gitUrl: string;
  branch: string;
  type: 'frontend' | 'backend' | 'fullstack';
  port?: number; // Porta externa (mapeada no host)
  internalPort?: number; // Porta interna (que a aplicação escuta)
  domain?: string; // Domínio customizado
  envVars: Record<string, string>;
  buildCommand?: string;
  startCommand?: string;
  installCommand: string;
  workDir: string;
  status: 'active' | 'inactive' | 'deploying' | 'error';
  currentVersion: string;
  deployments: IDeployment[];
  autoDeployEnabled: boolean;
  gitAuth: IGitAuth;
  containerId?: string;
  previousContainerId?: string; // Container da versão anterior (para rollback rápido)
  latestGitCommit?: string; // Último commit no GitHub
  hasUpdate?: boolean; // Indica se há atualização disponível
  serverId?: string; // ID do servidor remoto (null = local)
  serverName?: string; // Nome do servidor para exibição
  serverHost?: string; // IP/Host do servidor remoto
  groupId?: string; // ID do grupo/pasta
  groupName?: string; // Nome do grupo para exibição
  userId: string; // ID do usuário dono do projeto
  dockerfileTemplate?: string; // ID do template de Dockerfile (se não usar próprio)
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema = new Schema({
  version: { type: String, required: true },
  branch: { type: String, required: true },
  commit: { type: String, required: true },
  deployedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'failed', 'deploying'], default: 'deploying' },
  logs: { type: String, default: '' },
  deployedBy: { type: String, required: true },
  containerId: { type: String } // ID do container Docker criado neste deploy
});

const GitAuthSchema = new Schema({
  type: { type: String, enum: ['none', 'ssh', 'token', 'basic'], default: 'none' },
  sshKeyPath: { type: String },
  token: { type: String },
  username: { type: String },
  password: { type: String }
}, { _id: false });

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  gitUrl: { type: String, required: true },
  branch: { type: String, default: 'main' },
  type: { type: String, enum: ['frontend', 'backend', 'fullstack'], required: true },
  port: { type: Number }, // Porta externa
  internalPort: { type: Number, default: 3000 }, // Porta interna da aplicação
  domain: { type: String }, // Domínio customizado
  envVars: { type: Map, of: String, default: {} },
  buildCommand: { type: String },
  startCommand: { type: String },
  installCommand: { type: String, default: 'npm install' },
  workDir: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'deploying', 'error'], default: 'inactive' },
  currentVersion: { type: String, default: 'none' },
  deployments: [DeploymentSchema],
  autoDeployEnabled: { type: Boolean, default: false },
  gitAuth: { type: GitAuthSchema, default: { type: 'none' } },
  containerId: { type: String },
  previousContainerId: { type: String },
  latestGitCommit: { type: String },
  hasUpdate: { type: Boolean, default: false },
  serverId: { type: String }, // ID do servidor remoto
  serverName: { type: String }, // Nome do servidor
  serverHost: { type: String }, // IP/Host do servidor remoto
  groupId: { type: String }, // ID do grupo/pasta
  groupName: { type: String }, // Nome do grupo
  userId: { type: String, required: true }, // ID do usuário dono
  dockerfileTemplate: { type: String }, // ID do template de Dockerfile
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProjectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Índice para performance (não único - permite nomes duplicados)
ProjectSchema.index({ userId: 1 });
ProjectSchema.index({ name: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);
