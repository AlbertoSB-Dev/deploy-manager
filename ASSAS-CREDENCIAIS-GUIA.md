# 🔐 Guia Completo de Credenciais do Assas

## 📋 Índice
1. [O que é cada credencial](#o-que-é-cada-credencial)
2. [Onde encontrar no Assas](#onde-encontrar-no-assas)
3. [Como configurar no sistema](#como-configurar-no-sistema)
4. [Diferença entre Sandbox e Produção](#diferença-entre-sandbox-e-produção)
5. [Testando as credenciais](#testando-as-credenciais)

---

## 🎯 O que é cada credencial

### 1. **ASSAS_API_KEY** (Chave de API)
- **O que é**: Token de autenticação para fazer requisições à API do Assas
- **Formato**: String longa (ex: `$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNzI1Njk6OiRhYWNoXzRlNTU0ZGQyLTBmYTQtNDczYy04MmQyLTI4ZjZlNGFkNGM4Mw==`)
- **Uso**: Autenticar todas as chamadas à API (criar clientes, cobranças, assinaturas)
- **Sensibilidade**: 🔴 CRÍTICA - Nunca compartilhe ou exponha publicamente

### 2. **ASSAS_WEBHOOK_TOKEN** (Token do Webhook)
- **O que é**: Token secreto para validar que os webhooks realmente vêm do Assas
- **Formato**: String aleatória que você define (ex: `meu-token-secreto-123`)
- **Uso**: Validar a autenticidade dos webhooks recebidos
- **Sensibilidade**: 🟡 IMPORTANTE - Mantenha seguro

---

## 🔍 Onde encontrar no Assas

### Passo 1: Acessar o Painel do Assas

**Sandbox (Testes):**
```
https://sandbox.asaas.com
```

**Produção:**
```
https://www.asaas.com
```

### Passo 2: Obter a API Key

1. Faça login na sua conta Assas
2. No menu lateral, clique em **"Integrações"** ou **"API"**
3. Clique em **"Chaves de API"** ou **"API Keys"**
4. Você verá sua chave de API:
   ```
   Chave de API: $aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ...
   ```
5. Clique em **"Copiar"** ou **"Mostrar"** para visualizar a chave completa

**⚠️ IMPORTANTE:**
- Sandbox e Produção têm chaves DIFERENTES
- Nunca use a chave de produção em desenvolvimento
- Se a chave vazar, gere uma nova imediatamente

### Passo 3: Configurar o Webhook Token

1. No painel do Assas, vá em **"Integrações"** → **"Webhooks"**
2. Clique em **"Configurar Webhook"** ou **"Adicionar Webhook"**
3. Preencha:
   - **URL do Webhook**: `https://seu-dominio.com/api/payments/webhook`
   - **Token de Autenticação**: Crie um token secreto (ex: `meu-token-super-secreto-2024`)
   - **Eventos**: Selecione todos os eventos de pagamento e assinatura

**Eventos importantes para selecionar:**
- ✅ `PAYMENT_CREATED` - Pagamento criado
- ✅ `PAYMENT_RECEIVED` - Pagamento recebido
- ✅ `PAYMENT_CONFIRMED` - Pagamento confirmado
- ✅ `PAYMENT_OVERDUE` - Pagamento vencido
- ✅ `SUBSCRIPTION_CREATED` - Assinatura criada
- ✅ `SUBSCRIPTION_ACTIVATED` - Assinatura ativada
- ✅ `SUBSCRIPTION_CANCELLED` - Assinatura cancelada

---

## ⚙️ Como configurar no sistema

### Opção 1: Arquivo .env (Recomendado)

Edite o arquivo `.env` na raiz do projeto backend:

```bash
# ===== ASSAS (GATEWAY DE PAGAMENTO) =====
ASSAS_API_KEY=sua_chave_api_aqui
ASSAS_WEBHOOK_TOKEN=seu_token_webhook_aqui
ASSAS_ENVIRONMENT=sandbox  # ou 'production'
```

**Exemplo com valores reais (Sandbox):**
```bash
ASSAS_API_KEY=$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNzI1Njk6OiRhYWNoXzRlNTU0ZGQyLTBmYTQtNDczYy04MmQyLTI4ZjZlNGFkNGM4Mw==
ASSAS_WEBHOOK_TOKEN=meu-webhook-token-secreto-123
ASSAS_ENVIRONMENT=sandbox
```

### Opção 2: Painel Admin (Interface Web)

1. Acesse o painel admin: `https://seu-dominio.com/admin`
2. Vá em **"Configurações"**
3. Na seção **"Integrações de Pagamento"**, preencha:
   - **Assas API Key**: Cole sua chave de API
   - **Assas Webhook Token**: Cole seu token de webhook
   - **Ambiente**: Selecione "Sandbox" ou "Produção"
4. Clique em **"Salvar"**

---

## 🔄 Diferença entre Sandbox e Produção

### 🧪 Sandbox (Testes)

**Quando usar:**
- Durante desenvolvimento
- Para testar integrações
- Antes de ir para produção

**Características:**
- Não processa pagamentos reais
- Pode simular todos os cenários
- Dados são resetados periodicamente
- URL da API: `https://sandbox.asaas.com/api/v3`

**Como obter conta Sandbox:**
1. Acesse: https://sandbox.asaas.com
2. Crie uma conta de teste (gratuita)
3. Obtenha sua API Key de sandbox

### 💰 Produção (Real)

**Quando usar:**
- Quando o sistema estiver pronto
- Para processar pagamentos reais
- Após testar tudo no sandbox

**Características:**
- Processa pagamentos reais
- Cobra taxas do Assas
- Requer conta verificada
- URL da API: `https://www.asaas.com/api/v3`

**Como ativar produção:**
1. Crie conta real no Assas: https://www.asaas.com
2. Complete o cadastro e verificação
3. Obtenha sua API Key de produção
4. Atualize o `.env`:
   ```bash
   ASSAS_ENVIRONMENT=production
   ASSAS_API_KEY=sua_chave_de_producao
   ```

---

## ✅ Testando as credenciais

### Teste 1: Verificar se a API Key está funcionando

Execute no terminal do backend:

```bash
cd backend
node -e "
const axios = require('axios');
const apiKey = process.env.ASSAS_API_KEY || 'SUA_CHAVE_AQUI';
const env = process.env.ASSAS_ENVIRONMENT || 'sandbox';
const baseURL = env === 'production' 
  ? 'https://www.asaas.com/api/v3' 
  : 'https://sandbox.asaas.com/api/v3';

axios.get(baseURL + '/customers?limit=1', {
  headers: { 'access_token': apiKey }
})
.then(res => console.log('✅ API Key válida! Clientes:', res.data.totalCount))
.catch(err => console.error('❌ Erro:', err.response?.data || err.message));
"
```

**Resultado esperado:**
```
✅ API Key válida! Clientes: 0
```

### Teste 2: Verificar Webhook

1. Crie uma cobrança de teste no painel do Assas
2. Verifique os logs do backend:
   ```bash
   docker-compose logs -f backend | grep webhook
   ```
3. Você deve ver:
   ```
   ✅ Webhook recebido: PAYMENT_CREATED
   ✅ Webhook validado com sucesso
   ```

---

## 🚨 Problemas Comuns

### Erro: "Invalid API Key"
**Causa**: API Key incorreta ou expirada
**Solução**: 
1. Verifique se copiou a chave completa
2. Confirme se está usando a chave do ambiente correto (sandbox/produção)
3. Gere uma nova chave no painel do Assas

### Erro: "Webhook signature invalid"
**Causa**: Token do webhook não corresponde
**Solução**:
1. Verifique se o token no `.env` é o mesmo configurado no Assas
2. Não use espaços ou caracteres especiais no token
3. Reconfigure o webhook no painel do Assas

### Erro: "Environment not set"
**Causa**: Variável `ASSAS_ENVIRONMENT` não configurada
**Solução**:
```bash
# No .env
ASSAS_ENVIRONMENT=sandbox  # ou production
```

---

## 📝 Checklist de Configuração

- [ ] Conta criada no Assas (sandbox ou produção)
- [ ] API Key copiada do painel
- [ ] Webhook configurado no painel do Assas
- [ ] Token do webhook definido
- [ ] Variáveis no `.env` configuradas
- [ ] Ambiente correto selecionado (sandbox/production)
- [ ] Teste de API executado com sucesso
- [ ] Webhook testado e funcionando
- [ ] Sistema reiniciado após configuração

---

## 🔒 Segurança

### ✅ Boas Práticas

1. **Nunca commite credenciais no Git**
   ```bash
   # .gitignore já inclui:
   .env
   .env.local
   .env.production
   ```

2. **Use variáveis de ambiente em produção**
   ```bash
   # No servidor de produção
   export ASSAS_API_KEY="sua_chave_aqui"
   export ASSAS_WEBHOOK_TOKEN="seu_token_aqui"
   ```

3. **Rotacione as chaves periodicamente**
   - Gere novas chaves a cada 6 meses
   - Atualize imediatamente se houver suspeita de vazamento

4. **Monitore os logs**
   ```bash
   # Ver tentativas de acesso
   docker-compose logs backend | grep "Assas"
   ```

### ❌ Nunca Faça

- ❌ Compartilhar API Key em chat/email
- ❌ Usar chave de produção em desenvolvimento
- ❌ Commitar `.env` no repositório
- ❌ Expor chaves no frontend
- ❌ Usar a mesma chave em múltiplos projetos

---

## 📞 Suporte

**Dúvidas sobre o Assas:**
- Documentação: https://docs.asaas.com
- Suporte: suporte@asaas.com
- WhatsApp: (11) 4950-2915

**Dúvidas sobre o sistema:**
- Verifique os logs: `docker-compose logs backend`
- Consulte: `TROUBLESHOOTING.md`
- Entre em contato com o desenvolvedor

---

## 🎓 Resumo Rápido

```bash
# 1. Obter credenciais no Assas
https://sandbox.asaas.com → Integrações → API Keys

# 2. Configurar no .env
ASSAS_API_KEY=sua_chave_aqui
ASSAS_WEBHOOK_TOKEN=seu_token_aqui
ASSAS_ENVIRONMENT=sandbox

# 3. Configurar webhook no Assas
URL: https://seu-dominio.com/api/payments/webhook
Token: mesmo do ASSAS_WEBHOOK_TOKEN

# 4. Reiniciar sistema
docker-compose restart backend

# 5. Testar
Criar uma cobrança de teste no painel do Assas
```

---

**Última atualização**: Fevereiro 2026
