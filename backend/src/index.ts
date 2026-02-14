import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Carregar .env do diretório correto
dotenv.config({ path: path.join(__dirname, '../.env') });

import projectRoutes from './routes/projects';
import githubRoutes from './routes/github';
import serverRoutes from './routes/servers';
import databaseRoutes from './routes/databases';
import groupRoutes from './routes/groups';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import sftpRoutes from './routes/sftp';
import wordpressRoutes from './routes/wordpress';
import backupRoutes from './routes/backups';
import logsRoutes from './routes/logs';
import panelDeployRoutes from './routes/panel-deploy';
import paymentRoutes from './routes/payments';
import billingRoutes from './routes/billing';
import plansRoutes from './routes/plans';
import monitoringRoutes from './routes/monitoring';
import { UpdateCheckerService } from './services/UpdateCheckerService';
import { panelDeployService } from './services/PanelDeployService';
import SubscriptionRenewalService from './services/SubscriptionRenewalService';
import { serverMonitorService } from './services/ServerMonitorService';

const app = express();

// Trust proxy - necessário quando atrás de Nginx/proxy reverso
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  }
}));

const server = http.createServer(app);

// CORS configurado para Socket.IO
const ALLOWED_ORIGINS = [
  'http://localhost:8000',
  'http://localhost:3000',
  process.env.FRONTEND_URL || 'http://localhost:8000'
].filter(Boolean);

// Função para validar origem
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Permitir origens na lista
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    // Permitir qualquer subdomínio .sslip.io
    if (origin.includes('.sslip.io')) {
      return callback(null, true);
    }
    
    // Permitir qualquer IP com porta 8000 ou 3000 (desenvolvimento)
    if (origin.match(/^https?:\/\/\d+\.\d+\.\d+\.\d+:(8000|3000)$/)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.includes('.sslip.io')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Rate limit geral - 1000 requisições por 15 minutos
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Muitas requisições, tente novamente mais tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para autenticação - 5 tentativas por 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login, tente novamente mais tarde',
  skipSuccessfulRequests: true,
});

// Rate limit para /auth/me - 100 requisições por minuto (mais permissivo)
const authMeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Muitas requisições de verificação de autenticação',
  skip: (req) => req.method !== 'GET',
});

// Aplicar rate limiters
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/me', authMeLimiter);

// Disponibilizar io para as rotas
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/github', githubRoutes);
app.use('/api', serverRoutes);
app.use('/api/databases', databaseRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/sftp', sftpRoutes);
app.use('/api/wordpress', wordpressRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/panel-deploy', panelDeployRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO para logs em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('join-deploy', (projectId) => {
    socket.join(`deploy-${projectId}`);
    console.log(`Cliente ${socket.id} entrou na sala deploy-${projectId}`);
  });

  socket.on('join-panel-deploy', () => {
    socket.join('panel-deploy');
    console.log(`Cliente ${socket.id} entrou na sala panel-deploy`);
  });

  socket.on('join-database', (databaseId) => {
    socket.join(`database-${databaseId}`);
    console.log(`Cliente ${socket.id} entrou na sala database-${databaseId}`);
  });

  socket.on('leave-deploy', (projectId) => {
    socket.leave(`deploy-${projectId}`);
    console.log(`Cliente ${socket.id} saiu da sala deploy-${projectId}`);
  });

  socket.on('leave-panel-deploy', () => {
    socket.leave('panel-deploy');
    console.log(`Cliente ${socket.id} saiu da sala panel-deploy`);
  });

  socket.on('subscribe-logs', (projectId) => {
    socket.join(`project-${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Conectar ao MongoDB
const PORT = process.env.PORT || 8001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager';

// Validar variáveis de ambiente críticas
const requiredEnvVars = ['JWT_SECRET', 'ENCRYPTION_KEY', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => {
  const value = process.env[varName];
  return !value || value === 'your-secret-key' || value === 'your-32-character-secret-key!!';
});

if (missingEnvVars.length > 0) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas ou usando valores padrão:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n⚠️  Configure estas variáveis no arquivo .env antes de continuar!');
  process.exit(1);
}

console.log('✅ Variáveis de ambiente validadas');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB');
    
    // Passar io para o serviço de deploy do painel
    panelDeployService.setIO(io);
    
    // Iniciar serviço de renovação automática
    SubscriptionRenewalService.start();
    
    // Iniciar monitoramento de servidores (verifica a cada 5 minutos)
    serverMonitorService.start(5);
    
    server.listen(PORT, () => {
      console.log(`🚀 Deploy Manager rodando na porta ${PORT}`);
      
      // Iniciar verificador de atualizações (a cada 5 minutos)
      const updateChecker = new UpdateCheckerService();
      updateChecker.startPeriodicCheck(5);
    });
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  });

export { io, app, server };
