import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';

// Carregar .env do diretório correto
dotenv.config({ path: path.join(__dirname, '../.env') });

import projectRoutes from './routes/projects';
import githubRoutes from './routes/github';
import serverRoutes from './routes/servers';
import databaseRoutes from './routes/databases';
import groupRoutes from './routes/groups';
import { UpdateCheckerService } from './services/UpdateCheckerService';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Disponibilizar io para as rotas
app.set('io', io);

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/github', githubRoutes);
app.use('/api', serverRoutes);
app.use('/api/databases', databaseRoutes);
app.use('/api/groups', groupRoutes);

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

  socket.on('join-database', (databaseId) => {
    socket.join(`database-${databaseId}`);
    console.log(`Cliente ${socket.id} entrou na sala database-${databaseId}`);
  });

  socket.on('leave-deploy', (projectId) => {
    socket.leave(`deploy-${projectId}`);
    console.log(`Cliente ${socket.id} saiu da sala deploy-${projectId}`);
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

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB');
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

export { io };
