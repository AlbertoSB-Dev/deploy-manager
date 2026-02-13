# 📝 Guia - Variáveis de Ambiente nos Dockerfiles

## 🎯 Como Funciona Agora

Os Dockerfiles agora criam automaticamente os arquivos `.env` dentro dos containers durante o build, usando as variáveis do arquivo `.env` da raiz.

### Fluxo:
1. Você edita `.env` na raiz do projeto
2. Docker Compose passa as variáveis como `ARG` durante o build
3. Dockerfiles criam arquivos `.env` dentro dos containers
4. Aplicações leem os arquivos `.env` internos

## 📍 Onde Alterar as Credenciais

### Arquivo Principal
```bash
nano /opt/ark-deploy/.env
```

Edite as variáveis que você precisa:

```env
# MongoDB
MONGO_PASSWORD=vQO20N8X8k41oRkAUWAEnw==

# Segurança
JWT_SECRET=hxt8JpXUaEhzQ6VPZFVrhA0PvcbFDQoWvbYbRJEQYy0=
ENCRYPTION_KEY=azl2vRfXO7sysIKrbiger8FurqHcXs0P6z0ZfIDqMJc=

# Servidor
SERVER_IP=38.242.213.195
BASE_DOMAIN=sslip.io
FRONTEND_URL=http://painel.38.242.213.195.sslip.io

# API URL (IMPORTANTE!)
NEXT_PUBLIC_API_URL=http://api.38.242.213.195.sslip.io/api

# GitHub OAuth (opcional)
GITHUB_CLIENT_ID=seu_client_id
GITHUB_CLIENT_SECRET=seu_client_secret
GITHUB_CALLBACK_URL=http://painel.38.242.213.195.sslip.io/auth/github/callback

# Assas
ASSAS_API_KEY=sua_api_key
ASSAS_WEBHOOK_TOKEN=seu_webhook_token
ASSAS_ENVIRONMENT=sandbox

# Email (opcional)
EMAIL_ENABLED=false
EMAIL_SERVICE=gmail
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_app
```

## 🔨 Aplicar Mudanças

### Opção 1: Rebuild Completo (Recomendado)
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Opção 2: Rebuild Apenas o que Mudou
```bash
# Se mudou variáveis do backend
docker-compose build --no-cache backend
docker-compose up -d backend

# Se mudou NEXT_PUBLIC_API_URL
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## 🔍 Verificar se Funcionou

### Ver .env dentro do container backend
```bash
docker exec ark-deploy-backend cat .env
```

### Ver .env dentro do container frontend
```bash
docker exec ark-deploy-frontend cat .env.production
```

### Ver logs
```bash
docker-compose logs backend | grep -i "configurado\|oauth\|email"
docker-compose logs frontend | grep -i "api"
```

## ⚙️ Variáveis Importantes

### Backend (.env)
Criado em: `/app/.env` dentro do container

Contém:
- MONGO_PASSWORD
- JWT_SECRET
- ENCRYPTION_KEY
- SERVER_IP
- BASE_DOMAIN
- FRONTEND_URL
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GITHUB_CALLBACK_URL
- ASSAS_API_KEY
- ASSAS_WEBHOOK_TOKEN
- ASSAS_ENVIRONMENT
- EMAIL_ENABLED
- EMAIL_SERVICE
- EMAIL_USER
- EMAIL_PASSWORD

### Frontend (.env.production)
Criado em: `/app/.env.production` dentro do container

Contém:
- NEXT_PUBLIC_API_URL

## 🔐 Gerar Credenciais Seguras

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# MONGO_PASSWORD
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

## ⚠️ IMPORTANTE

### NEXT_PUBLIC_API_URL é Build-Time
- Esta variável é "baked in" no código durante o build
- Mudanças requerem rebuild do frontend
- Não adianta apenas reiniciar

### Outras Variáveis são Runtime
- Backend lê do .env em runtime
- Mudanças aplicam após reiniciar o container
- Não precisa rebuild

## 📋 Checklist de Atualização

1. [ ] Editar `.env` na raiz
2. [ ] Verificar se todas as variáveis estão corretas
3. [ ] Fazer rebuild: `docker-compose build --no-cache`
4. [ ] Iniciar: `docker-compose up -d`
5. [ ] Verificar logs: `docker-compose logs -f`
6. [ ] Testar no navegador
7. [ ] Verificar .env dentro dos containers (opcional)

## 🆘 Troubleshooting

### Variáveis não aplicadas
```bash
# Verificar se .env existe na raiz
ls -la .env

# Ver conteúdo
cat .env

# Rebuild forçado
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### Socket.IO conectando em localhost
```bash
# Verificar NEXT_PUBLIC_API_URL
cat .env | grep NEXT_PUBLIC_API_URL

# Deve ser: http://api.SEU_IP.sslip.io/api
# Se estiver errado, corrigir e rebuild frontend

docker-compose build --no-cache frontend
docker-compose up -d
```

### Ver variáveis dentro do container
```bash
# Backend
docker exec ark-deploy-backend env | grep -E "JWT|MONGO|GITHUB|ASSAS|EMAIL"

# Frontend
docker exec ark-deploy-frontend env | grep NEXT_PUBLIC
```

## 📚 Mais Informações

- [ENV-SETUP.md](./ENV-SETUP.md) - Guia completo de .env
- [GUIA-RAPIDO-VPS.md](./GUIA-RAPIDO-VPS.md) - Guia rápido para VPS
- [docker-compose.yml](./docker-compose.yml) - Configuração do Docker Compose
