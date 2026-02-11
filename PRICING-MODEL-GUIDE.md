# Guia do Novo Modelo de Preços

## 📋 Visão Geral

O sistema foi refatorado para um modelo de preços **por servidor com acesso ilimitado**. Você vende acesso ao painel e ao sistema de gerenciamento, não a VPS em si. Os clientes conectam suas próprias VPS e têm acesso ilimitado a projetos, bancos de dados e armazenamento.

### Modelo Antigo ❌
- Preço fixo por plano
- Limite de servidores por plano
- Limite de projetos, bancos de dados e armazenamento

### Modelo Novo ✅
- Preço **por servidor**
- Sem limites de projetos, bancos de dados ou armazenamento
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
  isActive: boolean;
  isPopular: boolean;
}
```

**Nota**: Sem campo `limits` - todos os planos têm acesso ilimitado!

---

## 🚀 Migração de Dados

Se você tem planos antigos no banco de dados, execute o script de migração:

```bash
cd backend
npm run migrate-plans
```

Este script:
1. Encontra todos os planos com o campo `price` (modelo antigo)
2. Copia o valor para `pricePerServer`
3. Remove o campo `limits` (não mais necessário)
4. Salva as alterações

---

## 💰 Como Funciona a Precificação

### Exemplo Prático

**Plano: Professional**
- Preço por servidor: R$ 99/mês
- Cliente escolhe: 5 servidores
- **Total: R$ 495/mês**
- **Acesso**: Ilimitado a projetos, bancos de dados e armazenamento em cada servidor

A fórmula é simples:
```
Total = pricePerServer × quantidade_de_servidores
```

---

## 🎨 Interface do Cliente (Pricing Page)

A página `/pricing` agora permite que o cliente:

1. **Selecione um plano** da lista de planos ativos
2. **Escolha a quantidade de servidores** com um slider (1-100)
3. **Veja o preço total em tempo real**
4. **Visualize os recursos inclusos** (acesso ilimitado)

### Componentes Atualizados
- `frontend/src/app/pricing/page.tsx` - Página de preços com calculadora

---

## 👨‍💼 Interface do Admin (Admin Plans Page)

A página `/admin/plans` foi atualizada para:

1. **Criar/Editar planos** com `pricePerServer`
2. **Definir funcionalidades** do plano
3. **Sem limites** - todos têm acesso ilimitado

### Campos do Formulário
- Nome do Plano
- Descrição
- **Preço por Servidor**
- Intervalo (Mensal/Anual)
- Funcionalidades (ex: "Suporte prioritário", "Backups automáticos")
- Status (Ativo/Inativo)
- Marcar como Popular

### Componentes Atualizados
- `frontend/src/app/admin/plans/page.tsx` - Gerenciamento de planos

---

## 📊 Exemplo de Planos

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
```

Isso garante que:
- Planos antigos com `price` continuam funcionando
- Planos novos com `pricePerServer` funcionam normalmente
- Após migração, todos usam `pricePerServer`

---

## 📝 Checklist de Implementação

- [x] Atualizar modelo `Plan.ts` com `pricePerServer`
- [x] Remover `limits` do modelo
- [x] Atualizar página de preços (`/pricing`)
- [x] Atualizar página de admin (`/admin/plans`)
- [x] Criar script de migração
- [x] Adicionar compatibilidade com planos antigos
- [ ] Executar migração no banco de dados
- [ ] Testar pricing page com novos planos
- [ ] Testar admin plans page
- [ ] Criar novos planos com novo modelo

---

## 🧪 Testando Localmente

1. **Criar um novo plano** via `/admin/plans`:
   - Nome: "Test Plan"
   - Preço por Servidor: 50
   - Funcionalidades: "Suporte por email", "Deploy automático"

2. **Acessar `/pricing`**:
   - Selecionar o novo plano
   - Mover o slider para diferentes quantidades
   - Verificar se o preço total é calculado corretamente

3. **Verificar recursos**:
   - Confirmar que mostra "Acesso ilimitado" para projetos, bancos de dados e armazenamento

---

## 🐛 Troubleshooting

### Erro: "Cannot read properties of undefined"
**Causa**: Plano antigo sem `pricePerServer`
**Solução**: Executar `npm run migrate-plans`

### Preço não aparece na página de preços
**Causa**: Plano não tem `pricePerServer` nem `price`
**Solução**: Editar o plano e definir o preço

### Campos de limites ainda aparecem
**Causa**: Cache do navegador
**Solução**: Limpar cache (Ctrl+Shift+Delete) e recarregar

---

## 📞 Suporte

Para dúvidas sobre o novo modelo de preços, consulte:
- Este guia
- Código em `backend/src/models/Plan.ts`
- Página de preços em `frontend/src/app/pricing/page.tsx`
- Admin plans em `frontend/src/app/admin/plans/page.tsx`
