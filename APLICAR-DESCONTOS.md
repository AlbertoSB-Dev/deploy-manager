# Como Aplicar Descontos por Quantidade

## 🎯 Objetivo

Adicionar faixas de desconto aos seus planos para que clientes que contratarem mais servidores recebam descontos progressivos.

---

## 📋 Opções

### Opção 1: Criar Novos Planos com Descontos (Recomendado)

Se você quer começar do zero com planos novos que já têm descontos configurados:

```bash
cd backend
npm run seed-plans-with-discounts
```

Isso vai:
- ✅ Remover todos os planos antigos
- ✅ Criar 3 planos novos (Starter, Professional, Enterprise)
- ✅ Cada plano já vem com faixas de desconto configuradas

**Planos criados:**

1. **Starter** - R$ 19.90/servidor
   - 5+ servidores: 5% OFF
   - 10+ servidores: 10% OFF
   - 20+ servidores: 15% OFF

2. **Professional** - R$ 49.90/servidor (Popular)
   - 5+ servidores: 10% OFF
   - 10+ servidores: 15% OFF
   - 20+ servidores: 20% OFF

3. **Enterprise** - R$ 149.90/servidor
   - 5+ servidores: 15% OFF
   - 10+ servidores: 20% OFF
   - 20+ servidores: 25% OFF
   - 50+ servidores: 30% OFF

---

### Opção 2: Adicionar Descontos aos Planos Existentes

Se você quer manter seus planos atuais e apenas adicionar descontos:

```bash
cd backend
npm run add-discount-tiers
```

Isso vai:
- ✅ Encontrar todos os planos existentes
- ✅ Adicionar faixas de desconto automáticas baseadas no preço
- ✅ Manter todos os dados dos planos

**Descontos automáticos:**
- Planos até R$ 50: descontos menores (5%, 10%, 15%)
- Planos R$ 50-100: descontos moderados (10%, 15%, 20%)
- Planos acima de R$ 100: descontos maiores (15%, 20%, 25%, 30%)

---

### Opção 3: Configurar Manualmente no Admin

1. Acesse `/admin/plans`
2. Clique em "Novo Plano" ou edite um existente
3. Preencha os dados do plano
4. Na seção "Faixas de Desconto por Quantidade":
   - Clique "+ Adicionar Faixa de Desconto"
   - Defina "A partir de X servidores"
   - Defina "Desconto Y%"
   - Adicione quantas faixas quiser
5. Clique "Criar Plano" ou "Atualizar"

---

## 🧪 Testando os Descontos

1. **Acesse a página de preços:**
   - Vá para `/pricing`

2. **Selecione um plano:**
   - Escolha qualquer plano da lista

3. **Mova o slider de servidores:**
   - Mova para 3 servidores: sem desconto
   - Mova para 5 servidores: deve aparecer o desconto
   - Mova para 10 servidores: desconto maior
   - Mova para 20 servidores: desconto ainda maior

4. **Verifique a exibição:**
   - Deve mostrar "Descontos por Quantidade" com as faixas
   - Deve mostrar o subtotal, desconto e total
   - O desconto deve ser destacado em verde

---

## 📊 Exemplo de Cálculo

**Plano Professional: R$ 49.90/servidor**

| Servidores | Subtotal | Desconto | Total | Economia |
|-----------|----------|----------|-------|----------|
| 3 | R$ 149.70 | - | R$ 149.70 | - |
| 5 | R$ 249.50 | 10% (-R$ 24.95) | R$ 224.55 | R$ 24.95 |
| 10 | R$ 499.00 | 15% (-R$ 74.85) | R$ 424.15 | R$ 74.85 |
| 20 | R$ 998.00 | 20% (-R$ 199.60) | R$ 798.40 | R$ 199.60 |

---

## 🔧 Editar Descontos Existentes

1. Acesse `/admin/plans`
2. Clique no ícone de edição (✏️) do plano
3. Na seção "Faixas de Desconto por Quantidade":
   - Edite os valores de "A partir de" e "Desconto %"
   - Clique no ícone de lixeira (🗑️) para remover uma faixa
   - Clique "+ Adicionar Faixa de Desconto" para adicionar mais
4. Clique "Atualizar"

---

## ⚠️ Importante

- **Ordem das faixas**: O sistema ordena automaticamente, não precisa se preocupar
- **Percentual máximo**: Não pode ser maior que 100%
- **Mínimo de servidores**: Deve ser maior que 0
- **Sem limite**: Você pode adicionar quantas faixas quiser

---

## 🐛 Troubleshooting

### Desconto não aparece na página de preços
- Verifique se o plano tem `discountTiers` configurado
- Recarregue a página (Ctrl+F5)
- Verifique o console do navegador (F12) para erros

### Desconto errado
- Verifique se as faixas estão configuradas corretamente
- Lembre-se: quanto MAIS servidores, MAIOR o desconto
- Exemplo correto: 5+ = 10%, 10+ = 15%, 20+ = 20%

### Planos não aparecem
- Verifique se os planos estão marcados como "Ativo"
- Verifique se estão no intervalo correto (monthly/yearly)

---

## 📞 Suporte

Para dúvidas, consulte:
- `PRICING-MODEL-GUIDE.md` - Guia completo do modelo de preços
- `frontend/src/app/pricing/page.tsx` - Código da página de preços
- `frontend/src/app/admin/plans/page.tsx` - Código do admin de planos
