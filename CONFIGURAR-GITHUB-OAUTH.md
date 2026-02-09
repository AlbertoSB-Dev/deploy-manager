# 🔧 Configurar GitHub OAuth App

## ⚠️ IMPORTANTE: Atualizar Callback URL

O GitHub OAuth App precisa ter a URL de callback correta configurada.

## 📝 Passos para Configurar

### 1. Acesse o GitHub OAuth App
1. Vá para: https://github.com/settings/developers
2. Clique no seu OAuth App (ou crie um novo)

### 2. Configure a Callback URL

**IMPORTANTE:** Adicione esta URL exata no GitHub OAuth App:

```
http://localhost:3000/auth/github/callback
```

**Por que essa URL?**
- O GitHub redireciona para `/auth/github/callback`
- Essa página redireciona automaticamente para `/dashboard` com os parâmetros
- O componente `GitHubConnectButton` processa o callback no dashboard

### 3. Configuração Completa

No formulário do GitHub OAuth App:

**Application name:** Deploy Manager (ou o nome que preferir)

**Homepage URL:** 
```
http://localhost:3000
```

**Authorization callback URL:**
```
http://localhost:3000/auth/github/callback
```

**Application description:** (opcional)
```
Sistema de gerenciamento de deploys
```

### 4. Copie as Credenciais

Após salvar, copie:
- **Client ID**
- **Client Secret** (clique em "Generate a new client secret" se necessário)

### 5. Configure o Backend

Edite `deploy-manager/backend/.env`:

```env
GITHUB_CLIENT_ID=seu-client-id-aqui
GITHUB_CLIENT_SECRET=seu-client-secret-aqui
```

## 🚀 Como Funciona Agora

### Fluxo de Conexão GitHub

1. Usuário faz login com email/senha
2. No dashboard, clica em "Conectar GitHub"
3. GitHub redireciona para: `http://localhost:3000/auth/github/callback?code=XXX&state=connect_userId`
4. Página de callback redireciona para: `/dashboard?github=connecting&code=XXX&state=connect_userId`
5. O componente `GitHubConnectButton` detecta os parâmetros
6. Envia o code para o backend
7. Backend retorna o GitHub token
8. Token é salvo no localStorage
9. Agora pode listar repositórios

## 🔍 Verificar Configuração

### 1. Reinicie o Backend
```bash
cd deploy-manager/backend
# Ctrl+C para parar
npm run dev
```

Você deve ver:
```
🔑 GitHub OAuth Config (Auth Routes):
  CLIENT_ID: ✅ Configurado
  CLIENT_SECRET: ✅ Configurado
```

### 2. Reinicie o Frontend
```bash
cd deploy-manager/frontend
# Ctrl+C para parar
npm run dev
```

Agora deve rodar na porta **3000** (não mais 8000).

### 3. Teste a Conexão

1. Acesse: http://localhost:3000/login
2. Faça login com email/senha
3. No dashboard, clique em "Conectar GitHub"
4. Autorize no GitHub
5. Deve voltar para o dashboard com "GitHub Conectado"

## ❌ Problemas Comuns

### "redirect_uri_mismatch"
→ A URL no GitHub OAuth App não está correta. Deve ser exatamente:
```
http://localhost:3000/auth/github/callback
```

### "404 Not Found" após autorizar
→ O frontend não está rodando na porta 3000. Verifique se reiniciou o frontend.

### "GitHub OAuth não configurado"
→ As credenciais não estão no `.env` ou o backend não foi reiniciado.

## 📊 Portas Corretas

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8001 | http://localhost:8001 |
| MongoDB | 27017 | mongodb://localhost:27017 |

## ✅ Checklist Final

- [ ] GitHub OAuth App tem callback: `http://localhost:3000/auth/github/callback`
- [ ] Backend `.env` tem `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` e `GITHUB_CALLBACK_URL`
- [ ] Backend foi reiniciado (porta 8001)
- [ ] Frontend foi reiniciado (porta 3000)
- [ ] MongoDB está rodando
- [ ] Consegue fazer login com email/senha
- [ ] Botão "Conectar GitHub" aparece no dashboard

---

**Última atualização:** 2026-02-08
