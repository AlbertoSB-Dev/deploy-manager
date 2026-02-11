#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

async function seedPlans() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Definir schema do Plan com discountTiers
    const PlanSchema = new mongoose.Schema({
      name: String,
      description: String,
      pricePerServer: Number,
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

    console.log('\n🗑️  Removendo planos antigos...');
    await Plan.deleteMany({});
    console.log('✅ Planos removidos');

    const plans = [
      {
        name: 'Starter',
        description: 'Perfeito para começar a gerenciar seus servidores',
        pricePerServer: 19.90,
        interval: 'monthly',
        features: [
          'Deploy automático',
          'Suporte por email',
          'Acesso ilimitado a projetos',
          'Monitoramento básico'
        ],
        discountTiers: [
          { minServers: 5, discountPercent: 5 },
          { minServers: 10, discountPercent: 10 },
          { minServers: 20, discountPercent: 15 }
        ],
        isActive: true,
        isPopular: false
      },
      {
        name: 'Professional',
        description: 'Para desenvolvedores e pequenas equipes',
        pricePerServer: 49.90,
        interval: 'monthly',
        features: [
          'Deploy automático',
          'Suporte prioritário',
          'Backups automáticos',
          'Acesso ilimitado a projetos e bancos de dados',
          'Monitoramento avançado',
          'Alertas em tempo real'
        ],
        discountTiers: [
          { minServers: 5, discountPercent: 10 },
          { minServers: 10, discountPercent: 15 },
          { minServers: 20, discountPercent: 20 }
        ],
        isActive: true,
        isPopular: true
      },
      {
        name: 'Enterprise',
        description: 'Solução completa para empresas e grandes equipes',
        pricePerServer: 149.90,
        interval: 'monthly',
        features: [
          'Deploy automático',
          'Suporte 24/7',
          'Backups automáticos',
          'SLA garantido',
          'Acesso ilimitado a tudo',
          'Monitoramento em tempo real',
          'Alertas customizáveis',
          'Relatórios detalhados',
          'Integração com ferramentas externas'
        ],
        discountTiers: [
          { minServers: 5, discountPercent: 15 },
          { minServers: 10, discountPercent: 20 },
          { minServers: 20, discountPercent: 25 },
          { minServers: 50, discountPercent: 30 }
        ],
        isActive: true,
        isPopular: false
      }
    ];

    console.log('\n📝 Criando planos com descontos...');
    for (const planData of plans) {
      const plan = new Plan(planData);
      await plan.save();
      console.log(`✅ Plano criado: ${plan.name}`);
      console.log(`   Preço: R$ ${plan.pricePerServer}/servidor`);
      console.log(`   Descontos:`);
      plan.discountTiers.forEach(tier => {
        console.log(`      ${tier.minServers}+ servidores: ${tier.discountPercent}% OFF`);
      });
    }

    console.log('\n✅ Planos criados com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Acesse a página de preços: http://localhost:3000/pricing');
    console.log('   2. Selecione um plano e mova o slider para ver os descontos');
    console.log('   3. Acesse o admin para editar: http://localhost:3000/admin/plans\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedPlans();
