#!/usr/bin/env node

/**
 * Script para adicionar faixas de desconto aos planos existentes
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Plan = require('../src/models/Plan').default;

async function addDiscounts() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    console.log('✅ Conectado ao MongoDB');

    console.log('\n📊 Buscando planos...');
    const plans = await Plan.find({});
    console.log(`Encontrados ${plans.length} planos`);

    let updated = 0;
    for (const plan of plans) {
      // Se o plano não tem discountTiers, adicionar
      if (!plan.discountTiers || plan.discountTiers.length === 0) {
        console.log(`\n💰 Adicionando descontos ao plano: ${plan.name}`);
        
        // Definir descontos padrão baseado no preço
        let discountTiers = [];
        
        if (plan.pricePerServer <= 50) {
          // Plano barato: descontos menores
          discountTiers = [
            { minServers: 5, discountPercent: 5 },
            { minServers: 10, discountPercent: 10 },
            { minServers: 20, discountPercent: 15 }
          ];
        } else if (plan.pricePerServer <= 100) {
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
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

addDiscounts();
