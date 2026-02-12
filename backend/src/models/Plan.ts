import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  description: string;
  pricePerServer: number; // Preço por servidor
  interval: 'monthly' | 'yearly';
  features: string[];
  discountTiers: Array<{
    minServers: number;
    discountPercent: number; // Percentual de desconto (ex: 10 = 10%)
  }>;
  isActive: boolean;
  isPopular: boolean;
  assasPlanId?: string; // ID do plano no Assas
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    pricePerServer: {
      type: Number,
      required: true,
      min: 0,
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    features: [{
      type: String,
    }],
    discountTiers: [{
      minServers: {
        type: Number,
        required: true,
        min: 1,
      },
      discountPercent: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    assasPlanId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Método para calcular preço com descontos
PlanSchema.methods.calculatePrice = function(servers: number): number {
  const basePrice = this.pricePerServer * servers;
  
  // Encontrar o tier de desconto aplicável
  let discountPercent = 0;
  
  // Ordenar tiers por minServers (decrescente) para pegar o maior desconto aplicável
  const sortedTiers = [...this.discountTiers].sort((a, b) => b.minServers - a.minServers);
  
  for (const tier of sortedTiers) {
    if (servers >= tier.minServers) {
      discountPercent = tier.discountPercent;
      break;
    }
  }
  
  // Aplicar desconto
  const discount = (basePrice * discountPercent) / 100;
  const finalPrice = basePrice - discount;
  
  return Math.round(finalPrice * 100) / 100; // Arredondar para 2 casas decimais
};

export default mongoose.model<IPlan>('Plan', PlanSchema);
