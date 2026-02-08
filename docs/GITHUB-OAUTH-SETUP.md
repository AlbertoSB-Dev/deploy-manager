# 🔐 Configurar GitHub OAuth

Siga este guia para configurar a autenticação com GitHub no Deploy Manager.

## 📋 Passo a Passo

### 1. Criar GitHub OAuth App

1. Acesse: https://github.com/settings/developers
2. Clique em **"OAuth Apps"** → **"New OAuth App"**

3. Preencha os campos:
   ```
   Application name: Deploy Manager
   Homepage URL: http://localhost:8000
   Authorization callback URL: http://localhost:8000/auth/github/callback
   ```

4. Clique em **"Register application"**

5. Você verá:
   - **Client ID**: `Iv1.xxxxxxxxxxxx`
   - **Client Secret**: Clique em "Generate a new client secret"

### 2. Configurar no Deploy Manager

Edite o arquivo `deploy-manager/backend/.env`:

```env
GITHUB_CLIENT_ID=Iv1.seu_client_id_aqui
GITHUB_CLIENT_SECRET=seu_client_secret_aqui
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
```

### 3. Reiniciar o Backend

```bash
# Parar o backend (Ctrl+C)
# Iniciar novamente
cd deploy-manager/backend
npm run dev
```

### 4. Testar a Conexão

1. Abra o Deploy Manager: http://localhost:8000
2. Clique em **"Novo Projeto"**
3. Clique em **"Conectar com GitHub"**
4. Autorize o acesso
5. Seus repositórios aparecerão automaticamente! ✅

---

## 🌐 Configuração para Produção

### Domínio Personalizado

Se você usar um domínio personalizado (ex: `deploy.seusite.com`):

1. **Atualizar GitHub OAuth App:**
   ```
   Homepage URL: https://deploy.seusite.com
   Authorization callback URL: https://deploy.seusite.com/auth/github/callback
   ```

2. **Atualizar .env:**
   ```env
   GITHUB_REDIRECT_URI=https://deploy.seusite.com/auth/github/callback
   ```

### Múltiplos Ambientes

Crie OAuth Apps separados para cada ambiente:

**Desenvolvimento:**
```env
GITHUB_CLIENT_ID=Iv1.dev_client_id
GITHUB_CLIENT_SECRET=dev_secret
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
```

**Produção:**
```env
GITHUB_CLIENT_ID=Iv1.prod_client_id
GITHUB_CLIENT_SECRET=prod_secret
GITHUB_REDIRECT_URI=https://deploy.seusite.com/auth/github/callback
```

---

## 🔒 Permissões

O Deploy Manager solicita as seguintes permissões:

- **`repo`**: Acesso completo aos repositórios (necessário para clone)
- **`read:user`**: Ler informações básicas do perfil
- **`user:email`**: Ler endereço de email

### Por que precisa de `repo`?

Para fazer clone de repositórios privados, o GitHub requer a permissão `repo` completa. Não é possível solicitar apenas leitura.

---

## 🛠️ Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa**: A URL de callback não corresponde à configurada no GitHub.

**Solução**:
1. Verifique o `.env`: `GITHUB_REDIRECT_URI`
2. Verifique no GitHub OAuth App: "Authorization callback URL"
3. Ambos devem ser **exatamente iguais**

### Erro: "Bad credentials"

**Causa**: Client ID ou Secret incorretos.

**Solução**:
1. Verifique o `.env`
2. Copie novamente do GitHub OAuth App
3. Reinicie o backend

### Popup não abre

**Causa**: Bloqueador de popup do navegador.

**Solução**:
1. Permita popups para `localhost:8000`
2. Ou clique com botão direito → "Abrir em nova aba"

### Token expirado

**Causa**: Tokens OAuth do GitHub não expiram, mas podem ser revogados.

**Solução**:
1. Desconecte e reconecte no Deploy Manager
2. Ou revogue o acesso em: https://github.com/settings/applications
3. Conecte novamente

---

## 📚 Recursos Adicionais

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [OAuth 2.0 Specification](https://oauth.net/2/)

---

## 🎯 Próximos Passos

Após configurar o GitHub OAuth:

1. ✅ Conecte sua conta GitHub
2. ✅ Selecione um repositório
3. ✅ Configure o projeto
4. ✅ Faça o deploy!

O Deploy Manager cuidará automaticamente da autenticação para todos os deploys futuros. 🚀
