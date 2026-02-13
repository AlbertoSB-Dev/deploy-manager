# 🚀 Fluxo de Deploy do Painel

## 📋 Comandos Executados na VPS

### 1️⃣ Criar Nova Versão

Quando você clica em "Nova Versão" no painel:

```bash
# 1. Sincronizar com GitHub
cd /opt/ark-deploy
git fetch origin

# 2. Obter commit mais recente
git rev-parse origin/main

# 3. Criar tag no repositório local
git tag -a v1.0.0 -m "Sua mensagem"

# 4. Salvar no banco de dados
# (registro criado no MongoDB com status 'building')
```

### 2️⃣ Fazer Deploy de uma Versão

Quando você clica em "Deploy" em uma versão:

```bash
# 1. Sincronizar com GitHub
cd /opt/ark-deploy
git fetch origin

# 2. Parar containers atuais
docker-compose down

# 3. Fazer checkout da versão
git checkout v1.0.0

# 4. Limpar cache do frontend
cd frontend
rm -rf .next

# 5. Build do frontend (SEM CACHE)
cd /opt/ark-deploy
docker-compose build --no-cache frontend

# 6. Build do backend (SEM CACHE)
docker-compose build --no-cache backend

# 7. Iniciar containers
docker-compose up -d

# 8. Aguardar containers ficarem saudáveis
# (verifica se containers estão rodando)

# 9. Atualizar status no banco de dados
# (marca versão como 'ready')
```

### 3️⃣ Fazer Rollback

Quando você clica em "Rollback" para uma versão anterior:

```bash
# Mesmo processo do deploy, mas com a versão anterior
cd /opt/ark-deploy
docker-compose down
git checkout v0.9.0
docker-compose build --no-cache
docker-compose up -d
```

## ⏱️ Tempo Estimado

- **Criar Versão**: ~5 segundos
- **Deploy Completo**: ~10-15 minutos
  - Parar containers: 10s
  - Checkout: 5s
  - Build frontend: 5-8 min
  - Build backend: 3-5 min
  - Iniciar: 30s
  - Aguardar health: 1-2 min

## 📊 Fluxo Visual

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CRIAR VERSÃO                                             │
├─────────────────────────────────────────────────────────────┤
│ • Sincronizar com GitHub (git fetch)                        │
│ • Obter commit mais recente (git rev-parse)                 │
│ • Criar registro no MongoDB (status: building)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. FAZER DEPLOY                                             │
├─────────────────────────────────────────────────────────────┤
│ • Sincronizar com GitHub                                    │
│ • Parar containers (docker-compose down)                    │
│ • Checkout da versão (git checkout)                         │
│ • Limpar cache frontend (rm -rf .next)                      │
│ • Build frontend (docker-compose build --no-cache)          │
│ • Build backend (docker-compose build --no-cache)           │
│ • Iniciar containers (docker-compose up -d)                 │
│ • Aguardar health check                                     │
│ • Atualizar status (ready)                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SISTEMA ATUALIZADO                                       │
├─────────────────────────────────────────────────────────────┤
│ • Frontend rodando com nova versão                          │
│ • Backend rodando com nova versão                           │
│ • MongoDB com dados preservados                             │
│ • Logs disponíveis em tempo real                            │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Detalhes Importantes

### Build --no-cache

O sistema usa `--no-cache` para garantir que:
- ✅ Todas as dependências sejam reinstaladas
- ✅ Código mais recente seja usado
- ✅ Variáveis de ambiente sejam aplicadas
- ✅ Não haja cache antigo causando problemas

### Variáveis de Ambiente

Durante o build, o Docker lê do `.env` na raiz:

```bash
# Lê estas variáveis:
MONGO_PASSWORD=...
JWT_SECRET=...
ENCRYPTION_KEY=...
SERVER_IP=...
NEXT_PUBLIC_API_URL=...
# etc...
```

E cria arquivos `.env` dentro dos containers:
- Backend: `/app/.env`
- Frontend: `/app/.env.production`

### Preservação de Dados

O que é preservado durante o deploy:
- ✅ Banco de dados MongoDB (volume persistente)
- ✅ Arquivo `.env` na raiz
- ✅ Volumes Docker (mongodb_data)

O que é recriado:
- ❌ Containers (são recriados)
- ❌ Cache do frontend (.next)
- ❌ node_modules (reinstalados)

## 🛠️ Comandos Manuais Equivalentes

Se você quiser fazer o mesmo processo manualmente:

```bash
# Conectar na VPS
ssh root@38.242.213.195

# Ir para o diretório
cd /opt/ark-deploy

# Atualizar código
git fetch origin
git pull origin main

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 📝 Logs em Tempo Real

Durante o deploy, você vê logs em tempo real via Socket.IO:

```
📡 Sincronizando com GitHub...
⏹️ Parando containers atuais...
📦 Fazendo checkout da versão v1.0.0...
🧹 Limpando cache do frontend...
🔨 Fazendo build do frontend...
🔨 Fazendo build do backend...
🚀 Iniciando containers...
⏳ Aguardando containers ficarem saudáveis...
✅ Deploy da versão v1.0.0 concluído com sucesso!
```

## ⚠️ Possíveis Erros

### Erro: "Versão não encontrada"
- Causa: Tag não existe no repositório
- Solução: Criar a versão primeiro

### Erro: "Build timeout"
- Causa: Build demorou mais de 10 minutos
- Solução: Verificar conexão de internet e recursos da VPS

### Erro: "Containers não ficaram saudáveis"
- Causa: Erro no código ou configuração
- Solução: Ver logs com `docker-compose logs`

## 🔄 Rollback Rápido

Se algo der errado, você pode fazer rollback:

1. Pelo painel: Clique em "Rollback" na versão anterior
2. Manual: `git checkout versao-anterior && docker-compose restart`

## 📚 Mais Informações

- [GUIA-RAPIDO-VPS.md](./GUIA-RAPIDO-VPS.md) - Comandos rápidos
- [ENV-SETUP.md](./ENV-SETUP.md) - Configuração de variáveis
- [DOCKERFILE-ENV-GUIDE.md](./DOCKERFILE-ENV-GUIDE.md) - Como .env funciona
