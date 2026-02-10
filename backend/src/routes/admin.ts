import { Router } from 'express';
import User from '../models/User';
import Plan from '../models/Plan';
import Project from '../models/Project';
import { Server } from '../models/Server';
import Database from '../models/Database';
import { protect, admin, AuthRequest } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de admin
router.use(protect, admin);

// Dashboard - Estatísticas gerais
router.get('/dashboard/stats', async (req: AuthRequest, res) => {
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
router.get('/users', async (req: AuthRequest, res) => {
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
router.put('/users/:id', async (req: AuthRequest, res) => {
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
router.delete('/users/:id', async (req: AuthRequest, res) => {
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
router.get('/plans', async (req: AuthRequest, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar plano
router.post('/plans', async (req: AuthRequest, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar plano
router.put('/plans/:id', async (req: AuthRequest, res) => {
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
router.delete('/plans/:id', async (req: AuthRequest, res) => {
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
// CONFIGURAÇÕES DO SISTEMA
// ==========================================

// Obter configurações do sistema
router.get('/settings', async (req: AuthRequest, res) => {
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
        githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || ''
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar configurações do sistema
router.put('/settings', async (req: AuthRequest, res) => {
  try {
    const SystemSettings = (await import('../models/SystemSettings')).default;
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const { serverIp, baseDomain, frontendUrl, githubClientId, githubClientSecret, githubCallbackUrl } = req.body;
    
    // Atualizar no banco de dados
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings({
        serverIp,
        baseDomain,
        frontendUrl,
        githubClientId,
        githubClientSecret,
        githubCallbackUrl
      });
    } else {
      settings.serverIp = serverIp;
      settings.baseDomain = baseDomain;
      settings.frontendUrl = frontendUrl;
      settings.githubClientId = githubClientId;
      settings.githubClientSecret = githubClientSecret;
      settings.githubCallbackUrl = githubCallbackUrl;
      settings.updatedAt = new Date();
    }
    
    await settings.save();
    
    // Atualizar arquivo .env
    const envPath = path.join(__dirname, '../../.env');
    let envContent = await fs.readFile(envPath, 'utf-8');
    
    // Atualizar variáveis
    envContent = envContent.replace(/SERVER_IP=.*/g, `SERVER_IP=${serverIp}`);
    envContent = envContent.replace(/BASE_DOMAIN=.*/g, `BASE_DOMAIN=${baseDomain}`);
    envContent = envContent.replace(/FRONTEND_URL=.*/g, `FRONTEND_URL=${frontendUrl}`);
    envContent = envContent.replace(/GITHUB_CLIENT_ID=.*/g, `GITHUB_CLIENT_ID=${githubClientId}`);
    envContent = envContent.replace(/GITHUB_CLIENT_SECRET=.*/g, `GITHUB_CLIENT_SECRET=${githubClientSecret}`);
    envContent = envContent.replace(/GITHUB_CALLBACK_URL=.*/g, `GITHUB_CALLBACK_URL=${githubCallbackUrl}`);
    
    await fs.writeFile(envPath, envContent);
    
    // Atualizar variáveis de ambiente em memória
    process.env.SERVER_IP = serverIp;
    process.env.BASE_DOMAIN = baseDomain;
    process.env.FRONTEND_URL = frontendUrl;
    process.env.GITHUB_CLIENT_ID = githubClientId;
    process.env.GITHUB_CLIENT_SECRET = githubClientSecret;
    process.env.GITHUB_CALLBACK_URL = githubCallbackUrl;
    
    res.json({ message: 'Configurações atualizadas com sucesso', settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reiniciar servidor
router.post('/restart', async (req: AuthRequest, res) => {
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

export default router;
