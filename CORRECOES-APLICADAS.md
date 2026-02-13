# Correções Aplicadas - Ark Deploy

## 📅 Data: 13/02/2026

---

## ✅ CORREÇÃO 1: Erro ENOENT ao salvar configurações

### Problema
```
PUT http://api.38.242.213.195.sslip.io/api/admin/settings 500 (Internal Server Error)
ENOENT: no such file or directory, open '/app/.env'
```

### Causa
A rota `PUT /admin/settings` estava importando os módulos `fs/promises` e `path` mesmo sem usá-los. Esses imports eram resquícios de código antigo que tentava escrever no arquivo `.env`.

### Solução Aplicada
**Arquivo**: `deploy-manager/backend/src/routes/admin.ts`

**Antes**:
```typescript
superAdminRouter.put('/settings', async (req: AuthRequest, res) => {
  try {
    const SystemSettings = (await import('../models/SystemSettings')).default;
    const fs = await import('fs/promises');  // ❌ Import desnecessário
    const path = await import('path');       // ❌ Import desnecessário
    
    const { serverIp, baseDomain, ... } = req.body;
    // ...
```

**Depois**:
```typescript
superAdminRouter.put('/settings', async (req: AuthRequest, res) => {
  try {
    const SystemSettings = (await import('../models/SystemSettings')).default;
    
    const { serverIp, baseDomain, ... } = req.body;
    // ...
```

### Como Funciona Agora
1. ✅ Configurações são salvas no MongoDB (collection `systemsettings`)
2. ✅ Variáveis são atualizadas em memória (`process.env`)
3. ✅ Não há mais tentativa de acessar arquivo `.env` no container
4. ✅ Sistema busca configurações do MongoDB primeiro, depois do `process.env`

### Testar
```bash
# Na VPS, após atualizar o código:
cd /opt/ark-deploy
git pull
docker-compose restart backend

# Acessar painel admin e salvar configurações
# Não deve mais dar erro ENOENT
```

---

## ✅ CORREÇÃO 2: Frontend usando localhost:8001

### Problema
```
Access to XMLHttpRequest at 'http://localhost:8001/api/...' from origin 'http://painel.38.242.213.195.sslip.io' has been blocked by CORS policy
```

### Causa
A variável de ambiente `NEXT_PUBLIC_API_URL` não estava configurada no `.env` da VPS, fazendo o frontend usar o valor padrão `http://localhost:8001/api`.

### Solução
**Arquivo**: `/opt/ark-deploy/.env` (na VPS)

Adicionar/modificar:
```bash
NEXT_PUBLIC_API_URL=http://api.38.242.213.195.sslip.io/api
```

### Como Aplicar

#### Opção 1: Script Automatizado (Recomendado)
```bash
cd /opt/ark-deploy
chmod +x scripts/configure-vps.sh
./scripts/configure-vps.sh
```

#### Opção 2: Manual
```bash
cd /opt/ark-deploy

# Editar .env
nano .env

# Adicionar linha:
NEXT_PUBLIC_API_URL=http://api.38.242.213.195.sslip.io/api

# Salvar (Ctrl+O, Enter, Ctrl+X)

# Rebuild frontend
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Verificar
```bash
# Ver logs do frontend
docker-compose logs frontend | grep "API URL"

# Deve mostrar:
# 🌐 API URL configurada: http://api.38.242.213.195.sslip.io/api
```

---

## 📋 Checklist de Atualização na VPS

Execute estes comandos na VPS para aplicar todas as correções:

```bash
# 1. Ir para o diretório do projeto
cd /opt/ark-deploy

# 2. Atualizar código do GitHub
git pull origin main

# 3. Configurar variáveis de ambiente
./scripts/configure-vps.sh

# 4. Verificar se tudo está funcionando
docker-compose ps
docker-compose logs -f backend frontend
```

---

## 🧪 Testes

### Teste 1: Salvar Configurações
1. Acessar: http://painel.38.242.213.195.sslip.io/admin/settings
2. Modificar qualquer campo
3. Clicar em "Salvar"
4. ✅ Deve salvar sem erro ENOENT

### Teste 2: API URL
1. Abrir DevTools (F12)
2. Ir para aba Network
3. Fazer qualquer ação no painel
4. ✅ Requisições devem ir para `http://api.38.242.213.195.sslip.io/api`
5. ❌ NÃO deve aparecer `localhost:8001`

### Teste 3: Socket.IO
1. Acessar página de Deploy
2. Abrir DevTools Console
3. ✅ Deve conectar ao Socket.IO sem erros CORS
4. ✅ Logs devem aparecer em tempo real

---

## 📚 Documentação Adicional

- **CONFIGURACAO-VPS.md**: Guia completo de configuração
- **GUIA-ATUALIZACAO-VPS.md**: Como atualizar o sistema
- **scripts/configure-vps.sh**: Script automatizado de configuração

---

## 🔐 Credenciais

### Super Admin
- **Email**: superadmin@arkdeploy.com
- **Senha**: Admin123
- **Role**: super_admin

### MongoDB
- **Host**: mongodb (container) ou localhost:27017 (host)
- **Usuário**: admin
- **Senha**: vQO20N8X8k41oRkAUWAEnw==
- **Database**: ark-deploy
- **Auth Database**: admin

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs:
   ```bash
   docker-compose logs -f backend frontend
   ```

2. Verificar containers:
   ```bash
   docker-compose ps
   ```

3. Reiniciar tudo:
   ```bash
   docker-compose restart
   ```

4. Rebuild completo:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```
