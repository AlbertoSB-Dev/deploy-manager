import express from 'express';
import { Server } from '../models/Server';
import { provisioningService } from '../services/ProvisioningService';
import { sshService } from '../services/SSHService';
import { protect, AuthRequest } from '../middleware/auth';
import { validateCommand } from '../utils/commandValidator';

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
router.post('/servers', protect, async (req: AuthRequest, res) => {
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
router.put('/servers/:id', protect, async (req: AuthRequest, res) => {
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
router.delete('/servers/:id', protect, async (req: AuthRequest, res) => {
  try {
    const server = await Server.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user?._id 
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    // Desconectar SSH se estiver conectado
    const serverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await sshService.disconnect(serverId);
    
    res.json({ success: true, message: 'Servidor deletado com sucesso' });
  } catch (error: any) {
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
    
    const isConnected = await sshService.testConnection(server);
    
    if (isConnected) {
      await Server.findByIdAndUpdate(req.params.id, {
        status: 'online',
        lastCheck: new Date()
      });
      res.json({ success: true, message: 'Conexão estabelecida com sucesso' });
    } else {
      await Server.findByIdAndUpdate(req.params.id, {
        status: 'offline',
        lastCheck: new Date()
      });
      res.json({ success: false, message: 'Falha na conexão' });
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
