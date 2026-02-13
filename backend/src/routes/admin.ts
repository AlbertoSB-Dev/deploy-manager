import { Router } from 'express';
import User from '../models/User';
import Plan from '../models/Plan';
import Project from '../models/Project';
import { Server } from '../models/Server';
import Database from '../models/Database';
import { protect, admin, superAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Rotas que requerem apenas admin (admin ou super_admin)
const adminRouter = Router();
adminRouter.use(protect, admin);

// Rotas que requerem super_admin
const superAdminRouter = Router();
superAdminRouter.use(protect, superAdmin);

// ===== ROTAS ADMIN (admin ou super_admin) =====

// Dashboard - Estatísticas gerais
adminRouter.get('/dashboard/stats', async (req: AuthRequest, res) => {
  try {
    console.log('📊 Buscando estatísticas do dashboard...');
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    console.log('1. Contando usuários...');
    // Total de usuários
    const totalUsers = await User.countDocuments();
    console.log(`   Total: ${totalUsers}`);
    
    console.log('2. Contando usuários ativos...');
    // Usuários ativos
    const activeUsers = await User.countDocuments({ isActive: true });
    console.log(`   Ativos: ${activeUsers}`);
    
    console.log('3. Contando novos usuários este mês...');
    // Novos usuários este mês
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    console.log(`   Novos: ${newUsersThisMonth}`);

    console.log('4. Buscando crescimento mensal...');
    // Crescimento de usuários por mês no ano atual
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    console.log(`   Crescimento: ${userGrowth.length} meses com dados`);

    // Preencher meses sem dados
    const monthlyGrowth = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const data = userGrowth.find(g => g._id === month);
      return {
        month,
        count: data ? data.count : 0
      };
    });

    console.log('5. Buscando estatísticas de assinaturas...');
    // Estatísticas de assinaturas
    const subscriptionStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription.status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log(`   Stats: ${subscriptionStats.length} status diferentes`);

    console.log('6. Contando recursos...');
    // Total de projetos, servidores e bancos
    const totalProjects = await Project.countDocuments();
    console.log(`   Projetos: ${totalProjects}`);
    const totalServers = await Server.countDocuments();
    console.log(`   Servidores: ${totalServers}`);
    const totalDatabases = await Database.countDocuments();
    console.log(`   Bancos: ${totalDatabases}`);

    console.log('7. Buscando planos populares...');
    // Planos mais populares
    const popularPlans = await User.aggregate([
      {
        $match: {
          'subscription.planId': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$subscription.planId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'plans',
          localField: '_id',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: '$plan'
      },
      {
        $project: {
          planName: '$plan.name',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    console.log('✅ Estatísticas carregadas com sucesso!');
    res.json({
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      monthlyGrowth,
      subscriptionStats,
      totalProjects,
      totalServers,
      totalDatabases,
      popularPlans
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Listar todos os usuários
adminRouter.get('/users', async (req: AuthRequest, res) => {
  try {
    const users = await User.find()
      .populate('subscription.planId')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar usuário (incluindo assinatura)
adminRouter.put('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { name, email, role, isActive, subscription } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive, subscription },
      { new: true }
    ).populate('subscription.planId');

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar usuário
adminRouter.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== PLANOS =====

// Listar todos os planos
adminRouter.get('/plans', async (req: AuthRequest, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar plano
adminRouter.post('/plans', async (req: AuthRequest, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar plano
adminRouter.put('/plans/:id', async (req: AuthRequest, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar plano
adminRouter.delete('/plans/:id', async (req: AuthRequest, res) => {
  try {
    // Verificar se há usuários usando este plano
    const usersWithPlan = await User.countDocuments({
      'subscription.planId': req.params.id
    });

    if (usersWithPlan > 0) {
      return res.status(400).json({
        error: `Não é possível deletar. ${usersWithPlan} usuário(s) estão usando este plano.`
      });
    }

    const plan = await Plan.findByIdAndDelete(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    res.json({ message: 'Plano deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// CONFIGURAÇÕES DO SISTEMA (SUPER ADMIN APENAS)
// ==========================================

// Obter configurações do sistema
superAdminRouter.get('/settings', async (req: AuthRequest, res) => {
  try {
    const SystemSettings = (await import('../models/SystemSettings')).default;
    
    let settings = await SystemSettings.findOne();
    
    // Se não existir, criar com valores padrão do .env
    if (!settings) {
      settings = new SystemSettings({
        serverIp: process.env.SERVER_IP || 'localhost',
        baseDomain: process.env.BASE_DOMAIN || 'sslip.io',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8000',
        githubClientId: process.env.GITHUB_CLIENT_ID || '',
        githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || '',
        assasApiKey: process.env.ASSAS_API_KEY || '',
        assasWebhookToken: process.env.ASSAS_WEBHOOK_TOKEN || '',
        assasEnvironment: (process.env.ASSAS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar configurações do sistema
superAdminRouter.put('/settings', async (req: AuthRequest, res) => {
  try {
    const SystemSettings = (await import('../models/SystemSettings')).default;
    
    const { serverIp, baseDomain, frontendUrl, githubClientId, githubClientSecret, githubCallbackUrl, assasApiKey, assasWebhookToken, assasEnvironment } = req.body;
    
    // Atualizar no banco de dados
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings({
        serverIp,
        baseDomain,
        frontendUrl,
        githubClientId,
        githubClientSecret,
        githubCallbackUrl,
        assasApiKey,
        assasWebhookToken,
        assasEnvironment: assasEnvironment || 'sandbox',
      });
    } else {
      settings.serverIp = serverIp;
      settings.baseDomain = baseDomain;
      settings.frontendUrl = frontendUrl;
      settings.githubClientId = githubClientId;
      settings.githubClientSecret = githubClientSecret;
      settings.githubCallbackUrl = githubCallbackUrl;
      settings.assasApiKey = assasApiKey;
      settings.assasWebhookToken = assasWebhookToken;
      settings.assasEnvironment = assasEnvironment || 'sandbox';
      settings.updatedAt = new Date();
    }
    
    await settings.save();
    
    // Nota: Não atualizamos o arquivo .env em produção pois ele não está montado no container
    // As configurações são salvas no banco de dados e aplicadas em memória
    
    // Atualizar variáveis de ambiente em memória
    process.env.SERVER_IP = serverIp;
    process.env.BASE_DOMAIN = baseDomain;
    process.env.FRONTEND_URL = frontendUrl;
    process.env.GITHUB_CLIENT_ID = githubClientId;
    process.env.GITHUB_CLIENT_SECRET = githubClientSecret;
    process.env.GITHUB_CALLBACK_URL = githubCallbackUrl;
    process.env.ASSAS_API_KEY = assasApiKey;
    process.env.ASSAS_WEBHOOK_TOKEN = assasWebhookToken;
    process.env.ASSAS_ENVIRONMENT = assasEnvironment || 'sandbox';
    
    res.json({ message: 'Configurações atualizadas com sucesso', settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reiniciar servidor
adminRouter.post('/restart', async (req: AuthRequest, res) => {
  try {
    res.json({ message: 'Servidor reiniciando...' });
    
    // Reiniciar após 2 segundos
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SISTEMA DE ATUALIZAÇÃO
// ==========================================

// Obter informações do sistema
adminRouter.get('/system-info', async (req: AuthRequest, res) => {
  try {
    const { execSync } = await import('child_process');
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Obter versão do package.json
    const packageJsonPath = path.join(__dirname, '../../../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const version = packageJson.version || '1.0.0';
    
    // Obter informações do Git
    let gitCommit = 'unknown';
    let gitBranch = 'unknown';
    let lastUpdate = null;
    
    try {
      gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
      const lastCommitDate = execSync('git log -1 --format=%cd --date=iso', { encoding: 'utf-8' }).trim();
      lastUpdate = new Date(lastCommitDate);
    } catch (error) {
      console.log('Git info not available');
    }
    
    res.json({
      version,
      gitCommit,
      gitBranch,
      lastUpdate,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar se há atualizações disponíveis no GitHub
adminRouter.get('/check-updates', async (req: AuthRequest, res) => {
  try {
    const { execSync } = await import('child_process');
    
    // Buscar atualizações do remoto
    execSync('git fetch origin', { encoding: 'utf-8' });
    
    // Obter commit local
    const localCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    
    // Obter commit remoto
    const remoteCommit = execSync('git rev-parse origin/main', { encoding: 'utf-8' }).trim();
    
    // Verificar se há diferença
    const hasUpdates = localCommit !== remoteCommit;
    
    // Se houver atualizações, obter detalhes
    let updateInfo = null;
    if (hasUpdates) {
      const commitCount = execSync(`git rev-list --count ${localCommit}..${remoteCommit}`, { encoding: 'utf-8' }).trim();
      const latestCommitMsg = execSync('git log origin/main -1 --pretty=%B', { encoding: 'utf-8' }).trim();
      const latestCommitDate = execSync('git log origin/main -1 --format=%cd --date=iso', { encoding: 'utf-8' }).trim();
      
      updateInfo = {
        commitsAhead: parseInt(commitCount),
        latestCommit: remoteCommit.substring(0, 7),
        latestCommitMessage: latestCommitMsg,
        latestCommitDate: new Date(latestCommitDate)
      };
    }
    
    res.json({
      hasUpdates,
      localCommit: localCommit.substring(0, 7),
      remoteCommit: remoteCommit.substring(0, 7),
      updateInfo
    });
  } catch (error: any) {
    console.error('❌ Erro ao verificar atualizações:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar atualizações',
      details: error.message 
    });
  }
});

// Listar versões disponíveis (tags Git)
adminRouter.get('/versions', async (req: AuthRequest, res) => {
  try {
    const { execSync } = await import('child_process');
    
    // Buscar tags do remoto
    execSync('git fetch --tags', { encoding: 'utf-8' });
    
    // Listar todas as tags
    const tagsOutput = execSync('git tag -l --sort=-version:refname', { encoding: 'utf-8' }).trim();
    
    if (!tagsOutput) {
      return res.json({ versions: [] });
    }
    
    const tags = tagsOutput.split('\n');
    
    // Obter detalhes de cada tag
    const versions = tags.map(tag => {
      try {
        const commit = execSync(`git rev-list -n 1 ${tag}`, { encoding: 'utf-8' }).trim();
        const date = execSync(`git log ${tag} -1 --format=%cd --date=iso`, { encoding: 'utf-8' }).trim();
        const message = execSync(`git tag -l --format='%(contents)' ${tag}`, { encoding: 'utf-8' }).trim();
        
        return {
          tag,
          commit: commit.substring(0, 7),
          date: new Date(date),
          message: message || 'Sem descrição'
        };
      } catch (error) {
        return null;
      }
    }).filter(v => v !== null);
    
    // Obter versão atual
    const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    
    res.json({
      versions,
      currentCommit: currentCommit.substring(0, 7)
    });
  } catch (error: any) {
    console.error('❌ Erro ao listar versões:', error);
    res.status(500).json({ 
      error: 'Erro ao listar versões',
      details: error.message 
    });
  }
});

// Fazer rollback para uma versão específica
adminRouter.post('/rollback', async (req: AuthRequest, res) => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const { version } = req.body;
    
    if (!version) {
      return res.status(400).json({ error: 'Versão não especificada' });
    }
    
    console.log(`🔄 Fazendo rollback para versão ${version}...`);
    
    // 1. Fazer backup do .env
    console.log('📦 Fazendo backup do .env...');
    await execAsync('cp .env .env.backup');
    
    // 2. Fazer checkout da versão
    console.log(`⬇️  Voltando para versão ${version}...`);
    await execAsync(`git checkout ${version}`);
    
    // 3. Instalar dependências
    console.log('📦 Instalando dependências...');
    await execAsync('cd backend && npm install');
    await execAsync('cd frontend && npm install');
    
    // 4. Rebuild containers
    console.log('🐳 Reconstruindo containers...');
    await execAsync('docker-compose build');
    
    // 5. Reiniciar containers
    console.log('🔄 Reiniciando containers...');
    await execAsync('docker-compose down');
    await execAsync('docker-compose up -d');
    
    console.log('✅ Rollback concluído!');
    
    res.json({ 
      message: `Rollback para versão ${version} concluído! Reiniciando...`
    });
    
    // Reiniciar processo após 5 segundos
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  } catch (error: any) {
    console.error('❌ Erro ao fazer rollback:', error);
    res.status(500).json({ 
      error: 'Erro ao fazer rollback',
      details: error.message 
    });
  }
});

// Atualizar sistema do GitHub
adminRouter.post('/update', async (req: AuthRequest, res) => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const path = await import('path');
    const fs = await import('fs');
    
    console.log('🔄 Iniciando atualização do sistema...');
    
    // Detectar se está rodando em Docker ou não
    const isDocker = fs.existsSync('/.dockerenv');
    console.log(`📍 Ambiente: ${isDocker ? 'Docker' : 'Host'}`);
    
    if (isDocker) {
      // Rodando em Docker - executar script de atualização no host
      console.log('🐳 Detectado ambiente Docker - Executando atualização em produção');
      
      try {
        // Verificar se há atualizações disponíveis primeiro
        const { stdout: gitFetch } = await execAsync('cd /opt/ark-deploy && git fetch origin main 2>&1');
        const { stdout: gitStatus } = await execAsync('cd /opt/ark-deploy && git status -uno 2>&1');
        
        if (gitStatus.includes('Your branch is up to date')) {
          return res.json({ 
            message: 'Sistema já está atualizado!',
            alreadyUpToDate: true
          });
        }
        
        // Executar script de atualização em produção
        console.log('🚀 Executando script de atualização em produção...');
        
        // Criar script temporário para executar a atualização
        const updateScript = `#!/bin/bash
set -e
cd /opt/ark-deploy
echo "📥 Atualizando código..."
git reset --hard HEAD
git pull origin main
echo "⏹️  Parando containers..."
docker-compose down
echo "🗑️  Removendo imagens antigas..."
docker rmi ark-deploy-frontend ark-deploy-backend 2>/dev/null || true
echo "🧹 Limpando cache..."
docker builder prune -af
rm -rf frontend/.next frontend/node_modules/.cache backend/dist 2>/dev/null || true
echo "🔨 Reconstruindo em modo PRODUÇÃO..."
docker-compose build --no-cache --pull
echo "🚀 Iniciando containers..."
docker-compose up -d
echo "✅ Atualização concluída!"
`;
        
        // Salvar script temporário
        fs.writeFileSync('/tmp/ark-deploy-update.sh', updateScript);
        await execAsync('chmod +x /tmp/ark-deploy-update.sh');
        
        // Executar script em background
        exec('nohup /tmp/ark-deploy-update.sh > /tmp/ark-deploy-update.log 2>&1 &');
        
        res.json({ 
          message: 'Atualização iniciada! O sistema será reiniciado automaticamente em alguns minutos.',
          success: true,
          requiresReload: true
        });
        
      } catch (cmdError: any) {
        console.error('❌ Erro ao executar atualização:', cmdError);
        
        // Fallback: instruções manuais
        res.json({ 
          message: 'Para atualizar o sistema, execute no servidor:\n\ncd /opt/ark-deploy\n./switch-to-production.sh\n\nOu manualmente:\ncd /opt/ark-deploy\ngit pull\ndocker-compose down\ndocker-compose build --no-cache\ndocker-compose up -d',
          requiresManualUpdate: true,
          error: cmdError.message
        });
      }
      
    } else {
      // Rodando no host - pode atualizar automaticamente
      console.log('💻 Detectado ambiente Host');
      
      try {
        // 1. Fazer backup do .env
        console.log('📦 Fazendo backup do .env...');
        if (fs.existsSync('.env')) {
          await execAsync('cp .env .env.backup');
        }
        
        // 2. Verificar se é um repositório git
        const { stdout: isGitRepo } = await execAsync('git rev-parse --is-inside-work-tree 2>/dev/null || echo "false"');
        
        if (isGitRepo.trim() === 'false') {
          throw new Error('Não é um repositório Git. Clone o projeto do GitHub primeiro.');
        }
        
        // 3. Fazer git pull
        console.log('⬇️  Baixando atualizações do GitHub...');
        const { stdout: pullOutput, stderr: pullError } = await execAsync('git pull origin main 2>&1');
        console.log(pullOutput);
        
        if (pullOutput.includes('Already up to date')) {
          return res.json({ 
            message: 'Sistema já está atualizado!',
            output: pullOutput,
            alreadyUpToDate: true
          });
        }
        
        // 4. Instalar dependências
        console.log('📦 Instalando dependências do backend...');
        await execAsync('cd backend && npm install 2>&1');
        
        console.log('📦 Instalando dependências do frontend...');
        await execAsync('cd frontend && npm install 2>&1');
        
        console.log('✅ Atualização concluída!');
        
        res.json({ 
          message: 'Sistema atualizado com sucesso! Reiniciando em 5 segundos...',
          output: pullOutput,
          success: true
        });
        
        // Reiniciar processo após 5 segundos
        setTimeout(() => {
          console.log('🔄 Reiniciando aplicação...');
          process.exit(0);
        }, 5000);
        
      } catch (cmdError: any) {
        console.error('❌ Erro ao executar comandos:', cmdError);
        throw new Error(`Erro ao atualizar: ${cmdError.message}`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao atualizar:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar sistema',
      details: error.message,
      stack: error.stack
    });
  }
});

// ===== GERENCIAMENTO DE ASSINATURAS (SUPER ADMIN) =====

// Listar todas as assinaturas
superAdminRouter.get('/subscriptions', async (req: AuthRequest, res) => {
  try {
    const users = await User.find({ 'subscription': { $exists: true } })
      .populate('subscription.planId')
      .select('name email subscription createdAt')
      .sort({ 'subscription.endDate': 1 });

    const subscriptions = users.map(user => ({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      subscription: user.subscription,
      createdAt: user.createdAt,
    }));

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error: any) {
    console.error('Erro ao listar assinaturas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar assinaturas',
    });
  }
});

// Atualizar assinatura manualmente
superAdminRouter.put('/subscriptions/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { planId, status, serversCount, endDate } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Validar plano se fornecido
    if (planId) {
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          error: 'Plano não encontrado',
        });
      }
    }

    // Atualizar subscription
    if (!user.subscription) {
      user.subscription = {
        status: 'trial',
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      };
    }

    if (planId) user.subscription.planId = planId;
    if (status) user.subscription.status = status;
    if (serversCount) user.subscription.serversCount = serversCount;
    if (endDate) user.subscription.endDate = new Date(endDate);

    await user.save();

    const updatedUser = await User.findById(userId).populate('subscription.planId');

    res.json({
      success: true,
      message: 'Assinatura atualizada com sucesso',
      data: {
        userId: updatedUser!._id,
        userName: updatedUser!.name,
        userEmail: updatedUser!.email,
        subscription: updatedUser!.subscription,
      },
    });
  } catch (error: any) {
    console.error('Erro ao atualizar assinatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar assinatura',
    });
  }
});

// Criar assinatura manual para usuário
superAdminRouter.post('/subscriptions/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { planId, serversCount, durationDays } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (durationDays || 30) * 24 * 60 * 60 * 1000);

    user.subscription = {
      planId: plan._id,
      status: 'active',
      startDate: startDate,
      endDate: endDate,
      serversCount: serversCount || 1,
    };

    await user.save();

    const updatedUser = await User.findById(userId).populate('subscription.planId');

    res.json({
      success: true,
      message: 'Assinatura criada com sucesso',
      data: {
        userId: updatedUser!._id,
        userName: updatedUser!.name,
        userEmail: updatedUser!.email,
        subscription: updatedUser!.subscription,
      },
    });
  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar assinatura',
    });
  }
});

// Cancelar assinatura
superAdminRouter.delete('/subscriptions/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    if (user.subscription) {
      user.subscription.status = 'cancelled';
      user.subscription.endDate = new Date();
      await user.save();
    }

    res.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao cancelar assinatura',
    });
  }
});

// Estender assinatura
superAdminRouter.post('/subscriptions/:userId/extend', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.body;

    if (!days || days < 1) {
      return res.status(400).json({
        success: false,
        error: 'Número de dias inválido',
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.subscription) {
      return res.status(404).json({
        success: false,
        error: 'Usuário ou assinatura não encontrada',
      });
    }

    const currentEndDate = new Date(user.subscription.endDate!);
    const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    user.subscription.endDate = newEndDate;
    if (user.subscription.status === 'cancelled' || user.subscription.status === 'inactive') {
      user.subscription.status = 'active';
    }
    
    await user.save();

    const updatedUser = await User.findById(userId).populate('subscription.planId');

    res.json({
      success: true,
      message: `Assinatura estendida por ${days} dias`,
      data: {
        userId: updatedUser!._id,
        userName: updatedUser!.name,
        userEmail: updatedUser!.email,
        subscription: updatedUser!.subscription,
      },
    });
  } catch (error: any) {
    console.error('Erro ao estender assinatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao estender assinatura',
    });
  }
});

// ===== RELATÓRIO FINANCEIRO (SUPER ADMIN) =====

// Obter relatório financeiro completo
superAdminRouter.get('/revenue', async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Buscar todos os usuários com assinaturas
    const allUsers = await User.find({ 'subscription': { $exists: true } })
      .populate('subscription.planId')
      .select('name email subscription createdAt');

    // Calcular receita total (assinaturas ativas)
    const activeSubscriptions = allUsers.filter(u => 
      u.subscription?.status === 'active' && 
      u.subscription?.planId
    );

    let monthlyRevenue = 0;
    let yearlyRevenue = 0;

    activeSubscriptions.forEach(user => {
      const plan = user.subscription?.planId as any;
      const serversCount = user.subscription?.serversCount || 1;
      
      if (plan && plan.calculatePrice) {
        const price = plan.calculatePrice(serversCount);
        monthlyRevenue += price;
      }
    });

    // Receita anual estimada (MRR * 12)
    yearlyRevenue = monthlyRevenue * 12;

    // Novos assinantes este mês
    const newSubscribersThisMonth = allUsers.filter(u => 
      u.subscription?.status === 'active' &&
      new Date(u.subscription.startDate!) >= startOfMonth
    ).length;

    // Cancelamentos este mês
    const cancelledThisMonth = allUsers.filter(u => 
      u.subscription?.status === 'cancelled' &&
      u.subscription.endDate &&
      new Date(u.subscription.endDate) >= startOfMonth
    ).length;

    // Taxa de churn (cancelamentos / total de assinantes ativos)
    const churnRate = activeSubscriptions.length > 0 
      ? (cancelledThisMonth / activeSubscriptions.length) * 100 
      : 0;

    // Receita por plano
    const revenueByPlan: any = {};
    activeSubscriptions.forEach(user => {
      const plan = user.subscription?.planId as any;
      const serversCount = user.subscription?.serversCount || 1;
      
      if (plan) {
        const planName = plan.name;
        const price = plan.calculatePrice ? plan.calculatePrice(serversCount) : 0;
        
        if (!revenueByPlan[planName]) {
          revenueByPlan[planName] = {
            planName,
            subscribers: 0,
            revenue: 0,
          };
        }
        
        revenueByPlan[planName].subscribers += 1;
        revenueByPlan[planName].revenue += price;
      }
    });

    // Histórico de novos assinantes e cancelamentos nos últimos 12 meses
    const subscriberHistory = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthName = monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Contar novos assinantes neste mês (status active e startDate no mês)
      const newSubscribers = allUsers.filter(u => {
        if (!u.subscription?.startDate) return false;
        const startDate = new Date(u.subscription.startDate);
        return startDate >= monthStart && startDate <= monthEnd && u.subscription.status === 'active';
      }).length;
      
      // Contar cancelamentos neste mês (status cancelled e endDate no mês)
      const cancelledSubscribers = allUsers.filter(u => {
        if (!u.subscription?.endDate) return false;
        const endDate = new Date(u.subscription.endDate);
        return endDate >= monthStart && endDate <= monthEnd && u.subscription.status === 'cancelled';
      }).length;
      
      subscriberHistory.push({
        month: monthName,
        newSubscribers,
        cancelledSubscribers,
      });
    }

    // Distribuição de status
    const statusDistribution = {
      active: allUsers.filter(u => u.subscription?.status === 'active').length,
      trial: allUsers.filter(u => u.subscription?.status === 'trial').length,
      cancelled: allUsers.filter(u => u.subscription?.status === 'cancelled').length,
      inactive: allUsers.filter(u => u.subscription?.status === 'inactive').length,
    };

    // Top clientes (por receita)
    const topCustomers = activeSubscriptions
      .map(user => {
        const plan = user.subscription?.planId as any;
        const serversCount = user.subscription?.serversCount || 1;
        const price = plan && plan.calculatePrice ? plan.calculatePrice(serversCount) : 0;
        
        return {
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          planName: plan?.name || 'Sem plano',
          serversCount,
          monthlyRevenue: price,
          startDate: user.subscription?.startDate,
        };
      })
      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        summary: {
          monthlyRevenue,
          yearlyRevenue,
          activeSubscribers: activeSubscriptions.length,
          totalSubscribers: allUsers.length,
          newSubscribersThisMonth,
          cancelledThisMonth,
          churnRate: churnRate.toFixed(2),
          averageRevenuePerUser: activeSubscriptions.length > 0 
            ? (monthlyRevenue / activeSubscriptions.length).toFixed(2) 
            : 0,
        },
        revenueByPlan: Object.values(revenueByPlan),
        subscriberHistory,
        statusDistribution,
        topCustomers,
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório financeiro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar relatório financeiro',
    });
  }
});

// Montar os routers
router.use('/', adminRouter);
router.use('/', superAdminRouter);

export default router;
