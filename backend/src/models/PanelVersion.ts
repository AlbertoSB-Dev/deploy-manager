import mongoose from 'mongoose';

const panelVersionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true,
  },
  tag: String,
  commit: String,
  message: String,
  date: {
    type: Date,
    default: Date.now,
  },
  frontend: {
    imageId: String,
    imageTag: String,
    size: Number,
  },
  backend: {
    imageId: String,
    imageTag: String,
    size: Number,
  },
  status: {
    type: String,
    enum: ['building', 'ready', 'failed'],
    default: 'ready',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: String,
  notes: String,
});

export default mongoose.model('PanelVersion', panelVersionSchema);
