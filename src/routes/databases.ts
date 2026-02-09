import { Router } from 'express';
import { databaseService } from '../services/DatabaseService';
import { dockerVersionService } from '../services/DockerVersionService';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// Obter versões disponíveis de bancos de dados (não precisa de auth)
router.get('/versions', async (req, res) => {
  try {
    const versions = await dockerVersionService.getAllVersions();
    res.json(versions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Limpar cache de versões (forçar atualização)
router.post('/versions/refresh', protect, async (req: AuthRequest, res) => {
  try {
    dockerVersionService.clearCache();
    const versions = await dockerVersionService.getAllVersions();
    res.json({ message: 'Cache limpo e versões atualizadas', versions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos os bancos de dados do usuário
router.get('/', protect, async (req: AuthRequest, res) => {
  try {
    const databases = await databaseService.listDatabases(req.user?._id.toString());
    res.json(databases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter banco de dados específico do usuário
router.get('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const database = await databaseService.getDatabase(req.params.id, req.user?._id.toString());
    if (!database) {
      return res.status(404).json({ error: 'Banco de dados não encontrado' });
    }
    res.json(database);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar novo banco de dados
router.post('/', async (req, res) => {
  try {
    const { name, displayName, type, version, serverId } = req.body;
    
    // Validar campos obrigatórios
    if (!name || !type || !version || !serverId) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: name, type, version, serverId' 
      });
    }

    // Validar tipo de banco
    const validTypes = ['mongodb', 'mysql', 'mariadb', 'postgresql', 'redis', 'minio'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Tipo inválido. Use: ${validTypes.join(', ')}` 
      });
    }

    // Garantir que o nome seja lowercase
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Obter io do app
    const io = req.app.get('io');

    const database = await databaseService.createDatabase({
      name: sanitizedName,
      displayName: displayName || name,
      type,
      version,
      serverId
    }, io);

    res.status(201).json(database);
  } catch (error: any) {
    console.error('Erro ao criar banco:', error);
    res.status(500).json({ error: error.message });
  }
});

// Parar banco de dados
router.post('/:id/stop', async (req, res) => {
  try {
    await databaseService.stopDatabase(req.params.id);
    res.json({ message: 'Banco de dados parado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar banco de dados
router.post('/:id/start', async (req, res) => {
  try {
    await databaseService.startDatabase(req.params.id);
    res.json({ message: 'Banco de dados iniciado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reiniciar banco de dados
router.post('/:id/restart', async (req, res) => {
  try {
    await databaseService.restartDatabase(req.params.id);
    res.json({ message: 'Banco de dados reiniciado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter logs do banco de dados
router.get('/:id/logs', async (req, res) => {
  try {
    const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
    const logs = await databaseService.getDatabaseLogs(req.params.id, lines);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar banco de dados
router.delete('/:id', async (req, res) => {
  try {
    await databaseService.deleteDatabase(req.params.id);
    res.json({ message: 'Banco de dados deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
