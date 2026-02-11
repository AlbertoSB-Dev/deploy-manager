# Sistema de Super Admin

## 📋 Visão Geral

O sistema possui 3 níveis de acesso:

1. **User** - Usuário comum com trial ou assinatura
2. **Admin** - Administrador com acesso ao painel de admin
3. **Super Admin** - Super administrador com acesso total ao sistema

---

## 🎯 Permissões

### User
- ✅ Criar servidores (1 no trial, ilimitado com assinatura)
- ✅ Criar projetos
- ✅ Fazer deploy
- ✅ Gerenciar seus próprios recursos
- ❌ Acessar painel de admin
- ❌ Gerenciar outros usuários

### Admin
- ✅ Tudo que User pode fazer
- ✅ Acessar painel de admin (`/admin`)
- ✅ Gerenciar planos
- ✅ Gerenciar usuários
- ✅ Ver relatórios
- ✅ Gerenciar deploy do painel
- ❌ Gerenciar pagamentos
- ❌ Acessar configurações de sistema

### Super Admin
- ✅ Tudo que Admin pode fazer
- ✅ Gerenciar pagamentos
- ✅ Acessar configurações de sistema
- ✅ Gerenciar outros admins
- ✅ Ver logs de auditoria
- ✅ Acessar todas as funcionalidades

---

## 🔧 Como Criar Super Admin

### Opção 1: Automático (Recomendado)

Se você já tem um admin criado:

```bash
cd backend
npm run make-super-admin
```

Isso vai:
1. Encontrar o primeiro usuário com role `admin`
2. Promover para `super_admin`
3. Mostrar confirmação

### Opção 2: Manual

1. Criar admin normalmente:
```bash
npm run make-admin-auto
```

2. Promover para super admin:
```bash
npm run make-super-admin
```

### Opção 3: Direto no MongoDB

```javascript
db.users.updateOne(
  { email: "seu-email@example.com" },
  { $set: { role: "super_admin" } }
)
```

---

## 📊 Estrutura de Roles

```
User
├── Criar servidores (1 no trial)
├── Criar projetos
├── Fazer deploy
└── Gerenciar seus recursos

Admin (herda de User)
├── Acessar /admin
├── Gerenciar planos
├── Gerenciar usuários
├── Ver relatórios
└── Gerenciar deploy do painel

Super Admin (herda de Admin)
├── Gerenciar pagamentos
├── Configurações de sistema
├── Gerenciar outros admins
├── Ver logs de auditoria
└── Acesso total
```

---

## 🛡️ Middlewares de Proteção

### Middleware `admin`
Bloqueia acesso se não for admin ou super_admin

```typescript
import { admin } from '../middleware/auth';

router.get('/admin/users', protect, admin, getUsers);
```

### Middleware `superAdmin`
Bloqueia acesso se não for super_admin

```typescript
import { superAdmin } from '../middleware/auth';

router.post('/admin/settings', protect, superAdmin, updateSettings);
```

---

## 📝 Rotas Protegidas

### Admin Routes
```
GET    /api/admin/plans              - Listar planos
POST   /api/admin/plans              - Criar plano
PUT    /api/admin/plans/:id          - Editar plano
DELETE /api/admin/plans/:id          - Deletar plano

GET    /api/admin/users              - Listar usuários
PUT    /api/admin/users/:id          - Editar usuário
DELETE /api/admin/users/:id          - Deletar usuário

GET    /api/admin/stats              - Ver estatísticas
```

### Super Admin Routes
```
POST   /api/admin/settings           - Atualizar configurações
GET    /api/admin/audit-logs         - Ver logs de auditoria
POST   /api/admin/promote-admin      - Promover usuário para admin
POST   /api/admin/demote-admin       - Rebaixar admin para user
```

---

## 🧪 Testando

### 1. Criar Admin

```bash
npm run make-admin-auto
```

Saída esperada:
```
✅ Admin criado com sucesso!
Email: admin@example.com
Senha: (gerada automaticamente)
```

### 2. Promover para Super Admin

```bash
npm run make-super-admin
```

Saída esperada:
```
✅ Usuário promovido para super_admin!
Nome: Admin User
Email: admin@example.com
Role: super_admin
```

### 3. Verificar Role

```bash
curl -X GET http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

Resposta:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "super_admin"
  }
}
```

### 4. Acessar Painel Admin

```
http://localhost:3000/admin
```

---

## 🔐 Segurança

### Boas Práticas

1. **Limite Super Admins**
   - Tenha apenas 1-2 super admins
   - Use senhas fortes
   - Ative 2FA (quando implementado)

2. **Auditoria**
   - Todos os acessos de super admin são registrados
   - Revise logs regularmente
   - Alerte sobre atividades suspeitas

3. **Permissões**
   - Sempre use middlewares de proteção
   - Verifique role antes de operações críticas
   - Implemente rate limiting

---

## 📋 Checklist

- [x] Adicionar role `super_admin` ao modelo User
- [x] Criar middleware `superAdmin`
- [x] Atualizar middleware `admin` para aceitar super_admin
- [x] Criar script `make-super-admin`
- [ ] Implementar rotas de super admin
- [ ] Adicionar logs de auditoria
- [ ] Implementar 2FA para super admin
- [ ] Criar página de gerenciamento de admins
- [ ] Implementar alertas de segurança

---

## 📞 Suporte

Para dúvidas, consulte:
- `backend/src/models/User.ts` - Modelo User
- `backend/src/middleware/auth.ts` - Middlewares
- `backend/scripts/make-super-admin.js` - Script de promoção
