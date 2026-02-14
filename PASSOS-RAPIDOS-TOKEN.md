# ⚡ Passos Rápidos - Configurar Token GitHub

## 🎯 O que você precisa fazer AGORA:

### 1️⃣ Criar Token no GitHub (2 minutos)

1. Acesse: https://github.com/settings/tokens
2. Clique em **Generate new token** → **Generate new token (classic)**
3. Preencha:
   - **Note:** `Ark Deploy - Repositório Privado`
   - **Expiration:** No expiration
   - **Scopes:** Marque apenas ✅ **repo**
4. Clique em **Generate token**
5. **COPIE O TOKEN** (você não verá novamente!)
   - Formato: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 2️⃣ Configurar no Painel (1 minuto)

1. Acesse: http://painel.38.242.213.195.sslip.io
   - Login: `superadmin@arkdeploy.com`
   - Senha: `Admin123`

2. Menu **Admin** → **Configurações**

3. Role até **Repositório do Painel** e preencha:
   ```
   Repositório: AlbertoSB-Dev/deploy-manager
   Branch: main
   Token: [COLE O TOKEN AQUI]
   ```

4. Clique em **Salvar Configurações**

---

### 3️⃣ Rebuild do Painel (5 minutos)

Para que o sistema detecte a versão local corretamente, faça rebuild:

```bash
# Na VPS
cd /opt/ark-deploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

### 4️⃣ Verificar (1 minuto)

1. Aguarde 5 minutos (verificação automática)
2. Ou acesse **Admin** → **Deploy do Painel**
3. Deve mostrar:
   - ✅ Versão atual: `69eabc9` (ou similar)
   - ✅ Status de atualização correto

---

## 🎉 Pronto!

Agora o sistema vai:
- ✅ Detectar a versão local do painel
- ✅ Consultar GitHub API com autenticação
- ✅ Mostrar quando há atualizações disponíveis
- ✅ Permitir deploy automático de novas versões

---

## 📖 Documentação Completa

Para mais detalhes, veja: `CONFIGURAR-GITHUB-TOKEN.md`
