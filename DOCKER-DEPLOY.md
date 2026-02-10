# 🐳 Deploy do Ark Deploy com Docker

Este guia explica como fazer deploy do próprio painel Ark Deploy usando o Dockerfile na raiz do projeto.

## 📋 Sobre o Dockerfile

O `Dockerfile` na raiz do projeto cria uma imagem completa que roda **backend + frontend** em um único container usando PM2 para gerenciar ambos os processos.

### Estrutura Multi-Stage:

1. **backend-builder** - Compila o TypeScript do backend
2. **frontend-builder** - Faz build do Next.js
3. **runtime** - Imagem final com ambos rodando via PM2

### Portas Expostas:

- **8000** - Frontend (Next.js)
- **8001** - Backend (API)

## 🚀 Como Usar

### Opção 1: Build e Run Manual

```bash
# Clone o repositório
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git
cd deploy-manager

# Build da imagem
docker build -t ark-deploy:latest .

# Criar rede (se não existir)
docker network create coolify

# Rodar container
docker run -d \
  --name ark-deploy \
  --network coolify \
  -p 8000:8000 \
  -p 8001:8001 \
  -e MONGODB_URI="mongodb://admin:senha@mongodb:27017/ark-deploy?authSource=admin" \
  -e JWT_SECRET="seu-secret-aqui" \
  -e ENCRYPTION_KEY="sua-chave-32-caracteres-minimo" \
  -e NEXT_PUBLIC_API_URL="http://localhost:8001" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /opt/projects:/opt/projects \
  -v /opt/backups:/opt/backups \
  --restart unless-stopped \
  ark-deploy:latest
```

### Opção 2: Docker Compose (Recomendado)

Use o `docker-compose.yml` existente que já está configurado:

```bash
docker-compose up -d
```

### Opção 3: Deploy via Ark Deploy (Meta!)

Você pode usar o próprio Ark Deploy para fazer deploy dele mesmo:

1. Adicione um servidor no painel
2. Crie um novo projeto:
   - **Repositório:** `https://github.com/AlbertoSB-Dev/deploy-manager.git`
   - **Branch:** `main`
   - **Porta:** `8000`
   - **Tipo:** Fullstack
3. Configure variáveis de ambiente:
   ```
   MONGODB_URI=mongodb://admin:senha@mongodb:27017/ark-deploy?authSource=admin
   JWT_SECRET=seu-secret-aqui
   ENCRYPTION_KEY=sua-chave-32-caracteres-minimo
   NEXT_PUBLIC_API_URL=http://backend:8001
   ```
4. Clique em **Deploy**

O sistema irá:
- ✅ Detectar o Dockerfile na raiz
- ✅ Fazer build da imagem
- ✅ Criar container com backend + frontend
- ✅ Configurar Traefik automaticamente

## 🔧 Variáveis de Ambiente Necessárias

### Backend:
```env
PORT=8001
MONGODB_URI=mongodb://admin:senha@mongodb:27017/ark-deploy?authSource=admin
JWT_SECRET=seu-secret-key-change-in-production
ENCRYPTION_KEY=sua-chave-de-criptografia-32-chars-min
PROJECTS_DIR=/opt/projects
BASE_DOMAIN=sslip.io
SERVER_IP=seu-ip-aqui
NODE_ENV=production
```

### Frontend:
```env
NEXT_PUBLIC_API_URL=http://backend:8001
NODE_ENV=production
```

## 📊 Gerenciamento com PM2

O container usa PM2 para gerenciar os processos. Para acessar:

```bash
# Entrar no container
docker exec -it ark-deploy sh

# Ver status dos processos
pm2 status

# Ver logs
pm2 logs

# Reiniciar backend
pm2 restart backend

# Reiniciar frontend
pm2 restart frontend

# Reiniciar tudo
pm2 restart all
```

## 🔍 Logs

Os logs são salvos em `/app/logs/`:

```bash
# Ver logs do backend
docker exec ark-deploy cat /app/logs/backend-out.log

# Ver logs do frontend
docker exec ark-deploy cat /app/logs/frontend-out.log

# Ver erros do backend
docker exec ark-deploy cat /app/logs/backend-error.log

# Ver erros do frontend
docker exec ark-deploy cat /app/logs/frontend-error.log
```

## 🏥 Health Check

O container possui health check automático que verifica se o frontend está respondendo:

```bash
# Ver status de saúde
docker inspect ark-deploy --format='{{.State.Health.Status}}'
```

## 🔄 Atualização

Para atualizar o painel:

```bash
# Parar container atual
docker stop ark-deploy
docker rm ark-deploy

# Baixar última versão
cd deploy-manager
git pull origin main

# Rebuild e restart
docker build -t ark-deploy:latest .
docker run -d ... # (mesmo comando anterior)
```

## 🐛 Troubleshooting

### Container não inicia:

```bash
# Ver logs do container
docker logs ark-deploy

# Ver logs do PM2
docker exec ark-deploy pm2 logs
```

### Frontend não conecta no backend:

Verifique se `NEXT_PUBLIC_API_URL` está correto:
- **Dentro do Docker:** `http://backend:8001`
- **Fora do Docker:** `http://localhost:8001`

### MongoDB não conecta:

Verifique se o MongoDB está rodando e acessível:

```bash
# Testar conexão
docker exec ark-deploy wget -O- http://mongodb:27017
```

## 📦 Volumes Importantes

- `/var/run/docker.sock` - Acesso ao Docker do host (necessário para deploys)
- `/opt/projects` - Projetos clonados
- `/opt/backups` - Backups dos projetos
- `/opt/databases` - Bancos de dados

## 🌐 Acesso

Após iniciar o container:

- **Frontend:** http://localhost:8000
- **Backend API:** http://localhost:8001
- **Com Traefik:** http://ark-deploy.SEU_IP.sslip.io

## 🔐 Primeiro Acesso

Credenciais padrão:
- **Email:** admin@admin.com
- **Senha:** admin123

⚠️ **Altere a senha após o primeiro login!**

## 📝 Notas

- O Dockerfile usa **multi-stage build** para otimizar o tamanho da imagem
- PM2 gerencia ambos os processos (backend + frontend)
- Health check verifica se o frontend está respondendo
- Logs são salvos em arquivos para fácil debug
- Container reinicia automaticamente em caso de falha

