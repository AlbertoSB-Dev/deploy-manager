const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager';

async function updatePlans() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    const PlanSchema = new mongoose.Schema({
      name: String,
      description: String,
      price: Number,
      interval: String,
      features: [String],
      limits: {
        maxProjects: Number,
        maxServers: Number,
        maxDatabases: Number,
        maxStorage: Number,
      },
      isActive: Boolean,
      isPopular: Boolean,
    }, { timestamps: true });

    const Plan = mongoose.model('Plan', PlanSchema);

    console.log('🗑️  Deletando planos antigos...');
    await Plan.deleteMany({});
    console.log('✅ Planos deletados\n');

    const plans = [
      {
        name: 'Starter',
        description: 'Perfeito para começar a gerenciar seus servidores',
        price: 19.90,
        interval: 'monthly',
        features: [
          'Gerenciamento de até 3 servidores VPS',
          'Deploy automático via Git',
          'Monitoramento básico de recursos',
          'Gerenciamento de até 3 bancos de dados',
          'SSL automático',
          'Logs de deploy',
          'Suporte por email',
        ],
        limits: {
          maxProjects: 5,
          maxServers: 3,
          maxDatabases: 5,
          maxStorage: 0, // Não usado - usuário usa storage do próprio VPS
        },
        isActive: true,
        isPopular: false,
      },
      {
        name: 'Professional',
        description: 'Para desenvolvedores e pequenas equipes',
        price: 49.90,
        interval: 'monthly',
        features: [
          'Tudo do plano Starter',
          'Gerenciamento de até 10 servidores VPS',
          'Deploy automático com CI/CD',
          'Monitoramento avançado (CPU, RAM, Disco)',
          'Gerenciamento de até 15 bancos de dados',
          'Múltiplos ambientes (dev, staging, prod)',
          'Webhooks personalizados',
          'Logs avançados e histórico',
          'Suporte prioritário',
        ],
        limits: {
          maxProjects: 20,
          maxServers: 10,
          maxDatabases: 15,
          maxStorage: 0,
        },
        isActive: true,
        isPopular: true,
      },
      {
        name: 'Enterprise',
        description: 'Solução completa para empresas e grandes equipes',
        price: 149.90,
        interval: 'monthly',
        features: [
          'Tudo do plano Professional',
          'Servidores ilimitados',
          'Projetos ilimitados',
          'Bancos de dados ilimitados',
          'Gerenciamento de equipe e permissões',
          'API completa para integrações',
          'Relatórios e analytics avançados',
          'Backup automático de configurações',
          'Suporte 24/7 com SLA',
          'Onboarding personalizado',
        ],
        limits: {
          maxProjects: 999,
          maxServers: 999,
          maxDatabases: 999,
          maxStorage: 0,
        },
        isActive: true,
        isPopular: false,
      },
    ];

    console.log('📦 Criando planos atualizados...\n');

    for (const planData of plans) {
      const plan = new Plan(planData);
      await plan.save();
      
      console.log(`✅ Plano "${planData.name}" criado!`);
      console.log(`   💰 R$ ${planData.price}/mês`);
      console.log(`   🖥️  Até ${planData.limits.maxServers === 999 ? 'ilimitados' : planData.limits.maxServers} servidores`);
      console.log(`   📦 Até ${planData.limits.maxProjects === 999 ? 'ilimitados' : planData.limits.maxProjects} projetos`);
      console.log(`   🗄️  Até ${planData.limits.maxDatabases === 999 ? 'ilimitados' : planData.limits.maxDatabases} bancos`);
      console.log(`   ${planData.isPopular ? '⭐ MAIS POPULAR' : ''}\n`);
    }

    console.log('🎉 Planos atualizados!\n');
    console.log('💡 Nota: O limite de storage foi removido pois os usuários');
    console.log('   usam o armazenamento dos próprios servidores VPS.\n');
    console.log('📝 Acesse: http://localhost:8000/admin/plans\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updatePlans();
