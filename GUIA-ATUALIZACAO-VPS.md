# 🚀 Guia de Atualização na VPS

## 📋 Comandos de Atualização

### 1. Atualização Normal (Recomendado)
```bash
cd /opt/ark-deploy && \
git pull && \
docker-compose down && \
docker rmi ark-deploy-frontend ark-deploy-backend || true && \
rm -rf frontend/.next backend/dist || true && \
docker-compose build --no-cache && \
docker-compose up -d
```

**Quando usar**: Para atualizações regulares com mudanças de código

**Tempo**: ~5-10 minutos

**O que faz**:
- ✅ Baixa atualizações do GitHub
- ✅ Para containers
- ✅ Remove imagens antigas
- ✅ Limpa cache do build
- ✅ Rebuilda tudo do zero
- ✅ Inicia containers

---

### 2. Atualização Rápida
```bash
cd /opt/ark-deploy && \
git pull && \
docker-compose down && \
docker-compose up -d --build
```

**Quando usar**: Para mudanças pequenas ou testes rápidos

**Tempo**: ~2-3 minutos

**O que faz**:
- ✅ Baixa atualizações
- ✅ Para containers
- ✅ Rebuilda apenas o necessário
- ✅ Inicia containers

---

### 3. Atualização Ultra-Limpa
```bash
cd /opt/ark-deploy && \
git pull && \
docker-compose down -v && \
docker system prune -af --volumes && \
rm -rf frontend/.next backend/dist backend/node_modules/.cache || true && \
docker-compose build --no-cache && \
docker-compose up -d
```

**Quando usar**: Quando há problemas persistentes ou cache corrompido

**Tempo**: ~10-15 minutos

**⚠️ ATENÇÃO**: Remove TODOS os volumes (incluindo dados de desenvolvimento)

**O que faz**:
- ✅ Baixa atualizações
- ✅ Para containers e remove volumes
- ✅ Limpa todo o sistema Docker
- ✅ Remove todo cache
- ✅ Rebuilda tudo do zero
- ✅ Inicia containers

---

## 🛠️ Usando o Script Automatizado

### Tornar o script executável (primeira vez)
```bash
chmod +x /opt/ark-deploy/update-production.sh
```

### Atualização Normal
```bash
/opt/ark-deploy/update-production.sh
```

### Atualização Rápida
```bash
/opt/ark-deploy/update-production.sh fast
```

### Atualização Limpa
```bash
/opt/ark-deploy/update-production.sh clean
```

### Atualização Ultra-Limpa
```bash
/opt/ark-deploy/update-production.sh ultra-clean
```

---

## 📊 Verificar Status Após Atualização

### Ver containers rodando
```bash
docker-compose ps
```

### Ver logs em tempo real
```bash
docker-compose logs -f
```

### Ver logs de um serviço específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Ver últimas 100 linhas dos logs
```bash
docker-compose logs --tail=100
```

---

## 🔧 Comandos Úteis

### Reiniciar todos os serviços
```bash
docker-compose restart
```

### Reiniciar apenas um serviço
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Parar tudo
```bash
docker-compose down
```

### Iniciar tudo
```bash
docker-compose up -d
```

### Ver uso de recursos
```bash
docker stats
```

### Limpar logs antigos
```bash
docker-compose logs --tail=0 -f > /dev/null &
```

---

## 🚨 Solução de Problemas

### Erro: "Cannot connect to Docker daemon"
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Erro: "Port already in use"
```bash
# Ver o que está usando a porta
sudo lsof -i :8000
sudo lsof -i :8001

# Matar processo
sudo kill -9 <PID>
```

### Erro: "No space left on device"
```bash
# Limpar imagens não usadas
docker system prune -a

# Limpar volumes não usados
docker volume prune

# Ver uso de disco
df -h
docker system df
```

### Containers não iniciam
```bash
# Ver logs detalhados
docker-compose logs

# Verificar configuração
docker-compose config

# Rebuildar do zero
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Frontend não carrega
```bash
# Limpar cache do Next.js
rm -rf /opt/ark-deploy/frontend/.next

# Rebuildar frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Backend não conecta ao MongoDB
```bash
# Verificar se MongoDB está rodando
docker-compose ps mongodb

# Ver logs do MongoDB
docker-compose logs mongodb

# Reiniciar MongoDB
docker-compose restart mongodb
```

---

## 📝 Checklist de Atualização

Antes de atualizar:
- [ ] Fazer backup do banco de dados
- [ ] Verificar se há usuários online
- [ ] Avisar usuários sobre manutenção
- [ ] Ter acesso SSH à VPS

Durante a atualização:
- [ ] Executar comando de atualização
- [ ] Aguardar build completar
- [ ] Verificar logs para erros

Após a atualização:
- [ ] Verificar se containers estão rodando
- [ ] Testar login no sistema
- [ ] Verificar funcionalidades principais
- [ ] Monitorar logs por alguns minutos

---

## 🔐 Backup Antes de Atualizar

### Backup do MongoDB
```bash
docker-compose exec mongodb mongodump --out /backup
docker cp $(docker-compose ps -q mongodb):/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Backup dos arquivos .env
```bash
cp /opt/ark-deploy/backend/.env /opt/ark-deploy/backend/.env.backup
cp /opt/ark-deploy/frontend/.env.local /opt/ark-deploy/frontend/.env.local.backup
```

### Backup completo
```bash
tar -czf ark-deploy-backup-$(date +%Y%m%d).tar.gz /opt/ark-deploy
```

---

## ⏱️ Tempo Estimado por Tipo

| Tipo | Tempo | Downtime |
|------|-------|----------|
| Rápida | 2-3 min | ~1 min |
| Normal | 5-10 min | ~3 min |
| Limpa | 10-15 min | ~5 min |
| Ultra-Limpa | 15-20 min | ~8 min |

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs: `docker-compose logs`
2. Verificar documentação: `/opt/ark-deploy/TROUBLESHOOTING.md`
3. Restaurar backup se necessário
4. Contatar suporte técnico

---

## 🎯 Resumo Rápido

**Atualização padrão (copie e cole)**:
```bash
cd /opt/ark-deploy && git pull && docker-compose down && docker rmi ark-deploy-frontend ark-deploy-backend || true && rm -rf frontend/.next backend/dist || true && docker-compose build --no-cache && docker-compose up -d && docker-compose logs -f --tail=50
```

Esse comando faz tudo e mostra os logs no final! 🚀
