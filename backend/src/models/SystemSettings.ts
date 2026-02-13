import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSettings extends Document {
  serverIp: string;
  baseDomain: string;
  frontendUrl: string;
  githubClientId?: string;
  githubClientSecret?: string;
  githubCallbackUrl?: string;
  assasApiKey?: string;
  assasWebhookToken?: string;
  assasEnvironment?: 'sandbox' | 'production';
  // Configurações do repositório do painel
  panelGitRepo?: string;
  panelGitBranch?: string;
  panelGitToken?: string;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
  serverIp: { type: String, required: true },
  baseDomain: { type: String, required: true, default: 'sslip.io' },
  frontendUrl: { type: String, required: true },
  githubClientId: { type: String },
  githubClientSecret: { type: String },
  githubCallbackUrl: { type: String },
  assasApiKey: { type: String },
  assasWebhookToken: { type: String },
  assasEnvironment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
  // Configurações do repositório do painel
  panelGitRepo: { type: String, default: 'AlbertoSB-Dev/deploy-manager' },
  panelGitBranch: { type: String, default: 'main' },
  panelGitToken: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
