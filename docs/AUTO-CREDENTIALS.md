# 🔐 Autenticação Automática com Git

O Deploy Manager detecta e usa automaticamente as credenciais Git já configuradas no seu sistema, sem precisar inserir manualmente!

## 🎯 Métodos Suportados

### 1. **SSH Keys** (Recomendado) ⭐

O sistema detecta automaticamente suas chaves SSH em `~/.ssh/`

**Configuração:**

```bash
# 1. Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu-email@example.com"

# 2. Adicionar ao ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 3. Copiar chave pública
cat ~/.ssh/id_ed25519.pub
```

**Adicionar no GitHub:**
1. GitHub → Settings → SSH and GPG keys → New SSH key
2. Cole a chave pública
3. Use URL SSH: `git@github.com:usuario/repo.git`

✅ **Vantagens:**
- Mais seguro
- Não expira
- Funciona automaticamente

---

### 2. **Personal Access Token**

O sistema busca tokens em variáveis de ambiente.

**Configuração:**

#### GitHub:
```bash
# Windows (PowerShell)
$env:GITHUB_TOKEN = "ghp_seu_token_aqui"
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ghp_seu_token_aqui", "User")

# Linux/Mac
export GITHUB_TOKEN="ghp_seu_token_aqui"
echo 'export GITHUB_TOKEN="ghp_seu_token_aqui"' >> ~/.bashrc
```

#### GitLab:
```bash
# Windows
$env:GITLAB_TOKEN = "glpat_seu_token_aqui"

# Linux/Mac
export GITLAB_TOKEN="glpat_seu_token_aqui"
```

#### Bitbucket:
```bash
# Windows
$env:BITBUCKET_TOKEN = "seu_token_aqui"

# Linux/Mac
export BITBUCKET_TOKEN="seu_token_aqui"
```

**Gerar Token:**
- **GitHub**: Settings → Developer settings → Personal access tokens → Generate new token
  - Permissões: `repo` (acesso completo)
- **GitLab**: Settings → Access Tokens → Add new token
  - Scopes: `read_repository`, `write_repository`
- **Bitbucket**: Settings → App passwords → Create app password

---

### 3. **Git Credential Manager**

O sistema usa automaticamente as credenciais salvas pelo Git.

**Verificar se está instalado:**
```bash
git credential-manager --version
```

**Instalar (se necessário):**

#### Windows:
```powershell
# Já vem com Git for Windows
winget install Git.Git
```

#### Linux:
```bash
# Ubuntu/Debian
sudo apt install git-credential-manager

# Fedora
sudo dnf install git-credential-manager
```

#### Mac:
```bash
brew install git-credential-manager
```

**Configurar:**
```bash
git config --global credential.helper manager
```

Após configurar, o Git pedirá suas credenciais uma vez e salvará automaticamente.

---

### 4. **Arquivo .git-credentials**

O sistema lê credenciais de `~/.git-credentials`

**Configuração:**
```bash
# Habilitar credential store
git config --global credential.helper store

# Fazer um clone (pedirá credenciais uma vez)
git clone https://github.com/usuario/repo.git

# Credenciais serão salvas em ~/.git-credentials
```

⚠️ **Atenção**: Este método armazena senhas em texto plano. Use tokens em vez de senhas!

---

## 🚀 Como Usar no Deploy Manager

### Opção 1: Detecção Automática (Recomendado)

1. **Não preencha** os campos de autenticação ao criar projeto
2. O sistema detectará automaticamente suas credenciais
3. Se detectar, mostrará: ✅ "Credenciais SSH detectadas"

### Opção 2: Testar Credenciais Antes

Use o endpoint para verificar:

```bash
curl -X POST http://localhost:8001/api/projects/detect-credentials \
  -H "Content-Type: application/json" \
  -d '{"gitUrl": "https://github.com/usuario/repo.git"}'
```

Resposta:
```json
{
  "detected": true,
  "type": "ssh",
  "hasSSHKey": true,
  "isValid": true,
  "message": "Credenciais ssh detectadas e válidas"
}
```

---

## 🔍 Ordem de Detecção

O sistema tenta na seguinte ordem:

1. **SSH Key** (se URL for `git@...`)
2. **Token em variável de ambiente** (`GITHUB_TOKEN`, `GITLAB_TOKEN`, etc.)
3. **Git Credential Manager**
4. **Arquivo ~/.git-credentials**
5. **Nenhuma** (repositório público)

---

## 🛠️ Troubleshooting

### SSH não funciona

```bash
# Testar conexão SSH
ssh -T git@github.com

# Verificar chaves
ls -la ~/.ssh/

# Adicionar chave ao agent
ssh-add ~/.ssh/id_ed25519
```

### Token não é detectado

```bash
# Verificar variável de ambiente
echo $GITHUB_TOKEN  # Linux/Mac
$env:GITHUB_TOKEN   # Windows

# Reiniciar terminal após configurar
```

### Git Credential Manager não funciona

```bash
# Verificar configuração
git config --global credential.helper

# Reconfigurar
git config --global credential.helper manager

# Limpar credenciais antigas
git credential-manager erase
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Usar SSH (Recomendado)

```bash
# 1. Configurar SSH no GitHub
ssh-keygen -t ed25519
cat ~/.ssh/id_ed25519.pub  # Adicionar no GitHub

# 2. No Deploy Manager, usar URL SSH
git@github.com:usuario/repo.git

# ✅ Credenciais detectadas automaticamente!
```

### Exemplo 2: Usar Token

```bash
# 1. Gerar token no GitHub
# Settings → Developer settings → Personal access tokens

# 2. Configurar variável de ambiente
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# 3. No Deploy Manager, usar URL HTTPS
https://github.com/usuario/repo.git

# ✅ Token detectado automaticamente!
```

### Exemplo 3: Repositório Público

```bash
# Não precisa de credenciais
https://github.com/usuario/repo-publico.git

# ✅ Clone direto sem autenticação
```

---

## 🔒 Segurança

### Boas Práticas:

✅ **Use SSH keys** sempre que possível
✅ **Use tokens** em vez de senhas
✅ **Configure tokens com permissões mínimas**
✅ **Não commite tokens** no código
✅ **Use variáveis de ambiente** para tokens
✅ **Revogue tokens** não utilizados

❌ **Evite:**
- Senhas em texto plano
- Tokens no código-fonte
- Compartilhar chaves SSH
- Tokens com permissões excessivas

---

## 📚 Links Úteis

- [GitHub SSH Keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)
- [GitLab Access Tokens](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
