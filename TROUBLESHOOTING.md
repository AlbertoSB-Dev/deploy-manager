# 🔧 Troubleshooting - Ark Deploy

## Problemas Comuns e Soluções

### ❌ "network coolify declared as external, but could not be found"

**Causa:** A rede Docker "coolify" não existe.

**Solução:**
```bash
docker network create coolify
cd /opt/ark-deploy
docker-compose up -d
```

---

### ❌ "Cannot connect to the Docker daemon"

**Causa:** Docker não está rodando.

**Solução:**
```bash
# Iniciar Docker
systemctl start docker
systemctl enable docker

# Verificar se está rodando
docker ps

# Tentar novamente
cd /opt/ark-deploy
docker-compose up -d
```

---

### ❌ "Nenhum usuário encontrado no banco de dados"

**Causa:** O script antigo `make-admin-auto.js` não cria usuários, apenas lista.

**Solução:**
```bash
cd /opt/ark-deploy
docker-compose exec backend node scripts/create-admin.js
```

Isso criará automaticamente:
- Email: `admin@admin.com`
- Senha: `admin123`

---

### ❌ IPv6 detectado ao invés de IPv4

**Causa:** O servidor tem IPv6 configurado e o curl retorna IPv6 por padrão.

**Solução:** O script já foi atualizado para forçar IPv4 com `curl -4`.

Se ainda tiver problemas, edite manualmente o `.env`:
```bash
cd /opt/ark-deploy
nano .env

# Altere SERVER_IP para seu IPv4
SERVER_IP=38.242.213.195
```

Depois reinicie:
```bash
docker-compose restart
```

---

### ❌ Containers não iniciam

**Verificar logs:**
```bash
cd /opt/ark-deploy
docker-compose logs -f
```

**Verificar status:**
```bash
docker-compose ps
```

**Reiniciar tudo:**
```bash
docker-compose down
docker-compose up -d
```

---

### ❌ Não consigo acessar o painel

**1. Verificar se containers estão rodando:**
```bash
docker-compose ps
```

Deve mostrar 3 containers: mongodb, backend, frontend (todos "Up")

**2. Verificar portas:**
```bash
netstat -tlnp | grep -E '8000|8001|27017'
```

**3. Verificar firewall:**
```bash
# Ubuntu/Debian
ufw allow 8000
ufw allow 8001

# CentOS/RHEL
firewall-cmd --add-port=8000/tcp --permanent
firewall-cmd --add-port=8001/tcp --permanent
firewall-cmd --reload
```

**4. Testar acesso local:**
```bash
curl http://localhost:8000
curl http://localhost:8001/api/health
```

---

### ❌ "WARN: the attribute `version` is obsolete"

**Causa:** Docker Compose v2 não usa mais `version` no arquivo.

**Solução:** Já foi corrigido no repositório. Atualize:
```bash
cd /opt/ark-deploy
git pull
docker-compose up -d
```

---

### 🔄 Reinstalação Completa

Se nada funcionar, reinstale do zero:

```bash
# Parar e remover tudo
cd /opt/ark-deploy
docker-compose down -v

# Remover diretório
cd /opt
rm -rf ark-deploy

# Reinstalar
curl -fsSL https://raw.githubusercontent.com/AlbertoSB-Dev/deploy-manager/main/install-one-command.sh | bash
```

---

### 📝 Comandos Úteis

**Ver logs em tempo real:**
```bash
docker-compose logs -f
```

**Ver logs de um serviço específico:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

**Reiniciar um serviço:**
```bash
docker-compose restart backend
```

**Acessar terminal do container:**
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
```

**Verificar variáveis de ambiente:**
```bash
docker-compose exec backend env | grep -E 'MONGODB|JWT|SERVER'
```

**Limpar tudo e reconstruir:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

### 🆘 Ainda com problemas?

1. Verifique os logs: `docker-compose logs -f`
2. Verifique o status: `docker-compose ps`
3. Teste a conexão: `curl http://localhost:8000`
4. Abra uma issue no GitHub com os logs completos
