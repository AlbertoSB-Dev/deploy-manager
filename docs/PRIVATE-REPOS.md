# 🔐 Configuração de Repositórios Privados

O Deploy Manager suporta 3 métodos de autenticação para repositórios privados:

## 1. SSH Key (Recomendado) 🔑

### Vantagens:
- ✅ Mais seguro
- ✅ Não expira
- ✅ Suporta múltiplos repositórios
- ✅ Recomendado para produção

### Configuração:

#### Passo 1: Gerar SSH Key (se não tiver)

```bash
ssh-keygen -t ed25519 -C "deploy-manager@seu-servidor.com"
# Salve em: /home/user/.ssh/deploy_manager_key
```

#### Passo 2: Adicionar chave pública ao GitHub/GitLab

**GitHub:**
1. Copie a chave pública:
```bash
cat ~/.ssh/deploy_manager_key.pub
```
2. Vá em: Settings → SSH and GPG keys → New SSH key
3. Cole a chave pública

**GitLab:**
1. Copie a chave pública
2. Vá em: Settings → SSH Keys
3. Cole a chave pública

#### Passo 3: Configurar no Deploy Manager

Ao criar o projeto:
- **Tipo de Autenticação**: SSH Key
- **Caminho da SSH Key**: `/home/user/.ssh/deploy_manager_key`
- **URL do Git**: Use formato SSH: `git@github.com:usuario/repo.git`

---

## 2. Personal Access Token 🎫

### Vantagens:
- ✅ Fácil de configurar
- ✅ Pode ter permissões específicas
- ✅ Pode ser revogado facilmente

### Desvantagens:
- ⚠️ Pode expirar
- ⚠️ Precisa ser armazenado com segurança

### Configuração:

#### GitHub:

1. Vá em: Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clique em "Generate new token"
3. Selecione os escopos:
   - ✅ `repo` (acesso completo a repositórios privados)
4. Copie o token (começa com `ghp_`)

#### GitLab:

1. Vá em: Settings → Access Tokens
2. Crie um novo token
3. Selecione os escopos:
   - ✅ `read_repository`
   - ✅ `write_repository`
4. Copie o token

#### Configurar no Deploy Manager:

Ao criar o projeto:
- **Tipo de Autenticação**: Personal Access Token
- **Token**: Cole o token copiado
- **URL do Git**: Use formato HTTPS: `https://github.com/usuario/repo.git`

---

## 3. Username + Password 🔒

### ⚠️ Não Recomendado

Este método é menos seguro e não funciona se você tiver 2FA ativado.

### Configuração:

Ao criar o projeto:
- **Tipo de Autenticação**: Username + Password
- **Username**: Seu usuário do GitHub/GitLab
- **Password**: Sua senha (ou token se tiver 2FA)
- **URL do Git**: Use formato HTTPS: `https://github.com/usuario/repo.git`

---

## 📝 Exemplos Práticos

### Exemplo 1: GitHub com SSH

```
Nome: meu-projeto-privado
URL: git@github.com:AlbertoSB-Dev/Gestao-Nautica-Frontend.git
Autenticação: SSH Key
SSH Key Path: /home/deploy/.ssh/github_key
```

### Exemplo 2: GitHub com Token

```
Nome: meu-projeto-privado
URL: https://github.com/AlbertoSB-Dev/Gestao-Nautica-Frontend.git
Autenticação: Personal Access Token
Token: ghp_xxxxxxxxxxxxxxxxxxxx
```

### Exemplo 3: GitLab com SSH

```
Nome: meu-projeto-gitlab
URL: git@gitlab.com:usuario/projeto.git
Autenticação: SSH Key
SSH Key Path: /home/deploy/.ssh/gitlab_key
```

---

## 🔧 Troubleshooting

### Erro: "Permission denied (publickey)"

**Solução:**
1. Verifique se a chave SSH está correta
2. Teste a conexão:
```bash
ssh -T git@github.com -i /caminho/para/chave
```
3. Certifique-se de que a chave pública foi adicionada ao GitHub/GitLab

### Erro: "Authentication failed"

**Solução para Token:**
1. Verifique se o token não expirou
2. Verifique se o token tem as permissões corretas
3. Gere um novo token se necessário

**Solução para SSH:**
1. Verifique as permissões da chave:
```bash
chmod 600 ~/.ssh/sua_chave
```

### Erro: "Repository not found"

**Solução:**
1. Verifique se a URL está correta
2. Verifique se você tem acesso ao repositório
3. Para SSH, use: `git@github.com:usuario/repo.git`
4. Para HTTPS, use: `https://github.com/usuario/repo.git`

---

## 🛡️ Boas Práticas de Segurança

1. **Use SSH Keys sempre que possível**
2. **Nunca compartilhe suas chaves privadas**
3. **Use tokens com permissões mínimas necessárias**
4. **Defina data de expiração para tokens**
5. **Revogue tokens não utilizados**
6. **Use chaves SSH diferentes para diferentes servidores**
7. **Mantenha as chaves SSH com permissões 600**:
```bash
chmod 600 ~/.ssh/sua_chave
```

---

## 📚 Links Úteis

- [GitHub SSH Keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitLab SSH Keys](https://docs.gitlab.com/ee/user/ssh.html)
- [GitLab Access Tokens](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
