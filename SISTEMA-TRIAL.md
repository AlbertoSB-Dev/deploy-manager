# Sistema de Trial de 15 Dias

## 📋 Visão Geral

Novo usuários recebem automaticamente 15 dias de trial grátis com acesso a 1 servidor. Após o período expirar, a conta fica bloqueada até que o usuário contrate uma assinatura paga.

---

## 🎯 Funcionalidades

### Durante o Trial (15 dias)
- ✅ Acesso completo ao painel
- ✅ Pode criar 1 servidor
- ✅ Pode criar projetos, bancos de dados, etc.
- ✅ Pode editar e deletar recursos
- ✅ Pode fazer deploy

### Após o Trial Expirar
- ❌ Não pode criar novos servidores
- ❌ Não pode criar novos projetos
- ❌ Não pode criar novos bancos de dados
- ❌ Não pode editar recursos existentes
- ❌ Não pode deletar recursos
- ✅ Pode visualizar seus projetos (read-only)
- ✅ Pode fazer upgrade para plano pago

---

## 🔧 Implementação Técnica

### Modelo User

```typescript
subscription: {
  status: 'trial' | 'active' | 'inactive' | 'cancelled';
  startDate: Date;        // Quando começou o trial
  endDate: Date;          // Quando expira o trial (15 dias depois)
  trialServersUsed: number; // Quantos servidores usou (máx 1)
}
```

### Métodos do User

```typescript
// Verificar se trial está ativo
user.isTrialActive() // true/false

// Verificar se assinatura paga está ativa
user.isSubscriptionActive() // true/false
```

### Middlewares

1. **checkSubscriptionActive** - Bloqueia acesso se trial/assinatura expirou
2. **checkServerLimit** - Bloqueia criação de 2º servidor durante trial
3. **checkCanModify** - Bloqueia edição/exclusão quando trial expirou

---

## 📝 Fluxo de Registro

1. Usuário se registra em `/register`
2. Sistema cria usuário com:
   - `subscription.status = 'trial'`
   - `subscription.startDate = agora`
   - `subscription.endDate = agora + 15 dias`
   - `subscription.trialServersUsed = 0`
3. Usuário recebe token JWT e pode fazer login
4. Usuário vê "Trial: 15 dias restantes" no dashboard

---

## 🛡️ Proteção de Recursos

### Criar Servidor
```typescript
// Middleware: checkServerLimit
// Se em trial e já tem 1 servidor → Bloqueado
```

### Criar Projeto/Banco de Dados
```typescript
// Middleware: checkSubscriptionActive
// Se trial expirou → Bloqueado
```

### Editar/Deletar Recursos
```typescript
// Middleware: checkCanModify
// Se trial expirou → Bloqueado (read-only)
```

---

## 📊 Endpoints

### GET /api/auth/me
Retorna informações do usuário incluindo status da assinatura:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "João",
    "email": "joao@example.com",
    "subscription": {
      "status": "trial",
      "startDate": "2026-02-11T...",
      "endDate": "2026-02-26T...",
      "isTrialActive": true,
      "isSubscriptionActive": false,
      "daysRemaining": 15
    }
  }
}
```

---

## 🎨 Frontend - Mostrar Status

### Dashboard
Mostrar banner com:
- "🎉 Você está em período de trial"
- "Dias restantes: 15"
- "Limite: 1 servidor"
- Botão "Fazer Upgrade"

### Ao Tentar Criar 2º Servidor
```
❌ Você atingiu o limite de 1 servidor no período de trial.
Faça upgrade para continuar.
```

### Ao Trial Expirar
```
⚠️ Sua assinatura expirou.
Você pode visualizar seus projetos, mas não pode fazer modificações.
Renove sua assinatura para continuar.
```

---

## 🔄 Transição para Plano Pago

1. Usuário clica "Fazer Upgrade"
2. Vai para página de preços (`/pricing`)
3. Seleciona um plano
4. Faz pagamento (integração com Stripe/PayPal)
5. Sistema atualiza:
   - `subscription.status = 'active'`
   - `subscription.planId = planoSelecionado`
   - `subscription.endDate = agora + 1 mês/ano`
6. Usuário tem acesso total novamente

---

## 📋 Checklist de Implementação

- [x] Atualizar modelo User com campos de trial
- [x] Adicionar métodos isTrialActive() e isSubscriptionActive()
- [x] Criar middleware checkSubscriptionActive
- [x] Criar middleware checkServerLimit
- [x] Criar middleware checkCanModify
- [x] Atualizar endpoint /register para criar trial
- [x] Atualizar endpoint /auth/me para retornar status
- [ ] Aplicar middlewares nas rotas de criação de recursos
- [ ] Aplicar middlewares nas rotas de edição/exclusão
- [ ] Criar UI para mostrar status do trial
- [ ] Criar página de upgrade
- [ ] Integrar com sistema de pagamento

---

## 🧪 Testando Localmente

1. **Registrar novo usuário:**
   ```bash
   POST /api/auth/register
   {
     "name": "Teste",
     "email": "teste@example.com",
     "password": "Senha123"
   }
   ```

2. **Verificar status:**
   ```bash
   GET /api/auth/me
   # Deve retornar subscription.status = 'trial'
   # subscription.daysRemaining = 15
   ```

3. **Tentar criar 2º servidor:**
   ```bash
   POST /api/servers
   # Deve retornar erro: "Você atingiu o limite de 1 servidor"
   ```

4. **Simular expiração do trial:**
   ```bash
   # Editar no MongoDB:
   db.users.updateOne(
     { email: "teste@example.com" },
     { $set: { "subscription.endDate": new Date() } }
   )
   ```

5. **Tentar criar projeto após expiração:**
   ```bash
   POST /api/projects
   # Deve retornar erro: "Sua assinatura expirou"
   ```

---

## 📞 Próximos Passos

1. Aplicar middlewares nas rotas de criação/edição
2. Criar UI para mostrar status do trial
3. Integrar com sistema de pagamento (Stripe/PayPal)
4. Criar página de upgrade
5. Enviar email de aviso quando trial está acabando (3 dias antes)
6. Enviar email quando trial expirou

---

## 📞 Suporte

Para dúvidas, consulte:
- `backend/src/models/User.ts` - Modelo User
- `backend/src/middleware/subscription.ts` - Middlewares
- `backend/src/routes/auth.ts` - Rotas de autenticação
