import { Router } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { panelDeployService } from '../services/PanelDeployService';
import PanelVersion from '../models/PanelVersion';

const router = Router();

// Middleware para verificar se é admin ou super_admin
const isAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  next();
};

// Sincronizar com GitHub
router.post('/sync-github', protect, isAdmin, async (req: AuthRequest, res) => {
  try {
    const commit = await panelDeployService.syncFromGitHub();
    
    res.json({
      message: 'Sincronização com GitHub concluída',
      commit
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter todas as versões do painel
router.get('/versions', protect, isAdmin, async (req: AuthRequest, res) => {
  try {
    const versions = await panelDeployService.getVersions();
    const current = await panelDeployService.getCurrentVersion();
    
    res.json({
      versions,
      currentVersion: current
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter versão atual
router.get('/current', protect, isAdmin, async (req: AuthRequest, res) => {
  try {
    const current = await panelDeployService.getCurrentVersion();
    res.json({ currentVersion: current });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fazer deploy de uma versão
router.post('/deploy', protect, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({ error: 'Versão é obrigatória' });
    }

    // Iniciar deploy em background
    panelDeployService.deployVersion(version, req.user?.email || 'admin').catch(error => {
      console.error('Erro no deploy:', error);
    });

    res.json({
      message: `Deploy da versão ${version} iniciado`,
      version
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fazer rollback
router.post('/rollback', protect, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { version } = req.body;

    // Iniciar rollback em background
    panelDeployService.rollback(version).catch(error => {
      console.error('Erro no rollback:', error);
    });

    res.json({
      message: 'Rollback iniciado',
      targetVersion: version || 'versão anterior'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar nova versão
router.post('/versions', protect, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { version, message } = req.body;

    if (!version) {
      return res.status(400).json({ error: 'Versão é obrigatória' });
    }

    // Validar formato de versão semântica
    if (!version.match(/^v?\d+\.\d+\.\d+$/)) {
      return res.status(400).json({ error: 'Formato de versão inválido. Use: v1.0.0 ou 1.0.0' });
    }

    const panelVersion = await panelDeployService.createVersion(
      version,
      message || '',
      req.user?.email || 'admin'
    );

    res.json({
      message: `Versão ${version} criada com sucesso`,
      version: panelVersion
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar versão
router.delete('/versions/:version', protect, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { version } = req.params;

    const result = await panelDeployService.deleteVersion(version as string);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
