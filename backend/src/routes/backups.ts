import { Router } from 'express';
import { backupService } from '../services/BackupService';
import { protect, AuthRequest } from '../middleware/auth';
import Backup from '../models/Backup';

const router = Router();

// Listar todos os backups do usuário
router.get('/', protect, async (req: AuthRequest, res) => {
  try {
    const { type, resourceId, status } = req.query;
    
    const backups = await backupService.listBackups(req.user?._id!, {
      type: type as any,
      resourceId: resourceId as string,
      status: status as string
    });

    res.json(backups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter backup específico
router.get('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const backup = await Backup.findOne({
      _id: req.params.id,
      userId: req.user?._id
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    res.json(backup);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar backup manual
router.post('/', protect, async (req: AuthRequest, res) => {
  try {
    const { resourceId, type, storageType, minioConfig } = req.body;

    if (!resourceId || !type || !storageType) {
      return res.status(400).json({ 
        error: 'resourceId, type e storageType são obrigatórios' 
      });
    }

    const backup = await backupService.createBackup({
      resourceId,
      type,
      storageType,
      userId: req.user?._id!,
      minioConfig
    });

    res.status(201).json(backup);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar backup de banco de dados
router.post('/database/:databaseId', protect, async (req: AuthRequest, res) => {
  try {
    const { storageType, minioConfig } = req.body;

    const backup = await backupService.createBackup({
      resourceId: req.params.databaseId,
      type: 'database',
      storageType: storageType || 'local',
      userId: req.user?._id!,
      minioConfig
    });

    res.status(201).json(backup);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar backup de projeto
router.post('/project/:projectId', protect, async (req: AuthRequest, res) => {
  try {
    const { storageType, minioConfig } = req.body;

    const backup = await backupService.createBackup({
      resourceId: req.params.projectId,
      type: 'project',
      storageType: storageType || 'local',
      userId: req.user?._id!,
      minioConfig
    });

    res.status(201).json(backup);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar backup de WordPress
router.post('/wordpress/:wordpressId', protect, async (req: AuthRequest, res) => {
  try {
    const { storageType, minioConfig } = req.body;

    const backup = await backupService.createBackup({
      resourceId: req.params.wordpressId,
      type: 'wordpress',
      storageType: storageType || 'local',
      userId: req.user?._id!,
      minioConfig
    });

    res.status(201).json(backup);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Restaurar backup
router.post('/:id/restore', protect, async (req: AuthRequest, res) => {
  try {
    const { targetResourceId } = req.body;

    await backupService.restoreBackup({
      backupId: req.params.id,
      userId: req.user?._id!,
      targetResourceId
    });

    res.json({ message: 'Backup restaurado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar backup
router.delete('/:id', protect, async (req: AuthRequest, res) => {
  try {
    await backupService.deleteBackup(req.params.id, req.user?._id!);
    res.json({ message: 'Backup deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload de backup manual (arquivo)
router.post('/upload', protect, async (req: AuthRequest, res) => {
  try {
    // TODO: Implementar upload de arquivo usando multer
    res.status(501).json({ error: 'Upload de backup não implementado ainda' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download de backup
router.get('/:id/download', protect, async (req: AuthRequest, res) => {
  try {
    const backup = await Backup.findOne({
      _id: req.params.id,
      userId: req.user?._id
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    if (!backup.localPath) {
      return res.status(404).json({ error: 'Arquivo de backup não encontrado' });
    }

    res.download(backup.localPath, backup.name);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
