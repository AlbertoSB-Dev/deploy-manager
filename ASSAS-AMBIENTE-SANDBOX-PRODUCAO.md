# 🔄 Seletor de Ambiente Assas (Sandbox/Produção)

## 📋 Visão Geral

Agora você pode alternar entre os ambientes **Sandbox (Teste)** e **Produção** diretamente pelo painel de administração, sem precisar editar arquivos `.env` manualmente.

---

## ✨ Funcionalidades

### 1. Seletor Visual no Painel Admin
- Dropdown para escolher entre Sandbox e Produção
- Indicador visual mostrando qual ambiente está ativo
- Cores diferentes para cada ambiente (amarelo = teste, verde = produção)
- Alertas claros sobre o que cada ambiente faz

### 2. Configuração Automática
- Ao salvar, atualiza automaticamente:
  - Banco de dados (SystemSettings)
  - Arquivo `.env`
  - Variáveis de ambiente em memória
  - URL base do Assas Service

### 3. URLs Corretas por Ambiente
- **Sandbox**: `https://sandbox.asaas.com/api/v3`
- **Produção**: `https://api.asaas.com/v3`

---

## 🎯 Como Usar

### Passo 1: Acessar Configurações
1. Faça login como Super Admin
2. Vá para **Admin → Configurações**
3. Role até a seção "Assas Payment Gateway"

### Passo 2: Escolher Ambiente
1. No dropdown "Ambiente", selecione:
   - **Sandbox (Teste)** - Para testes sem cobranças reais
   - **Produção** - Para cobranças reais de clientes

### Passo 3: Configurar Credenciais
1. Insira a **API Key** correspondente ao ambiente escolhido
2. Insira o **Webhook Token** correspondente
3. Clique em "Salvar Configurações"

---

## 🔐 Credenciais por Ambiente

### Sandbox (Teste)
```
API Key: Obtida em https://sandbox.asaas.com/myAccount/apiKey
Webhook Token: Obtido em https://sandbox.asaas.com/myAccount/webhooks
```

### Produção
```
API Key: Obtida em https://www.asaas.com/myAccount/apiKey
Webhook Token: Obtido em https://www.asaas.com/myAccount/webhooks
```

⚠️ **IMPORTANTE**: As credenciais de Sandbox e Produção são DIFERENTES!

---

## 🎨 Indicadores Visuais

### Ambiente Sandbox (Teste)
- 🟡 Borda e badge amarelos
- Mensagem: "Modo de teste - Nenhuma cobrança real será feita"
- Ideal para: Desenvolvimento, testes, homologação

### Ambiente Produção
- 🟢 Borda e badge verdes
- Mensagem: "⚠️ Cobranças reais serão processadas"
- Ideal para: Clientes reais, cobranças reais

---

## 🔧 Detalhes Técnicos

### Backend
- **Modelo**: `SystemSettings.ts` - Campo `assasEnvironment` adicionado
- **Rota**: `/admin/settings` - GET e PUT atualizados
- **Service**: `AssasService.ts` - URL base dinâmica baseada no ambiente

### Frontend
- **Página**: `/admin/settings/page.tsx`
- **Componentes**: Dropdown + Indicador visual de status
- **Estado**: `assasEnvironment: 'sandbox' | 'production'`

### Variável de Ambiente
```env
ASSAS_ENVIRONMENT=sandbox  # ou production
```

---

## 📝 Fluxo de Atualização

```
1. Admin seleciona ambiente no painel
   ↓
2. Clica em "Salvar Configurações"
   ↓
3. Backend atualiza:
   - SystemSettings no MongoDB
   - Arquivo .env
   - process.env em memória
   ↓
4. AssasService reinicializa com nova URL
   ↓
5. Próximas requisições usam o ambiente correto
```

---

## ⚠️ Avisos Importantes

### 1. Não Misture Credenciais
- ❌ Não use API Key de Sandbox com ambiente Produção
- ❌ Não use API Key de Produção com ambiente Sandbox
- ✅ Sempre use credenciais correspondentes ao ambiente

### 2. Teste Antes de Produção
- Sempre teste no Sandbox primeiro
- Verifique se webhooks estão funcionando
- Confirme que pagamentos de teste são processados
- Só então mude para Produção

### 3. Cuidado ao Alternar
- Ao mudar de Sandbox → Produção:
  - Atualize TODAS as credenciais
  - Verifique se a API Key é de produção
  - Confirme que o Webhook Token é de produção
  - Teste com uma cobrança pequena primeiro

---

## 🧪 Como Testar

### Teste no Sandbox
1. Configure ambiente como "Sandbox"
2. Use credenciais de teste do Assas
3. Crie uma assinatura de teste
4. Verifique se aparece no painel Sandbox do Assas
5. Confirme que nenhuma cobrança real foi feita

### Teste em Produção
1. Configure ambiente como "Produção"
2. Use credenciais reais do Assas
3. Crie uma assinatura com valor baixo (ex: R$ 1,00)
4. Verifique se aparece no painel de Produção do Assas
5. Confirme que a cobrança é real

---

## 🐛 Troubleshooting

### Erro: "Cliente Assas não inicializado"
- Verifique se a API Key está correta
- Confirme que o ambiente está configurado
- Reinicie o backend se necessário

### Erro: "Invalid API Key"
- Você está usando credenciais do ambiente errado
- Sandbox precisa de API Key de Sandbox
- Produção precisa de API Key de Produção

### Webhooks não funcionam
- Verifique se o Webhook Token está correto
- Confirme que a URL do webhook está configurada no Assas
- Ambiente do webhook deve corresponder ao ambiente configurado

---

## 📚 Links Úteis

- [Documentação Assas - Sandbox](https://docs.asaas.com/docs/ambiente-de-testes)
- [Documentação Assas - Produção](https://docs.asaas.com/docs/ambiente-de-producao)
- [Como obter API Key](https://docs.asaas.com/docs/como-obter-api-key)
- [Configurar Webhooks](https://docs.asaas.com/docs/webhooks)

---

## ✅ Checklist de Configuração

### Sandbox
- [ ] Criar conta no Sandbox Assas
- [ ] Obter API Key de Sandbox
- [ ] Obter Webhook Token de Sandbox
- [ ] Configurar ambiente como "Sandbox" no painel
- [ ] Inserir credenciais de Sandbox
- [ ] Salvar configurações
- [ ] Testar criação de assinatura
- [ ] Verificar webhook funcionando

### Produção
- [ ] Criar conta real no Assas
- [ ] Verificar conta (documentos, etc)
- [ ] Obter API Key de Produção
- [ ] Obter Webhook Token de Produção
- [ ] Configurar ambiente como "Produção" no painel
- [ ] Inserir credenciais de Produção
- [ ] Salvar configurações
- [ ] Fazer teste com valor baixo
- [ ] Confirmar cobrança real funcionando
- [ ] Verificar webhook funcionando

---

## 🎉 Pronto!

Agora você pode alternar entre Sandbox e Produção facilmente, sem precisar editar arquivos ou reiniciar servidores manualmente!
