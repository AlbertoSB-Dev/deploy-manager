import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectGroup extends Document {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectGroupSchema = new Schema<IProjectGroup>({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: '📁' },
  color: { type: String, default: '#3B82F6' },
  parentId: { type: String }, // Para subpastas no futuro
}, {
  timestamps: true
});

export default mongoose.model<IProjectGroup>('ProjectGroup', ProjectGroupSchema);
