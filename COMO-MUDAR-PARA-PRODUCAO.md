# 🚀 Como Mudar o Ark Deploy para Modo Produção

## ⚠️ Problema Identificado

O sistema estava rodando em modo desenvolvimento (`npm run dev`) ao invés de produção.

## ✅ Solução Implementada

Foram feitas as seguintes alterações:

### 1. Dockerfiles Otimizados

**Frontend (`frontend/Dockerfile`):**
- Multi-stage build (builder + runner)
- `NODE_ENV=production` definido ANTES do build
- `NEXT_TELEMETRY_DISABLED=1` para desabilitar telemetria
- Apenas dependências de produção no stage final
- Build otimizado do Next.js

**Backend (`backend/Dockerfile`):**
- Multi-stage build (builder + runner)
- TypeScript compilado no stage builder
- Apenas dependências de produção no stage final
- Executa `node dist/index.js` (não ts-node)

### 2. Scripts Criados

**`switch-to-production.sh`** - Script automático que:
1. Para todos os containers
2. Remove imagens antigas
3. Limpa cache (Docker, Next.js, TypeScript)
4. Reconstrói tudo do zero em modo produção
5. Inicia os containers
6. Mostra logs para verificação

**`remove-all-containers.sh`** - Remove tudo (containers, imagens, volumes)

### 3. Instalação Atualizada

O script `install-one-command.sh` agora:
- Limpa cache antes de buildar
- Usa `--no-cache --pull` para garantir build limpo
- Instala tudo já em modo produção

### 4. Documentação

- **`PRODUCTION.md`** - Guia completo sobre modo produção
- **`README.md`** - Atualizado com seção de produção

## 🔧 Como Aplicar no Seu Servidor

Execute no seu VPS (IP: 38.242.213.195):

```bash
# 1. Conectar no servidor
ssh root@38.242.213.195

# 2. Ir para o diretório
cd /opt/ark-deploy

# 3. Atualizar código
git pull

# 4. Dar permissão ao script
chmod +x switch-to-production.sh

# 5. Executar script de produção
./switch-to-production.sh
```

O script vai:
- Parar containers atuais
- Remover imagens antigas
- Limpar todo o cache
- Rebuildar tudo em modo produção
- Iniciar containers
- Mostrar logs

**Tempo estimado:** 5-10 minutos (depende da internet)

## ✅ Como Verificar se Funcionou

Após executar o script, verifique os logs:

```bash
# Ver logs do frontend
docker-compose logs frontend | grep -i "ready"

# Ver logs do backend
docker-compose logs backend | grep -i "production"
```

### Sinais de Sucesso ✅

**Frontend:**
- ✅ `✓ Ready in Xs` (sem mencionar "dev")
- ✅ Sem "Try Turbopack"
- ✅ Sem "Route: Static"

**Backend:**
- ✅ `🚀 Deploy Manager rodando na porta 8001`
- ✅ Sem `ts-node` nos logs

### Se Ainda Estiver em Dev ❌

Execute novamente com limpeza mais agressiva:

```bash
cd /opt/ark-deploy

# Remover TUDO
docker-compose down -v
docker rmi ark-deploy-frontend ark-deploy-backend
docker builder prune -af
rm -rf frontend/.next backend/dist

# Rebuild do zero
docker-compose build --no-cache --pull
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 📊 Diferenças Visíveis

| Antes (Dev) | Depois (Produção) |
|-------------|-------------------|
| `npm run dev` | `npm start` |
| `ts-node-dev` | `node dist/index.js` |
| "Try Turbopack" | Sem mensagem |
| Hot reload | Sem hot reload |
| Mais lento | Mais rápido |
| Mais logs | Logs otimizados |

## 🆘 Troubleshooting

### Erro ao buildar

```bash
# Ver erro completo
docker-compose build --no-cache

# Se erro persistir, verificar:
docker-compose logs frontend
docker-compose logs backend
```

### Containers não iniciam

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs

# Reiniciar
docker-compose restart
```

### Ainda mostra dev mode

```bash
# Forçar rebuild apenas do frontend
docker-compose down
docker rmi ark-deploy-frontend
rm -rf frontend/.next
docker-compose build --no-cache frontend
docker-compose up -d
```

## 📝 Comandos Úteis

```bash
# Ver status
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Reiniciar tudo
docker-compose restart

# Parar tudo
docker-compose down

# Remover tudo (CUIDADO: apaga dados!)
./remove-all-containers.sh
```

## 🎯 Próximos Passos

Após colocar em produção:

1. ✅ Verificar que está em modo produção
2. ✅ Testar login e funcionalidades
3. ✅ Configurar GitHub OAuth (se necessário)
4. ✅ Configurar SSL/TLS com Certbot
5. ✅ Configurar backups automáticos
6. ✅ Monitorar logs e performance

## 📖 Documentação Adicional

- **PRODUCTION.md** - Guia completo de produção
- **TROUBLESHOOTING.md** - Solução de problemas
- **README.md** - Documentação geral
