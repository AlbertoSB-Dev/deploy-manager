# Configuração de Variáveis de Ambiente para Produção

## 📋 Variáveis do Backend

Configure estas variáveis no painel do Ark Deploy ao criar/editar o projeto backend:

### 🔧 Servidor
```env
PORT=8000
NODE_ENV=production
```

### 🗄️ Banco de Dados
```env
MONGODB_URI=mongodb://seu-ip-mongodb:27017/ark-deploy-prod
```
**Importante**: 
- Se MongoDB estiver em container: use o IP do container ou nome do serviço
- Se MongoDB estiver no host: use o IP da VPS
- Exemplo: `mongodb://172.18.0.3:27017/ark-deploy-prod`

### 🔐 Segurança (CRÍTICO!)
```env
JWT_SECRET=gere-uma-chave-secreta-forte-aqui-min-32-caracteres
ENCRYPTION_KEY=exatamente-32-caracteres-aqui!
```

**Como gerar chaves seguras:**
```bash
# JWT_SECRET (qualquer tamanho, recomendado 64+ caracteres)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY (EXATAMENTE 32 caracteres)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

⚠️ **NUNCA mude o ENCRYPTION_KEY depois de configurado!** Isso quebrará todas as credenciais criptografadas.

### 📁 Diretórios
```env
PROJECTS_DIR=/opt/projects
```

### 🌐 Domínio e IP
```env
BASE_DOMAIN=sslip.io
SERVER_IP=38.242.213.195
```
**Substitua** `38.242.213.195` pelo IP real da sua VPS.

### 🔗 GitHub OAuth
```env
GITHUB_CLIENT_ID=seu_client_id_do_github
GITHUB_CLIENT_SECRET=seu_client_secret_do_github
```

**Como obter:**
1. Acesse: https://github.com/settings/developers
2. Clique em "New OAuth App"
3. Preencha:
   - Application name: `Ark Deploy - Produção`
   - Homepage URL: `http://seu-dominio-frontend.com`
   - Authorization callback URL: `http://seu-dominio-frontend.com/auth/github/callback`
4. Copie o Client ID e Client Secret

### 🎨 URLs do Frontend
```env
FRONTEND_URL=http://seu-dominio-frontend.com
GITHUB_CALLBACK_URL=http://seu-dominio-frontend.com/auth/github/callback
```

**Substitua** `seu-dominio-frontend.com` pelo domínio real do frontend.

---

## 📋 Variáveis do Frontend

Configure estas variáveis no painel do Ark Deploy ao criar/editar o projeto frontend:

### 🔗 API Backend
```env
NEXT_PUBLIC_API_URL=http://seu-dominio-backend.com/api
```

**Substitua** `seu-dominio-backend.com` pelo domínio real do backend.

### 🌐 URLs Públicas
```env
NEXT_PUBLIC_FRONTEND_URL=http://seu-dominio-frontend.com
```

---

## 📝 Exemplo Completo - Backend

Copie e cole no painel, substituindo os valores:

```env
PORT=8000
NODE_ENV=production
MONGODB_URI=mongodb://172.18.0.3:27017/ark-deploy-prod
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
ENCRYPTION_KEY=12345678901234567890123456789012
PROJECTS_DIR=/opt/projects
BASE_DOMAIN=sslip.io
SERVER_IP=38.242.213.195
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
FRONTEND_URL=http://painel.38.242.213.195.sslip.io
GITHUB_CALLBACK_URL=http://painel.38.242.213.195.sslip.io/auth/github/callback
```

---

## 📝 Exemplo Completo - Frontend

```env
NEXT_PUBLIC_API_URL=http://api.38.242.213.195.sslip.io/api
NEXT_PUBLIC_FRONTEND_URL=http://painel.38.242.213.195.sslip.io
```

---

## 🚀 Passo a Passo no Painel

### Backend:
1. Acesse o painel do Ark Deploy
2. Vá em "Projetos" → Encontre o projeto do backend
3. Clique em "Editar" (ícone de lápis)
4. Na seção "Variáveis de Ambiente", adicione todas as variáveis acima
5. Clique em "Salvar"
6. Clique em "Deploy" para aplicar as mudanças

### Frontend:
1. Vá em "Projetos" → Encontre o projeto do frontend
2. Clique em "Editar"
3. Adicione as variáveis do frontend
4. Salvar e fazer Deploy

---

## ✅ Checklist de Configuração

- [ ] Gerei chaves seguras para JWT_SECRET e ENCRYPTION_KEY
- [ ] Configurei o MONGODB_URI com o IP correto
- [ ] Configurei o SERVER_IP com o IP da VPS
- [ ] Criei OAuth App no GitHub e copiei as credenciais
- [ ] Configurei FRONTEND_URL e GITHUB_CALLBACK_URL com domínio correto
- [ ] Configurei NEXT_PUBLIC_API_URL no frontend
- [ ] Fiz deploy do backend com as novas variáveis
- [ ] Fiz deploy do frontend com as novas variáveis
- [ ] Testei login no painel
- [ ] Testei conexão com GitHub

---

## 🔍 Verificação

Após configurar e fazer deploy, verifique:

1. **Backend rodando**: Acesse `http://seu-dominio-backend.com/api/health`
2. **Frontend carregando**: Acesse `http://seu-dominio-frontend.com`
3. **Logs do backend**: Use o botão "Ver Logs" no painel
4. **Conexão MongoDB**: Logs devem mostrar "Connected to MongoDB"

---

## ⚠️ Problemas Comuns

### Backend não conecta no MongoDB
- Verifique se o IP do MongoDB está correto
- Teste conexão: `docker exec -it <container-mongo> mongosh`
- Verifique se MongoDB está na mesma rede Docker

### Frontend não conecta no Backend
- Verifique se NEXT_PUBLIC_API_URL está correto
- Teste: `curl http://seu-dominio-backend.com/api/health`
- Verifique CORS no backend

### GitHub OAuth não funciona
- Verifique se GITHUB_CALLBACK_URL está exatamente igual no GitHub
- Verifique se Client ID e Secret estão corretos
- Callback URL deve ser acessível publicamente
