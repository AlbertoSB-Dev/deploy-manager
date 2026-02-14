import express from 'express';
import { Server } from '../models/Server';
import { provisioningService } from '../services/ProvisioningService';
import { sshService } from '../services/SSHService';
import { protect, AuthRequest } from '../middleware/auth';
import { checkServerLimit, checkCanModify } from '../middleware/subscription';
import { validateCommand } from '../utils/commandValidator';
import { serverMonitorService } from '../services/ServerMonitorService';

const router = express.Router();

// Listar todos os servidores do usuário
router.get('/servers', protect, async (req: AuthRequest, res) => {
  try {
    const servers = await Server.find({ userId: req.user?._id }).sort({ createdAt: -1 });
    
    // Buscar contagem de projetos para cada servidor
    const Project = (await import('../models/Project')).default;
    
    const serversWithProjects = await Promise.all(
      servers.map(async (server) => {
        const projectCount = await Project.countDocuments({
          userId: req.user?._id,
          $or: [
            { serverId: server._id.toString() },
            { serverId: { $exists: false } }, // Projetos locais
            { serverId: null }
          ]
        });
        
        return {
          ...server.toObject(),
          projects: Array(projectCount).fill('') // Array com tamanho = número de projetos
        };
      })
    );
    
    res.json(serversWithProjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter servidor específico do usuário
router.get('/servers/:id', protect, async (req: AuthRequest, res) => {
  try {
    const server = await Server.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    res.json(server);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar novo servidor e iniciar provisioning
router.post('/servers', protect, checkServerLimit, async (req: AuthRequest, res) => {
  try {
    const server = new Server({
      ...req.body,
      userId: req.user?._id, // Adicionar userId do usuário logado
      provisioningStatus: 'pending'
    });
    await server.save();
    
    // Iniciar provisioning em background
    const io = (req as any).app.get('io');
    provisioningService.provisionServer(server._id.toString(), io)
      .catch(err => console.error('Erro no provisioning:', err));
    
    res.json({ 
      success: true, 
      server,
      message: 'Servidor adicionado. Provisioning iniciado em background.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar servidor
router.put('/servers/:id', protect, checkCanModify, async (req: AuthRequest, res) => {
  try {
    const server = await Server.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true }
    );
    
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    res.json(server);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar servidor
router.delete('/servers/:id', protect, checkCanModify, async (req: AuthRequest, res) => {
  try {
    const serverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    const server = await Server.findOne({ 
      _id: serverId,
      userId: req.user?._id 
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    console.log(`🗑️ Deletando servidor ${server.name} e TODOS os recursos físicos...`);
    
    // Importar modelos
    const Project = (await import('../models/Project')).default;
    const Database = (await import('../models/Database')).default;
    const { WordPress } = await import('../models/WordPress');
    
    // PASSO 1: LIMPAR TUDO DO SERVIDOR FÍSICO VIA SSH
    try {
      console.log('🔌 Conectando ao servidor para limpeza física...');
      await sshService.connect(server);
      
      // 1. Parar TODOS os containers Docker
      console.log('  🛑 Parando todos os containers...');
      await sshService.executeCommand(serverId, 'docker stop $(docker ps -aq) 2>/dev/null || true');
      
      // 2. Remover TODOS os containers Docker
      console.log('  🗑️ Removendo todos os containers...');
      await sshService.executeCommand(serverId, 'docker rm -f $(docker ps -aq) 2>/dev/null || true');
      
      // 3. Remover TODOS os volumes Docker
      console.log('  💾 Removendo todos os volumes...');
      await sshService.executeCommand(serverId, 'docker volume rm $(docker volume ls -q) 2>/dev/null || true');
      
      // 4. Remover TODAS as imagens Docker
      console.log('  🖼️ Removendo todas as imagens...');
      await sshService.executeCommand(serverId, 'docker rmi -f $(docker images -aq) 2>/dev/null || true');
      
      // 5. Remover TODAS as redes Docker customizadas
      console.log('  🌐 Removendo redes customizadas...');
      await sshService.executeCommand(serverId, 'docker network prune -f 2>/dev/null || true');
      
      // 6. Limpar cache de build do Docker
      console.log('  🧹 Limpando cache de build...');
      await sshService.executeCommand(serverId, 'docker builder prune -af 2>/dev/null || true');
      
      // 7. Remover diretórios de projetos
      console.log('  📁 Removendo diretórios de projetos...');
      await sshService.executeCommand(serverId, 'rm -rf /root/projects/* 2>/dev/null || true');
      await sshService.executeCommand(serverId, 'rm -rf /root/deployments/* 2>/dev/null || true');
      await sshService.executeCommand(serverId, 'rm -rf /opt/projects/* 2>/dev/null || true');
      
      // 8. Remover configurações do Nginx/Traefik
      console.log('  ⚙️ Removendo configurações de proxy...');
      await sshService.executeCommand(serverId, 'rm -rf /etc/nginx/sites-enabled/* 2>/dev/null || true');
      await sshService.executeCommand(serverId, 'rm -rf /etc/nginx/sites-available/* 2>/dev/null || true');
      await sshService.executeCommand(serverId, 'rm -rf /etc/traefik/dynamic/* 2>/dev/null || true');
      
      // 9. Limpar logs do Docker
      console.log('  📝 Limpando logs...');
      await sshService.executeCommand(serverId, 'truncate -s 0 /var/lib/docker/containers/*/*-json.log 2>/dev/null || true');
      
      // 10. Executar limpeza completa do sistema Docker
      console.log('  🧼 Executando limpeza completa do Docker...');
      await sshService.executeCommand(serverId, 'docker system prune -af --volumes 2>/dev/null || true');
      
      // 11. Verificar se ainda há containers rodando
      const checkContainers = await sshService.executeCommand(serverId, 'docker ps -a --format "{{.Names}}" 2>/dev/null || echo "none"');
      if (checkContainers.stdout.trim() !== 'none' && checkContainers.stdout.trim() !== '') {
        console.log('  ⚠️ Ainda existem containers, forçando remoção...');
        await sshService.executeCommand(serverId, 'docker rm -f $(docker ps -aq) 2>/dev/null || true');
      }
      
      console.log('  ✅ Servidor físico completamente limpo!');
    } catch (sshError: any) {
      console.error('  ⚠️ Erro ao limpar servidor físico (continuando com deleção do banco):', sshError.message);
      // Continua mesmo se houver erro na limpeza física
    }
    
    // PASSO 2: DELETAR REGISTROS DO BANCO DE DADOS
    console.log('💾 Deletando registros do banco de dados...');
    
    // Deletar todos os projetos do servidor
    const deletedProjects = await Project.deleteMany({ 
      userId: req.user?._id,
      serverId: serverId
    });
    console.log(`  ✓ ${deletedProjects.deletedCount} projetos deletados do banco`);
    
    // Deletar todos os bancos de dados do servidor
    const deletedDatabases = await Database.deleteMany({ 
      userId: req.user?._id,
      serverId: serverId
    });
    console.log(`  ✓ ${deletedDatabases.deletedCount} bancos de dados deletados do banco`);
    
    // Deletar todos os WordPress do servidor
    const deletedWordPress = await WordPress.deleteMany({ 
      userId: req.user?._id,
      serverId: serverId
    });
    console.log(`  ✓ ${deletedWordPress.deletedCount} sites WordPress deletados do banco`);
    
    // Desconectar SSH
    await sshService.disconnect(serverId);
    
    // Deletar o servidor do banco
    await Server.findByIdAndDelete(serverId);
    console.log(`  ✓ Servidor deletado do banco`);
    
    const totalDeleted = deletedProjects.deletedCount + deletedDatabases.deletedCount + deletedWordPress.deletedCount;
    
    console.log('✅ DELEÇÃO COMPLETA! Servidor totalmente limpo e removido.');
    
    res.json({ 
      success: true, 
      message: `Servidor completamente limpo! ${totalDeleted} recurso(s) removidos do banco de dados e TODOS os containers/volumes/imagens removidos do servidor físico.`,
      deleted: {
        projects: deletedProjects.deletedCount,
        databases: deletedDatabases.deletedCount,
        wordpress: deletedWordPress.deletedCount
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao deletar servidor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter status de provisioning
router.get('/servers/:id/provisioning', protect, async (req: AuthRequest, res) => {
  try {
    const server = await Server.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    res.json({
      status: server.provisioningStatus,
      progress: server.provisioningProgress,
      logs: server.provisioningLogs,
      error: server.provisioningError,
      installedSoftware: server.installedSoftware
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reprovisionar servidor
router.post('/servers/:id/reprovision', protect, async (req: AuthRequest, res) => {
  try {
    // Verificar se o servidor pertence ao usuário
    const server = await Server.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    // Resetar status
    const serverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    await Server.findByIdAndUpdate(serverId, {
      provisioningStatus: 'pending',
      provisioningProgress: 0,
      provisioningLogs: [],
      provisioningError: undefined
    });
    
    // Iniciar provisioning
    const io = (req as any).app.get('io');
    provisioningService.provisionServer(serverId, io)
      .catch(err => console.error('Erro no reprovisioning:', err));
    
    res.json({ success: true, message: 'Reprovisioning iniciado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar sistema do servidor (apt update, upgrade, etc)
router.post('/servers/:id/update-system', protect, async (req: AuthRequest, res) => {
  try {
    const serverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    const server = await Server.findOne({ 
      _id: serverId,
      userId: req.user?._id 
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    console.log(`🔄 Atualizando sistema do servidor ${server.name}...`);
    
    await sshService.connect(server);
    
    // Detectar sistema operacional
    const osResult = await sshService.executeCommand(serverId, 'cat /etc/os-release | grep "^ID=" | cut -d= -f2 | tr -d \'"\'');
    const os = osResult.stdout.trim();
    
    let updateCommands: string[] = [];
    
    if (os === 'ubuntu' || os === 'debian') {
      updateCommands = [
        'export DEBIAN_FRONTEND=noninteractive',
        'apt-get update -y',
        'apt-get upgrade -y',
        'apt-get autoremove -y',
        'apt-get clean'
      ];
    } else if (os === 'centos' || os === 'rhel') {
      updateCommands = [
        'yum update -y',
        'yum clean all'
      ];
    } else {
      return res.status(400).json({ error: 'Sistema operacional não suportado' });
    }
    
    // Executar comandos
    for (const cmd of updateCommands) {
      console.log(`Executando: ${cmd}`);
      const result = await sshService.executeCommand(serverId, cmd);
      if (result.code !== 0) {
        console.error(`Erro ao executar ${cmd}:`, result.stderr);
      }
    }
    
    console.log('✅ Sistema atualizado com sucesso');
    
    res.json({ 
      success: true, 
      message: 'Sistema atualizado com sucesso',
      os
    });
  } catch (error: any) {
    console.error('Erro ao atualizar sistema:', error);
    res.status(500).json({ error: error.message });
  }
});

// Testar conexão SSH
router.post('/servers/:id/test', protect, async (req: AuthRequest, res) => {
  try {
    const server = await Server.findOne({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    // Usar o serviço de monitoramento para verificar
    const isConnected = await serverMonitorService.checkServer(req.params.id);
    
    if (isConnected) {
      res.json({ success: true, message: 'Conexão estabelecida com sucesso', status: 'online' });
    } else {
      res.json({ success: false, message: 'Falha na conexão', status: 'offline' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Executar comando SSH
router.post('/servers/:id/execute', protect, async (req: AuthRequest, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Comando não fornecido' });
    }
    
    const serverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    const server = await Server.findOne({ 
      _id: serverId,
      userId: req.user?._id 
    });
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    await sshService.connect(server);
    const result = await sshService.executeCommand(serverId, command);
    
    res.json({
      success: result.code === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Executar comando SSH (rota alternativa para compatibilidade com frontend)
router.post('/servers/:id/exec', protect, async (req: AuthRequest, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Comando não fornecido' });
    }
    
    // 🔒 VALIDAR COMANDO ANTES DE EXECUTAR
    const validation = validateCommand(command);
    if (!validation.valid) {
      console.log(`⚠️ Comando bloqueado: ${command}`);
      console.log(`   Razão: ${validation.error}`);
      return res.status(403).json({ 
        output: '',
        error: `Comando não permitido: ${validation.error}`,
        code: 1,
        success: false
      });
    }
    
    const serverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    const server = await Server.findOne({ 
      _id: serverId,
      userId: req.user?._id 
    });
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    console.log(`🔧 Executando comando validado no servidor ${server.name}: ${validation.sanitized}`);
    
    await sshService.connect(server);
    const result = await sshService.executeCommand(serverId, validation.sanitized!);
    
    console.log(`📤 Resultado - Code: ${result.code}, Stdout: "${result.stdout}", Stderr: "${result.stderr}"`);
    
    // Combinar stdout e stderr para melhor visualização
    const output = result.stdout || result.stderr || '';
    
    res.json({
      output: output,
      error: result.code !== 0 && result.stderr ? result.stderr : undefined,
      code: result.code,
      success: result.code === 0
    });
  } catch (error: any) {
    console.error(`❌ Erro ao executar comando:`, error);
    res.status(500).json({ 
      output: '',
      error: error.message,
      code: 1,
      success: false
    });
  }
});

// Listar containers Docker do servidor
router.get('/servers/:id/containers', protect, async (req: AuthRequest, res) => {
  try {
    const serverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    const server = await Server.findOne({ 
      _id: serverId,
      userId: req.user?._id 
    });
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    // Buscar projetos e bancos de dados do usuário neste servidor
    const Project = (await import('../models/Project')).default;
    const Database = (await import('../models/Database')).default;
    
    const projects = await Project.find({ 
      userId: req.user?._id,
      $or: [
        { serverId: serverId },
        { serverId: { $exists: false } }, // Projetos locais
        { serverId: null }
      ],
      containerId: { $exists: true, $ne: null }
    });
    
    const databases = await Database.find({ 
      userId: req.user?._id,
      $or: [
        { serverId: serverId },
        { serverId: { $exists: false } }, // Bancos locais
        { serverId: null }
      ],
      containerId: { $exists: true, $ne: null }
    });
    
    // Montar lista de containers gerenciados
    const containers = [
      ...projects.map(p => ({
        id: p.containerId,
        name: p.displayName,
        type: 'project',
        status: p.status,
        image: `${p.name}:latest`,
        isRunning: p.status === 'active'
      })),
      ...databases.map(db => ({
        id: db.containerId,
        name: db.displayName,
        type: 'database',
        status: db.status,
        image: `${db.type}:${db.version}`,
        isRunning: db.status === 'running'
      }))
    ];
    
    res.json({ containers });
  } catch (error: any) {
    res.status(500).json({ 
      containers: [],
      error: error.message 
    });
  }
});

// Obter métricas do servidor (CPU, RAM, Disco, etc)
router.get('/servers/:id/metrics', protect, async (req: AuthRequest, res) => {
  try {
    const serverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    const server = await Server.findOne({ 
      _id: serverId,
      userId: req.user?._id 
    });
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    await sshService.connect(server);
    
    // CPU Usage
    const cpuResult = await sshService.executeCommand(
      serverId,
      "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'"
    );
    
    // Memory Usage
    const memResult = await sshService.executeCommand(
      serverId,
      "free | grep Mem | awk '{print ($3/$2) * 100.0}'"
    );
    
    // Disk Usage
    const diskResult = await sshService.executeCommand(
      serverId,
      "df -h / | tail -1 | awk '{print $5}' | sed 's/%//'"
    );
    
    // Total Memory
    const totalMemResult = await sshService.executeCommand(
      serverId,
      "free -h | grep Mem | awk '{print $2}'"
    );
    
    // Used Memory
    const usedMemResult = await sshService.executeCommand(
      serverId,
      "free -h | grep Mem | awk '{print $3}'"
    );
    
    // Total Disk
    const totalDiskResult = await sshService.executeCommand(
      serverId,
      "df -h / | tail -1 | awk '{print $2}'"
    );
    
    // Used Disk
    const usedDiskResult = await sshService.executeCommand(
      serverId,
      "df -h / | tail -1 | awk '{print $3}'"
    );
    
    // Uptime
    const uptimeResult = await sshService.executeCommand(
      serverId,
      "uptime -p"
    );
    
    // Load Average
    const loadResult = await sshService.executeCommand(
      serverId,
      "uptime | awk -F'load average:' '{print $2}' | awk '{print $1, $2, $3}'"
    );
    
    // Network Stats
    const networkResult = await sshService.executeCommand(
      serverId,
      "cat /proc/net/dev | grep -E 'eth0|ens|enp' | head -1 | awk '{print $2, $10}'"
    );
    
    // Top Processes
    const processesResult = await sshService.executeCommand(
      serverId,
      "ps aux --sort=-%cpu | head -6 | tail -5 | awk '{print $11, $3, $4}'"
    );
    
    // Docker Stats
    const dockerStatsResult = await sshService.executeCommand(
      serverId,
      "docker stats --no-stream --format '{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}' 2>/dev/null || echo ''"
    );
    
    // Parse results
    const cpu = parseFloat(cpuResult.stdout.trim()) || 0;
    const memory = parseFloat(memResult.stdout.trim()) || 0;
    const disk = parseFloat(diskResult.stdout.trim()) || 0;
    
    const networkParts = networkResult.stdout.trim().split(' ');
    const rxBytes = parseInt(networkParts[0]) || 0;
    const txBytes = parseInt(networkParts[1]) || 0;
    
    const loadParts = loadResult.stdout.trim().replace(/,/g, '').split(' ');
    
    const processes = processesResult.stdout.trim().split('\n').map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        name: parts[0] || 'unknown',
        cpu: parseFloat(parts[1]) || 0,
        memory: parseFloat(parts[2]) || 0
      };
    }).filter(p => p.name !== 'unknown');
    
    const dockerContainers = dockerStatsResult.stdout.trim().split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [name, cpu, mem] = line.split('|');
        return {
          name: name || 'unknown',
          cpu: cpu || '0%',
          memory: mem || '0B / 0B'
        };
      });
    
    res.json({
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(memory * 10) / 10,
      disk: Math.round(disk * 10) / 10,
      totalMemory: totalMemResult.stdout.trim(),
      usedMemory: usedMemResult.stdout.trim(),
      totalDisk: totalDiskResult.stdout.trim(),
      usedDisk: usedDiskResult.stdout.trim(),
      uptime: uptimeResult.stdout.trim().replace('up ', ''),
      loadAverage: {
        '1min': parseFloat(loadParts[0]) || 0,
        '5min': parseFloat(loadParts[1]) || 0,
        '15min': parseFloat(loadParts[2]) || 0
      },
      network: {
        received: (rxBytes / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        transmitted: (txBytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
      },
      topProcesses: processes,
      dockerContainers: dockerContainers
    });
  } catch (error: any) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ 
      error: error.message,
      cpu: 0,
      memory: 0,
      disk: 0
    });
  }
});

export default router;
