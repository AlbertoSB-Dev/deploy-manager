# Configuração do Assas para Pagamentos

## 📋 Visão Geral

Integração com Assas para processar pagamentos de assinaturas. O Assas é uma plataforma de pagamentos brasileira que suporta cartão de crédito, PIX, boleto e mais.

---

## 🔧 Configuração

### 1. Criar Conta no Assas

1. Acesse [https://www.assas.com.br](https://www.assas.com.br)
2. Clique em "Começar Agora"
3. Preencha os dados da sua empresa
4. Confirme o email
5. Faça login

### 2. Obter API Key

1. No painel do Assas, vá para **Configurações** → **API**
2. Copie a **API Key** (chave de produção)
3. Guarde em local seguro

### 3. Configurar Variáveis de Ambiente

Adicione ao arquivo `.env`:

```bash
# Assas
ASSAS_API_KEY=seu_api_key_aqui
```

### 4. Configurar Webhook

1. No painel do Assas, vá para **Configurações** → **Webhooks**
2. Clique em "Adicionar Webhook"
3. URL: `https://seu-dominio.com/api/payments/webhook`
4. Selecione os eventos:
   - `subscription_created`
   - `subscription_activated`
   - `subscription_cancelled`
   - `subscription_suspended`
   - `payment_created`
   - `payment_confirmed`
   - `payment_received`
   - `payment_overdue`
   - `payment_deleted`
5. Clique em "Salvar"

---

## 💳 Fluxo de Pagamento

### 1. Cliente Seleciona Plano

```
GET /api/admin/plans
```

### 2. Cliente Faz Upgrade

```
POST /api/payments/subscribe
{
  "planId": "ID_DO_PLANO",
  "billingType": "CREDIT_CARD",
  "creditCard": {
    "holderName": "João Silva",
    "number": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "ccv": "123"
  }
}
```

### 3. Sistema Cria Cliente no Assas

- Se não existir, cria novo cliente
- Salva ID do cliente no banco

### 4. Sistema Cria Plano no Assas

- Se não existir, cria novo plano
- Salva ID do plano no banco

### 5. Sistema Cria Assinatura

- Cria assinatura no Assas
- Atualiza status do usuário para "active"
- Retorna confirmação

### 6. Webhook Processa Eventos

- Assas envia eventos para o webhook
- Sistema atualiza status conforme necessário

---

## 📊 Endpoints de Pagamento

### POST /api/payments/subscribe
Criar assinatura para um plano

**Request:**
```json
{
  "planId": "ID_DO_PLANO",
  "billingType": "CREDIT_CARD",
  "creditCard": {
    "holderName": "João Silva",
    "number": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "ccv": "123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assinatura criada com sucesso!",
  "data": {
    "subscriptionId": "sub_123456",
    "status": "ACTIVE",
    "nextDueDate": "2026-03-11"
  }
}
```

### POST /api/payments/cancel-subscription
Cancelar assinatura do usuário

**Response:**
```json
{
  "success": true,
  "message": "Assinatura cancelada com sucesso"
}
```

### GET /api/payments/subscription-status
Obter status da assinatura

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ACTIVE",
    "nextDueDate": "2026-03-11",
    "plan": {
      "_id": "ID_DO_PLANO",
      "name": "Professional",
      "pricePerServer": 49.90
    }
  }
}
```

### POST /api/payments/webhook
Webhook para receber eventos do Assas

**Eventos Suportados:**
- `subscription_created` - Assinatura criada
- `subscription_activated` - Assinatura ativada
- `subscription_cancelled` - Assinatura cancelada
- `subscription_suspended` - Assinatura suspensa
- `payment_created` - Pagamento criado
- `payment_confirmed` - Pagamento confirmado
- `payment_received` - Pagamento recebido
- `payment_overdue` - Pagamento vencido
- `payment_deleted` - Pagamento deletado

---

## 🧪 Testando Localmente

### 1. Configurar Variável de Ambiente

```bash
# .env
ASSAS_API_KEY=sua_chave_de_teste
```

### 2. Criar Plano

```bash
npm run seed-plans-with-discounts
```

### 3. Registrar Usuário

```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@example.com",
    "password": "Senha123"
  }'
```

### 4. Fazer Upgrade

```bash
curl -X POST http://localhost:8001/api/payments/subscribe \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "ID_DO_PLANO",
    "billingType": "CREDIT_CARD",
    "creditCard": {
      "holderName": "Teste Silva",
      "number": "4111111111111111",
      "expiryMonth": "12",
      "expiryYear": "2025",
      "ccv": "123"
    }
  }'
```

### 5. Verificar Status

```bash
curl -X GET http://localhost:8001/api/payments/subscription-status \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔐 Segurança

### Dados Sensíveis

- **Nunca** armazene dados de cartão no banco de dados
- **Sempre** use HTTPS em produção
- **Nunca** exponha a API Key em logs ou código
- Use variáveis de ambiente para configurações sensíveis

### Validação de Webhook

- Validar assinatura do webhook (implementar em produção)
- Usar HTTPS para webhook
- Implementar retry logic para falhas

---

## 📝 Checklist de Implementação

- [x] Criar serviço AssasService
- [x] Criar rotas de pagamento
- [x] Atualizar modelo User com campos Assas
- [x] Atualizar modelo Plan com campo assasPlanId
- [x] Registrar rotas no index.ts
- [ ] Implementar validação de webhook
- [ ] Criar UI para pagamento
- [ ] Testar fluxo completo
- [ ] Configurar webhook em produção
- [ ] Implementar retry logic
- [ ] Adicionar logs de auditoria

---

## 🐛 Troubleshooting

### Erro: "ASSAS_API_KEY não configurada"

**Solução**: Adicione `ASSAS_API_KEY` ao arquivo `.env`

### Erro: "Cliente não encontrado no Assas"

**Solução**: Verifique se o CPF/CNPJ está correto

### Erro: "Plano não encontrado no Assas"

**Solução**: Verifique se o plano foi criado corretamente

### Webhook não recebendo eventos

**Solução**: 
1. Verifique se a URL está correta
2. Verifique se o servidor está acessível
3. Verifique os logs do Assas

---

## 📞 Suporte

- Documentação Assas: [https://docs.assas.com.br](https://docs.assas.com.br)
- Código: `backend/src/services/AssasService.ts`
- Rotas: `backend/src/routes/payments.ts`

---

## 🔗 Links Úteis

- [Assas - Documentação API](https://docs.assas.com.br)
- [Assas - Dashboard](https://app.assas.com.br)
- [Assas - Suporte](https://suporte.assas.com.br)
