# ⚙️ Como Configurar Assas pelo Painel Admin

## 🎯 Guia Rápido - 3 Minutos

Este guia mostra como configurar as credenciais do Assas diretamente pela interface web, sem precisar editar arquivos.

---

## 📋 Pré-requisitos

✅ Ter uma conta no Assas (sandbox ou produção)  
✅ Ser Super Admin no sistema  
✅ Sistema rodando (backend e frontend)

---

## 🚀 Passo a Passo

### 1️⃣ Acessar o Painel Admin

1. Abra seu navegador
2. Acesse: `http://localhost:8000/admin` (ou seu domínio)
3. Faça login com uma conta Super Admin

### 2️⃣ Ir para Configurações

1. No menu lateral, clique em **"Configurações"** (ícone de engrenagem ⚙️)
2. Você verá a página de configurações do sistema

### 3️⃣ Configurar Credenciais do Assas

Na seção **"Integrações de Pagamento"**, preencha:

#### Campo 1: Assas API Key
```
┌─────────────────────────────────────────────┐
│ Assas API Key                               │
│ ┌─────────────────────────────────────────┐ │
│ │ $aact_YTU5YTE0M2M2N2I4MTliNzk0...      │ │
│ └─────────────────────────────────────────┘ │
│ [👁️ Mostrar/Ocultar]                        │
└─────────────────────────────────────────────┘
```

**Como obter:**
1. Acesse: https://sandbox.asaas.com (ou https://www.asaas.com)
2. Vá em: **Integrações** → **Chaves de API**
3. Copie a chave completa
4. Cole no campo acima

#### Campo 2: Assas Webhook Token
```
┌─────────────────────────────────────────────┐
│ Assas Webhook Token                         │
│ ┌─────────────────────────────────────────┐ │
│ │ meu-token-secreto-123                   │ │
│ └─────────────────────────────────────────┘ │
│ [👁️ Mostrar/Ocultar]                        │
└─────────────────────────────────────────────┘
```

**Como definir:**
1. Crie um token secreto (ex: `meu-webhook-token-2024`)
2. Cole no campo acima
3. **IMPORTANTE**: Use o mesmo token no painel do Assas

### 4️⃣ Configurar Webhook no Assas

Agora você precisa configurar o webhook no painel do Assas:

1. Acesse o painel do Assas
2. Vá em: **Integrações** → **Webhooks**
3. Clique em **"Configurar Webhook"**
4. Preencha:

```
┌─────────────────────────────────────────────┐
│ URL do Webhook:                             │
│ https://seu-dominio.com/api/payments/webhook│
│                                             │
│ Token de Autenticação:                      │
│ meu-webhook-token-2024                      │
│ (MESMO token que você colocou no painel)    │
│                                             │
│ Eventos: ☑ Selecionar todos                 │
│                                             │
│ [Salvar]                                    │
└─────────────────────────────────────────────┘
```

### 5️⃣ Salvar Configurações

1. No painel admin, clique no botão **"Salvar Configurações"**
2. Aguarde a mensagem de sucesso: ✅ "Configurações salvas!"
3. O sistema irá:
   - Salvar no banco de dados
   - Atualizar o arquivo `.env`
   - Aplicar as mudanças em memória

### 6️⃣ Verificar se Funcionou

O sistema **NÃO precisa ser reiniciado**! As configurações são aplicadas automaticamente.

Para testar:
1. Vá para a página de **Planos** (`/pricing`)
2. Tente criar uma assinatura de teste
3. Verifique os logs do backend:
   ```bash
   docker-compose logs -f backend | grep Assas
   ```
4. Você deve ver:
   ```
   ✅ Assas inicializado com sucesso
   ✅ Cliente criado no Assas
   ✅ Assinatura criada no Assas
   ```

---

## 🎨 Interface Visual

### Tela de Configurações

```
┌────────────────────────────────────────────────────────────┐
│  ⚙️ Configurações do Sistema                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🌐 Configurações de Servidor                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ IP do Servidor: [localhost                        ]  │ │
│  │ Domínio Base:   [sslip.io                         ]  │ │
│  │ URL Frontend:   [http://localhost:8000            ]  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  🔑 GitHub OAuth                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Client ID:      [seu_github_client_id             ]  │ │
│  │ Client Secret:  [••••••••••••••••••] [👁️]          │ │
│  │ Callback URL:   [http://localhost:8000/auth/...   ]  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  💳 Assas (Pagamentos)                                    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ API Key:        [••••••••••••••••••] [👁️]          │ │
│  │ Webhook Token:  [••••••••••••••••••] [👁️]          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [💾 Salvar Configurações]                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ Vantagens de Configurar pelo Painel

### 👍 Prós

- ✅ **Fácil e visual** - Não precisa editar arquivos
- ✅ **Sem reiniciar** - Mudanças aplicadas automaticamente
- ✅ **Seguro** - Campos de senha ocultos por padrão
- ✅ **Validação** - Sistema valida as credenciais
- ✅ **Histórico** - Salva no banco de dados
- ✅ **Multi-ambiente** - Funciona em dev e produção

### 📝 Observações

- As configurações são salvas em **dois lugares**:
  1. Banco de dados (MongoDB)
  2. Arquivo `.env` (backup)
  
- Se você editar o `.env` manualmente, o painel irá mostrar os valores do banco de dados

- Para resetar para os valores do `.env`, delete as configurações do banco

---

## 🔄 Fluxo Completo

```
1. Você preenche no painel admin
   ↓
2. Sistema salva no MongoDB
   ↓
3. Sistema atualiza .env
   ↓
4. Sistema aplica em memória
   ↓
5. Assas funciona imediatamente!
```

---

## 🚨 Problemas Comuns

### ❌ Erro: "Erro ao salvar configurações"

**Causa**: Você não é Super Admin

**Solução**:
```bash
# Tornar seu usuário Super Admin
cd backend
node scripts/make-super-admin.js seu-email@exemplo.com
```

### ❌ Erro: "Invalid API Key"

**Causa**: API Key incorreta ou incompleta

**Solução**:
1. Verifique se copiou a chave completa do Assas
2. Certifique-se que não tem espaços extras
3. Confirme que está usando a chave do ambiente correto (sandbox/produção)

### ❌ Webhook não funciona

**Causa**: Token diferente no painel e no Assas

**Solução**:
1. Copie o token do painel admin
2. Cole EXATAMENTE o mesmo no painel do Assas
3. Salve em ambos os lugares

---

## 🔒 Segurança

### ✅ Boas Práticas

1. **Use tokens fortes**
   ```
   ❌ Ruim:  123456
   ✅ Bom:   meu-webhook-token-super-secreto-2024-xyz
   ```

2. **Não compartilhe credenciais**
   - Nunca envie por email/chat
   - Não tire prints com as chaves visíveis
   - Use o botão 👁️ para ocultar quando não estiver usando

3. **Rotacione periodicamente**
   - Troque as chaves a cada 6 meses
   - Atualize imediatamente se houver suspeita de vazamento

4. **Use ambiente correto**
   - Desenvolvimento: Sandbox
   - Produção: Produção
   - Nunca misture!

---

## 📊 Comparação: Painel vs .env

| Aspecto | Painel Admin | Arquivo .env |
|---------|--------------|--------------|
| Facilidade | ⭐⭐⭐⭐⭐ Muito fácil | ⭐⭐⭐ Médio |
| Reiniciar? | ❌ Não precisa | ✅ Precisa |
| Visual | ✅ Interface bonita | ❌ Texto puro |
| Validação | ✅ Valida ao salvar | ❌ Sem validação |
| Histórico | ✅ Salvo no banco | ❌ Sem histórico |
| Acesso | 🔐 Apenas Super Admin | 🔐 Acesso ao servidor |

**Recomendação**: Use o painel admin sempre que possível!

---

## 🎓 Resumo Ultra-Rápido

```bash
1. Acesse: /admin/settings
2. Cole API Key do Assas
3. Defina Webhook Token
4. Configure mesmo token no Assas
5. Salve
6. Pronto! ✅
```

**Tempo total**: ~3 minutos

---

## 📞 Precisa de Ajuda?

- **Dúvidas sobre Assas**: https://docs.asaas.com
- **Problemas técnicos**: Verifique `TROUBLESHOOTING.md`
- **Guia detalhado**: Veja `ASSAS-CREDENCIAIS-GUIA.md`
- **Diagramas visuais**: Veja `ASSAS-FLUXO-VISUAL.md`

---

**Última atualização**: Fevereiro 2026

✅ **Configuração pelo painel está 100% funcional!**
