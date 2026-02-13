# 🚀 Guia Rápido - Atualização na VPS

## 📋 Checklist Rápido

```bash
# 1. Conectar na VPS
ssh root@38.242.213.195

# 2. Ir para o diretório
cd /opt/ark-deploy

# 3. Verificar configuração atual
./check-env.sh

# 4. Atualizar código
git pull origin main

# 5. Aplicar mudanças
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 6. Verificar logs
docker-compose logs -f
```

## 🔧 Problema: Socket.IO conectando em localhost

### Sintoma
```
Access to XMLHttpRequest at 'http://localhost:8001/socket.io/...'
from origin 'http://painel.38.242.213.195.sslip.io' has been blocked
```

### Solução Completa

```bash
# 1. Verificar se .env existe na raiz
ls -la .env

# 2. Se não existir, criar a partir do template
cp .env.production .env

# 3. Editar e verificar NEXT_PUBLIC_API_URL
nano .env

# Deve ter:
# NEXT_PUBLIC_API_URL=http://api.38.242.213.195.sslip.io/api

# 4. Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Rebuild COMPLETO (importante!)
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 6. Verificar se aplicou
docker-compose logs frontend | grep -i "api"

# 7. Testar no navegador
# Abrir: http://painel.38.242.213.195.sslip.io
# Verificar console (F12) - não deve ter erro de localhost
```

## 🔍 Verificar se está funcionando

```bash
# Ver logs do backend
docker-compose logs backend | tail -20

# Ver logs do frontend
docker-compose logs frontend | tail -20

# Ver status dos containers
docker-compose ps

# Verificar se Socket.IO está correto
docker-compose logs frontend | grep -i "socket\|localhost"
```

## 📝 Variáveis Importantes no .env

```env
# IP da VPS
SERVER_IP=38.242.213.195

# URL do frontend
FRONTEND_URL=http://painel.38.242.213.195.sslip.io

# URL da API (CRÍTICO para Socket.IO)
NEXT_PUBLIC_API_URL=http://api.38.242.213.195.sslip.io/api

# MongoDB (já configurado)
MONGO_PASSWORD=vQO20N8X8k41oRkAUWAEnw==

# Segurança (já configurado)
JWT_SECRET=hxt8JpXUaEhzQ6VPZFVrhA0PvcbFDQoWvbYbRJEQYy0=
ENCRYPTION_KEY=azl2vRfXO7sysIKrbiger8FurqHcXs0P6z0ZfIDqMJc=
```

## ⚠️ IMPORTANTE

### NEXT_PUBLIC_API_URL é Build-Time

Isso significa que:
- ❌ Apenas reiniciar NÃO aplica a mudança
- ✅ É necessário REBUILD do frontend
- ✅ Use sempre `--no-cache` para garantir

```bash
# ERRADO (não funciona)
docker-compose restart frontend

# CERTO (funciona)
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

## 🔄 Atualização Completa do Sistema

```bash
# 1. Parar tudo
docker-compose down

# 2. Atualizar código
git pull origin main

# 3. Verificar .env
cat .env | grep NEXT_PUBLIC_API_URL

# 4. Se não tiver ou estiver errado, corrigir
nano .env

# 5. Rebuild completo
docker-compose build --no-cache

# 6. Iniciar
docker-compose up -d

# 7. Acompanhar logs
docker-compose logs -f
```

## 🆘 Comandos de Emergência

```bash
# Parar tudo
docker-compose down

# Ver o que está rodando
docker ps -a

# Remover containers antigos
docker-compose rm -f

# Limpar cache do Docker
docker system prune -a

# Rebuild do zero
docker-compose build --no-cache
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Ver apenas erros
docker-compose logs | grep -i "error\|fail"
```

## 📊 Verificar Sistema de Atualizações

```bash
# Ver logs do backend sobre GitHub
docker-compose logs backend | grep -i "github\|commit\|update"

# Deve aparecer algo como:
# ✅ Commit hash capturado: abc123...
# 🔍 Verificando atualizações no GitHub...
```

## 🎯 Checklist Final

- [ ] Arquivo .env existe na raiz
- [ ] NEXT_PUBLIC_API_URL está correto
- [ ] Rebuild do frontend foi feito
- [ ] Containers estão rodando (docker-compose ps)
- [ ] Logs não mostram erros (docker-compose logs)
- [ ] Navegador não mostra erro de localhost
- [ ] Socket.IO conecta corretamente
- [ ] Sistema detecta atualizações

## 📞 Suporte

Se algo não funcionar:

1. Execute: `./check-env.sh`
2. Copie a saída
3. Verifique os logs: `docker-compose logs`
4. Consulte: [ENV-SETUP.md](./ENV-SETUP.md)
