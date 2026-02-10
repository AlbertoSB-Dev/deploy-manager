# 🚀 Ark Deploy - Guia de Produção

Este guia explica como fazer deploy do Ark Deploy em produção com configurações otimizadas e seguras.

## 📋 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Servidor Linux (Ubuntu/Debian recomendado)
- Mínimo 2GB RAM
- Acesso root ou sudo

## 🔧 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git
cd deploy-manager
```

### 2. Configure Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.production .env.production

# Gerar secrets seguros
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env.production
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env.production
echo "MONGO_PASSWORD=$(openssl rand -base64 32)" >> .env.production

# Editar e configurar SERVER_IP
nano .env.production
```

**Variáveis obrigatórias:**
- `SERVER_IP` - IP do seu servidor
- `MONGO_PASSWORD` - Senha do MongoDB (gerada automaticamente)
- `JWT_SECRET` - Secret para JWT (gerado automaticamente)
- `ENCRYPTION_KEY` - Chave de criptografia (gerada automaticamente)

### 3. Execute o Deploy

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

O script irá:
- ✅ Validar variáveis de ambiente
- ✅ Criar rede do Traefik
- ✅ Build das imagens otimizadas
- ✅ Iniciar containers
- ✅ Criar usuário admin

## 🌐 Acesso

Após o deploy:

- **Frontend:** `http://SEU_IP:8000`
- **Backend API:** `http://SEU_IP:8001`
- **Com Traefik:** `http://ark-deploy.SEU_IP.sslip.io`

**Credenciais padrão:**
- Email: `admin@admin.com`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

## 📊 Gerenciamento

### Ver Logs

```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Apenas backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Apenas frontend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Status dos Containers

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Reiniciar Serviços

```bash
# Reiniciar tudo
docker-compose -f docker-compose.prod.yml restart

# Reiniciar apenas backend
docker-compose -f docker-compose.prod.yml restart backend

# Reiniciar apenas frontend
docker-compose -f docker-compose.prod.yml restart frontend
```

### Parar Serviços

```bash
docker-compose -f docker-compose.prod.yml down
```

### Atualizar Sistema

```bash
# Baixar última versão
git pull origin main

# Rebuild e restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Segurança

### Firewall

Configure o firewall para permitir apenas portas necessárias:

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # Frontend
sudo ufw allow 8001/tcp  # Backend API
sudo ufw enable
```

### SSL/HTTPS (Recomendado)

Para produção, configure SSL com Let's Encrypt:

```bash
# Instalar Certbot
sudo apt install certbot

# Obter certificado
sudo certbot certonly --standalone -d seu-dominio.com

# Configurar Traefik para usar certificados
# Ver documentação do Traefik
```

### Backup

Configure backups automáticos:

```bash
# Backup do MongoDB
docker-compose -f docker-compose.prod.yml exec mongodb mongodump \
  --uri="mongodb://admin:SENHA@localhost:27017/ark-deploy?authSource=admin" \
  --out=/backup

# Backup de volumes
docker run --rm -v mongodb_data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/mongodb-$(date +%Y%m%d).tar.gz /data
```

## 🏗️ Arquitetura de Produção

```
┌─────────────────────────────────────────┐
│           Traefik (Proxy)               │
│         Port 80/443 (HTTP/HTTPS)        │
└────────────┬────────────────────────────┘
             │
             ├──────────────┬──────────────┐
             │              │              │
    ┌────────▼────────┐ ┌──▼──────────┐ ┌─▼──────────┐
    │   Frontend      │ │   Backend   │ │  MongoDB   │
    │   (Next.js)     │ │  (Node.js)  │ │            │
    │   Port 8000     │ │  Port 8001  │ │ Port 27017 │
    └─────────────────┘ └─────────────┘ └────────────┘
```

## 📦 Branches Separadas

O projeto está organizado em branches:

- **`main`** - Projeto completo (frontend + backend)
- **`frontend`** - Apenas frontend
- **`backend`** - Apenas backend

### Deploy de Branch Específica

```bash
# Frontend apenas
git clone -b frontend https://github.com/AlbertoSB-Dev/deploy-manager.git frontend
cd frontend
docker build -f Dockerfile.prod -t ark-deploy-frontend .
docker run -d -p 8000:8000 ark-deploy-frontend

# Backend apenas
git clone -b backend https://github.com/AlbertoSB-Dev/deploy-manager.git backend
cd backend
docker build -f Dockerfile.prod -t ark-deploy-backend .
docker run -d -p 8001:8001 ark-deploy-backend
```

## 🔧 Configurações Avançadas

### Limites de Recursos

Edite `docker-compose.prod.yml` para adicionar limites:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Variáveis de Ambiente Customizadas

Adicione no `.env.production`:

```env
# Limites de upload
MAX_FILE_SIZE=100MB

# Timeout de requisições
REQUEST_TIMEOUT=30000

# Número de workers
WORKERS=2
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs backend

# Verificar health check
docker inspect ark-deploy-backend-prod | grep -A 10 Health
```

### MongoDB não conecta

```bash
# Testar conexão
docker-compose -f docker-compose.prod.yml exec backend \
  wget -O- http://mongodb:27017

# Verificar senha
docker-compose -f docker-compose.prod.yml exec mongodb \
  mongosh -u admin -p SENHA --authenticationDatabase admin
```

### Frontend não conecta no backend

Verifique `NEXT_PUBLIC_API_URL` no `.env.production`:

```env
# Para acesso externo
NEXT_PUBLIC_API_URL=http://SEU_IP:8001

# Para acesso interno (containers)
NEXT_PUBLIC_API_URL=http://backend:8001
```

## 📈 Monitoramento

### Recursos do Sistema

```bash
# CPU e Memória
docker stats

# Espaço em disco
df -h
docker system df
```

### Logs Centralizados

Configure um sistema de logs como ELK Stack ou Grafana Loki para monitoramento centralizado.

## 🔄 CI/CD

Exemplo de GitHub Actions para deploy automático:

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: root
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/ark-deploy
            git pull origin main
            ./deploy-production.sh
```

## 📞 Suporte

- **Issues:** https://github.com/AlbertoSB-Dev/deploy-manager/issues
- **Documentação:** https://github.com/AlbertoSB-Dev/deploy-manager
- **Discord:** [Em breve]

## 📝 Licença

MIT License - veja [LICENSE](./LICENSE) para detalhes.
