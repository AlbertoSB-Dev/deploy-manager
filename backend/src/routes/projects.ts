import { Router } from 'express';
import Project from '../models/Project';
import { GitService } from '../services/GitService';
import { DeployService } from '../services/DeployService';
import { GitCredentialService } from '../services/GitCredentialService';
import { PortManager } from '../services/PortManager';
import { UpdateCheckerService } from '../services/UpdateCheckerService';
import { protect, AuthRequest } from '../middleware/auth';
import { checkSubscriptionActive, checkCanModify } from '../middleware/subscription';
import { validateCommand } from '../utils/commandValidator';
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
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar novo projeto
router.post('/', protect, checkSubscriptionActive, async (req: AuthRequest, res) => {
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
      // Usar nome do projeto (sanitizado - apenas letras e números, SEM hífens)
      // Remove todos os caracteres especiais e espaços
      const domainPrefix = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');  // Remove tudo exceto letras e números
      
      // Se for deploy remoto, usar IP do servidor
      if (serverId) {
        const { Server } = await import('../models/Server');
        const server = await Server.findById(serverId);
        if (server && server.host) {
          // Formato: nomedoprojeto.IP.COM.PONTOS.sslip.io
          return `${domainPrefix}.${server.host}.sslip.io`;
        }
      }
      
      // Deploy local: usar configuração do .env
      const serverIp = process.env.SERVER_IP || 'localhost';
      const baseDomain = process.env.BASE_DOMAIN || 'localhost';
      
      // Se tiver IP configurado, usar sslip.io
      if (serverIp !== 'localhost' && serverIp.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        // Formato: nomedoprojeto.IP.COM.PONTOS.sslip.io
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
router.put('/:id', protect, checkCanModify, async (req: AuthRequest, res) => {
  try {
    const { name, domain, port, branch, buildCommand, startCommand, envVars } = req.body;
    
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    // Preparar dados para atualização
    const updateData: any = {};
    
    if (name) updateData.name = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (domain) updateData.domain = domain;
    if (port) updateData.port = parseInt(port);
    if (branch) updateData.branch = branch;
    if (buildCommand !== undefined) updateData.buildCommand = buildCommand;
    if (startCommand !== undefined) updateData.startCommand = startCommand;
    if (envVars) updateData.envVars = envVars;
    
    // Atualizar projeto
    const updatedProject = await Project.findOneAndUpdate(
      { _id: (req.params.id as string), userId: req.user?._id },
      { $set: updateData },
      { new: true }
    );
    
    res.json(updatedProject);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar projeto
router.delete('/:id', protect, checkCanModify, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    await deployService.deleteProject((req.params.id as string));
    res.json({ message: 'Projeto deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deploy projeto
router.post('/:id/deploy', protect, checkSubscriptionActive, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const { version, deployedBy } = req.body;
    
    // Retornar imediatamente e fazer deploy em background
    res.json({ 
      success: true, 
      message: 'Deploy iniciado em background',
      projectId: req.params.id,
      version 
    });
    
    // Fazer deploy em background
    const io = (req as any).app.get('io');
    deployService.deployProject((req.params.id as string), version, deployedBy || 'manual')
      .then(result => {
        console.log('✅ Deploy concluído:', result);
        io.to(`deploy-${req.params.id}`).emit('deploy-complete', {
          projectId: req.params.id,
          success: true,
          message: 'Deploy concluído com sucesso'
        });
      })
      .catch(error => {
        console.error('❌ Erro no deploy:', error);
        io.to(`deploy-${req.params.id}`).emit('deploy-complete', {
          projectId: req.params.id,
          success: false,
          message: error.message
        });
      });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rollback rápido (usa container anterior)
router.post('/:id/rollback/fast', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const { deployedBy } = req.body;
    const result = await deployService.rollback((req.params.id as string), undefined, deployedBy || 'manual');
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
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const { deploymentIndex, deployedBy } = req.body;
    const result = await deployService.rollback((req.params.id as string), deploymentIndex, deployedBy || 'manual');
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
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const result = await updateChecker.checkForUpdates((req.params.id as string));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter versões disponíveis (tags e branches)
router.get('/:id/versions', protect, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findOne({ 
      _id: (req.params.id as string),
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
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const logs = await deployService.getProjectLogs((req.params.id as string));
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
    
    // 🔒 VALIDAR COMANDO
    const validation = validateCommand(command);
    if (!validation.valid) {
      console.log(`⚠️ Comando bloqueado no container: ${command}`);
      return res.status(403).json({ 
        output: '',
        error: `Comando não permitido: ${validation.error}`,
      });
    }
    
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      res.status(404).json({ error: 'Projeto não encontrado' });
      return;
    }
    
    const output = await deployService.execCommand((req.params.id as string), validation.sanitized!);
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
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    await deployService.startContainer((req.params.id as string));
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
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    await deployService.stopContainer((req.params.id as string));
    res.json({ message: 'Container parado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reiniciar container
router.post('/:id/container/restart', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o projeto pertence ao usuário
    const project = await Project.findOne({ 
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    // Parar e iniciar o container
    await deployService.stopContainer((req.params.id as string));
    await deployService.startContainer((req.params.id as string));
    res.json({ message: 'Container reiniciado com sucesso' });
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
    const port = parseInt((req.params.port as string));
    
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

// Deletar versão específica (remove containers antigos)
router.delete('/:id/versions/:version', protect, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findOne({ 
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const version = (req.params.version as string);
    console.log('🗑️ Deletando versão:', version);
    
    // Verificar se não é a versão atual
    if (project.currentVersion === version) {
      return res.status(400).json({ error: 'Não é possível deletar a versão atual' });
    }

    // Buscar todos os deploys desta versão (versão semântica ou commit)
    const versionDeployments = project.deployments.filter((d: any) => {
      // Comparar versão semântica ou commit
      return d.version === version || d.commit === version || d.commit?.startsWith(version);
    });
    
    if (versionDeployments.length === 0) {
      return res.status(404).json({ error: 'Versão não encontrada' });
    }

    console.log(`📦 Encontrados ${versionDeployments.length} deploys para deletar`);

    // Deletar containers desta versão
    const { sshService } = await import('../services/SSHService');
    const { Server } = await import('../models/Server');
    
    let deletedContainers = 0;
    
    for (const deployment of versionDeployments) {
      if (deployment.containerId) {
        try {
          if (project.serverId) {
            // Deploy remoto
            const server = await Server.findById(project.serverId);
            if (server) {
              const ssh = await sshService.connect(server);
              await ssh.execCommand(`docker rm -f ${deployment.containerId}`);
              await ssh.dispose();
            }
          } else {
            // Deploy local
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            await execAsync(`docker rm -f ${deployment.containerId}`);
          }
          console.log(`✅ Container ${deployment.containerId.substring(0, 12)} deletado`);
          deletedContainers++;
        } catch (error) {
          console.error(`❌ Erro ao deletar container ${deployment.containerId}:`, error);
        }
      }
    }

    // Remover deploys do histórico
    project.deployments = project.deployments.filter((d: any) => {
      return d.version !== version && d.commit !== version && !d.commit?.startsWith(version);
    });
    await project.save();

    res.json({ 
      message: `Versão ${version} deletada com sucesso`,
      deletedContainers,
      totalDeployments: versionDeployments.length
    });
  } catch (error: any) {
    console.error('❌ Erro ao deletar versão:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar container individual de um deployment específico
router.delete('/:id/deployments/:deploymentIndex', protect, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findOne({ 
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const deploymentIndex = parseInt((req.params.deploymentIndex as string));
    
    if (isNaN(deploymentIndex) || deploymentIndex < 0 || deploymentIndex >= project.deployments.length) {
      return res.status(400).json({ error: 'Índice de deployment inválido' });
    }

    const deployment = project.deployments[deploymentIndex];
    
    // Verificar se não é o container atual
    if (deployment.containerId && deployment.containerId === project.containerId) {
      return res.status(400).json({ error: 'Não é possível deletar o container em execução' });
    }

    console.log(`🗑️ Deletando deployment #${deploymentIndex}`);
    console.log(`📦 Container ID: ${deployment.containerId || 'sem container'}`);

    // Deletar container se existir
    if (deployment.containerId && deployment.containerId !== 'no-container') {
      const { sshService } = await import('../services/SSHService');
      const { Server } = await import('../models/Server');
      
      try {
        if (project.serverId) {
          // Deploy remoto
          const server = await Server.findById(project.serverId);
          if (server) {
            const ssh = await sshService.connect(server);
            await ssh.execCommand(`docker rm -f ${deployment.containerId}`);
            await ssh.dispose();
          }
        } else {
          // Deploy local
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          await execAsync(`docker rm -f ${deployment.containerId}`);
        }
        console.log(`✅ Container ${deployment.containerId.substring(0, 12)} deletado`);
      } catch (error) {
        console.error(`⚠️ Erro ao deletar container (pode já estar deletado):`, error);
        // Continua mesmo se falhar (container pode já ter sido deletado)
      }
    } else {
      console.log(`ℹ️ Deployment sem container, apenas removendo do histórico`);
    }

    // Remover deployment do histórico
    project.deployments.splice(deploymentIndex, 1);
    await project.save();

    res.json({ 
      message: 'Deployment removido com sucesso',
      containerId: deployment.containerId || null,
      hadContainer: !!deployment.containerId
    });
  } catch (error: any) {
    console.error('❌ Erro ao deletar deployment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Diagnosticar e corrigir problemas do Traefik
router.post('/:id/fix-traefik', protect, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findOne({ 
      _id: (req.params.id as string),
      userId: req.user?._id 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    if (!project.serverId) {
      return res.status(400).json({ error: 'Projeto não está em servidor remoto' });
    }

    if (!project.containerId) {
      return res.status(400).json({ error: 'Projeto não tem container ativo' });
    }

    const { Server } = await import('../models/Server');
    const { sshService } = await import('../services/SSHService');
    const { TraefikService } = await import('../services/TraefikService');

    const server = await Server.findById(project.serverId);
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }

    const ssh = await sshService.connect(server);
    const logs: string[] = [];

    // 1. Verificar se Traefik está rodando
    logs.push('🔍 Verificando Traefik...');
    const traefikRunning = await TraefikService.isTraefikRunning(ssh);
    if (!traefikRunning) {
      return res.status(400).json({ 
        error: 'Traefik não está rodando no servidor',
        logs 
      });
    }
    logs.push('✅ Traefik rodando');

    // 2. Detectar rede do Traefik
    logs.push('🔍 Detectando rede do Traefik...');
    const traefikNetworkResult = await ssh.execCommand(`docker inspect traefik-proxy --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{println}}{{end}}' | head -n 1`);
    const traefikNetwork = traefikNetworkResult.stdout.trim();
    logs.push(`✅ Rede do Traefik: ${traefikNetwork}`);

    // 3. Verificar redes do container
    logs.push('🔍 Verificando redes do container...');
    const containerNetworkResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{println}}{{end}}'`);
    const containerNetworks = containerNetworkResult.stdout.trim().split('\n');
    logs.push(`Redes atuais: ${containerNetworks.join(', ')}`);

    // 4. Conectar à rede do Traefik se necessário
    if (!containerNetworks.includes(traefikNetwork)) {
      logs.push(`⚠️  Container não está na rede do Traefik`);
      logs.push(`🔧 Conectando à rede: ${traefikNetwork}...`);
      await ssh.execCommand(`docker network connect ${traefikNetwork} ${project.containerId}`);
      logs.push('✅ Container conectado à rede do Traefik');
    } else {
      logs.push('✅ Container já está na rede do Traefik');
    }

    // 5. Verificar labels
    logs.push('🔍 Verificando labels do Traefik...');
    const labelsResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{index .Config.Labels "traefik.enable"}}'`);
    const hasLabels = labelsResult.stdout.trim() === 'true';
    
    if (!hasLabels) {
      logs.push('❌ Container não tem labels do Traefik');
      logs.push('⚠️  Faça um novo deploy para aplicar labels corretamente');
      return res.json({ 
        success: false, 
        message: 'Container precisa ser recriado com labels do Traefik',
        logs,
        needsRedeploy: true
      });
    }
    logs.push('✅ Labels do Traefik encontrados');

    // 6. Reiniciar Traefik para forçar detecção
    logs.push('🔄 Reiniciando Traefik para forçar detecção...');
    await ssh.execCommand('docker restart traefik-proxy');
    logs.push('✅ Traefik reiniciado');

    // 7. Testar conectividade interna
    logs.push('🔍 Testando conectividade interna...');
    const containerIpResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{if eq $key "${traefikNetwork}"}}{{$value.IPAddress}}{{end}}{{end}}'`);
    const containerIp = containerIpResult.stdout.trim();
    
    if (containerIp) {
      logs.push(`IP do container: ${containerIp}`);
      const testResult = await ssh.execCommand(`docker exec traefik-proxy wget -q -O- --timeout=2 http://${containerIp}:${project.port || 3000} 2>&1 | head -n 1`);
      if (testResult.stdout.trim()) {
        logs.push('✅ Aplicação respondendo internamente');
      } else {
        logs.push('⚠️  Aplicação não está respondendo');
      }
    }

    logs.push('');
    logs.push('✅ Diagnóstico e correção concluídos!');
    logs.push(`🌐 Teste o domínio: http://${project.domain}`);
    logs.push('⏳ Aguarde 5-10 segundos para o Traefik detectar as mudanças');

    res.json({ 
      success: true, 
      message: 'Correções aplicadas com sucesso',
      logs,
      domain: project.domain
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
