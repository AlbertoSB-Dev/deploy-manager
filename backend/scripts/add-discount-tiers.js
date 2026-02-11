#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

async function addDiscounts() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Definir schema do Plan
    const PlanSchema = new mongoose.Schema({
      name: String,
      description: String,
      pricePerServer: Number,
      price: Number,
      interval: String,
      features: [String],
      discountTiers: [{
        minServers: Number,
        discountPercent: Number,
      }],
      isActive: Boolean,
      isPopular: Boolean,
    }, { timestamps: true });

    const Plan = mongoose.model('Plan', PlanSchema);

    console.log('\n📊 Buscando planos...');
    const plans = await Plan.find({});
    console.log(`Encontrados ${plans.length} planos`);

    let updated = 0;
    for (const plan of plans) {
      // Se o plano não tem discountTiers, adicionar
      if (!plan.discountTiers || plan.discountTiers.length === 0) {
        console.log(`\n💰 Adicionando descontos ao plano: ${plan.name}`);
        
        const pricePerServer = plan.pricePerServer || plan.price || 0;
        
        // Definir descontos padrão baseado no preço
        let discountTiers = [];
        
        if (pricePerServer <= 50) {
          // Plano barato: descontos menores
          discountTiers = [
            { minServers: 5, discountPercent: 5 },
            { minServers: 10, discountPercent: 10 },
            { minServers: 20, discountPercent: 15 }
          ];
        } else if (pricePerServer <= 100) {
          // Plano médio: descontos moderados
          discountTiers = [
            { minServers: 5, discountPercent: 10 },
            { minServers: 10, discountPercent: 15 },
            { minServers: 20, discountPercent: 20 }
          ];
        } else {
          // Plano caro: descontos maiores
          discountTiers = [
            { minServers: 5, discountPercent: 15 },
            { minServers: 10, discountPercent: 20 },
            { minServers: 20, discountPercent: 25 },
            { minServers: 50, discountPercent: 30 }
          ];
        }
        
        plan.discountTiers = discountTiers;
        await plan.save();
        
        console.log(`   ✅ Descontos adicionados:`);
        discountTiers.forEach(tier => {
          console.log(`      ${tier.minServers}+ servidores: ${tier.discountPercent}% OFF`);
        });
        
        updated++;
      }
    }

    console.log(`\n✅ Concluído! ${updated} planos atualizados com descontos.`);
    console.log('\n📝 Próximos passos:');
    console.log('   1. Acesse a página de preços: http://localhost:3000/pricing');
    console.log('   2. Selecione um plano e mova o slider para ver os descontos\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addDiscounts();
