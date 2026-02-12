# 🔄 Sistema de Upgrade/Downgrade de Servidores

## 📋 Situação Atual

**Problema**: Cliente não consegue aumentar ou diminuir quantidade de servidores após contratar plano.

**Cenário**:
- Cliente contrata plano com 3 servidores
- Depois quer aumentar para 5 servidores
- Ou diminuir para 2 servidores
- Sistema atual não permite isso

---

## 🎯 Solução Proposta

### Opção 1: Upgrade/Downgrade Imediato (Recomendado)

**Como Funciona**:
1. Cliente vai em "Meu Perfil" ou "Gerenciar Assinatura"
2. Vê quantidade atual de servidores
3. Pode aumentar ou diminuir quantidade
4. Sistema calcula diferença de preço (proporcional)
5. Cobra/credita diferença
6. Atualiza assinatura no Assas
7. Atualiza limite no MongoDB

**Vantagens**:
- ✅ Mudança imediata
- ✅ Cobrança proporcional
- ✅ Flexível para o cliente

**Desvantagens**:
- ⚠️ Mais complexo de implementar
- ⚠️ Precisa calcular valores proporcionais

### Opção 2: Upgrade/Downgrade na Próxima Renovação

**Como Funciona**:
1. Cliente solicita mudança
2. Sistema agenda mudança para próxima renovação
3. Na renovação, aplica novo valor
4. Atualiza limite

**Vantagens**:
- ✅ Mais simples de implementar
- ✅ Não precisa calcular proporção

**Desvantagens**:
- ⚠️ Cliente precisa esperar até renovação
- ⚠️ Menos flexível

---

## 💡 Implementação Recomendada (Opção 1)

Vou implementar a Opção 1 com cobrança proporcional.

### Fluxo Completo

```
┌─────────────────────────────────────────┐
│  Cliente: "Quero 5 servidores"          │
│  Atual: 3 servidores (R$ 87/mês)        │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  1. Calcular Novo Valor                 │
│     - 5 servidores = R$ 145/mês         │
│     - Diferença = R$ 58/mês             │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. Calcular Valor Proporcional         │
│     - Dias restantes: 20 dias           │
│     - Proporção: 20/30 = 0.67           │
│     - Cobrar agora: R$ 58 × 0.67 = R$ 39│
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. Criar Cobrança no Assas             │
│     - Valor: R$ 39                      │
│     - Descrição: "Upgrade para 5 serv." │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  4. Atualizar Assinatura no Assas       │
│     - Novo valor mensal: R$ 145         │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  5. Atualizar MongoDB                   │
│     - serversCount: 5                   │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  ✅ Cliente pode criar 5 servidores     │
└─────────────────────────────────────────┘
```

---

## 🔧 Implementação

### 1. Criar Rota de Upgrade/Downgrade

**Arquivo**: `backend/src/routes/payments.ts`

```typescript
/**
 * @route   POST /api/payments/change-servers
 * @desc    Aumentar ou diminuir quantidade de servidores
 * @access  Private
 */
router.post('/change-servers', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { newServersCount } = req.body;
    const userId = req.user?._id;

    // Validações
    if (!newServersCount || newServersCount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade de servidores inválida',
      });
    }

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user || !user.subscription) {
      return res.status(404).json({
        success: false,
        error: 'Usuário ou assinatura não encontrada',
      });
    }

    // Verificar se tem assinatura ativa
    if (user.subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Você precisa ter uma assinatura ativa para fazer upgrade',
      });
    }

    const currentServers = user.subscription.serversCount || 1;
    
    // Verificar se é realmente uma mudança
    if (currentServers === newServersCount) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade de servidores já é essa',
      });
    }

    // Buscar plano
    const plan = await Plan.findById(user.subscription.planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
      });
    }

    // Calcular valores
    const currentPrice = (plan as any).calculatePrice(currentServers);
    const newPrice = (plan as any).calculatePrice(newServersCount);
    const priceDifference = newPrice - currentPrice;

    // Calcular valor proporcional (dias restantes)
    const now = new Date();
    const endDate = new Date(user.subscription.endDate!);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysInMonth = 30;
    const proportionalValue = (priceDifference * daysRemaining) / daysInMonth;

    console.log(`📊 Mudança de ${currentServers} para ${newServersCount} servidores`);
    console.log(`💰 Preço atual: R$ ${currentPrice}`);
    console.log(`💰 Novo preço: R$ ${newPrice}`);
    console.log(`💰 Diferença: R$ ${priceDifference}`);
    console.log(`📅 Dias restantes: ${daysRemaining}`);
    console.log(`💰 Valor proporcional: R$ ${proportionalValue.toFixed(2)}`);

    // Se for upgrade (aumentar servidores)
    if (newServersCount > currentServers) {
      // Criar cobrança proporcional no Assas
      if (proportionalValue > 0) {
        try {
          await AssasService.createInvoice(
            user.subscription.assasCustomerId!,
            proportionalValue,
            `Upgrade para ${newServersCount} servidores (proporcional)`,
            new Date().toISOString().split('T')[0] // Hoje
          );
          console.log('✅ Cobrança proporcional criada no Assas');
        } catch (error: any) {
          console.error('❌ Erro ao criar cobrança:', error);
          return res.status(400).json({
            success: false,
            error: 'Erro ao criar cobrança no Assas',
          });
        }
      }
    }

    // Se for downgrade (diminuir servidores)
    if (newServersCount < currentServers) {
      // Verificar se tem servidores criados além do novo limite
      const Server = (await import('../models/Server')).Server;
      const serverCount = await Server.countDocuments({ userId: user._id });
      
      if (serverCount > newServersCount) {
        return res.status(400).json({
          success: false,
          error: `Você tem ${serverCount} servidores criados. Delete ${serverCount - newServersCount} servidor(es) antes de fazer downgrade.`,
        });
      }

      // Crédito será aplicado na próxima renovação
      console.log(`💳 Crédito de R$ ${Math.abs(proportionalValue).toFixed(2)} será aplicado na próxima renovação`);
    }

    // Atualizar assinatura no Assas (novo valor mensal)
    try {
      // TODO: Implementar atualização de valor no Assas
      // AssasService.updateSubscription(subscriptionId, newPrice);
      console.log('⚠️ Atualização de valor no Assas ainda não implementada');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar assinatura no Assas:', error);
    }

    // Atualizar MongoDB
    user.subscription.serversCount = newServersCount;
    await user.save();

    console.log('✅ Quantidade de servidores atualizada no MongoDB');

    res.json({
      success: true,
      message: newServersCount > currentServers 
        ? `Upgrade realizado! Você agora pode ter ${newServersCount} servidores.`
        : `Downgrade realizado! Seu limite agora é ${newServersCount} servidores.`,
      data: {
        oldServersCount: currentServers,
        newServersCount: newServersCount,
        oldPrice: currentPrice,
        newPrice: newPrice,
        priceDifference: priceDifference,
        proportionalCharge: newServersCount > currentServers ? proportionalValue : 0,
        proportionalCredit: newServersCount < currentServers ? Math.abs(proportionalValue) : 0,
        daysRemaining: daysRemaining,
      },
    });
  } catch (error: any) {
    console.error('Erro ao mudar quantidade de servidores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar mudança',
    });
  }
});
```

### 2. Criar UI no Frontend

**Arquivo**: `frontend/src/app/profile/page.tsx`

Adicionar seção de gerenciamento de servidores:

```tsx
{/* Gerenciar Servidores */}
{user.subscription?.status === 'active' && (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
      Gerenciar Servidores
    </h2>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quantidade de Servidores
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setNewServersCount(Math.max(1, newServersCount - 1))}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            -
          </button>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {newServersCount}
          </span>
          <button
            onClick={() => setNewServersCount(newServersCount + 1)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            +
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Atual: {user.subscription.serversCount || 1} servidor(es)
        </p>
      </div>

      {newServersCount !== (user.subscription.serversCount || 1) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            {newServersCount > (user.subscription.serversCount || 1) ? 'Upgrade' : 'Downgrade'}
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Novo valor mensal: R$ {calculateNewPrice(newServersCount).toFixed(2)}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {newServersCount > (user.subscription.serversCount || 1) 
              ? `Cobrança proporcional agora: R$ ${calculateProportional(newServersCount).toFixed(2)}`
              : `Crédito na próxima renovação: R$ ${calculateProportional(newServersCount).toFixed(2)}`
            }
          </p>
        </div>
      )}

      <button
        onClick={handleChangeServers}
        disabled={newServersCount === (user.subscription.serversCount || 1) || changingServers}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {changingServers ? 'Processando...' : 'Confirmar Mudança'}
      </button>
    </div>
  </div>
)}
```

---

## 📊 Cálculo de Valores

### Exemplo 1: Upgrade (3 → 5 servidores)

```
Plano: R$ 29/servidor
Desconto 3 servidores: 10% → R$ 87/mês
Desconto 5 servidores: 15% → R$ 123.25/mês

Diferença mensal: R$ 123.25 - R$ 87 = R$ 36.25
Dias restantes: 20 dias
Proporção: 20/30 = 0.67

Cobrar agora: R$ 36.25 × 0.67 = R$ 24.29
Próxima renovação: R$ 123.25/mês
```

### Exemplo 2: Downgrade (5 → 3 servidores)

```
Plano: R$ 29/servidor
Desconto 5 servidores: 15% → R$ 123.25/mês
Desconto 3 servidores: 10% → R$ 87/mês

Diferença mensal: R$ 87 - R$ 123.25 = -R$ 36.25
Dias restantes: 20 dias
Proporção: 20/30 = 0.67

Crédito: R$ 36.25 × 0.67 = R$ 24.29 (aplicado na próxima renovação)
Próxima renovação: R$ 87/mês
```

---

## 🔒 Validações Importantes

### 1. Downgrade - Verificar Servidores Criados
```typescript
// Não permitir downgrade se tem mais servidores criados
const serverCount = await Server.countDocuments({ userId: user._id });

if (serverCount > newServersCount) {
  return res.status(400).json({
    error: `Você tem ${serverCount} servidores. Delete ${serverCount - newServersCount} antes de fazer downgrade.`
  });
}
```

### 2. Trial - Não Permitir Mudança
```typescript
if (user.subscription.status === 'trial') {
  return res.status(400).json({
    error: 'Faça upgrade para um plano pago primeiro'
  });
}
```

### 3. Assinatura Inativa - Não Permitir
```typescript
if (user.subscription.status !== 'active') {
  return res.status(400).json({
    error: 'Sua assinatura está inativa. Renove primeiro.'
  });
}
```

---

## 🎯 Resumo

**Funcionalidade**: Upgrade/Downgrade de servidores

**Como Funciona**:
1. Cliente escolhe nova quantidade
2. Sistema calcula diferença proporcional
3. Upgrade → Cobra diferença agora
4. Downgrade → Credita na próxima renovação
5. Atualiza limite no MongoDB

**Vantagens**:
- ✅ Flexível para o cliente
- ✅ Cobrança justa (proporcional)
- ✅ Mudança imediata

**Próximos Passos**:
1. Implementar rota `/api/payments/change-servers`
2. Criar UI no perfil
3. Adicionar método `updateSubscription` no AssasService
4. Testar upgrade e downgrade
5. Documentar para o cliente

---

Quer que eu implemente essa funcionalidade completa agora?
