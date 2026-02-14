# 🔧 Correção Completa - GitHub OAuth

## 🔴 Problemas Identificados nos Logs

```
❌ CLIENT_ID: Não configurado
❌ CLIENT_SECRET: Não configurado
❌ /bin/sh: git: not found
```

---

## ✅ Solução em 3 Passos

### Passo 1: Configurar GitHub OAuth no Painel (2 minutos)

1. Acesse: http://painel.38.242.213.195.sslip.io
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

### Passo 2: Atualizar OAuth App no GitHub (1 minuto)

1. Acesse: https://github.com/settings/developers
2. Clique em **OAuth Apps**
3. Clique no seu app
4. Atualize:

```
Homepage URL: http://painel.38.242.213.195.sslip.io
Authorization callback URL: http://painel.38.242.213.195.sslip.io/auth/github/callback
```

5. Clique em **Update application**

---

### Passo 3: Rebuild do Backend (5 minutos)

O container não tem git instalado. Precisa fazer rebuild:

```bash
cd /opt/ark-deploy

# Parar containers
docker-compose down

# Rebuild apenas backend (mais rápido)
docker-compose build --no-cache backend

# Subir novamente
docker-compose up -d
```

---

## 🧪 Verificar se Funcionou

### 1. Verificar Logs do Backend

```bash
docker-compose logs backend | grep "GitHub OAuth Config" -A 3
```

**Deve mostrar:**
```
✅ CLIENT_ID: Configurado
✅ CLIENT_SECRET: Configurado
📍 CALLBACK_URL: http://painel.38.242.213.195.sslip.io/auth/github/callback
```

### 2. Verificar se Git está instalado

```bash
docker exec ark-deploy-backend git --version
```

**Deve mostrar:**
```
git version 2.x.x
```

### 3. Testar Conexão GitHub

1. No painel, vá para **Dashboard**
2. Clique em **"Conectar GitHub"**
3. Deve redirecionar para o GitHub
4. Autorize o aplicativo
5. Deve voltar para o painel com sucesso

---

## 📊 Resumo das Mudanças

### Arquivos Modificados:
- ✅ `backend/Dockerfile` - Adicionado git e bash
- ✅ `backend/Dockerfile.prod` - Adicionado git e bash

### Configurações Necessárias:
- ✅ GitHub OAuth no painel (MongoDB)
- ✅ OAuth App no GitHub
- ✅ Rebuild do backend

---

## 🐛 Solução de Problemas

### Ainda mostra "❌ Não configurado"

**Causa:** Configurações não foram salvas no MongoDB

**Solução:**
1. Verifique se salvou no painel
2. Verifique se o MongoDB está rodando: `docker-compose ps mongo`
3. Reinicie o backend: `docker-compose restart backend`

### Erro "git: not found" persiste

**Causa:** Rebuild não foi feito ou falhou

**Solução:**
```bash
# Rebuild forçado
docker-compose down
docker rmi ark-deploy-backend
docker-compose build --no-cache backend
docker-compose up -d
```

### Erro "redirect_uri_mismatch"

**Causa:** URLs não correspondem

**Solução:**
1. No GitHub: `http://painel.38.242.213.195.sslip.io/auth/github/callback`
2. No Painel: `http://painel.38.242.213.195.sslip.io/auth/github/callback`
3. Devem ser EXATAMENTE iguais

---

## ⚡ Comandos Rápidos

```bash
# Ver logs em tempo real
docker-compose logs -f backend

# Ver apenas configuração GitHub
docker-compose logs backend | grep "GitHub OAuth Config" -A 3

# Verificar git no container
docker exec ark-deploy-backend git --version

# Rebuild rápido
docker-compose down && docker-compose build --no-cache backend && docker-compose up -d

# Ver status dos containers
docker-compose ps
```

---

## ✅ Checklist Final

- [ ] Configurações salvas no painel (Admin → Configurações)
- [ ] OAuth App atualizado no GitHub
- [ ] Rebuild do backend concluído
- [ ] Logs mostram "✅ Configurado"
- [ ] Git instalado no container (`git --version` funciona)
- [ ] Teste de conexão GitHub funcionando

---

**Última atualização:** 13/02/2026
