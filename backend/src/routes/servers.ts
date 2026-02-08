import express from 'express';
import { Server } from '../models/Server';
import { provisioningService } from '../services/ProvisioningService';
import { sshService } from '../services/SSHService';

const router = express.Router();

// Listar todos os servidores
router.get('/servers', async (req, res) => {
  try {
    const servers = await Server.find().sort({ createdAt: -1 });
    res.json(servers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter servidor específico
router.get('/servers/:id', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    res.json(server);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar novo servidor e iniciar provisioning
router.post('/servers', async (req, res) => {
  try {
    const server = new Server(req.body);
    server.provisioningStatus = 'pending';
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
router.put('/servers/:id', async (req, res) => {
  try {
    const server = await Server.findByIdAndUpdate(
      req.params.id,
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
router.delete('/servers/:id', async (req, res) => {
  try {
    const server = await Server.findByIdAndDelete(req.params.id);
    
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    // Desconectar SSH se estiver conectado
    await sshService.disconnect(req.params.id);
    
    res.json({ success: true, message: 'Servidor deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter status de provisioning
router.get('/servers/:id/provisioning', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
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
router.post('/servers/:id/reprovision', async (req, res) => {
  try {
    // Resetar status
    await Server.findByIdAndUpdate(req.params.id, {
      provisioningStatus: 'pending',
      provisioningProgress: 0,
      provisioningLogs: [],
      provisioningError: undefined
    });
    
    // Iniciar provisioning
    const io = (req as any).app.get('io');
    provisioningService.provisionServer(req.params.id, io)
      .catch(err => console.error('Erro no reprovisioning:', err));
    
    res.json({ success: true, message: 'Reprovisioning iniciado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Testar conexão SSH
router.post('/servers/:id/test', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
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
router.post('/servers/:id/execute', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Comando não fornecido' });
    }
    
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }
    
    const ssh = await sshService.connect(server);
    const result = await sshService.executeCommand(req.params.id, command);
    
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

export default router;
