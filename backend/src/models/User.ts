import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  cpfCnpj?: string;
  avatar?: string;
  googleId?: string;
  role: 'super_admin' | 'admin' | 'user';
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  subscription?: {
    planId?: mongoose.Types.ObjectId;
    status: 'active' | 'inactive' | 'cancelled' | 'trial';
    startDate?: Date;
    endDate?: Date;
    trialServersUsed?: number;
    serversCount?: number;
    assasCustomerId?: string;      // ID do cliente no Assas
    assasSubscriptionId?: string;  // ID da assinatura no Assas
    autoRenew?: boolean;           // Renovação automática ativada
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isTrialActive(): boolean;
  isSubscriptionActive(): boolean;
}

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
    select: false, // Não retorna senha por padrão
  },
  cpfCnpj: {
    type: String,
    trim: true,
    sparse: true, // Permite múltiplos documentos sem este campo
  },
  avatar: {
    type: String,
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'user'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  subscription: {
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'trial'],
      default: 'trial',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    trialServersUsed: {
      type: Number,
      default: 0,
    },
    serversCount: {
      type: Number,
      default: 1,
    },
    assasCustomerId: {
      type: String,
    },
    assasSubscriptionId: {
      type: String,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password antes de salvar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Atualizar updatedAt
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Método para comparar senha
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Método para verificar se trial está ativo
UserSchema.methods.isTrialActive = function (): boolean {
  if (this.subscription?.status !== 'trial') return false;
  if (!this.subscription?.endDate) return false;
  return new Date() < this.subscription.endDate;
};

// Método para verificar se assinatura está ativa
UserSchema.methods.isSubscriptionActive = function (): boolean {
  if (this.subscription?.status === 'active') {
    if (!this.subscription?.endDate) return true;
    return new Date() < this.subscription.endDate;
  }
  return false;
};

export default mongoose.model<IUser>('User', UserSchema);
