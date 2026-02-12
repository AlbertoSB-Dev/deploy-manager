# 📊 Como as Assinaturas São Salvas

## 📋 Estrutura de Dados

As assinaturas são salvas **dentro do documento do usuário** no MongoDB, no campo `subscription`.

### Modelo User (MongoDB)

```typescript
{
  _id: ObjectId("..."),
  name: "João Silva",
  email: "joao@example.com",
  password: "hash...",
  role: "user",
  
  // 👇 ASSINATURA AQUI
  subscription: {
    planId: ObjectId("..."),              // Referência ao plano escolhido
    status: "trial",                      // Status: trial, active, inactive, cancelled
    startDate: ISODate("2026-02-12"),     // Quando começou
    endDate: ISODate("2026-02-27"),       // Quando expira (15 dias depois)
    trialServersUsed: 0,                  // Quantos servidores usou no trial
    serversCount: 1,                      // Quantos servidores pode ter
    assasCustomerId: "cus_123456",        // ID do cliente no Assas
    assasSubscriptionId: "sub_789012"     // ID da assinatura no Assas
  },
  
  createdAt: ISODate("2026-02-12"),
  updatedAt: ISODate("2026-02-12")
}
```

---

## 🔄 Fluxo de Salvamento

### 1. Registro de Novo Usuário (Trial)

**Quando**: Usuário se registra em `/api/auth/register`

**Código**:
```typescript
// backend/src/routes/auth.ts
const user = await User.create({
  name,
  email,
  password,
  subscription: {
    status: 'trial',
    startDate: new Date(),
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
    trialServersUsed: 0,
  },
});
```

**Resultado no MongoDB**:
```json
{
  "_id": "698943636949228361c3030",
  "name": "João Silva",
  "email": "joao@example.com",
  "subscription": {
    "status": "trial",
    "startDate": "2026-02-12T10:00:00.000Z",
    "endDate": "2026-02-27T10:00:00.000Z",
    "trialServersUsed": 0,
    "serversCount": 1
  }
}
```

---

### 2. Criação de Assinatura Paga

**Quando**: Usuário faz checkout em `/api/payments/subscribe`

**Fluxo**:
```
1. Frontend envia: planId, servers, billingType
2. Backend valida preço
3. Backend cria cliente no Assas (se não existir)
4. Backend cria assinatura no Assas
5. Backend salva IDs no MongoDB
```

**Código**:
```typescript
// backend/src/routes/payments.ts

// 1. Criar cliente no Assas
const customer = await AssasService.createCustomer({
  name: user.name,
  email: user.email,
  cpfCnpj: '00000000000000',
});

// 2. Criar assinatura no Assas
const subscription = await AssasService.createSubscription({
  customerId: customer.id,
  planId: assasPlanId,
  billingType: 'CREDIT_CARD',
  creditCard: {...},
});

// 3. Salvar no MongoDB
user.subscription = {
  planId: plan._id,
  status: 'active',
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
  assasSubscriptionId: subscription.id,
  assasCustomerId: customer.id,
  serversCount: servers,
};
await user.save();
```

**Resultado no MongoDB**:
```json
{
  "_id": "698943636949228361c3030",
  "subscription": {
    "planId": "698943636949228361c3031",
    "status": "active",
    "startDate": "2026-02-12T10:00:00.000Z",
    "endDate": "2026-03-12T10:00:00.000Z",
    "assasCustomerId": "cus_000005141142",
    "assasSubscriptionId": "sub_000005141143",
    "serversCount": 5
  }
}
```

---

### 3. Atualização via Webhook (Pagamento Recebido)

**Quando**: Assas envia webhook `PAYMENT_RECEIVED`

**Código**:
```typescript
// backend/src/routes/payments.ts

case 'payment_received': {
  const subscriptionId = processedEvent.data?.subscription?.id;
  
  // Buscar usuário pelo ID da assinatura do Assas
  const user = await User.findOne({ 
    'subscription.assasSubscriptionId': subscriptionId 
  });
  
  if (user) {
    // Calcular nova data de expiração
    const endDate = new Date();
    if (plan?.interval === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    // Atualizar assinatura
    user.subscription = {
      ...user.subscription,
      status: 'active',
      endDate: endDate,
    };
    
    await user.save();
  }
}
```

**Resultado no MongoDB**:
```json
{
  "subscription": {
    "status": "active",
    "endDate": "2026-03-12T10:00:00.000Z"  // ← Atualizado
  }
}
```

---

### 4. Expiração Automática (Cron Job)

**Quando**: Cron job executa às 3h da manhã

**Código**:
```typescript
// backend/src/services/SubscriptionRenewalService.ts

// Buscar trials expirados
const expiredUsers = await User.find({
  'subscription.status': 'trial',
  'subscription.endDate': { $lte: new Date() },
});

// Atualizar status
for (const user of expiredUsers) {
  user.subscription.status = 'inactive';
  await user.save();
}
```

**Resultado no MongoDB**:
```json
{
  "subscription": {
    "status": "inactive",  // ← Mudou de 'trial' para 'inactive'
    "endDate": "2026-02-27T10:00:00.000Z"
  }
}
```

---

## 📊 Estados da Assinatura

### Status Possíveis

| Status | Descrição | Quando Acontece |
|--------|-----------|-----------------|
| `trial` | Trial ativo | Ao registrar |
| `active` | Assinatura paga ativa | Após pagamento confirmado |
| `inactive` | Expirado | Trial ou assinatura expirou |
| `cancelled` | Cancelado | Usuário cancelou |

### Transições de Estado

```
┌─────────┐
│  trial  │ ← Registro
└────┬────┘
     │
     ├─→ (15 dias) ─→ inactive (trial expirou)
     │
     └─→ (pagamento) ─→ active
                         │
                         ├─→ (expirou) ─→ inactive
                         │
                         └─→ (cancelou) ─→ cancelled
```

---

## 🔍 Consultas Comuns

### 1. Buscar Usuário por Email
```javascript
const user = await User.findOne({ email: 'joao@example.com' });
console.log(user.subscription.status); // 'trial'
```

### 2. Buscar por ID da Assinatura do Assas
```javascript
const user = await User.findOne({ 
  'subscription.assasSubscriptionId': 'sub_123456' 
});
```

### 3. Buscar Trials Expirando
```javascript
const threeDaysFromNow = new Date();
threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

const expiringUsers = await User.find({
  'subscription.status': 'trial',
  'subscription.endDate': { $lte: threeDaysFromNow },
});
```

### 4. Buscar Assinaturas Ativas
```javascript
const activeUsers = await User.find({
  'subscription.status': 'active',
});
```

### 5. Contar Servidores Usados no Trial
```javascript
const Server = require('./models/Server');
const serverCount = await Server.countDocuments({ userId: user._id });

if (serverCount >= 1 && user.subscription.status === 'trial') {
  // Limite atingido
}
```

---

## 📝 Exemplo Completo de Documento

```json
{
  "_id": {
    "$oid": "698943636949228361c3030"
  },
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "$2a$10$hash...",
  "role": "user",
  "isActive": true,
  "avatar": "https://example.com/avatar.jpg",
  
  "subscription": {
    "planId": {
      "$oid": "698943636949228361c3031"
    },
    "status": "active",
    "startDate": {
      "$date": "2026-02-12T10:00:00.000Z"
    },
    "endDate": {
      "$date": "2026-03-12T10:00:00.000Z"
    },
    "trialServersUsed": 0,
    "serversCount": 5,
    "assasCustomerId": "cus_000005141142",
    "assasSubscriptionId": "sub_000005141143"
  },
  
  "createdAt": {
    "$date": "2026-02-12T10:00:00.000Z"
  },
  "updatedAt": {
    "$date": "2026-02-12T10:00:00.000Z"
  }
}
```

---

## 🔧 Métodos Úteis do Modelo

### isTrialActive()
```typescript
user.isTrialActive(); // true ou false

// Implementação:
UserSchema.methods.isTrialActive = function (): boolean {
  if (this.subscription?.status !== 'trial') return false;
  if (!this.subscription?.endDate) return false;
  return new Date() < this.subscription.endDate;
};
```

### isSubscriptionActive()
```typescript
user.isSubscriptionActive(); // true ou false

// Implementação:
UserSchema.methods.isSubscriptionActive = function (): boolean {
  if (this.subscription?.status === 'active') {
    if (!this.subscription?.endDate) return true;
    return new Date() < this.subscription.endDate;
  }
  return false;
};
```

---

## 🗄️ Índices do MongoDB

Para melhor performance, criar índices:

```javascript
// Índice para buscar por email (já existe por unique: true)
db.users.createIndex({ email: 1 });

// Índice para buscar por assasSubscriptionId
db.users.createIndex({ "subscription.assasSubscriptionId": 1 });

// Índice para buscar trials expirando
db.users.createIndex({ 
  "subscription.status": 1, 
  "subscription.endDate": 1 
});
```

---

## 📊 Estatísticas

### Contar por Status
```javascript
// Trials ativos
const trialsAtivos = await User.countDocuments({
  'subscription.status': 'trial',
  'subscription.endDate': { $gt: new Date() }
});

// Assinaturas ativas
const assinaturasAtivas = await User.countDocuments({
  'subscription.status': 'active'
});

// Expirados
const expirados = await User.countDocuments({
  'subscription.status': 'inactive'
});
```

---

## 🔄 Sincronização com Assas

### Dados Salvos Localmente (MongoDB)
- `planId` - Referência ao plano local
- `status` - Status local (trial, active, inactive, cancelled)
- `startDate` / `endDate` - Datas locais
- `serversCount` - Quantidade de servidores

### Dados Salvos no Assas
- `assasCustomerId` - ID do cliente no Assas
- `assasSubscriptionId` - ID da assinatura no Assas

### Sincronização
- **Webhook** mantém dados sincronizados
- Quando Assas recebe pagamento → Atualiza MongoDB
- Quando Assas detecta atraso → Atualiza MongoDB

---

## 🎯 Resumo

**Onde são salvas**: No documento do usuário, campo `subscription`

**Estrutura**: Objeto aninhado com status, datas, IDs do Assas

**Atualizações**:
- Registro → Cria trial
- Checkout → Cria assinatura paga
- Webhook → Atualiza status
- Cron job → Marca como expirado

**Vantagens**:
- ✅ Dados centralizados no usuário
- ✅ Fácil de consultar
- ✅ Sincronizado com Assas
- ✅ Histórico mantido

**Desvantagens**:
- ⚠️ Não tem histórico de pagamentos (apenas status atual)
- ⚠️ Para histórico completo, consultar API do Assas

---

## 📞 Consultas Úteis no MongoDB

```javascript
// Ver todos os usuários com trial
db.users.find({ "subscription.status": "trial" })

// Ver assinaturas expirando hoje
db.users.find({ 
  "subscription.endDate": { 
    $gte: new Date().setHours(0,0,0,0),
    $lt: new Date().setHours(23,59,59,999)
  }
})

// Ver usuários sem assinatura
db.users.find({ "subscription": { $exists: false } })

// Atualizar status manualmente
db.users.updateOne(
  { email: "joao@example.com" },
  { $set: { "subscription.status": "active" } }
)
```

---

**Conclusão**: As assinaturas são salvas de forma simples e eficiente dentro do documento do usuário, facilitando consultas e mantendo sincronização com o Assas via webhook.
