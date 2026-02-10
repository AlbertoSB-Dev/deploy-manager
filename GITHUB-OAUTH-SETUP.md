# 🔑 Configurar GitHub OAuth - Ark Deploy

Este guia explica como obter as credenciais do GitHub OAuth para permitir que usuários conectem seus repositórios GitHub ao Ark Deploy.

## 📋 O que é GitHub OAuth?

GitHub OAuth permite que usuários autorizem o Ark Deploy a acessar seus repositórios privados sem compartilhar senhas. Isso é necessário para:

- ✅ Listar repositórios privados
- ✅ Clonar repositórios privados
- ✅ Fazer deploy de projetos privados
- ✅ Configurar webhooks automáticos

## 🚀 Passo a Passo

### 1. Acessar GitHub Developer Settings

1. Acesse: https://github.com/settings/developers
2. Ou navegue: **GitHub** → **Settings** → **Developer settings** → **OAuth Apps**

### 2. Criar Nova OAuth App

1. Clique em **"New OAuth App"**
2. Preencha o formulário:

```
Application name: Ark Deploy
Homepage URL: http://SEU_IP:8000
Application description: Sistema de gerenciamento de deploy
Authorization callback URL: http://SEU_IP:8000/auth/github/callback
```

**⚠️ IMPORTANTE:** Substitua `SEU_IP` pelo IP ou domínio do seu servidor!

**Exemplos de URLs:**

Para desenvolvimento local:
```
Homepage URL: http://localhost:8000
Callback URL: http://localhost:8000/auth/github/callback
```

Para produção com IP:
```
Homepage URL: http://38.242.213.195:8000
Callback URL: http://38.242.213.195:8000/auth/github/callback
```

Para produção com domínio:
```
Homepage URL: https://ark-deploy.seudominio.com
Callback URL: https://ark-deploy.seudominio.com/auth/github/callback
```

### 3. Obter Credenciais

Após criar a OAuth App, você verá:

- **Client ID** - Um código como `Iv1.a1b2c3d4e5f6g7h8`
- **Client Secret** - Clique em "Generate a new client secret"

**⚠️ ATENÇÃO:** Copie o Client Secret imediatamente! Ele só é mostrado uma vez.

### 4. Configurar no Ark Deploy

#### Opção A: Arquivo .env (Desenvolvimento)

Edite `backend/.env`:

```env
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=seu_client_secret_aqui
GITHUB_CALLBACK_URL=http://localhost:8000/auth/github/callback
FRONTEND_URL=http://localhost:8000
```

#### Opção B: Docker Compose (Produção)

Edite `.env.production`:

```env
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=seu_client_secret_aqui
GITHUB_CALLBACK_URL=http://SEU_IP:8000/auth/github/callback
FRONTEND_URL=http://SEU_IP:8000
```

Depois reinicie os containers:

```bash
docker-compose -f docker-compose.prod.yml restart
```

#### Opção C: Variáveis de Ambiente Docker

```bash
docker run -d \
  -e GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8 \
  -e GITHUB_CLIENT_SECRET=seu_client_secret \
  -e GITHUB_CALLBACK_URL=http://SEU_IP:8000/auth/github/callback \
  -e FRONTEND_URL=http://SEU_IP:8000 \
  ark-deploy-backend
```

### 5. Testar Configuração

1. Acesse o Ark Deploy: `http://SEU_IP:8000`
2. Faça login
3. Vá em **Dashboard** → **Novo Projeto**
4. Clique em **"Conectar GitHub"**
5. Você será redirecionado para autorizar o app no GitHub
6. Após autorizar, será redirecionado de volta e poderá ver seus repositórios

## 🔧 Configurações Avançadas

### Múltiplos Ambientes

Você pode criar OAuth Apps separadas para cada ambiente:

**Desenvolvimento:**
```env
GITHUB_CLIENT_ID=Iv1.dev_client_id
GITHUB_CLIENT_SECRET=dev_secret
GITHUB_CALLBACK_URL=http://localhost:8000/auth/github/callback
```

**Produção:**
```env
GITHUB_CLIENT_ID=Iv1.prod_client_id
GITHUB_CLIENT_SECRET=prod_secret
GITHUB_CALLBACK_URL=https://ark-deploy.com/auth/github/callback
```

### Permissões (Scopes)

O Ark Deploy solicita as seguintes permissões:

- `repo` - Acesso completo a repositórios privados
- `user:email` - Acesso ao email do usuário

Essas permissões são definidas no código em `backend/src/routes/auth.ts`:

```typescript
const scope = 'repo user:email';
```

### Webhook (Opcional)

Para deploys automáticos quando você faz push no GitHub:

1. Vá em: **Repositório** → **Settings** → **Webhooks**
2. Clique em **"Add webhook"**
3. Configure:
   ```
   Payload URL: http://SEU_IP:8001/api/webhooks/github
   Content type: application/json
   Secret: seu_webhook_secret
   Events: Just the push event
   ```

## 🐛 Troubleshooting

### Erro: "The redirect_uri MUST match the registered callback URL"

**Problema:** A URL de callback não corresponde à configurada no GitHub.

**Solução:**
1. Verifique a URL no GitHub OAuth App
2. Verifique `GITHUB_CALLBACK_URL` no `.env`
3. Certifique-se de que são EXATAMENTE iguais (incluindo http/https, porta, etc)

### Erro: "Bad credentials"

**Problema:** Client ID ou Secret incorretos.

**Solução:**
1. Verifique se copiou corretamente do GitHub
2. Gere um novo Client Secret se necessário
3. Reinicie o backend após alterar

### Erro: "Application suspended"

**Problema:** OAuth App foi suspensa pelo GitHub.

**Solução:**
1. Verifique o email do GitHub para notificações
2. Revise os termos de uso do GitHub
3. Entre em contato com o suporte do GitHub

### Repositórios não aparecem

**Problema:** Permissões insuficientes ou token expirado.

**Solução:**
1. Desconecte e reconecte o GitHub
2. Verifique se autorizou o acesso aos repositórios privados
3. Vá em: https://github.com/settings/applications
4. Encontre "Ark Deploy" e revogue/reconecte

## 🔒 Segurança

### Proteger Client Secret

**NUNCA** compartilhe ou commite o Client Secret no Git!

✅ **Correto:**
```bash
# .env (não commitado)
GITHUB_CLIENT_SECRET=seu_secret_aqui
```

❌ **ERRADO:**
```javascript
// código fonte
const secret = 'ghp_abc123...'; // NUNCA FAÇA ISSO!
```

### Rotacionar Secrets

Recomenda-se rotacionar o Client Secret periodicamente:

1. Gere um novo secret no GitHub
2. Atualize o `.env`
3. Reinicie o backend
4. Revogue o secret antigo

### Limitar Acesso

Configure a OAuth App para aceitar apenas domínios específicos:

1. No GitHub OAuth App settings
2. Em "Authorization callback URL"
3. Use URLs específicas (não wildcards)

## 📚 Referências

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitHub OAuth Scopes](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
- [GitHub API](https://docs.github.com/en/rest)

## ❓ FAQ

### Preciso configurar OAuth para usar o Ark Deploy?

Não! OAuth é opcional. Você pode:
- Usar repositórios públicos (sem OAuth)
- Usar Personal Access Token
- Usar SSH Keys

OAuth é apenas para facilitar o acesso a repositórios privados.

### Posso usar a mesma OAuth App em múltiplos servidores?

Sim, mas você precisará adicionar múltiplas callback URLs:

```
http://servidor1.com:8000/auth/github/callback
http://servidor2.com:8000/auth/github/callback
```

### O que acontece se eu revogar o acesso?

Os usuários precisarão reconectar suas contas GitHub. Projetos já configurados continuarão funcionando se usarem tokens salvos.

## 💡 Dicas

1. **Use HTTPS em produção** - Mais seguro e evita problemas
2. **Configure domínio próprio** - Melhor que usar IP
3. **Teste em desenvolvimento primeiro** - Crie OAuth App de teste
4. **Documente suas URLs** - Anote as URLs usadas
5. **Monitore uso** - GitHub mostra estatísticas de uso da OAuth App

## ✅ Checklist de Configuração

- [ ] Criar OAuth App no GitHub
- [ ] Copiar Client ID
- [ ] Gerar e copiar Client Secret
- [ ] Configurar callback URL correta
- [ ] Adicionar credenciais no `.env`
- [ ] Reiniciar backend
- [ ] Testar conexão GitHub
- [ ] Verificar se repositórios aparecem
- [ ] Testar deploy de repositório privado

---

**Pronto!** Agora seus usuários podem conectar repositórios GitHub privados facilmente! 🎉
