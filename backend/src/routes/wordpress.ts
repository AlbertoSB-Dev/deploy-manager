import express from 'express';
import { WordPressService } from '../services/WordPressService';
import { Server } from '../models/Server';
import { protect, AuthRequest } from '../middleware/auth';
import { checkSubscriptionActive, checkCanModify } from '../middleware/subscription';

const router = express.Router();

/**
 * POST /api/wordpress/install
 * Instalar novo WordPress
 */
router.post('/install', protect, checkSubscriptionActive, async (req: AuthRequest, res) => {
  try {
    const { serverId, name, domain, wpAdminUser, wpAdminPassword, wpAdminEmail } = req.body;

    // Validações
    if (!serverId || !name || !wpAdminEmail) {
      return res.status(400).json({ error: 'Campos obrigatórios: serverId, name, wpAdminEmail' });
    }

    // Verificar se servidor pertence ao usuário
    const server = await Server.findOne({ _id: serverId, userId: req.user?._id });
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(wpAdminEmail)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Instalar WordPress
    const wordpress = await WordPressService.install({
      userId: req.user!._id.toString(),
      serverId,
      name,
      domain,
      wpAdminUser,
      wpAdminPassword,
      wpAdminEmail,
    });

    res.json({
      success: true,
      wordpress: {
        id: wordpress._id,
        name: wordpress.name,
        domain: wordpress.domain,
        adminUrl: `http://${wordpress.domain}/wp-admin`,
        adminUser: wordpress.wpAdminUser,
        adminPassword: wordpress.wpAdminPassword, // Mostrar apenas uma vez
        status: wordpress.status,
      },
      message: 'Instalação iniciada. Aguarde 2-3 minutos para conclusão.',
    });
  } catch (error: any) {
    console.error('Erro ao instalar WordPress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wordpress
 * Listar WordPress do usuário
 */
router.get('/', protect, async (req: AuthRequest, res) => {
  try {
    const wordpressList = await WordPressService.list(req.user!._id.toString());
    
    // Não retornar senhas na listagem
    const sanitized = wordpressList.map(wp => ({
      id: wp._id,
      name: wp.name,
      domain: wp.domain,
      adminUrl: `http://${wp.domain}/wp-admin`,
      adminUser: wp.wpAdminUser,
      status: wp.status,
      serverId: wp.serverId,
      createdAt: wp.createdAt,
      updatedAt: wp.updatedAt,
    }));

    res.json(sanitized);
  } catch (error: any) {
    console.error('Erro ao listar WordPress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wordpress/:id
 * Obter WordPress por ID
 */
router.get('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const wordpress = await WordPressService.getById(req.params.id, req.user!._id.toString());
    
    if (!wordpress) {
      return res.status(404).json({ error: 'WordPress não encontrado' });
    }

    // Não retornar senhas
    res.json({
      id: wordpress._id,
      name: wordpress.name,
      domain: wordpress.domain,
      adminUrl: `http://${wordpress.domain}/wp-admin`,
      adminUser: wordpress.wpAdminUser,
      adminEmail: wordpress.wpAdminEmail,
      status: wordpress.status,
      serverId: wordpress.serverId,
      containerName: wordpress.containerName,
      dbContainerName: wordpress.dbContainerName,
      installationLog: wordpress.installationLog,
      createdAt: wordpress.createdAt,
      updatedAt: wordpress.updatedAt,
    });
  } catch (error: any) {
    console.error('Erro ao obter WordPress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/wordpress/:id/start
 * Iniciar WordPress
 */
router.post('/:id/start', protect, async (req: AuthRequest, res) => {
  try {
    await WordPressService.start(req.params.id, req.user!._id.toString());
    res.json({ success: true, message: 'WordPress iniciado' });
  } catch (error: any) {
    console.error('Erro ao iniciar WordPress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/wordpress/:id/stop
 * Parar WordPress
 */
router.post('/:id/stop', protect, async (req: AuthRequest, res) => {
  try {
    await WordPressService.stop(req.params.id, req.user!._id.toString());
    res.json({ success: true, message: 'WordPress parado' });
  } catch (error: any) {
    console.error('Erro ao parar WordPress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/wordpress/:id/restart
 * Reiniciar WordPress
 */
router.post('/:id/restart', protect, async (req: AuthRequest, res) => {
  try {
    await WordPressService.restart(req.params.id, req.user!._id.toString());
    res.json({ success: true, message: 'WordPress reiniciado' });
  } catch (error: any) {
    console.error('Erro ao reiniciar WordPress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/wordpress/:id
 * Excluir WordPress
 */
router.delete('/:id', protect, checkCanModify, async (req: AuthRequest, res) => {
  try {
    await WordPressService.delete(req.params.id, req.user!._id.toString());
    res.json({ success: true, message: 'WordPress excluído' });
  } catch (error: any) {
    console.error('Erro ao excluir WordPress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wordpress/:id/logs
 * Obter logs
 */
router.get('/:id/logs', protect, async (req: AuthRequest, res) => {
  try {
    const lines = parseInt(req.query.lines as string) || 100;
    const logs = await WordPressService.getLogs(req.params.id, req.user!._id.toString(), lines);
    res.json(logs);
  } catch (error: any) {
    console.error('Erro ao obter logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/wordpress/:id/domain
 * Atualizar domínio
 */
router.put('/:id/domain', protect, checkCanModify, async (req: AuthRequest, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domínio é obrigatório' });
    }

    await WordPressService.updateDomain(req.params.id, req.user!._id.toString(), domain);
    res.json({ success: true, message: 'Domínio atualizado' });
  } catch (error: any) {
    console.error('Erro ao atualizar domínio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wordpress/:id/status
 * Obter status dos containers
 */
router.get('/:id/status', protect, async (req: AuthRequest, res) => {
  try {
    const status = await WordPressService.getStatus(req.params.id, req.user!._id.toString());
    res.json(status);
  } catch (error: any) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
