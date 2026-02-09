const mongoose = require('mongoose');

// Conectar ao MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager';

async function seedPlans() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Definir schema do Plan
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

    // Verificar se já existem planos
    const existingPlans = await Plan.countDocuments();
    if (existingPlans > 0) {
      console.log(`⚠️  Já existem ${existingPlans} plano(s) cadastrado(s).`);
      console.log('   Deseja continuar e adicionar mais planos? (Os planos existentes não serão afetados)\n');
    }

    // Planos a serem criados
    const plans = [
      {
        name: 'Básico',
        description: 'Ideal para projetos pessoais e pequenos sites',
        price: 29.90,
        interval: 'monthly',
        features: [
          'Deploy automático via Git',
          'SSL gratuito',
          'Monitoramento básico',
          'Suporte por email',
          'Backups diários',
        ],
        limits: {
          maxProjects: 3,
          maxServers: 1,
          maxDatabases: 3,
          maxStorage: 10,
        },
        isActive: true,
        isPopular: false,
      },
      {
        name: 'Profissional',
        description: 'Perfeito para desenvolvedores e pequenas empresas',
        price: 79.90,
        interval: 'monthly',
        features: [
          'Tudo do plano Básico',
          'Deploy automático via Git',
          'SSL gratuito',
          'Monitoramento avançado',
          'Suporte prioritário',
          'Backups a cada 6 horas',
          'Ambientes de staging',
          'Logs avançados',
        ],
        limits: {
          maxProjects: 10,
          maxServers: 3,
          maxDatabases: 10,
          maxStorage: 50,
        },
        isActive: true,
        isPopular: true, // Plano mais popular
      },
      {
        name: 'Empresarial',
        description: 'Solução completa para empresas e equipes',
        price: 199.90,
        interval: 'monthly',
        features: [
          'Tudo do plano Profissional',
          'Projetos ilimitados',
          'Servidores ilimitados',
          'Bancos de dados ilimitados',
          'Suporte 24/7',
          'Backups em tempo real',
          'Múltiplos ambientes',
          'CI/CD avançado',
          'Gerenciamento de equipe',
          'SLA garantido',
        ],
        limits: {
          maxProjects: 999,
          maxServers: 999,
          maxDatabases: 999,
          maxStorage: 500,
        },
        isActive: true,
        isPopular: false,
      },
    ];

    console.log('📦 Criando planos...\n');

    for (const planData of plans) {
      // Verificar se o plano já existe
      const existing = await Plan.findOne({ name: planData.name });
      
      if (existing) {
        console.log(`⏭️  Plano "${planData.name}" já existe, pulando...`);
        continue;
      }

      const plan = new Plan(planData);
      await plan.save();
      
      console.log(`✅ Plano "${planData.name}" criado com sucesso!`);
      console.log(`   💰 Preço: R$ ${planData.price}/mês`);
      console.log(`   📊 Limites: ${planData.limits.maxProjects} projetos, ${planData.limits.maxServers} servidores, ${planData.limits.maxDatabases} bancos`);
      console.log(`   ${planData.isPopular ? '⭐ MAIS POPULAR' : ''}\n`);
    }

    console.log('\n🎉 Processo concluído!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Acesse o painel admin: http://localhost:8000/admin');
    console.log('   2. Clique em "Gerenciar Planos"');
    console.log('   3. Visualize e edite os planos criados\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedPlans();
