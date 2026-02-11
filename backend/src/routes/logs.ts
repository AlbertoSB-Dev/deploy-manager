import { Router, Request, Response } from 'express';
import Project from '../models/Project';
import { Server } from '../models/Server';
import { sshService } from '../services/SSHService';

const router = Router();

// Middleware de autenticação que aceita token via query string ou header
const authMiddleware = (req: Request, res: Response, next: any) => {
  // Tentar pegar token do header primeiro
  let token = req.headers.authorization?.replace('Bearer ', '');
  
  // Se não tiver no header, tentar query string (para EventSource)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  // Por enquanto, apenas verificar se tem token
  // TODO: Validar o token JWT aqui
  next();
};

/**
 * GET /api/logs/:projectId/stream
 * Stream de logs em tempo real via SSE (Server-Sent Events)
 */
router.get('/:projectId/stream', authMiddleware, async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('serverId');
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    if (!project.containerId) {
      return res.status(400).json({ error: 'Projeto não tem container ativo' });
    }

    if (!project.serverId) {
      return res.status(400).json({ error: 'Projeto não tem servidor configurado' });
    }

    const server = project.serverId as any;
    
    if (!server._id) {
      return res.status(400).json({ error: 'Servidor não encontrado ou inválido' });
    }
    
    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // Enviar comentário inicial
    res.write(': connected\n\n');
    
    let ssh: any;
    let intervalId: NodeJS.Timeout;
    
    try {
      // Conectar via SSH
      ssh = await sshService.connect(server);
      
      // Enviar logs iniciais
      const initialLogs = await ssh.execCommand(`docker logs --tail 50 ${project.containerId} 2>&1`);
      if (initialLogs.stdout) {
        res.write(`data: ${JSON.stringify({ type: 'stdout', data: initialLogs.stdout })}\n\n`);
      }
      
      // Polling a cada 2 segundos
      let lastTimestamp = Math.floor(Date.now() / 1000);
      intervalId = setInterval(async () => {
        try {
          if (!ssh || res.writableEnded) {
            clearInterval(intervalId);
            return;
          }
          
          const newLogs = await ssh.execCommand(
            `docker logs --since ${lastTimestamp} ${project.containerId} 2>&1`
          );
          
          if (newLogs.stdout && newLogs.stdout.trim()) {
            res.write(`data: ${JSON.stringify({ type: 'stdout', data: newLogs.stdout })}\n\n`);
          }
          
          lastTimestamp = Math.floor(Date.now() / 1000);
        } catch (error: any) {
          console.error('Erro no polling de logs:', error);
          res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro ao conectar SSH:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
      res.end();
    }
    
    // Cleanup
    req.on('close', () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (ssh) {
        ssh.dispose();
      }
      res.end();
    });
    
  } catch (error: any) {
    console.error('Erro geral:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/logs/:projectId/recent
 * Obter logs recentes (últimas N linhas)
 */
router.get('/:projectId/recent', authMiddleware, async (req: Request, res: Response) => {
  try {
    const lines = parseInt(req.query.lines as string) || 100;
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    if (!project.containerId) {
      return res.status(400).json({ error: 'Projeto não tem container ativo' });
    }

    if (!project.serverId) {
      return res.status(400).json({ error: 'Projeto não tem servidor configurado' });
    }

    // Buscar servidor separadamente
    const server = await Server.findById(project.serverId);
    
    if (!server) {
      return res.status(400).json({ error: 'Servidor não encontrado' });
    }

    console.log(`Buscando logs do projeto ${project.name} no servidor ${server.name}`);

    const ssh = await sshService.connect(server);
    
    // Usar 2>&1 para capturar stdout e stderr juntos
    const result = await ssh.execCommand(`docker logs --tail ${lines} ${project.containerId} 2>&1`);
    
    ssh.dispose();
    
    console.log(`Logs obtidos: ${result.stdout?.length || 0} caracteres`);
    
    res.json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      combined: result.stdout || result.stderr || 'Nenhum log disponível'
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar logs recentes:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
