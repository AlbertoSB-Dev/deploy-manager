# 🚀 Solução Rápida - GitHub OAuth

## ⚡ Problema

O GitHub está redirecionando para `localhost:8000` mas você quer usar `localhost:3000`.

## ✅ Solução Imediata (Funciona nas Duas Portas)

### 1. Atualizar GitHub OAuth App

Acesse: https://github.com/settings/developers

**Adicione DUAS callback URLs:**

```
http://localhost:8000/auth/github/callback
http://localhost:3000/auth/github/callback
```

**Como adicionar múltiplas URLs:**
- No campo "Authorization callback URL", você pode adicionar uma por linha
- OU separar por vírgula

### 2. Reiniciar Backend

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
  CALLBACK_URL: http://localhost:8000/auth/github/callback
```

### 3. Testar

**Se estiver usando porta 8000:**
1. Acesse: http://localhost:8000/dashboard
2. Clique em "Conectar GitHub"
3. Autorize no GitHub
4. Deve funcionar!

**Se quiser mudar para porta 3000:**
1. Pare o frontend (Ctrl+C)
2. Edite `frontend/package.json` - já está configurado para porta 3000
3. Edite `backend/.env` - mude `GITHUB_CALLBACK_URL` para porta 3000
4. Reinicie backend e frontend
5. Acesse: http://localhost:3000/dashboard

## 🔄 Como Funciona

1. Você clica em "Conectar GitHub"
2. GitHub redireciona para: `http://localhost:PORTA/auth/github/callback?code=XXX`
3. Página de callback detecta a porta automaticamente
4. Redireciona para: `http://localhost:PORTA/dashboard?github=connecting&code=XXX`
5. `GitHubConnectButton` processa e salva o token

## 📝 Configuração Atual

**Backend (.env):**
```env
GITHUB_CALLBACK_URL=http://localhost:8000/auth/github/callback
```

**Frontend (package.json):**
```json
"dev": "next dev -p 3000"
```

**Página de callback:**
- Detecta automaticamente a porta
- Funciona em 8000 ou 3000

## ✅ Checklist

- [ ] GitHub OAuth App tem AMBAS as callback URLs (8000 e 3000)
- [ ] Backend foi reiniciado
- [ ] Consegue acessar o dashboard
- [ ] Botão "Conectar GitHub" aparece
- [ ] Ao clicar, redireciona para GitHub
- [ ] Após autorizar, volta para o dashboard
- [ ] Mostra "GitHub Conectado"

## 🎯 Recomendação

**Para produção, use apenas uma porta (3000):**

1. Edite `backend/.env`:
   ```env
   GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
   ```

2. Reinicie o frontend na porta 3000:
   ```bash
   cd deploy-manager/frontend
   npm run dev
   ```

3. No GitHub OAuth App, mantenha apenas:
   ```
   http://localhost:3000/auth/github/callback
   ```

---

**Última atualização:** 2026-02-08
