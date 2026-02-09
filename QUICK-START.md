# 🚀 Quick Start - Deploy Manager

## Instalação

### Opção 1: Docker (Recomendado)

```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager
docker-compose up -d
```

### Opção 2: Manual

```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager

# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (novo terminal)
cd ../frontend
npm install
npm run dev
```

## Acesse o Painel

**Frontend:** http://localhost:3000  
**Backend:** http://localhost:8001

## Primeiro Deploy

1. Clique em **"Novo Projeto"**
2. Preencha:
   - Nome: `meu-projeto`
   - Git URL: `https://github.com/usuario/repo.git`
   - Branch: `main`
   - Tipo: Frontend/Backend
   - Porta: `3000`
3. Clique em **"Criar Projeto"**
4. Clique em **"Deploy"**

✅ Pronto! Seu projeto estará rodando em `meu-projeto.localhost:3000`

## Repositório Privado

Ao criar o projeto, configure a autenticação:

**SSH Key:**
- Tipo: SSH Key
- Path: `/home/user/.ssh/id_rsa`

**Token:**
- Tipo: Personal Access Token
- Token: `ghp_xxxxxxxxxxxx`

📖 [Guia completo](./docs/PRIVATE-REPOS.md)

## Comandos Úteis

### Docker

```bash
# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Reiniciar
docker-compose restart

# Rebuild
docker-compose up -d --build
```

### Manual

```bash
# Ver logs backend
cd backend && npm run dev

# Ver logs frontend
cd frontend && npm run dev
```

## Troubleshooting

### Porta já em uso

```bash
# Windows
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8001 | xargs kill -9
```

### MongoDB não conecta

```bash
# Linux
sudo systemctl start mongodb

# Mac
brew services start mongodb-community

# Windows
net start MongoDB
```

## Próximos Passos

- 📖 Leia a [documentação completa](./README.md)
- 🔐 Configure [repositórios privados](./docs/PRIVATE-REPOS.md)
- 🐳 Use [Docker para produção](./docker-compose.yml)
