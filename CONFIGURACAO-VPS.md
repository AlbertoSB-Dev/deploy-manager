# Configuração da VPS - Ark Deploy

## ✅ Correções Aplicadas

### 1. Removido acesso ao arquivo .env em produção
- **Problema**: Rota `PUT /admin/settings` tentava importar módulos `fs` e `path` que não eram usados
- **Solução**: Removidos imports desnecessários
- **Resultado**: Sistema agora busca TODAS as configurações do MongoDB, não do arquivo .env

### 2. Sistema de Configurações
O sistema agora funciona da seguinte forma:
- ✅ Configurações são salvas no MongoDB (collection `systemsettings`)
- ✅ Variáveis são atualizadas em memória (`process.env`)
- ✅ Não há mais tentativa de escrever no arquivo `.env` do container
- ✅ Rota GET `/admin/settings` cria configurações padrão se não existirem

---

## 🔧 Configuração Necessária na VPS

### Problema: Frontend usando localhost:8001

O frontend está tentando conectar em `localhost:8001` porque a variável `NEXT_PUBLIC_API_URL` não está configurada corretamente.

### Solução: Configurar NEXT_PUBLIC_API_URL

**1. Editar o arquivo .env na VPS:**

```bash
cd /opt/ark-deploy
nano .env
```

**2. Adicionar/modificar a linha:**

```bash
NEXT_PUBLIC_API_URL=http://api.38.242.213.195.sslip.io/api
```

**3. Salvar e sair** (Ctrl+O, Enter, Ctrl+X)

**4. Rebuild do frontend** (necessário porque Next.js usa variáveis em build-time):

```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

**5. Verificar se funcionou:**

```bash
docker-compose logs frontend | grep "API URL"
```

Deve mostrar:
```
🌐 API URL configurada: http://api.38.242.213.195.sslip.io/api
```

---

## 📋 Arquivo .env Completo Recomendado

Aqui está um exemplo de `.env` completo para a VPS:

```bash
# MongoDB
MONGO_PASSWORD=vQO20N8X8k41oRkAUWAEnw==

# JWT & Encryption
JWT_SECRET=your-secret-key-change-in-production
ENCRYPTION_KEY=your-encryption-key-32-chars-min

# Server Configuration
SERVER_IP=38.242.213.195
BASE_DOMAIN=sslip.io
FRONTEND_URL=http://painel.38.242.213.195.sslip.io

# API URL (IMPORTANTE!)
NEXT_PUBLIC_API_URL=http://api.38.242.213.195.sslip.io/api

# GitHub OAuth (opcional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://painel.38.242.213.195.sslip.io/auth/github/callback

# Assas (configurável pelo painel)
ASSAS_API_KEY=
ASSAS_WEBHOOK_TOKEN=
ASSAS_ENVIRONMENT=sandbox

# Email (opcional)
EMAIL_ENABLED=false
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
```

---

## 🚀 Comandos de Atualização

### Atualização Rápida (após git pull)
```bash
cd /opt/ark-deploy
./update-production.sh fast
```

### Atualização Completa (rebuild total)
```bash
cd /opt/ark-deploy
./update-production.sh normal
```

### Atualização Ultra-Clean (limpa tudo)
```bash
cd /opt/ark-deploy
./update-production.sh ultra-clean
```

---

## 🔍 Diagnóstico de Problemas

### Verificar se containers estão rodando:
```bash
docker-compose ps
```

### Ver logs do backend:
```bash
docker-compose logs -f backend
```

### Ver logs do frontend:
```bash
docker-compose logs -f frontend
```

### Verificar configurações do MongoDB:
```bash
docker-compose exec mongodb mongosh -u admin -p 'vQO20N8X8k41oRkAUWAEnw==' --authenticationDatabase admin ark-deploy --eval "db.systemsettings.find().pretty()"
```

### Testar API:
```bash
curl http://api.38.242.213.195.sslip.io/api/health
```

### Testar Login:
```bash
curl -X POST http://api.38.242.213.195.sslip.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@arkdeploy.com","password":"Admin123"}'
```

---

## 📝 Credenciais do Super Admin

- **Email**: superadmin@arkdeploy.com
- **Senha**: Admin123
- **Role**: super_admin

---

## ⚠️ Notas Importantes

1. **NEXT_PUBLIC_API_URL** é uma variável de build-time do Next.js
   - Mudanças requerem rebuild do frontend
   - Não pode ser alterada apenas reiniciando o container

2. **Configurações do Painel Admin** são salvas no MongoDB
   - Não precisam estar no .env
   - São carregadas automaticamente na inicialização
   - Podem ser alteradas pelo painel em tempo real

3. **Arquivo .env** é usado apenas para:
   - Configurações de infraestrutura (MongoDB, portas, etc)
   - Variáveis que precisam estar disponíveis no build
   - Valores padrão caso MongoDB esteja vazio

4. **Em produção (Docker)**:
   - O arquivo .env fica no host (`/opt/ark-deploy/.env`)
   - Containers não têm acesso direto ao arquivo
   - Variáveis são passadas via docker-compose.yml

---

## 🎯 Próximos Passos

1. ✅ Adicionar `NEXT_PUBLIC_API_URL` no .env
2. ✅ Rebuild do frontend
3. ✅ Testar login no painel
4. ✅ Configurar credenciais Assas pelo painel admin
5. ✅ Configurar GitHub OAuth (opcional)
6. ✅ Configurar Email (opcional)
