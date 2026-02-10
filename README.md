# ⚙️ Ark Deploy - Backend

Backend API do Ark Deploy construído com Node.js, Express, TypeScript e MongoDB.

## 🚀 Deploy Rápido

### Com Docker (Produção)

```bash
docker build -f Dockerfile.prod -t ark-deploy-backend .
docker run -d -p 8001:8001 \
  -e MONGODB_URI=mongodb://admin:senha@mongodb:27017/ark-deploy?authSource=admin \
  -e JWT_SECRET=seu-secret-aqui \
  -e ENCRYPTION_KEY=sua-chave-32-chars \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ark-deploy-backend
```

### Desenvolvimento

```bash
npm install
npm run dev
```

API disponível em: http://localhost:8001

## 📦 Tecnologias

- **Node.js 20** - Runtime JavaScript
- **Express** - Web Framework
- **TypeScript** - Type Safety
- **MongoDB** - Database NoSQL
- **Mongoose** - ODM para MongoDB
- **Socket.IO** - WebSockets para real-time
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Dockerode** - Docker API Client
- **node-ssh** - SSH Client
- **simple-git** - Git Operations
- **ssh2-sftp-client** - SFTP Client

## 🔧 Configuração

### Variáveis de Ambiente

Crie `.env`:

```env
PORT=8001
MONGODB_URI=mongodb://admin:senha@localhost:27017/ark-deploy?authSource=admin
JWT_SECRET=seu-secret-key-64-chars-min
ENCRYPTION_KEY=sua-chave-32-chars-min
PROJECTS_DIR=/opt/projects
BASE_DOMAIN=sslip.io
SERVER_IP=localhost
NODE_ENV=development
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FRONTEND_URL=http://localhost:8000
GITHUB_CALLBACK_URL=http://localhost:8000/auth/github/callback
```

### Gerar Secrets Seguros

```bash
# JWT Secret (64 chars)
openssl rand -hex 64

# Encryption Key (32 chars)
openssl rand -hex 32

# MongoDB Password
openssl rand -base64 32
```

## 📁 Estrutura

```
backend/
├── src/
│   ├── index.ts          # Entry Point
│   ├── models/           # Mongoose Models
│   │   ├── User.ts
│   │   ├── Server.ts
│   │   ├── Project.ts
│   │   ├── Database.ts
│   │   ├── Backup.ts
│   │   └── WordPress.ts
│   ├── routes/           # API Routes
│   │   ├── auth.ts
│   │   ├── servers.ts
│   │   ├── projects.ts
│   │   ├── databases.ts
│   │   ├── backups.ts
│   │   ├── sftp.ts
│   │   ├── wordpress.ts
│   │   └── admin.ts
│   ├── services/         # Business Logic
│   │   ├── DeployService.ts
│   │   ├── SSHService.ts
│   │   ├── SFTPService.ts
│   │   ├── DockerService.ts
│   │   ├── GitService.ts
│   │   ├── TraefikService.ts
│   │   ├── BackupService.ts
│   │   └── ProvisioningService.ts
│   ├── middleware/       # Express Middleware
│   │   └── auth.ts
│   └── utils/            # Utilities
│       └── commandValidator.ts
├── scripts/              # Utility Scripts
│   ├── make-admin.js
│   ├── make-admin-auto.js
│   ├── seed-plans.js
│   └── reset-password.js
├── Dockerfile            # Dev Dockerfile
├── Dockerfile.prod       # Production Dockerfile
├── tsconfig.json         # TypeScript Config
├── tsconfig.prod.json    # Production TS Config
└── package.json
```

## 🛣️ API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Registrar novo usuário
- `POST /login` - Login
- `POST /forgot-password` - Recuperar senha
- `POST /reset-password/:token` - Resetar senha
- `GET /github` - Iniciar OAuth GitHub
- `GET /github/callback` - Callback OAuth

### Servers (`/api/servers`)
- `GET /` - Listar servidores
- `POST /` - Adicionar servidor
- `GET /:id` - Detalhes do servidor
- `PUT /:id` - Atualizar servidor
- `DELETE /:id` - Remover servidor
- `POST /:id/test` - Testar conexão SSH
- `POST /:id/update-system` - Atualizar sistema (apt)
- `GET /:id/stats` - Estatísticas do servidor

### Projects (`/api/projects`)
- `GET /` - Listar projetos
- `POST /` - Criar projeto
- `GET /:id` - Detalhes do projeto
- `PUT /:id` - Atualizar projeto
- `DELETE /:id` - Deletar projeto
- `POST /:id/deploy` - Fazer deploy
- `POST /:id/rollback` - Rollback
- `GET /:id/logs` - Logs do container
- `POST /:id/exec` - Executar comando
- `POST /:id/check-updates` - Verificar atualizações Git

### Databases (`/api/databases`)
- `GET /` - Listar databases
- `POST /` - Criar database
- `GET /:id` - Detalhes do database
- `DELETE /:id` - Deletar database
- `POST /:id/backup` - Criar backup

### Backups (`/api/backups`)
- `GET /` - Listar backups
- `POST /` - Criar backup
- `GET /:id` - Detalhes do backup
- `POST /:id/restore` - Restaurar backup
- `DELETE /:id` - Deletar backup
- `GET /:id/download` - Download backup

### SFTP (`/api/sftp/:serverId`)
- `GET /files` - Listar arquivos
- `POST /upload` - Upload arquivo
- `GET /download` - Download arquivo
- `POST /create-folder` - Criar pasta
- `DELETE /delete` - Deletar arquivo/pasta
- `POST /rename` - Renomear
- `POST /move` - Mover arquivo
- `GET /read` - Ler conteúdo
- `POST /write` - Escrever conteúdo

### WordPress (`/api/wordpress`)
- `GET /` - Listar instalações
- `POST /` - Instalar WordPress
- `GET /:id` - Detalhes da instalação
- `DELETE /:id` - Remover WordPress
- `POST /:id/backup` - Backup WordPress
- `POST /:id/update` - Atualizar WordPress

### Admin (`/api/admin`)
- `GET /users` - Listar usuários
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário
- `GET /plans` - Listar planos
- `POST /plans` - Criar plano
- `PUT /plans/:id` - Atualizar plano
- `DELETE /plans/:id` - Deletar plano
- `GET /stats` - Estatísticas do sistema
- `POST /update-system` - Atualizar painel

## 🐳 Docker

### Build Desenvolvimento

```bash
docker build -t ark-deploy-backend:dev .
```

### Build Produção

```bash
docker build -f Dockerfile.prod -t ark-deploy-backend:prod .
```

O Dockerfile de produção:
- Usa ts-node com transpileOnly (sem verificação de tipos)
- Multi-stage build
- Health checks
- Restart automático

### Run

```bash
docker run -d \
  --name ark-deploy-backend \
  -p 8001:8001 \
  -e MONGODB_URI=mongodb://admin:senha@mongodb:27017/ark-deploy?authSource=admin \
  -e JWT_SECRET=seu-secret \
  -e ENCRYPTION_KEY=sua-chave \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /opt/projects:/opt/projects \
  -v /opt/backups:/opt/backups \
  ark-deploy-backend:prod
```

## 📝 Scripts

```bash
npm run dev           # Desenvolvimento com hot-reload
npm run build         # Build TypeScript
npm run start         # Start produção
npm run make-admin    # Criar usuário admin interativo
```

### Scripts Utilitários

```bash
# Criar admin automaticamente
node scripts/make-admin-auto.js

# Resetar senha de usuário
node scripts/reset-password.js

# Popular planos padrão
node scripts/seed-plans.js
```

## 🔒 Segurança

### Autenticação JWT

```typescript
// Gerar token
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
  expiresIn: '7d'
});

// Verificar token (middleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Criptografia de Credenciais

Credenciais SSH são criptografadas antes de salvar no banco:

```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

// Encrypt
const cipher = crypto.createCipheriv(algorithm, key, iv);
const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');

// Decrypt
const decipher = crypto.createDecipheriv(algorithm, key, iv);
const decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requisições
});

app.use('/api/', limiter);
```

## 🔌 WebSocket (Socket.IO)

### Eventos Emitidos

- `deploy-log` - Logs de deploy em tempo real
- `container-stats` - Estatísticas de containers
- `server-stats` - Estatísticas de servidores

### Exemplo de Uso

```typescript
io.to(`deploy-${projectId}`).emit('deploy-log', {
  message: 'Building Docker image...',
  timestamp: new Date().toISOString()
});
```

## 🗄️ Modelos MongoDB

### User
- email, password, name, role, plan, servers, projects

### Server
- name, host, port, username, password/sshKey, status

### Project
- name, gitUrl, branch, serverId, port, envVars, deployments

### Database
- name, type, serverId, credentials

### Backup
- resourceId, type, storageType, path, size

## 🔧 Serviços

### DeployService
Gerencia deploys de projetos (local e remoto via SSH).

### SSHService
Conexões SSH para servidores remotos.

### SFTPService
Transferência de arquivos via SFTP.

### DockerService
Integração com Docker API (build, run, logs).

### GitService
Operações Git (clone, pull, checkout).

### TraefikService
Configuração de proxy reverso Traefik.

### ProvisioningService
Provisiona servidores (instala Docker, Traefik, etc).

## 📊 Monitoramento

### Health Check

```bash
curl http://localhost:8001/api/health
```

### Logs

```bash
# Docker logs
docker logs ark-deploy-backend -f

# Logs de deploy
GET /api/projects/:id/logs
```

## 🔗 Links

- **Repositório Completo:** https://github.com/AlbertoSB-Dev/deploy-manager
- **Frontend:** https://github.com/AlbertoSB-Dev/deploy-manager/tree/frontend
- **Main Branch:** https://github.com/AlbertoSB-Dev/deploy-manager/tree/main
- **Documentação:** https://github.com/AlbertoSB-Dev/deploy-manager#readme

## 📄 Licença

MIT License - veja [LICENSE](https://github.com/AlbertoSB-Dev/deploy-manager/blob/main/LICENSE) para detalhes.
