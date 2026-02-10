# 🎨 Ark Deploy - Frontend

Frontend do Ark Deploy construído com Next.js 15, React 18 e Tailwind CSS.

## 🚀 Deploy Rápido

### Com Docker (Produção)

```bash
docker build -f Dockerfile.prod -t ark-deploy-frontend .
docker run -d -p 8000:8000 \
  -e NEXT_PUBLIC_API_URL=http://SEU_BACKEND_URL:8001 \
  ark-deploy-frontend
```

### Desenvolvimento

```bash
npm install
npm run dev
```

Acesse: http://localhost:8000

## 📦 Tecnologias

- **Next.js 15** - Framework React com App Router
- **React 18** - UI Library
- **Tailwind CSS** - Utility-first CSS
- **Socket.IO Client** - Real-time logs e comunicação
- **Axios** - HTTP Client
- **Zustand** - State Management
- **Monaco Editor** - Code Editor integrado
- **Lucide React** - Ícones modernos
- **React Hot Toast** - Notificações
- **React Dropzone** - Upload de arquivos

## 🔧 Configuração

### Variáveis de Ambiente

Crie `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

Para produção (`.env.production`):

```env
NEXT_PUBLIC_API_URL=http://seu-backend.com:8001
```

## 📁 Estrutura

```
frontend/
├── src/
│   ├── app/              # Pages (App Router Next.js 15)
│   │   ├── page.tsx      # Landing page
│   │   ├── login/        # Login
│   │   ├── register/     # Registro
│   │   ├── dashboard/    # Dashboard principal
│   │   ├── admin/        # Painel admin
│   │   └── ...
│   ├── components/       # React Components
│   │   ├── ServerCard.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── FileManager.tsx
│   │   ├── TerminalSSH.tsx
│   │   └── ...
│   ├── services/         # API Services
│   │   ├── api.ts
│   │   └── sftpService.ts
│   └── styles/           # Global Styles
├── public/               # Static Files
│   ├── favicon.svg
│   └── logo.svg
├── Dockerfile            # Dev Dockerfile
├── Dockerfile.prod       # Production Dockerfile
├── next.config.js        # Next.js Config
├── tailwind.config.ts    # Tailwind Config
└── package.json
```

## 🐳 Docker

### Build Desenvolvimento

```bash
docker build -t ark-deploy-frontend:dev .
```

### Build Produção (Otimizado)

```bash
docker build -f Dockerfile.prod -t ark-deploy-frontend:prod .
```

O Dockerfile de produção usa:
- Multi-stage build
- Standalone output do Next.js
- Usuário não-root
- Health checks

### Run

```bash
docker run -d \
  --name ark-deploy-frontend \
  -p 8000:8000 \
  -e NEXT_PUBLIC_API_URL=http://backend:8001 \
  ark-deploy-frontend:prod
```

## 📝 Scripts

```bash
npm run dev      # Desenvolvimento (porta 8000)
npm run build    # Build produção
npm run start    # Start produção
npm run lint     # Lint código
```

## 🎨 Componentes Principais

### ServerCard
Exibe informações de um servidor VPS com status, recursos e ações.

### ProjectCard
Card de projeto com status de deploy, logs e controles.

### FileManager
Gerenciador de arquivos SFTP com upload, download e edição.

### TerminalSSH
Terminal SSH integrado no navegador.

### CodeEditor
Editor de código Monaco com syntax highlighting.

## 🔌 Integração com Backend

O frontend se comunica com o backend via:

- **REST API** - Axios para requisições HTTP
- **WebSocket** - Socket.IO para logs em tempo real
- **SFTP** - Gerenciamento de arquivos remoto

### Exemplo de Requisição:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Listar projetos
const projects = await api.get('/api/projects');
```

### Exemplo de WebSocket:

```typescript
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

socket.on('deploy-log', (data) => {
  console.log(data.message);
});
```

## 🎯 Features

- ✅ Dashboard com estatísticas
- ✅ Gerenciamento de servidores VPS
- ✅ Deploy de projetos Git
- ✅ Terminal SSH integrado
- ✅ Gerenciador de arquivos SFTP
- ✅ Editor de código
- ✅ Logs em tempo real
- ✅ Gerenciamento de databases
- ✅ Backups automáticos
- ✅ WordPress installer
- ✅ Sistema de planos
- ✅ Painel administrativo

## 🔒 Autenticação

O frontend usa JWT para autenticação:

```typescript
// Login
const response = await api.post('/api/auth/login', {
  email: 'user@example.com',
  password: 'senha'
});

// Salvar token
localStorage.setItem('token', response.data.token);

// Usar token em requisições
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

## 🌐 Rotas

- `/` - Landing page
- `/login` - Login
- `/register` - Registro
- `/dashboard` - Dashboard principal
- `/admin` - Painel administrativo
- `/admin/users` - Gerenciar usuários
- `/admin/plans` - Gerenciar planos
- `/pricing` - Planos e preços
- `/backups` - Gerenciar backups

## 🎨 Temas

O projeto usa Tailwind CSS com tema dark por padrão.

Cores principais:
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)

## 📱 Responsivo

O frontend é totalmente responsivo e funciona em:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1920px+)

## 🔗 Links

- **Repositório Completo:** https://github.com/AlbertoSB-Dev/deploy-manager
- **Backend:** https://github.com/AlbertoSB-Dev/deploy-manager/tree/backend
- **Main Branch:** https://github.com/AlbertoSB-Dev/deploy-manager/tree/main
- **Documentação:** https://github.com/AlbertoSB-Dev/deploy-manager#readme

## 📄 Licença

MIT License - veja [LICENSE](https://github.com/AlbertoSB-Dev/deploy-manager/blob/main/LICENSE) para detalhes.
