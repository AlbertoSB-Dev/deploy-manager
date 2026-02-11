# Guia do Novo Modelo de Preços com Descontos por Quantidade

## 📋 Visão Geral

O sistema foi refatorado para um modelo de preços **por servidor com acesso ilimitado e descontos progressivos**. Você vende acesso ao painel e ao sistema de gerenciamento, não a VPS em si. Os clientes conectam suas próprias VPS e têm acesso ilimitado a projetos, bancos de dados e armazenamento.

**Novidade**: Quanto mais servidores o cliente adicionar, maior o desconto!

### Modelo Antigo ❌
- Preço fixo por plano
- Limite de servidores por plano
- Limite de projetos, bancos de dados e armazenamento

### Modelo Novo ✅
- Preço **por servidor**
- Sem limites de projetos, bancos de dados ou armazenamento
- **Descontos progressivos** por quantidade de servidores
- Acesso completo ao painel para gerenciar a VPS do cliente

---

## 🔧 Estrutura do Banco de Dados

### Modelo Plan (Novo)

```typescript
interface IPlan {
  name: string;
  description: string;
  pricePerServer: number;        // Preço por servidor
  interval: 'monthly' | 'yearly';
  features: string[];            // Funcionalidades do plano
  discountTiers: Array<{
    minServers: number;          // A partir de quantos servidores
    discountPercent: number;     // Percentual de desconto (ex: 10 = 10%)
  }>;
  isActive: boolean;
  isPopular: boolean;
}
```

---

## 💰 Como Funciona a Precificação com Descontos

### Exemplo Prático

**Plano: Professional**
- Preço por servidor: R$ 99/mês
- Faixas de desconto:
  - 5+ servidores: 10% OFF
  - 10+ servidores: 15% OFF
  - 20+ servidores: 20% OFF

**Cenários:**

1. **Cliente com 3 servidores:**
   - 3 × R$ 99 = R$ 297/mês (sem desconto)

2. **Cliente com 5 servidores:**
   - 5 × R$ 99 = R$ 495
   - Desconto 10%: -R$ 49,50
   - **Total: R$ 445,50/mês**

3. **Cliente com 10 servidores:**
   - 10 × R$ 99 = R$ 990
   - Desconto 15%: -R$ 148,50
   - **Total: R$ 841,50/mês**

4. **Cliente com 20 servidores:**
   - 20 × R$ 99 = R$ 1.980
   - Desconto 20%: -R$ 396
   - **Total: R$ 1.584/mês**

---

## 🎨 Interface do Cliente (Pricing Page)

A página `/pricing` agora permite que o cliente:

1. **Selecione um plano** da lista de planos ativos
2. **Escolha a quantidade de servidores** com um slider (1-100)
3. **Veja o desconto aplicável em tempo real**
4. **Visualize o preço total com desconto**
5. **Veja as faixas de desconto disponíveis**

### Componentes Atualizados
- `frontend/src/app/pricing/page.tsx` - Página de preços com calculadora e descontos

---

## 👨‍💼 Interface do Admin (Admin Plans Page)

A página `/admin/plans` foi atualizada para:

1. **Criar/Editar planos** com `pricePerServer`
2. **Definir faixas de desconto** por quantidade de servidores
3. **Gerenciar funcionalidades** do plano

### Campos do Formulário
- Nome do Plano
- Descrição
- **Preço por Servidor**
- Intervalo (Mensal/Anual)
- **Faixas de Desconto** (novo):
  - A partir de X servidores: Y% de desconto
- Funcionalidades (ex: "Suporte prioritário", "Backups automáticos")
- Status (Ativo/Inativo)
- Marcar como Popular

### Componentes Atualizados
- `frontend/src/app/admin/plans/page.tsx` - Gerenciamento de planos com descontos

---

## 📊 Exemplo de Planos com Descontos

```javascript
// Plano Starter
{
  name: "Starter",
  description: "Perfeito para começar",
  pricePerServer: 49,
  interval: "monthly",
  features: [
    "Deploy automático",
    "Suporte por email",
    "Acesso ilimitado a projetos"
  ],
  discountTiers: [
    { minServers: 5, discountPercent: 5 },
    { minServers: 10, discountPercent: 10 }
  ],
  isActive: true,
  isPopular: false
}

// Plano Professional
{
  name: "Professional",
  description: "Para equipes em crescimento",
  pricePerServer: 99,
  interval: "monthly",
  features: [
    "Deploy automático",
    "Suporte prioritário",
    "Backups automáticos",
    "Acesso ilimitado a projetos e bancos de dados"
  ],
  discountTiers: [
    { minServers: 5, discountPercent: 10 },
    { minServers: 10, discountPercent: 15 },
    { minServers: 20, discountPercent: 20 }
  ],
  isActive: true,
  isPopular: true
}

// Plano Enterprise
{
  name: "Enterprise",
  description: "Solução completa",
  pricePerServer: 199,
  interval: "monthly",
  features: [
    "Deploy automático",
    "Suporte 24/7",
    "Backups automáticos",
    "SLA garantido",
    "Acesso ilimitado a tudo"
  ],
  discountTiers: [
    { minServers: 5, discountPercent: 15 },
    { minServers: 10, discountPercent: 20 },
    { minServers: 20, discountPercent: 25 },
    { minServers: 50, discountPercent: 30 }
  ],
  isActive: true,
  isPopular: false
}
```

---

## 🔄 Compatibilidade com Código Antigo

O código foi atualizado para suportar **ambos os formatos** durante a transição:

```typescript
// Funciona com planos antigos e novos
const pricePerServer = plan.pricePerServer || plan.price || 0;

// Calcula desconto se existir
let discountPercent = 0;
if (plan.discountTiers && plan.discountTiers.length > 0) {
  const sortedTiers = [...plan.discountTiers].sort((a, b) => b.minServers - a.minServers);
  for (const tier of sortedTiers) {
    if (servers >= tier.minServers) {
      discountPercent = tier.discountPercent;
      break;
    }
  }
}
```

---

## 🧮 Serviço de Cálculo de Preços

Novo serviço `PricingService.ts` para cálculos centralizados:

```typescript
import { PricingService } from '@/services/PricingService';

// Calcular preço com desconto
const calculation = PricingService.calculatePrice(plan, 10);

// Resultado:
{
  pricePerServer: 99,
  quantity: 10,
  discountPercent: 15,
  subtotal: 990,
  discount: 148.50,
  total: 841.50
}

// Formatar para exibição
const formatted = PricingService.formatPricing(calculation);
// "R$ 99.00 × 10 = R$ 990.00 - 15% desconto (R$ 148.50) = R$ 841.50"
```

---

## 📝 Checklist de Implementação

- [x] Atualizar modelo `Plan.ts` com `discountTiers`
- [x] Criar `PricingService.ts` para cálculos
- [x] Atualizar página de preços (`/pricing`) com descontos
- [x] Atualizar página de admin (`/admin/plans`) com gerenciamento de descontos
- [x] Adicionar compatibilidade com planos antigos
- [ ] Executar migração no banco de dados (se necessário)
- [ ] Testar pricing page com novos planos
- [ ] Testar admin plans page
- [ ] Criar novos planos com descontos

---

## 🧪 Testando Localmente

1. **Criar um novo plano** via `/admin/plans`:
   - Nome: "Test Plan"
   - Preço por Servidor: 50
   - Faixas de Desconto:
     - 5+ servidores: 10% OFF
     - 10+ servidores: 15% OFF
   - Funcionalidades: "Suporte por email", "Deploy automático"

2. **Acessar `/pricing`**:
   - Selecionar o novo plano
   - Mover o slider para 3 servidores: R$ 150 (sem desconto)
   - Mover o slider para 5 servidores: R$ 225 (10% OFF = R$ 22,50 de desconto)
   - Mover o slider para 10 servidores: R$ 425 (15% OFF = R$ 75 de desconto)

3. **Verificar descontos**:
   - Confirmar que o desconto é aplicado corretamente
   - Verificar que as faixas de desconto são exibidas

---

## 🐛 Troubleshooting

### Desconto não aparece
**Causa**: Plano sem `discountTiers` ou faixas vazias
**Solução**: Editar o plano e adicionar faixas de desconto

### Desconto errado
**Causa**: Faixas de desconto não ordenadas corretamente
**Solução**: O sistema ordena automaticamente, mas verifique os valores

### Campo de descontos não aparece no admin
**Causa**: Cache do navegador
**Solução**: Limpar cache (Ctrl+Shift+Delete) e recarregar

---

## 📞 Suporte

Para dúvidas sobre o novo modelo de preços com descontos, consulte:
- Este guia
- Código em `backend/src/models/Plan.ts`
- Serviço em `backend/src/services/PricingService.ts`
- Página de preços em `frontend/src/app/pricing/page.tsx`
- Admin plans em `frontend/src/app/admin/plans/page.tsx`
