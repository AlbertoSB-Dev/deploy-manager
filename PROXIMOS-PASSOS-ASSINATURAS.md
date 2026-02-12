# 🚀 Próximos Passos - Sistema de Assinaturas

## ✅ O Que Foi Implementado

### 1. Middlewares de Assinatura ✅
- [x] `checkSubscriptionActive` - Bloqueia criação de recursos
- [x] `checkServerLimit` - Limita 1 servidor no trial
- [x] `checkCanModify` - Bloqueia edição/exclusão após expiração
- [x] Aplicados em TODAS as rotas necessárias

### 2. Webhook do Assas ✅
- [x] Processa evento `subscription_activated`
- [x] Processa evento `payment_received`
- [x] Processa evento `subscription_cancelled`
- [x] Processa evento `payment_overdue`
- [x] Atualiza status do usuário automaticamente

### 3. Sistema de Trial ✅
- [x] 15 dias de trial automático no registro
- [x] Limite de 1 servidor durante trial
- [x] Métodos `isTrialActive()` e `isSubscriptionActive()`
- [x] Bloqueio automático após expiração

---

## ⚠️ O Que Ainda Precisa Ser Feito

### 1. Validação de Webhook (SEGURANÇA) 🔒
**Prioridade**: ALTA

O webhook do Assas atualmente aceita qualquer requisição. Precisa validar a assinatura para evitar fraudes.

**Implementação**:
```typescript
// backend/src/routes/payments.ts
router.post('/webhook', async (req: Request, res: Response) => {
  // 1. Validar assinatura do Assas
  const signature = req.headers['asaas-signature'];
  const webhookToken = process.env.ASSAS_WEBHOOK_TOKEN;
  
  if (!AssasService.validateWebhookSignature(signature, webhookToken, req.body)) {
    return res.status(401).json({ error: 'Assinatura inválida' });
  }
  
  // 2. Processar evento...
});
```

**Adicionar ao .env**:
```env
ASSAS_WEBHOOK_TOKEN=seu_token_secreto_aqui
```

**Documentação**: https://docs.asaas.com/reference/webhooks

---

### 2. Validação de Preço no Backend 💰
**Prioridade**: ALTA

O frontend calcula o preço com descontos, mas o backend não valida. Usuário malicioso pode manipular o preço.

**Implementação**:
```typescript
// backend/src/routes/payments.ts
router.post('/subscribe', protect, async (req: AuthRequest, res: Response) => {
  const { planId, servers, billingType } = req.body;
  
  // Buscar plano
  const plan = await Plan.findById(planId);
  
  // Calcular preço esperado no backend
  const expectedPrice = plan.calculatePrice(servers, billingType);
  
  // Validar com preço enviado pelo frontend
  if (req.body.price !== expectedPrice) {
    return res.status(400).json({ 
      error: 'Preço inválido. Tente novamente.' 
    });
  }
  
  // Criar assinatura com preço validado...
});
```

---

### 3. Renovação Automática 🔄
**Prioridade**: MÉDIA

Atualmente não há sistema para renovar assinaturas automaticamente.

**Opções**:

#### Opção A: Renovação via Assas (Recomendado)
- Configurar assinatura recorrente no Assas
- Assas cobra automaticamente todo mês/ano
- Webhook notifica quando pagamento é recebido
- Sistema atualiza `endDate` automaticamente

#### Opção B: Cron Job Manual
```typescript
// backend/src/services/SubscriptionRenewalService.ts
import cron from 'node-cron';

// Executar todo dia às 3h da manhã
cron.schedule('0 3 * * *', async () => {
  console.log('🔄 Verificando assinaturas expirando...');
  
  // Buscar assinaturas que expiram em 3 dias
  const expiringUsers = await User.find({
    'subscription.status': 'active',
    'subscription.endDate': {
      $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }
  });
  
  for (const user of expiringUsers) {
    // Enviar email de aviso
    await EmailService.sendExpirationWarning(user);
  }
  
  // Buscar assinaturas expiradas
  const expiredUsers = await User.find({
    'subscription.status': 'active',
    'subscription.endDate': { $lte: new Date() }
  });
  
  for (const user of expiredUsers) {
    // Atualizar status para inativo
    user.subscription.status = 'inactive';
    await user.save();
    
    // Enviar email de expiração
    await EmailService.sendExpiredNotification(user);
  }
});
```

---

### 4. UI do Frontend 🎨
**Prioridade**: ALTA

Usuário precisa ver status da assinatura no dashboard.

**Implementações Necessárias**:

#### A. Banner de Trial no Dashboard
```tsx
// frontend/src/app/dashboard/page.tsx
{user.subscription?.status === 'trial' && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-blue-900">
          🎉 Você está em período de trial
        </h3>
        <p className="text-sm text-blue-700">
          Dias restantes: {user.subscription.daysRemaining}
        </p>
        <p className="text-sm text-blue-600">
          Limite: 1 servidor (você pode criar projetos ilimitados)
        </p>
      </div>
      <Link href="/pricing">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Fazer Upgrade
        </button>
      </Link>
    </div>
  </div>
)}
```

#### B. Banner de Expiração
```tsx
{user.subscription?.status === 'inactive' && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-red-900">
          ⚠️ Sua assinatura expirou
        </h3>
        <p className="text-sm text-red-700">
          Você pode visualizar seus projetos, mas não pode fazer modificações.
        </p>
      </div>
      <Link href="/pricing">
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg">
          Renovar Assinatura
        </button>
      </Link>
    </div>
  </div>
)}
```

#### C. Contador de Servidores
```tsx
<div className="bg-white rounded-lg shadow p-4">
  <h3 className="font-semibold mb-2">Servidores</h3>
  <p className="text-2xl font-bold">
    {serverCount} / {user.subscription?.status === 'trial' ? 1 : '∞'}
  </p>
  {user.subscription?.status === 'trial' && serverCount >= 1 && (
    <p className="text-sm text-orange-600 mt-2">
      Limite atingido. Faça upgrade para adicionar mais servidores.
    </p>
  )}
</div>
```

---

### 5. Notificações por Email 📧
**Prioridade**: MÉDIA

Enviar emails em momentos importantes.

**Emails Necessários**:

1. **Bem-vindo ao Trial**
   - Enviado: Ao registrar
   - Conteúdo: "Você tem 15 dias de trial grátis!"

2. **Trial Expirando em 3 Dias**
   - Enviado: 3 dias antes de expirar
   - Conteúdo: "Seu trial expira em 3 dias. Faça upgrade!"

3. **Trial Expirou**
   - Enviado: Quando trial expira
   - Conteúdo: "Seu trial expirou. Renove para continuar."

4. **Pagamento Recebido**
   - Enviado: Quando webhook recebe payment_received
   - Conteúdo: "Pagamento confirmado! Sua assinatura está ativa."

5. **Pagamento Atrasado**
   - Enviado: Quando webhook recebe payment_overdue
   - Conteúdo: "Seu pagamento está atrasado. Regularize para não perder acesso."

**Implementação**:
```typescript
// backend/src/services/EmailService.ts
import nodemailer from 'nodemailer';

export class EmailService {
  static async sendTrialWelcome(user: any) {
    // Enviar email de boas-vindas
  }
  
  static async sendExpirationWarning(user: any) {
    // Enviar aviso de expiração
  }
  
  static async sendExpiredNotification(user: any) {
    // Enviar notificação de expiração
  }
  
  static async sendPaymentConfirmation(user: any) {
    // Enviar confirmação de pagamento
  }
  
  static async sendPaymentOverdue(user: any) {
    // Enviar aviso de atraso
  }
}
```

---

### 6. Testes Automatizados 🧪
**Prioridade**: BAIXA

Criar testes para garantir que middlewares funcionam.

**Testes Necessários**:
```typescript
// backend/tests/subscription.test.ts
describe('Subscription Middlewares', () => {
  it('should allow creating 1 server during trial', async () => {
    // Teste
  });
  
  it('should block creating 2nd server during trial', async () => {
    // Teste
  });
  
  it('should block creating project after trial expires', async () => {
    // Teste
  });
  
  it('should block editing project after trial expires', async () => {
    // Teste
  });
  
  it('should allow viewing projects after trial expires', async () => {
    // Teste
  });
});
```

---

## 📋 Checklist de Prioridades

### 🔴 Prioridade ALTA (Fazer Agora)
- [ ] Implementar validação de webhook do Assas
- [ ] Implementar validação de preço no backend
- [ ] Criar UI de status de trial no dashboard
- [ ] Criar banner de expiração no dashboard

### 🟡 Prioridade MÉDIA (Fazer em Breve)
- [ ] Configurar renovação automática (via Assas ou cron)
- [ ] Implementar sistema de emails
- [ ] Criar página de gerenciamento de assinatura

### 🟢 Prioridade BAIXA (Fazer Depois)
- [ ] Criar testes automatizados
- [ ] Adicionar analytics de conversão trial → pago
- [ ] Criar relatórios de assinaturas no admin

---

## 🎯 Resumo

**O que está funcionando**:
- ✅ Sistema de trial de 15 dias
- ✅ Limite de 1 servidor no trial
- ✅ Bloqueio de criação após expiração
- ✅ Bloqueio de edição/exclusão após expiração
- ✅ Webhook processa eventos do Assas
- ✅ Status atualiza automaticamente

**O que precisa ser feito**:
- ⚠️ Validar webhook (segurança)
- ⚠️ Validar preço no backend (segurança)
- ⚠️ Criar UI no frontend (UX)
- ⚠️ Configurar renovação automática (funcionalidade)
- ⚠️ Implementar emails (comunicação)

---

## 📞 Suporte

Para implementar os próximos passos, consulte:
- `MIDDLEWARES-APLICADOS.md` - Status atual
- `SISTEMA-TRIAL.md` - Documentação do trial
- `ASSAS-SETUP.md` - Integração com Assas
- Documentação Assas: https://docs.asaas.com
