# 🔴 Erro 403 Forbidden - Solução

## 📋 Problema

Você está recebendo erro **403 Forbidden** ao acessar rotas de admin:
- `/api/admin/subscriptions`
- `/api/admin/revenue`
- `/api/admin/settings`

## 🔍 Causa

O usuário logado **não tem permissão de super_admin**. Apenas usuários com `role: 'super_admin'` podem acessar essas rotas.

## ✅ Solução

### Opção 1: Script Automatizado (Recomendado)

```bash
cd /opt/ark-deploy/backend
node scripts/make-user-super-admin.js beto@gmail.com
```

Ou se estiver em desenvolvimento local:
```bash
cd deploy-manager/backend
node scripts/make-user-super-admin.js seu-email@exemplo.com
```

### Opção 2: Via MongoDB Compass

1. Conectar ao MongoDB
2. Abrir collection `users`
3. Encontrar seu usuário pelo email
4. Editar o campo `role` para `"super_admin"`
5. Salvar

### Opção 3: Via Mongo Shell

```bash
# Conectar ao MongoDB
docker-compose exec mongodb mongosh

# No shell do MongoDB
use deploy-manager

# Atualizar usuário
db.users.updateOne(
  { email: "beto@gmail.com" },
  { $set: { role: "super_admin" } }
)

# Verificar
db.users.findOne({ email: "beto@gmail.com" }, { email: 1, role: 1 })

# Sair
exit
```

### Opção 4: Script Existente

```bash
cd /opt/ark-deploy/backend
node scripts/make-super-admin.js
```

## 🔄 Após Atualizar

1. **Fazer logout** do sistema
2. **Fazer login** novamente
3. Verificar se o menu de admin aparece
4. Testar acesso às páginas de admin

## 🎯 Verificar Permissões

Para verificar qual é sua role atual:

```bash
cd /opt/ark-deploy/backend
node scripts/check-user-role.js beto@gmail.com
```

## 📊 Hierarquia de Roles

| Role | Permissões |
|------|-----------|
| `user` | Acesso básico ao sistema |
| `admin` | Gerenciamento de usuários |
| `super_admin` | **Acesso total** (necessário para rotas /admin/*) |

## 🚨 Outros Erros nos Logs

### 1. Socket.IO CORS Error
```
Access to XMLHttpRequest at 'http://localhost:8001/socket.io/...' has been blocked by CORS
```

**Causa**: Frontend tentando conectar ao localhost em vez da URL da API

**Solução**: Verificar variável de ambiente `NEXT_PUBLIC_API_URL` no frontend

### 2. Check Updates 500 Error
```
GET http://api.38.242.213.195.sslip.io/api/admin/check-updates 500
```

**Causa**: Erro no servidor ao verificar atualizações

**Solução**: Verificar logs do backend:
```bash
docker-compose logs backend | grep "check-updates"
```

## 🔧 Comandos Úteis

### Listar todos os usuários e suas roles
```bash
cd /opt/ark-deploy/backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find({}, 'email name role');
  console.log('\\n📋 Usuários:');
  users.forEach(u => console.log(\`   \${u.email} - \${u.role}\`));
  process.exit(0);
});
"
```

### Tornar TODOS os usuários super_admin (CUIDADO!)
```bash
cd /opt/ark-deploy/backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  await User.updateMany({}, { \$set: { role: 'super_admin' } });
  console.log('✅ Todos os usuários são super_admin agora!');
  process.exit(0);
});
"
```

## 📝 Resumo Rápido

**Para resolver o erro 403**:

1. Execute na VPS:
```bash
cd /opt/ark-deploy/backend && node scripts/make-user-super-admin.js beto@gmail.com
```

2. Faça logout e login novamente

3. Pronto! ✅

## 🎯 Teste

Após fazer as mudanças, teste acessando:
- http://painel.38.242.213.195.sslip.io/admin
- http://painel.38.242.213.195.sslip.io/admin/subscriptions
- http://painel.38.242.213.195.sslip.io/admin/revenue

Se ainda der erro 403, verifique:
1. Se fez logout/login
2. Se o token foi atualizado (limpar localStorage)
3. Se o backend está rodando
4. Se a role foi realmente atualizada no banco
