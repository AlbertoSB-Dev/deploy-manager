# 🔧 Corrigir Erro 404 no GitHub OAuth

## 🔴 Problema

Quando o usuário tenta conectar ao GitHub para acessar repositórios, aparece erro 404:
```
https://github.com/login/oauth/authorize/client_id=&redirect_uri=http://localhost:8000/auth/github/callback&scope=repo,read:user,user:email
```

**Causa:** A URL de callback está configurada como `localhost` em vez da URL da VPS.

---

## ✅ Solução Completa

### Passo 1: Atualizar Configurações no Painel

1. Acesse o painel: http://painel.38.242.213.195.sslip.io
2. Login: `superadmin@arkdeploy.com` / `Admin123`
3. Menu **Admin** → **Configurações**
4. Seção **GitHub OAuth**, preencha:

```
Client ID: Ov23liUAMV3RZp1pk9PH
Client Secret: ae184835a93a3a81c259ddc2f42cb8bc175a1b0a
Callback URL: http://painel.38.242.213.195.sslip.io/auth/github/callback
```

5. Clique em **Salvar Configurações**

---

### Passo 2: Atualizar OAuth App no GitHub

1. Acesse: https://github.com/settings/developers
2. Clique em **OAuth Apps**
3. Clique no seu app (ou crie um novo se não existir)
4. Atualize os campos:

**Application name:**
```
Ark Deploy
```

**Homepage URL:**
```
http://painel.38.242.213.195.sslip.io
```

**Authorization callback URL:**
```
http://painel.38.242.213.195.sslip.io/auth/github/callback
```

5. Clique em **Update application**

---

### Passo 3: Reiniciar o Backend

Para aplicar as novas configurações:

```bash
# Na VPS
cd /opt/ark-deploy
docker-compose restart backend
```

Aguarde 30 segundos e teste novamente.

---

## 🧪 Testar a Conexão

1. No painel, vá para **Dashboard**
2. Clique em **"Conectar GitHub"** ou **"Novo Projeto"**
3. Clique no botão de conectar ao GitHub
4. Você deve ser redirecionado para o GitHub
5. Autorize o aplicativo
6. Você deve voltar para o painel com sucesso

---

## 🔍 Verificar Configuração Atual

Para ver as configurações atuais do backend:

```bash
# Na VPS
cd /opt/ark-deploy
docker-compose logs backend | grep "GitHub OAuth Config"
```

Deve mostrar:
```
✅ CLIENT_ID: Configurado
✅ CLIENT_SECRET: Configurado
📍 REDIRECT_URI: http://painel.38.242.213.195.sslip.io/auth/github/callback
```

---

## 🆕 Criar Novo OAuth App (Se Necessário)

Se você não tem um OAuth App ou quer criar um novo:

### 1. Criar no GitHub

1. Acesse: https://github.com/settings/developers
2. Clique em **OAuth Apps** → **New OAuth App**
3. Preencha:

```
Application name: Ark Deploy
Homepage URL: http://painel.38.242.213.195.sslip.io
Authorization callback URL: http://painel.38.242.213.195.sslip.io/auth/github/callback
```

4. Clique em **Register application**
5. Copie o **Client ID**
6. Clique em **Generate a new client secret**
7. Copie o **Client Secret** (você não verá novamente!)

### 2. Configurar no Painel

1. Acesse: Admin → Configurações
2. Seção **GitHub OAuth**:
   - Client ID: [COLE AQUI]
   - Client Secret: [COLE AQUI]
   - Callback URL: `http://painel.38.242.213.195.sslip.io/auth/github/callback`
3. Salvar Configurações
4. Reiniciar backend: `docker-compose restart backend`

---

## 🐛 Solução de Problemas

### Erro: "redirect_uri_mismatch"

**Causa:** URL de callback no GitHub não corresponde à configurada no painel

**Solução:**
1. Verifique se as URLs são EXATAMENTE iguais (incluindo http/https, porta, etc)
2. No GitHub: `http://painel.38.242.213.195.sslip.io/auth/github/callback`
3. No Painel: `http://painel.38.242.213.195.sslip.io/auth/github/callback`

### Erro: "CLIENT_ID: ❌ Não configurado"

**Causa:** Configurações não foram salvas ou backend não reiniciou

**Solução:**
```bash
cd /opt/ark-deploy
docker-compose restart backend
docker-compose logs -f backend | grep "GitHub"
```

### Erro: "Bad credentials" ou "401 Unauthorized"

**Causa:** Client Secret incorreto

**Solução:**
1. No GitHub, gere um novo Client Secret
2. Atualize no painel
3. Reinicie o backend

---

## 📝 Resumo das URLs

| Tipo | URL |
|------|-----|
| **Painel** | http://painel.38.242.213.195.sslip.io |
| **Backend API** | http://api.38.242.213.195.sslip.io/api |
| **GitHub Callback** | http://painel.38.242.213.195.sslip.io/auth/github/callback |
| **GitHub OAuth Settings** | https://github.com/settings/developers |

---

## ✅ Checklist Final

- [ ] OAuth App criado/atualizado no GitHub
- [ ] Client ID e Secret copiados
- [ ] Configurações salvas no painel (Admin → Configurações)
- [ ] Callback URL correto: `http://painel.38.242.213.195.sslip.io/auth/github/callback`
- [ ] Backend reiniciado: `docker-compose restart backend`
- [ ] Logs verificados: `docker-compose logs backend | grep "GitHub"`
- [ ] Teste de conexão realizado com sucesso

---

**Última atualização:** 13/02/2026
