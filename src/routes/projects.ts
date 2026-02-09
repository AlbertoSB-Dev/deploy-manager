import { Router } from 'express';
import Project from '../models/Project';
import { GitService } from '../services/GitService';
import { DeployService } from '../services/DeployService';
import { GitCredentialService } from '../services/GitCredentialService';
import { PortManager } from '../services/PortManager';
import { UpdateCheckerService } from '../services/UpdateCheckerService';
import { protect, AuthRequest } from '../middleware/auth';
import path from 'path';

const router = Router();
const deployService = new DeployService();
const updateChecker = new UpdateCheckerService();

// Listar todos os projetos do usuário
router.get('/', protect, async (req: AuthRequest, res) => {
  try {
    const projects = await Project.find({ userId: req.user?._id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter projeto específico do usuário
router.get('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar novo projeto
router.post('/', protect, async (req: AuthRequest, res) => {
  try {
    const { name, displayName, gitUrl, branch, type, port, envVars, buildCommand, startCommand, gitAuth, serverId, serverName } = req.body;
    
    // Garantir que o nome do projeto seja lowercase (Docker requirement)
    const projectName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    const workDir = path.join(process.env.PROJECTS_DIR || '/var/www/projects', projectName);
    
    // Gerenciar porta automaticamente
    let finalPort: number | undefined;
    if (port) {
      // Verificar se porta está disponível
      const portInUse = await PortManager.isPortInUse(parseInt(port));
      if (portInUse) {
        // Buscar porta alternativa
        finalPort = await PortManager.findAvailablePort(parseInt(port));
        console.log(`⚠️  Porta ${port} em uso, usando porta ${finalPort}`);
      } else {
        finalPort = parseInt(port);
      }
    } else {
      // Alocar porta automaticamente
      finalPort = await PortManager.findAvailablePort();
      console.log(`✅ Porta alocada automaticamente: ${finalPort}`);
    }
    
    // Gerar domínio baseado no nome do projeto se não fornecido
    const generateProjectDomain = async () => {
      // Usar nome do projeto (sanitizado)
      const domainPrefix = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      
      // Se for deploy remoto, usar IP do servidor
      if (serverId) {
        const { Server } = await import('../models/Server');
        const server = await Server.findById(serverId);
        if (server && server.host) {
          // Usar IP do servidor remoto com sslip.io
          return `${domainPrefix}.${server.host}.sslip.io`;
        }
      }
      
      // Deploy local: usar configuração do .env
      const serverIp = process.env.SERVER_IP || 'localhost';
      const baseDomain = process.env.BASE_DOMAIN || 'localhost';
      
      // Se tiver IP configurado, usar sslip.io
      if (serverIp !== 'localhost' && serverIp.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return `${domainPrefix}.${serverIp}.sslip.io`;
      }
      
      // Senão, usar formato simples
      return `${domainPrefix}.${baseDomain}`;
    };
    
    const finalDomain = req.body.domain || await generateProjectDomain();
    
    // Buscar IP do servidor se for remoto
    let serverHost: string | undefined;
    if (serverId) {
      const { Server } = await import('../models/Server');
      const server = await Server.findById(serverId);
      if (server) {
        serverHost = server.host;
      }
    }
    
    const project = new Project({
      name: projectName,
      displayName,
      gitUrl,
      branch: branch || 'main',
      type,
      port: finalPort,
      domain: finalDomain,
      envVars: envVars || {},
      buildCommand,
      startCommand,
      workDir,
      gitAuth: gitAuth || { type: 'none' },
      serverId: serverId || undefined,
      serverName: serverName || undefined,
      serverHost: serverHost || undefined,
      userId: req.user?._id // Adicionar userId do usuário logado
    });

    await project.save();

    // Clone repository apenas se for deploy local
    if (!serverId) {
      const gitService = new GitService(workDir, project.gitAuth);
      await gitService.clone(gitUrl, branch || 'main');
    }

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar projeto
router.put('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      { $set: req.body },
      { new: true }
    );
    
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar projeto
router.delete('/:id', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    await deployService.deleteProject(req.params.id);
    res.json({ message: 'Projeto deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deploy projeto
router.post('/:id/deploy', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const { version, deployedBy } = req.body;
    const result = await deployService.deployProject(req.params.id, version, deployedBy || 'manual');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rollback rápido (usa container anterior)
router.post('/:id/rollback/fast', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const { deployedBy } = req.body;
    const result = await deployService.rollback(req.params.id, undefined, deployedBy || 'manual');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rollback completo (faz novo deploy de versão específica)
router.post('/:id/rollback', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const { deploymentIndex, deployedBy } = req.body;
    const result = await deployService.rollback(req.params.id, deploymentIndex, deployedBy || 'manual');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar se há atualizações disponíveis
router.get('/:id/check-updates', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const result = await updateChecker.checkForUpdates(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter versões disponíveis (tags e branches)
router.get('/:id/versions', protect, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const gitService = new GitService(project.workDir, project.gitAuth);
    await gitService.fetch();
    
    const tags = await gitService.getTags();
    const branches = await gitService.getBranches();

    res.json({ tags, branches });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter logs do projeto
router.get('/:id/logs', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const logs = await deployService.getProjectLogs(req.params.id);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Executar comando no container (terminal)
router.post('/:id/exec', protect, async (req: AuthRequest, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      res.status(400).json({ error: 'Comando é obrigatório' });
      return;
    }
    
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!project) {
      res.status(404).json({ error: 'Projeto não encontrado' });
      return;
    }
    
    const output = await deployService.execCommand(req.params.id, command);
    res.json({ output });
  } catch (error: any) {
    res.status(500).json({ 
      output: '',
      error: error.message 
    });
  }
});

// Iniciar container
router.post('/:id/container/start', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    await deployService.startContainer(req.params.id);
    res.json({ message: 'Container iniciado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Parar container
router.post('/:id/container/stop', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    await deployService.stopContainer(req.params.id);
    res.json({ message: 'Container parado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Detectar credenciais Git automaticamente
router.post('/detect-credentials', protect, async (req: AuthRequest, res) => {
  try {
    const { gitUrl } = req.body;
    
    if (!gitUrl) {
      res.status(400).json({ error: 'gitUrl é obrigatório' });
      return;
    }

    console.log(`🔍 Detectando credenciais para: ${gitUrl}`);
    const credentials = await GitCredentialService.detectCredentials(gitUrl);
    
    // Testar se as credenciais funcionam
    const isValid = await GitCredentialService.testCredentials(gitUrl, credentials);
    
    res.json({
      detected: credentials.type !== 'none',
      type: credentials.type,
      hasSSHKey: !!credentials.sshKeyPath,
      hasToken: !!credentials.token,
      username: credentials.username,
      isValid,
      message: credentials.type === 'none' 
        ? 'Nenhuma credencial detectada. Configure manualmente ou use repositório público.'
        : `Credenciais ${credentials.type} detectadas e ${isValid ? 'válidas' : 'inválidas'}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar se porta está disponível
router.get('/check-port/:port', protect, async (req: AuthRequest, res) => {
  try {
    const port = parseInt(req.params.port);
    
    if (isNaN(port) || !PortManager.isValidPort(port)) {
      res.status(400).json({ error: 'Porta inválida. Use portas entre 3000-9000' });
      return;
    }

    const inUse = await PortManager.isPortInUse(port);
    
    res.json({
      port,
      available: !inUse,
      message: inUse ? `Porta ${port} já está em uso` : `Porta ${port} está disponível`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sugerir portas disponíveis
router.get('/suggest-ports', protect, async (req: AuthRequest, res) => {
  try {
    const count = parseInt(req.query.count as string) || 5;
    const suggestions = await PortManager.suggestPorts(count);
    
    res.json({
      suggestions,
      usedPorts: await PortManager.getUsedPorts()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
