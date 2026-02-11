# 🚀 Modo Produção - Ark Deploy

Este guia explica como garantir que o Ark Deploy está rodando em modo produção.

## ✅ Como Verificar se Está em Produção

Execute no servidor:

```bash
cd /opt/ark-deploy

# Verificar logs do frontend
docker-compose logs frontend | grep -i "mode\|dev\|production\|ready"

# Verificar logs do backend
docker-compose logs backend | grep -i "mode\|dev\|production"
```

### Sinais de Modo Produção ✅

**Frontend (Next.js):**
- ✅ `✓ Ready in Xs` (sem mencionar "dev" ou "Turbopack")
- ✅ Sem mensagem "Try Turbopack"
- ✅ Sem "Route: Static" ou "Route: Dynamic"
- ✅ `NODE_ENV=production` nos logs

**Backend:**
- ✅ `node dist/index.js` rodando
- ✅ Sem `ts-node` ou `ts-node-dev` nos processos
- ✅ `NODE_ENV=production` nos logs

### Sinais de Modo Desenvolvimento ❌

**Frontend:**
- ❌ `npm run dev` nos logs
- ❌ Mensagem "Try Turbopack"
- ❌ "Route: Static" ou "Route: Dynamic"
- ❌ Warnings sobre "allowedDevOrigins"

**Backend:**
- ❌ `ts-node` ou `ts-node-dev` rodando
- ❌ `npm run dev` nos logs

## 🔄 Como Mudar para Modo Produção

### Opção 1: Script Automático (Recomendado)

```bash
cd /opt/ark-deploy
chmod +x switch-to-production.sh
./switch-to-production.sh
```

Este script:
1. Para todos os containers
2. Remove imagens antigas
3. Limpa todo o cache (Docker, Next.js, TypeScript)
4. Reconstrói tudo do zero em modo produção
5. Inicia os containers

### Opção 2: Manual

```bash
cd /opt/ark-deploy

# 1. Parar containers
docker-compose down

# 2. Remover imagens antigas
docker rmi ark-deploy-frontend ark-deploy-backend

# 3. Limpar cache do Docker
docker builder prune -af

# 4. Limpar cache do Next.js e build do backend
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache
rm -rf backend/dist

# 5. Rebuild sem cache
docker-compose build --no-cache --pull

# 6. Iniciar
docker-compose up -d

# 7. Ver logs
docker-compose logs -f
```

## 🐛 Troubleshooting

### Frontend ainda mostra "npm run dev"

**Causa:** Cache do Next.js ou Docker usando imagem antiga

**Solução:**
```bash
cd /opt/ark-deploy
docker-compose down
docker rmi ark-deploy-frontend
rm -rf frontend/.next
docker-compose build --no-cache frontend
docker-compose up -d
```

### Backend ainda usa ts-node

**Causa:** Dockerfile não foi atualizado ou cache do Docker

**Solução:**
```bash
cd /opt/ark-deploy
docker-compose down
docker rmi ark-deploy-backend
rm -rf backend/dist
docker-compose build --no-cache backend
docker-compose up -d
```

### Containers não iniciam após rebuild

**Causa:** Erro no build ou falta de dependências

**Solução:**
```bash
# Ver logs de build
docker-compose build --no-cache

# Ver logs de runtime
docker-compose up

# Se houver erro, verificar:
docker-compose logs frontend
docker-compose logs backend
```

## 📊 Diferenças entre Dev e Produção

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| **Frontend** | `npm run dev` | `npm start` |
| **Backend** | `ts-node-dev` | `node dist/index.js` |
| **Hot Reload** | ✅ Sim | ❌ Não |
| **Source Maps** | ✅ Completos | ⚠️ Limitados |
| **Otimização** | ❌ Mínima | ✅ Máxima |
| **Cache** | ❌ Desabilitado | ✅ Habilitado |
| **Build Time** | Rápido | Mais lento |
| **Performance** | Mais lento | Mais rápido |
| **Tamanho** | Maior | Menor |

## 🔒 Checklist de Produção

Antes de colocar em produção, verifique:

- [ ] `NODE_ENV=production` no `.env`
- [ ] JWT_SECRET gerado com `openssl rand -hex 64`
- [ ] ENCRYPTION_KEY gerado com `openssl rand -hex 16`
- [ ] Senha do MongoDB alterada (não usar `changeme123`)
- [ ] GitHub OAuth configurado (se usar)
- [ ] Nginx configurado como proxy reverso
- [ ] Firewall configurado (portas 80, 443, 8000, 8001)
- [ ] Backups automáticos configurados
- [ ] Logs sendo monitorados
- [ ] SSL/TLS configurado (Certbot/Let's Encrypt)

## 🚀 Performance em Produção

### Frontend (Next.js)

- Build otimizado com minificação
- Imagens otimizadas automaticamente
- CSS extraído e minificado
- JavaScript dividido em chunks
- Cache agressivo de assets estáticos

### Backend (Node.js)

- TypeScript compilado para JavaScript
- Sem overhead de transpilação em runtime
- Apenas dependências de produção instaladas
- Logs otimizados

## 📝 Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Ver uso de recursos
docker stats

# Ver logs em tempo real
docker-compose logs -f

# Ver apenas erros
docker-compose logs | grep -i error

# Reiniciar apenas um serviço
docker-compose restart frontend
docker-compose restart backend

# Atualizar código e rebuild
cd /opt/ark-deploy
git pull
./switch-to-production.sh
```

## 🆘 Suporte

Se após seguir este guia o sistema ainda estiver em modo dev:

1. Verifique os Dockerfiles em `backend/Dockerfile` e `frontend/Dockerfile`
2. Confirme que `CMD` usa comandos de produção
3. Verifique se `NODE_ENV=production` está definido
4. Execute `./switch-to-production.sh` novamente
5. Abra uma issue no GitHub com os logs completos
