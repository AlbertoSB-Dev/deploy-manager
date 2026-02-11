# 🚀 Como Configurar Variáveis de Ambiente

## 📁 Arquivos Criados

- `.env.backend.producao` - Variáveis do backend (já com chaves geradas)
- `.env.frontend.producao` - Variáveis do frontend

## 🔧 Passo a Passo

### 1️⃣ Configurar Backend

1. Abra o arquivo `.env.backend.producao`
2. **Ajuste apenas estas variáveis:**
   ```env
   MONGODB_URI=mongodb://SEU_IP_MONGODB:27017/ark-deploy-prod
   GITHUB_CLIENT_ID=SEU_CLIENT_ID_AQUI
   GITHUB_CLIENT_SECRET=SEU_CLIENT_SECRET_AQUI
   FRONTEND_URL=http://SEU_DOMINIO_FRONTEND
   GITHUB_CALLBACK_URL=http://SEU_DOMINIO_FRONTEND/auth/github/callback
   ```

3. **No painel do Ark Deploy:**
   - Vá em "Projetos" → Encontre o projeto do backend
   - Clique em "Editar" (ícone de lápis)
   - Na seção "Variáveis de Ambiente", cole TODO o conteúdo do arquivo
   - Clique em "Salvar"
   - Clique em "Deploy"

### 2️⃣ Configurar Frontend

1. Abra o arquivo `.env.frontend.producao`
2. **Ajuste estas variáveis:**
   ```env
   NEXT_PUBLIC_API_URL=http://SEU_DOMINIO_BACKEND/api
   NEXT_PUBLIC_FRONTEND_URL=http://SEU_DOMINIO_FRONTEND
   ```

3. **No painel do Ark Deploy:**
   - Vá em "Projetos" → Encontre o projeto do frontend
   - Clique em "Editar"
   - Cole as variáveis
   - Salvar e Deploy

## 🔍 Como Descobrir o IP do MongoDB

Se você tem MongoDB em container Docker:

```bash
# Listar containers
docker ps | grep mongo

# Ver IP do container
docker inspect <container-id> | grep IPAddress
```

Exemplo de saída:
```
"IPAddress": "172.18.0.3"
```

Use este IP no `MONGODB_URI`:
```env
MONGODB_URI=mongodb://172.18.0.3:27017/ark-deploy-prod
```

## 🔗 Como Obter Credenciais do GitHub

1. Acesse: https://github.com/settings/developers
2. Clique em "New OAuth App"
3. Preencha:
   - **Application name:** Ark Deploy - Produção
   - **Homepage URL:** http://painelark.38.242.213.195.sslip.io
   - **Authorization callback URL:** http://painelark.38.242.213.195.sslip.io/auth/github/callback
4. Clique em "Register application"
5. Copie o **Client ID**
6. Clique em "Generate a new client secret"
7. Copie o **Client Secret**
8. Cole no arquivo `.env.backend.producao`

## ✅ Checklist

- [ ] Ajustei MONGODB_URI com IP correto
- [ ] Obtive credenciais do GitHub OAuth
- [ ] Configurei FRONTEND_URL e GITHUB_CALLBACK_URL
- [ ] Colei variáveis do backend no painel
- [ ] Fiz deploy do backend
- [ ] Ajustei NEXT_PUBLIC_API_URL no frontend
- [ ] Colei variáveis do frontend no painel
- [ ] Fiz deploy do frontend
- [ ] Testei acesso ao painel

## 🎯 Domínios Padrão (usando sslip.io)

Se você não tem domínio próprio, use estes:

**Backend:**
```
http://apiark.38.242.213.195.sslip.io
```

**Frontend:**
```
http://painelark.38.242.213.195.sslip.io
```

Substitua `38.242.213.195` pelo IP da sua VPS.

## 🔐 Segurança

As chaves JWT_SECRET e ENCRYPTION_KEY já foram geradas de forma segura:
- ✅ JWT_SECRET: 128 caracteres aleatórios
- ✅ ENCRYPTION_KEY: 32 caracteres aleatórios

**⚠️ IMPORTANTE:** Nunca mude o ENCRYPTION_KEY depois de configurado!

## 🆘 Problemas?

### Backend não inicia
- Verifique logs: Clique em "Ver Logs" no projeto
- Verifique se MongoDB está acessível
- Teste conexão: `docker exec -it <container-backend> ping <ip-mongodb>`

### Frontend não conecta no backend
- Verifique se NEXT_PUBLIC_API_URL está correto
- Teste: Abra `http://seu-dominio-backend/api/health` no navegador
- Deve retornar: `{"status":"ok"}`

### GitHub OAuth não funciona
- Verifique se callback URL está EXATAMENTE igual no GitHub
- URL deve ser acessível publicamente
- Teste acessando a URL do frontend no navegador
