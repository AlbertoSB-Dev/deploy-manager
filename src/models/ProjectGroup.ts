import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectGroup extends Document {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  userId: string; // ID do usuário dono do grupo
  createdAt: Date;
  updatedAt: Date;
}

const ProjectGroupSchema = new Schema<IProjectGroup>({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: '📁' },
  color: { type: String, default: '#3B82F6' },
  parentId: { type: String }, // Para subpastas no futuro
  userId: { type: String, required: true, index: true }, // ID do usuário dono
}, {
  timestamps: true
});

// Índice composto: nome único por usuário
ProjectGroupSchema.index({ name: 1, userId: 1 }, { unique: true });

export default mongoose.model<IProjectGroup>('ProjectGroup', ProjectGroupSchema);
