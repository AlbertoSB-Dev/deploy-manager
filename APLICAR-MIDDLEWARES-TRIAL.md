# Como Aplicar Middlewares de Trial

## 📋 Resumo

Os middlewares de trial precisam ser aplicados nas rotas para bloquear ações quando o trial expirar.

---

## 🔧 Middlewares Disponíveis

### 1. checkSubscriptionActive
**Uso**: Bloqueia acesso se trial/assinatura expirou
**Aplica em**: Qualquer rota que precise de acesso ativo

```typescript
import { checkSubscriptionActive } from '../middleware/subscription';

router.post('/projects', protect, checkSubscriptionActive, createProject);
```

### 2. checkServerLimit
**Uso**: Limita a 1 servidor durante trial
**Aplica em**: Rota de criar servidor

```typescript
import { checkServerLimit } from '../middleware/subscription';

router.post('/servers', protect, checkServerLimit, createServer);
```

### 3. checkCanModify
**Uso**: Bloqueia edição/exclusão quando trial expirou (read-only)
**Aplica em**: Rotas de editar/deletar

```typescript
import { checkCanModify } from '../middleware/subscription';

router.put('/projects/:id', protect, checkCanModify, updateProject);
router.delete('/projects/:id', protect, checkCanModify, deleteProject);
```

---

## 📝 Rotas para Aplicar

### Servidores (`backend/src/routes/servers.ts`)

```typescript
import { checkSubscriptionActive, checkServerLimit } from '../middleware/subscription';

// Criar servidor - aplicar checkServerLimit
router.post('/', protect, checkServerLimit, createServer);

// Editar servidor - aplicar checkCanModify
router.put('/:id', protect, checkCanModify, updateServer);

// Deletar servidor - aplicar checkCanModify
router.delete('/:id', protect, checkCanModify, deleteServer);
```

### Projetos (`backend/src/routes/projects.ts`)

```typescript
import { checkSubscriptionActive, checkCanModify } from '../middleware/subscription';

// Criar projeto - aplicar checkSubscriptionActive
router.post('/', protect, checkSubscriptionActive, createProject);

// Editar projeto - aplicar checkCanModify
router.put('/:id', protect, checkCanModify, updateProject);

// Deletar projeto - aplicar checkCanModify
router.delete('/:id', protect, checkCanModify, deleteProject);

// Deploy - aplicar checkSubscriptionActive
router.post('/:id/deploy', protect, checkSubscriptionActive, deployProject);
```

### Bancos de Dados (`backend/src/routes/databases.ts`)

```typescript
import { checkSubscriptionActive, checkCanModify } from '../middleware/subscription';

// Criar banco - aplicar checkSubscriptionActive
router.post('/', protect, checkSubscriptionActive, createDatabase);

// Editar banco - aplicar checkCanModify
router.put('/:id', protect, checkCanModify, updateDatabase);

// Deletar banco - aplicar checkCanModify
router.delete('/:id', protect, checkCanModify, deleteDatabase);
```

### Backups (`backend/src/routes/backups.ts`)

```typescript
import { checkSubscriptionActive, checkCanModify } from '../middleware/subscription';

// Criar backup - aplicar checkSubscriptionActive
router.post('/', protect, checkSubscriptionActive, createBackup);

// Restaurar backup - aplicar checkCanModify
router.post('/:id/restore', protect, checkCanModify, restoreBackup);

// Deletar backup - aplicar checkCanModify
router.delete('/:id', protect, checkCanModify, deleteBackup);
```

### WordPress (`backend/src/routes/wordpress.ts`)

```typescript
import { checkSubscriptionActive, checkCanModify } from '../middleware/subscription';

// Instalar WordPress - aplicar checkSubscriptionActive
router.post('/', protect, checkSubscriptionActive, installWordPress);

// Editar WordPress - aplicar checkCanModify
router.put('/:id', protect, checkCanModify, updateWordPress);

// Deletar WordPress - aplicar checkCanModify
router.delete('/:id', protect, checkCanModify, deleteWordPress);
```

---

## 🧪 Testando

### 1. Registrar novo usuário
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@example.com",
    "password": "Senha123"
  }'
```

### 2. Verificar status do trial
```bash
curl -X GET http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

Deve retornar:
```json
{
  "subscription": {
    "status": "trial",
    "isTrialActive": true,
    "daysRemaining": 15
  }
}
```

### 3. Criar 1º servidor (deve funcionar)
```bash
curl -X POST http://localhost:8001/api/servers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Servidor 1", ... }'
```

### 4. Tentar criar 2º servidor (deve falhar)
```bash
curl -X POST http://localhost:8001/api/servers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Servidor 2", ... }'
```

Deve retornar:
```json
{
  "success": false,
  "error": "Você atingiu o limite de 1 servidor no período de trial. Faça upgrade para continuar."
}
```

### 5. Simular expiração do trial
```bash
# No MongoDB:
db.users.updateOne(
  { email: "teste@example.com" },
  { $set: { "subscription.endDate": new Date() } }
)
```

### 6. Tentar criar projeto (deve falhar)
```bash
curl -X POST http://localhost:8001/api/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Projeto", ... }'
```

Deve retornar:
```json
{
  "success": false,
  "error": "Sua assinatura expirou. Por favor, renove sua assinatura para continuar."
}
```

### 7. Tentar editar projeto (deve falhar com read-only)
```bash
curl -X PUT http://localhost:8001/api/projects/ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Novo Nome" }'
```

Deve retornar:
```json
{
  "success": false,
  "error": "Sua assinatura expirou. Você pode visualizar seus projetos, mas não pode fazer modificações."
}
```

---

## 📋 Checklist

- [ ] Aplicar middlewares em `servers.ts`
- [ ] Aplicar middlewares em `projects.ts`
- [ ] Aplicar middlewares em `databases.ts`
- [ ] Aplicar middlewares em `backups.ts`
- [ ] Aplicar middlewares em `wordpress.ts`
- [ ] Testar criação de 1º servidor (deve funcionar)
- [ ] Testar criação de 2º servidor (deve falhar)
- [ ] Testar criação de projeto com trial ativo (deve funcionar)
- [ ] Testar criação de projeto com trial expirado (deve falhar)
- [ ] Testar edição de projeto com trial expirado (deve falhar com read-only)

---

## 📞 Suporte

Para dúvidas, consulte:
- `backend/src/middleware/subscription.ts` - Implementação dos middlewares
- `SISTEMA-TRIAL.md` - Documentação do sistema de trial
