import { Router } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { SFTPService } from '../services/SFTPService';
import { Server } from '../models/Server';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
    files: 100,
  },
});

// Middleware para verificar se servidor pertence ao usuário
async function verifyServerOwnership(req: AuthRequest, res: any, next: any) {
  try {
    const server = await Server.findOne({
      _id: (req.params.serverId as string),
      userId: req.user?._id,
    });

    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Testar conexão SFTP
router.get('/:serverId/test', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    console.log(`[SFTP] Testando conexão com servidor ${(req.params.serverId as string)}`);
    
    const server = await Server.findById((req.params.serverId as string));
    if (!server) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }

    const SFTPClient = require('ssh2-sftp-client');
    const sftp = new SFTPClient();
    
    try {
      await sftp.connect({
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.password,
        readyTimeout: 20000,
      });

      console.log('[SFTP] Conexão estabelecida com sucesso');
      
      // Testar listagem do diretório home
      const homeDir = await sftp.list('/');
      console.log(`[SFTP] Diretório raiz tem ${homeDir.length} itens`);
      
      await sftp.end();
      
      res.json({ 
        success: true, 
        message: 'Conexão SFTP estabelecida com sucesso',
        itemsInRoot: homeDir.length
      });
    } catch (error: any) {
      console.error('[SFTP] Erro na conexão:', error.message);
      await sftp.end().catch(() => {});
      
      res.status(500).json({ 
        success: false, 
        error: `Erro ao conectar via SFTP: ${error.message}`,
        details: error.code || error.level
      });
    }
  } catch (error: any) {
    console.error('[SFTP] Erro geral:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar arquivos e diretórios
router.get('/:serverId/list', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: dirPath = '/' } = req.query;
    
    console.log(`[SFTP] Listando diretório: ${dirPath} no servidor ${(req.params.serverId as string)}`);
    
    if (!SFTPService.validatePath(dirPath as string)) {
      console.log(`[SFTP] Caminho negado: ${dirPath}`);
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    const files = await SFTPService.listDirectory((req.params.serverId as string), dirPath as string);
    console.log(`[SFTP] ${files.length} arquivos encontrados`);
    res.json(files);
  } catch (error: any) {
    console.error('[SFTP] Erro ao listar arquivos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter informações de arquivo
router.get('/:serverId/info', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Caminho do arquivo é obrigatório' });
    }

    if (!SFTPService.validatePath(filePath as string)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    const info = await SFTPService.getFileInfo((req.params.serverId as string), filePath as string);
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ler arquivo
router.get('/:serverId/read', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Caminho do arquivo é obrigatório' });
    }

    if (!SFTPService.validatePath(filePath as string)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    const content = await SFTPService.readFile((req.params.serverId as string), filePath as string);
    
    // Detectar tipo MIME
    const mimeType = SFTPService.getMimeType(filePath as string);
    
    res.setHeader('Content-Type', mimeType);
    res.send(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Escrever arquivo
router.post('/:serverId/write', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: filePath, content } = req.body;
    
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'Caminho e conteúdo são obrigatórios' });
    }

    if (!SFTPService.validatePath(filePath)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    await SFTPService.writeFile((req.params.serverId as string), filePath, content);
    res.json({ success: true, message: 'Arquivo salvo com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar diretório
router.post('/:serverId/mkdir', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: dirPath, recursive = true } = req.body;
    
    if (!dirPath) {
      return res.status(400).json({ error: 'Caminho do diretório é obrigatório' });
    }

    if (!SFTPService.validatePath(dirPath)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    await SFTPService.createDirectory((req.params.serverId as string), dirPath, recursive);
    res.json({ success: true, message: 'Diretório criado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir arquivo ou diretório
router.delete('/:serverId/delete', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: targetPath, recursive = false } = req.body;
    
    if (!targetPath) {
      return res.status(400).json({ error: 'Caminho é obrigatório' });
    }

    if (!SFTPService.validatePath(targetPath)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    await SFTPService.delete((req.params.serverId as string), targetPath, recursive);
    res.json({ success: true, message: 'Excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Renomear
router.put('/:serverId/rename', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { oldPath, newPath } = req.body;
    
    if (!oldPath || !newPath) {
      return res.status(400).json({ error: 'Caminhos antigo e novo são obrigatórios' });
    }

    if (!SFTPService.validatePath(oldPath) || !SFTPService.validatePath(newPath)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    await SFTPService.rename((req.params.serverId as string), oldPath, newPath);
    res.json({ success: true, message: 'Renomeado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mover
router.put('/:serverId/move', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { sourcePath, destPath } = req.body;
    
    if (!sourcePath || !destPath) {
      return res.status(400).json({ error: 'Caminhos de origem e destino são obrigatórios' });
    }

    if (!SFTPService.validatePath(sourcePath) || !SFTPService.validatePath(destPath)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    await SFTPService.move((req.params.serverId as string), sourcePath, destPath);
    res.json({ success: true, message: 'Movido com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Copiar
router.post('/:serverId/copy', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { sourcePath, destPath } = req.body;
    
    if (!sourcePath || !destPath) {
      return res.status(400).json({ error: 'Caminhos de origem e destino são obrigatórios' });
    }

    if (!SFTPService.validatePath(sourcePath) || !SFTPService.validatePath(destPath)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    await SFTPService.copy((req.params.serverId as string), sourcePath, destPath);
    res.json({ success: true, message: 'Copiado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload de arquivo
router.post('/:serverId/upload', protect, verifyServerOwnership, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    console.log('[SFTP Upload] Iniciando upload...');
    console.log('[SFTP Upload] Servidor:', (req.params.serverId as string));
    console.log('[SFTP Upload] Body:', req.body);
    console.log('[SFTP Upload] File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'nenhum');
    
    const { path: remotePath } = req.body;
    
    if (!remotePath) {
      console.log('[SFTP Upload] Erro: caminho remoto não fornecido');
      return res.status(400).json({ error: 'Caminho remoto é obrigatório' });
    }
    
    if (!req.file) {
      console.log('[SFTP Upload] Erro: arquivo não fornecido');
      return res.status(400).json({ error: 'Arquivo é obrigatório' });
    }

    if (!SFTPService.validatePath(remotePath)) {
      console.log('[SFTP Upload] Erro: caminho negado -', remotePath);
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    console.log('[SFTP Upload] Fazendo upload para:', remotePath);
    await SFTPService.uploadFile((req.params.serverId as string), req.file.buffer, remotePath);
    console.log('[SFTP Upload] Upload concluído com sucesso');
    
    res.json({ success: true, message: 'Upload concluído com sucesso' });
  } catch (error: any) {
    console.error('[SFTP Upload] Erro:', error);
    res.status(500).json({ error: error.message || 'Erro ao fazer upload' });
  }
});

// Download de arquivo
router.get('/:serverId/download', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: remotePath } = req.query;
    
    if (!remotePath) {
      return res.status(400).json({ error: 'Caminho do arquivo é obrigatório' });
    }

    if (!SFTPService.validatePath(remotePath as string)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    const buffer = await SFTPService.downloadFile((req.params.serverId as string), remotePath as string);
    const filename = path.basename(remotePath as string);
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Comprimir arquivos
router.post('/:serverId/compress', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { paths, outputPath } = req.body;
    
    if (!paths || !Array.isArray(paths) || !outputPath) {
      return res.status(400).json({ error: 'Caminhos e caminho de saída são obrigatórios' });
    }

    for (const p of paths) {
      if (!SFTPService.validatePath(p)) {
        return res.status(403).json({ error: 'Acesso negado a um dos caminhos' });
      }
    }

    if (!SFTPService.validatePath(outputPath)) {
      return res.status(403).json({ error: 'Acesso negado ao caminho de saída' });
    }

    await SFTPService.compress((req.params.serverId as string), paths, outputPath);
    res.json({ success: true, message: 'Arquivos comprimidos com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Extrair arquivo
router.post('/:serverId/extract', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { archivePath, destination } = req.body;
    
    if (!archivePath || !destination) {
      return res.status(400).json({ error: 'Caminho do arquivo e destino são obrigatórios' });
    }

    if (!SFTPService.validatePath(archivePath) || !SFTPService.validatePath(destination)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    await SFTPService.extract((req.params.serverId as string), archivePath, destination);
    res.json({ success: true, message: 'Arquivo extraído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Alterar permissões
router.put('/:serverId/chmod', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: targetPath, mode, recursive = false } = req.body;
    
    if (!targetPath || !mode) {
      return res.status(400).json({ error: 'Caminho e modo são obrigatórios' });
    }

    if (!SFTPService.validatePath(targetPath)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    await SFTPService.chmod((req.params.serverId as string), targetPath, mode, recursive);
    res.json({ success: true, message: 'Permissões alteradas com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Alterar proprietário
router.put('/:serverId/chown', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: targetPath, owner, group, recursive = false } = req.body;
    
    if (!targetPath || !owner || !group) {
      return res.status(400).json({ error: 'Caminho, proprietário e grupo são obrigatórios' });
    }

    if (!SFTPService.validatePath(targetPath)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    await SFTPService.chown((req.params.serverId as string), targetPath, owner, group, recursive);
    res.json({ success: true, message: 'Proprietário alterado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter tamanho de diretório
router.get('/:serverId/size', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: dirPath } = req.query;
    
    if (!dirPath) {
      return res.status(400).json({ error: 'Caminho do diretório é obrigatório' });
    }

    if (!SFTPService.validatePath(dirPath as string)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    const size = await SFTPService.getDirectorySize((req.params.serverId as string), dirPath as string);
    res.json({ size });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter uso de disco
router.get('/:serverId/disk-usage', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: targetPath = '/' } = req.query;

    const usage = await SFTPService.getDiskUsage((req.params.serverId as string), targetPath as string);
    res.json(usage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar arquivos
router.get('/:serverId/search', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: searchPath = '/', query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query de busca é obrigatória' });
    }

    if (!SFTPService.validatePath(searchPath as string)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    const files = await SFTPService.searchFiles((req.params.serverId as string), searchPath as string, query as string);
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tail de arquivo (últimas linhas)
router.get('/:serverId/tail', protect, verifyServerOwnership, async (req: AuthRequest, res) => {
  try {
    const { path: filePath, lines = '100' } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Caminho do arquivo é obrigatório' });
    }

    if (!SFTPService.validatePath(filePath as string)) {
      return res.status(403).json({ error: 'Acesso negado a este caminho' });
    }

    const content = await SFTPService.tailFile((req.params.serverId as string), filePath as string, parseInt(lines as string));
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
