#!/usr/bin/env node

/**
 * Migration script to update existing plans from old model to new model
 * Old model: price, maxServers
 * New model: pricePerServer, removed maxServers
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Plan = require('../src/models/Plan').default;

async function migrate() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    console.log('✅ Conectado ao MongoDB');

    console.log('\n📊 Buscando planos antigos...');
    const plans = await Plan.find({});
    console.log(`Encontrados ${plans.length} planos`);

    let updated = 0;
    for (const plan of plans) {
      // Se o plano tem 'price' mas não tem 'pricePerServer', fazer migração
      if (plan.price && !plan.pricePerServer) {
        console.log(`\n🔄 Migrando plano: ${plan.name}`);
        console.log(`   Preço antigo: R$ ${plan.price}`);
        
        plan.pricePerServer = plan.price;
        
        // Remover campos antigos
        if (plan.limits && plan.limits.maxServers) {
          console.log(`   Removendo maxServers: ${plan.limits.maxServers}`);
          delete plan.limits.maxServers;
        }
        
        await plan.save();
        console.log(`   ✅ Migrado para: R$ ${plan.pricePerServer} por servidor`);
        updated++;
      }
    }

    console.log(`\n✅ Migração concluída! ${updated} planos atualizados.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrate();
