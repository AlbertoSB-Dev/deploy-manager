# Configuração do Google OAuth

Este guia explica como configurar o Google OAuth para permitir login com Google no Ark Deploy.

## 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. No menu lateral, vá em **APIs e Serviços** > **Credenciais**

## 2. Configurar Tela de Consentimento OAuth

1. Clique em **Tela de consentimento OAuth**
2. Selecione **Externo** (para permitir qualquer usuário do Google)
3. Preencha as informações obrigatórias:
   - Nome do aplicativo: `Ark Deploy`
   - Email de suporte do usuário: seu email
   - Domínio da página inicial do aplicativo: `http://localhost:8000` (desenvolvimento)
   - Domínio autorizado: `localhost` (desenvolvimento)
   - Email de contato do desenvolvedor: seu email
4. Clique em **Salvar e continuar**
5. Em **Escopos**, adicione:
   - `openid`
   - `profile`
   - `email`
6. Clique em **Salvar e continuar**
7. Em **Usuários de teste** (modo desenvolvimento), adicione seu email
8. Clique em **Salvar e continuar**

## 3. Criar Credenciais OAuth 2.0

1. Volte para **Credenciais**
2. Clique em **Criar credenciais** > **ID do cliente OAuth**
3. Tipo de aplicativo: **Aplicativo da Web**
4. Nome: `Ark Deploy Web Client`
5. **URIs de redirecionamento autorizados**:
   - Desenvolvimento: `http://localhost:8001/api/auth/google/callback`
   - Produção: `https://seu-dominio.com/api/auth/google/callback`
6. Clique em **Criar**
7. Copie o **ID do cliente** e o **Segredo do cliente**

## 4. Configurar Variáveis de Ambiente

### Backend (.env)

Adicione as seguintes variáveis no arquivo `deploy-manager/backend/.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_google_client_secret_aqui
GOOGLE_CALLBACK_URL=http://localhost:8001/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:8000
```

### Frontend (.env.local)

Crie ou edite o arquivo `deploy-manager/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```

## 5. Testar a Integração

1. Reinicie o backend:
   ```bash
   cd deploy-manager/backend
   npm run dev
   ```

2. Reinicie o frontend:
   ```bash
   cd deploy-manager/frontend
   npm run dev
   ```

3. Acesse `http://localhost:8000/login`
4. Clique em **Continuar com Google**
5. Faça login com sua conta Google
6. Você será redirecionado de volta para o dashboard

## 6. Produção

Para produção, você precisa:

1. **Publicar o aplicativo** no Google Cloud Console:
   - Vá em **Tela de consentimento OAuth**
   - Clique em **Publicar aplicativo**
   - Aguarde a aprovação do Google (pode levar alguns dias)

2. **Atualizar as URLs de redirecionamento**:
   - Adicione a URL de produção: `https://seu-dominio.com/api/auth/google/callback`

3. **Atualizar variáveis de ambiente de produção**:
   ```env
   GOOGLE_CALLBACK_URL=https://seu-dominio.com/api/auth/google/callback
   FRONTEND_URL=https://seu-dominio.com
   ```

## Fluxo de Autenticação

1. Usuário clica em "Continuar com Google"
2. Frontend redireciona para `GET /api/auth/google`
3. Backend redireciona para Google OAuth
4. Usuário faz login no Google
5. Google redireciona para `GET /api/auth/google/callback?code=...`
6. Backend troca o código por access token
7. Backend busca informações do usuário no Google
8. Backend cria ou atualiza o usuário no banco de dados
9. Backend gera JWT token
10. Backend redireciona para `http://localhost:8000/auth/google/callback?token=...`
11. Frontend salva o token e redireciona para o dashboard

## Troubleshooting

### Erro: "redirect_uri_mismatch"
- Verifique se a URL de callback no Google Cloud Console está exatamente igual à configurada no `.env`
- Certifique-se de incluir `http://` ou `https://`

### Erro: "access_denied"
- Verifique se o email está na lista de usuários de teste (modo desenvolvimento)
- Certifique-se de que o aplicativo está publicado (produção)

### Erro: "Google OAuth não configurado"
- Verifique se as variáveis `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão no `.env`
- Reinicie o backend após adicionar as variáveis

### Token não é recebido
- Verifique os logs do backend para ver erros detalhados
- Certifique-se de que o `FRONTEND_URL` está correto no `.env`

## Segurança

- **Nunca** commite o arquivo `.env` com as credenciais
- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Mantenha o `GOOGLE_CLIENT_SECRET` seguro
- Em produção, use HTTPS para todas as URLs
