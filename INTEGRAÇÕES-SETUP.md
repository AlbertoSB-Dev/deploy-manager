# Configuração de Integrações - Super Admin

Este guia explica como configurar as credenciais de pagamento (Assas) e autenticação (GitHub) através do painel de Super Admin.

## 📋 Visão Geral

Todas as credenciais sensíveis agora são gerenciadas através do painel de Super Admin em vez de variáveis de ambiente. Isso oferece:

- ✅ Segurança: Credenciais armazenadas no banco de dados, não em arquivos
- ✅ Facilidade: Atualizar credenciais sem reiniciar o servidor
- ✅ Auditoria: Histórico de alterações (futuro)
- ✅ Flexibilidade: Múltiplos ambientes com diferentes credenciais

## 🔐 Acessando as Integrações

1. Faça login como **Super Admin**
2. Vá para o painel de admin: `/admin`
3. Clique no botão **"Integrações"** (roxo)
4. Configure as credenciais necessárias

## 🛠️ Configurações Disponíveis

### 1. Configurações do Servidor

**IP do Servidor**
- Endereço IP do seu servidor
- Exemplo: `192.168.1.1` ou `123.45.67.89`

**Domínio Base**
- Domínio usado para gerar URLs de subdomínios
- Padrão: `sslip.io`
- Exemplo: `example.com`

**URL do Frontend**
- URL completa do seu painel frontend
- Exemplo: `https://app.example.com`

### 2. GitHub OAuth

Necessário para permitir login via GitHub e deploy de repositórios.

**Client ID**
- Obtido em: GitHub Settings → Developer settings → OAuth Apps
- Exemplo: `Ov23liXXXXXXXXXXXXXX`

**Client Secret**
- Obtido em: GitHub Settings → Developer settings → OAuth Apps
- ⚠️ **NUNCA compartilhe este valor**
- Será mascarado na interface

**Callback URL**
- URL para onde GitHub redireciona após autenticação
- Formato: `https://seu-dominio.com/api/auth/github/callback`
- Deve corresponder ao configurado no GitHub

### 3. Assas Payment Gateway

Necessário para processar pagamentos de assinaturas.

**API Key**
- Obtida em: Assas Dashboard → Configurações → API
- ⚠️ **NUNCA compartilhe este valor**
- Será mascarado na interface

**Webhook Token**
- Token para validar webhooks do Assas
- Obtido em: Assas Dashboard → Webhooks
- Usado para confirmar que eventos vêm do Assas

## 📝 Passo a Passo: Configurar GitHub OAuth

### 1. Criar OAuth App no GitHub

1. Acesse: https://github.com/settings/developers
2. Clique em "New OAuth App"
3. Preencha:
   - **Application name**: "Ark Deploy"
   - **Homepage URL**: `https://seu-dominio.com`
   - **Authorization callback URL**: `https://seu-dominio.com/api/auth/github/callback`
4. Clique em "Register application"
5. Copie o **Client ID** e **Client Secret**

### 2. Configurar no Painel

1. Vá para `/admin/integrations`
2. Na seção "GitHub OAuth", preencha:
   - Client ID: Cole o valor copiado
   - Client Secret: Cole o valor copiado
   - Callback URL: `https://seu-dominio.com/api/auth/github/callback`
3. Clique em "Salvar Configurações"

### 3. Testar

1. Vá para a página de login
2. Clique em "Entrar com GitHub"
3. Você deve ser redirecionado para autorizar o app
4. Após autorizar, deve fazer login com sucesso

## 📝 Passo a Passo: Configurar Assas

### 1. Obter Credenciais do Assas

1. Acesse: https://app.assas.com.br
2. Faça login com sua conta
3. Vá para: Configurações → API
4. Copie a **API Key** (chave de produção ou sandbox)
5. Vá para: Webhooks
6. Copie o **Webhook Token**

### 2. Configurar no Painel

1. Vá para `/admin/integrations`
2. Na seção "Assas Payment Gateway", preencha:
   - API Key: Cole a chave copiada
   - Webhook Token: Cole o token copiado
3. Clique em "Salvar Configurações"

### 3. Configurar Webhook no Assas

1. No Assas Dashboard, vá para: Webhooks
2. Clique em "Novo Webhook"
3. Configure:
   - **URL**: `https://seu-dominio.com/api/payments/webhook`
   - **Eventos**: Selecione todos os eventos de assinatura e pagamento
4. Salve

### 4. Testar

1. Vá para a página de pricing
2. Selecione um plano e quantidade de servidores
3. Clique em "Começar Agora"
4. Preencha os dados de pagamento
5. Clique em "Confirmar Pagamento"
6. Você deve ser redirecionado para o dashboard após sucesso

## 🔄 Fluxo de Atualização

Quando você atualiza as credenciais no painel:

1. **Banco de Dados**: Credenciais são salvas no MongoDB
2. **Arquivo .env**: O arquivo `.env` é atualizado automaticamente
3. **Memória**: Variáveis de ambiente em memória são atualizadas
4. **Serviços**: Os serviços (Assas, GitHub) usam as novas credenciais imediatamente

⚠️ **Nota**: Se o servidor for reiniciado, as credenciais serão carregadas do banco de dados.

## 🔒 Segurança

### Boas Práticas

1. **Nunca compartilhe credenciais** em chat, email ou repositório
2. **Use credenciais diferentes** para desenvolvimento e produção
3. **Rotacione credenciais regularmente** (especialmente API Keys)
4. **Monitore acessos** ao painel de integrações
5. **Faça backup** das credenciais em local seguro

### Proteção

- Apenas **Super Admin** pode acessar `/admin/integrations`
- Credenciais são **mascaradas** na interface (exceto ao editar)
- Credenciais são **criptografadas** no banco de dados (futuro)
- Acesso é **auditado** (futuro)

## 🐛 Troubleshooting

### GitHub Login não funciona

**Problema**: "Invalid client_id"
- Verifique se o Client ID está correto
- Verifique se a Callback URL corresponde exatamente

**Problema**: "Redirect URI mismatch"
- A Callback URL no painel deve ser idêntica à configurada no GitHub
- Verifique maiúsculas/minúsculas e protocolo (http vs https)

### Pagamentos não funcionam

**Problema**: "API Key inválida"
- Verifique se a API Key está correta
- Verifique se está usando a chave de produção (não sandbox)
- Verifique se a chave não expirou

**Problema**: "Webhook não recebido"
- Verifique se a URL do webhook está correta
- Verifique se o servidor está acessível externamente
- Verifique os logs do Assas para erros

## 📚 Referências

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Assas API Documentation](https://docs.assas.com.br)
- [Assas Webhooks](https://docs.assas.com.br/webhooks)

## ❓ Dúvidas?

Se tiver dúvidas sobre a configuração, consulte:
1. Este documento
2. A documentação oficial do GitHub e Assas
3. Os logs do servidor (`docker logs ark-deploy-backend`)
