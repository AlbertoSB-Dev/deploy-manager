# Configuração de Variáveis de Ambiente

## 📁 Estrutura de Arquivos

```
deploy-manager/
├── .env                    # ✅ USAR ESTE (produção/Docker)
├── .env.example            # Template com todas as variáveis
├── .env.production         # Template específico para VPS
├── backend/
│   ├── .env               # ⚠️ Apenas para desenvolvimento local
│   └── .env.example       # Template do backend
└── frontend/
    ├── .env.local         # ⚠️ Apenas para desenvolvimento local
    └── .env.example       # Template do frontend
```

## 🎯 Qual Arquivo Usar?

### Em Produção (VPS com Docker)
**Use**: `.env` na raiz do projeto

```bash
cd /opt/ark-deploy
cp .env.example .env
nano .env  # Editar com valores reais
```

O `docker-compose.yml` lê automaticamente este arquivo.

### Em Desenvolvimento Local (sem Docker)

**Backend**: `backend/.env`
```bash
cd backend
cp .env.example .env
npm run dev
```

**Frontend**: `frontend/.env.local`
```bash
cd frontend
cp .env.example .env.local
npm run dev
```

## 🔧 Como Funciona no Docker

O `docker-compose.yml` passa as variáveis assim:

```yaml
services:
  backend:
    environment:
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/...
      JWT_SECRET: ${JWT_SECRET}
      # Lê do .env na raiz ↑
      
  frontend:
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      # Lê do .env na raiz ↑
```

## ⚙️ Variáveis Importantes

### NEXT_PUBLIC_API_URL
**Tipo**: Build-time (Next.js)
**Quando muda**: Requer rebuild do frontend

```bash
# Após mudar NEXT_PUBLIC_API_URL:
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Outras Variáveis
**Tipo**: Runtime
**Quando muda**: Apenas reiniciar

```bash
docker-compose restart backend
```

## 🔄 Migração de Arquivos Antigos

Se você já tem `backend/.env` e `frontend/.env.local`, use o script de migração:

```bash
cd /opt/ark-deploy
chmod +x migrate-env.sh
./migrate-env.sh
```

O script irá:
- ✅ Criar backup dos arquivos antigos
- ✅ Copiar todas as variáveis para `.env` na raiz
- ✅ Manter valores existentes
- ✅ Mostrar próximos passos

**Migração Manual:**

```bash
# 1. Criar .env na raiz
cp .env.example .env

# 2. Copiar valores de backend/.env
# 3. Copiar NEXT_PUBLIC_API_URL de frontend/.env.local
# 4. Ajustar SERVER_IP e outras variáveis

# 5. Rebuild se mudou NEXT_PUBLIC_API_URL
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

## 📝 Template para VPS

Copie `.env.production` para `.env` e ajuste:

```bash
cd /opt/ark-deploy
cp .env.production .env

# Editar valores:
# - SERVER_IP: IP da VPS
# - MONGO_PASSWORD: Senha segura
# - JWT_SECRET: Chave segura
# - ENCRYPTION_KEY: Chave segura
# - NEXT_PUBLIC_API_URL: URL pública da API
```

## 🔐 Gerar Chaves Seguras

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# MONGO_PASSWORD
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

## ❌ Erros Comuns

### Socket.IO conectando em localhost

**Sintoma:**
```
Access to XMLHttpRequest at 'http://localhost:8001/socket.io/...' 
from origin 'http://painel.38.242.213.195.sslip.io' has been blocked by CORS
```

**Causa**: `NEXT_PUBLIC_API_URL` não configurado ou frontend não foi reconstruído

**Solução**:
```bash
# 1. Verificar se está no .env da raiz
cat .env | grep NEXT_PUBLIC_API_URL

# 2. Se não estiver ou estiver errado, corrigir:
nano .env
# Adicionar/corrigir:
# NEXT_PUBLIC_API_URL=http://api.SEU_IP.sslip.io/api

# 3. REBUILD do frontend (obrigatório!)
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d

# 4. Verificar logs
docker-compose logs frontend | grep -i "api"
```

**Por que precisa rebuild?**
- `NEXT_PUBLIC_API_URL` é uma variável de BUILD TIME no Next.js
- Ela é "baked in" no código durante o build
- Apenas reiniciar não aplica a mudança
- É necessário rebuild completo do frontend

### Variáveis não sendo aplicadas

**Causa**: Docker Compose não recarregou o .env

**Solução**:
```bash
docker-compose down
docker-compose up -d
```

### Sistema não detecta atualizações

**Causa**: Commit hash não foi capturado durante build

**Solução**:
```bash
# Rebuild do backend
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d

# Verificar logs
docker-compose logs backend | grep -i "commit\|github"
```

### Erro ao conectar no MongoDB

**Causa**: Senha do MongoDB incorreta no .env

**Solução**:
```bash
# Verificar senha atual
docker-compose exec mongodb mongosh -u admin -p

# Se não souber a senha, resetar:
docker-compose down
docker volume rm deploy-manager_mongodb_data
# Editar .env com nova senha
docker-compose up -d
```

## 📚 Mais Informações

- [CONFIGURACAO-VPS.md](CONFIGURACAO-VPS.md) - Guia completo de configuração
- [CORRECOES-APLICADAS.md](CORRECOES-APLICADAS.md) - Histórico de correções
- [docker-compose.yml](docker-compose.yml) - Como as variáveis são usadas
