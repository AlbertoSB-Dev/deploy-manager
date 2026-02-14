# 🔐 Como Configurar o Token do GitHub para Repositório Privado

## 📋 Visão Geral

Para que o sistema detecte atualizações do painel através do repositório privado `AlbertoSB-Dev/deploy-manager`, você precisa criar um **Personal Access Token (PAT)** no GitHub e configurá-lo no painel.

---

## 🎯 Passo 1: Criar Personal Access Token no GitHub

### 1.1. Acesse as Configurações do GitHub

1. Faça login no GitHub: https://github.com
2. Clique na sua foto de perfil (canto superior direito)
3. Clique em **Settings** (Configurações)

### 1.2. Navegue até Developer Settings

1. No menu lateral esquerdo, role até o final
2. Clique em **Developer settings** (Configurações de desenvolvedor)

### 1.3. Crie um Token Clássico

1. No menu lateral, clique em **Personal access tokens**
2. Clique em **Tokens (classic)**
3. Clique no botão **Generate new token** → **Generate new token (classic)**

### 1.4. Configure o Token

Preencha os campos:

**Note (Nome do token):**
```
Ark Deploy - Acesso ao Repositório Privado
```

**Expiration (Expiração):**
- Recomendado: **No expiration** (Sem expiração)
- Ou escolha um período longo (90 dias, 1 ano)

**Select scopes (Permissões):**

Marque APENAS esta opção:
- ✅ **repo** (Full control of private repositories)
  - Isso inclui automaticamente:
    - repo:status
    - repo_deployment
    - public_repo
    - repo:invite
    - security_events

### 1.5. Gere e Copie o Token

1. Role até o final da página
2. Clique em **Generate token**
3. **⚠️ IMPORTANTE:** Copie o token IMEDIATAMENTE
   - Formato: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Você NÃO poderá ver este token novamente!
   - Se perder, terá que criar um novo

**Exemplo de token:**
```
ghp_1A2b3C4d5E6f7G8h9I0jK1lM2nO3pQ4rS5tU6v
```

---

## 🖥️ Passo 2: Configurar no Painel Ark Deploy

### 2.1. Acesse as Configurações do Sistema

1. Faça login no painel: http://painel.38.242.213.195.sslip.io
   - Email: `superadmin@arkdeploy.com`
   - Senha: `Admin123`

2. No menu lateral, clique em **Admin**
3. Clique em **Configurações**

### 2.2. Preencha a Seção "Repositório do Painel"

Role até a seção **Repositório do Painel** e preencha:

**Repositório (owner/repo):**
```
AlbertoSB-Dev/deploy-manager
```

**Branch:**
```
main
```

**Personal Access Token:**
```
ghp_1A2b3C4d5E6f7G8h9I0jK1lM2nO3pQ4rS5tU6v
```
(Cole o token que você copiou do GitHub)

### 2.3. Salve as Configurações

1. Clique no botão **Salvar Configurações**
2. Aguarde a mensagem de sucesso

---

## ✅ Passo 3: Verificar se Está Funcionando

### 3.1. Teste a Detecção de Atualizações

1. No painel Admin, clique em **Deploy do Painel**
2. Observe a seção **Versão Atual**
3. O sistema deve mostrar:
   - ✅ Versão atual detectada (ex: `69eabc9`)
   - ✅ Status de atualização correto

### 3.2. Verifique os Logs

Se ainda não funcionar, verifique os logs do backend:

```bash
# Na VPS
cd /opt/ark-deploy
docker-compose logs -f backend | grep -i "github\|atualiz"
```

Você deve ver algo como:
```
✅ GitHub API respondeu: 69eabc9
🔐 Usando token de autenticação (repositório privado)
✅ Sistema atualizado
```

---

## 🔒 Segurança do Token

### ⚠️ Boas Práticas

1. **NUNCA compartilhe seu token** em:
   - Commits do Git
   - Issues públicas
   - Mensagens de chat
   - Screenshots

2. **Armazene com segurança:**
   - O token fica criptografado no banco de dados MongoDB
   - Apenas super admins podem ver/editar

3. **Revogue tokens antigos:**
   - Se criar um novo token, revogue o antigo
   - GitHub → Settings → Developer settings → Personal access tokens
   - Clique em **Delete** no token antigo

4. **Monitore o uso:**
   - GitHub mostra quando o token foi usado pela última vez
   - Se ver atividade suspeita, revogue imediatamente

---

## 🐛 Solução de Problemas

### Problema: "403 Forbidden" nos logs

**Causa:** Token inválido ou sem permissões

**Solução:**
1. Verifique se o token tem a permissão `repo`
2. Verifique se o token não expirou
3. Crie um novo token e atualize no painel

### Problema: "404 Not Found" nos logs

**Causa:** Repositório ou branch incorreto

**Solução:**
1. Verifique se o repositório está correto: `AlbertoSB-Dev/deploy-manager`
2. Verifique se o branch está correto: `main`
3. Verifique se o token tem acesso ao repositório privado

### Problema: Ainda mostra "Versão: Unknown"

**Causa:** Sistema não consegue detectar versão local

**Solução:**
1. Faça rebuild do painel para adicionar gitCommit no package.json:
```bash
cd /opt/ark-deploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

2. Aguarde 5 minutos (verificação automática)
3. Ou force verificação manual no painel

---

## 📚 Referências

- [GitHub: Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub: Token permissions](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)

---

## 📞 Suporte

Se ainda tiver problemas:

1. Verifique os logs do backend
2. Verifique se o token está correto
3. Tente criar um novo token
4. Verifique se o repositório é privado e você tem acesso

---

**Última atualização:** 13/02/2026
