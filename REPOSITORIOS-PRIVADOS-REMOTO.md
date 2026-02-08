# Repositórios Privados em Deploy Remoto

## 🔐 Como Funciona

Quando você faz deploy de um repositório privado em um servidor remoto, o sistema precisa autenticar no GitHub para clonar o código.

## ✅ Solução Implementada

### 1. Conectar via GitHub ao Criar Projeto

Quando você cria um projeto:
1. Clique em "Conectar com GitHub"
2. Autorize o acesso
3. Selecione o repositório privado
4. O **token de acesso** é salvo automaticamente no projeto

### 2. Token é Usado no Deploy Remoto

O sistema automaticamente:
- Detecta se há um token salvo (`gitAuth.token`)
- Adiciona o token na URL do Git: `https://TOKEN@github.com/user/repo.git`
- Usa `GIT_TERMINAL_PROMPT=0` para evitar prompt interativo
- Clona o repositório no servidor remoto com autenticação

## 📋 Fluxo Completo

```
1. Usuário conecta GitHub → Token salvo
2. Usuário cria projeto → gitAuth: { type: 'token', token: 'ghp_xxx' }
3. Usuário faz deploy remoto → Sistema usa token
4. SSH executa: git clone https://TOKEN@github.com/user/repo.git
5. Repositório privado clonado com sucesso! ✅
```

## 🔍 Verificar se Token Está Salvo

Ao fazer deploy, você verá nos logs:

**Com token:**
```
🔐 Usando token de autenticação GitHub...
📡 Clonando/atualizando repositório no servidor remoto...
```

**Sem token:**
```
⚠️ Nenhum token encontrado - repositório deve ser público
📡 Clonando/atualizando repositório no servidor remoto...
```

## ⚠️ Problemas Comuns

### Erro: "could not read Username for 'https://github.com'"

**Causa**: Token não foi salvo ou projeto foi criado manualmente sem conectar GitHub.

**Solução**:
1. Delete o projeto atual
2. Crie novamente usando "Conectar com GitHub"
3. Autorize o acesso
4. Selecione o repositório
5. Configure e crie o projeto
6. Agora o token estará salvo!

### Verificar Token no Banco de Dados

Se você tem acesso ao MongoDB, pode verificar:

```javascript
db.projects.findOne({ name: "sistema-de-teste" }, { gitAuth: 1 })
```

Deve retornar:
```json
{
  "gitAuth": {
    "type": "token",
    "token": "ghp_xxxxxxxxxxxxxxxxxx"
  }
}
```

## 🔄 Alternativa: Usar SSH

Se preferir, você pode usar chaves SSH:

1. Gere uma chave SSH no servidor remoto:
```bash
ssh-keygen -t ed25519 -C "deploy@server"
```

2. Adicione a chave pública no GitHub:
   - Settings → SSH and GPG keys → New SSH key

3. Use URL SSH ao criar projeto:
```
git@github.com:usuario/repo.git
```

## 📝 Notas Técnicas

### Token na URL
O formato `https://TOKEN@github.com/user/repo.git` é seguro porque:
- Só é usado no servidor remoto
- Não aparece nos logs (mascarado)
- É transmitido via SSH criptografado
- GitHub aceita tokens como senha

### GIT_TERMINAL_PROMPT=0
Esta variável de ambiente:
- Desabilita prompts interativos do Git
- Faz o comando falhar imediatamente se precisar de credenciais
- Evita que o processo fique travado esperando input

## 🚀 Próximos Passos

1. **Reinicie o backend** para aplicar as mudanças
2. **Delete o projeto** que deu erro
3. **Crie novamente** usando "Conectar com GitHub"
4. **Verifique nos logs** se aparece "🔐 Usando token de autenticação GitHub..."
5. **Deploy deve funcionar!** ✅

## 🔐 Segurança

- Tokens são armazenados criptografados no MongoDB
- Nunca são expostos nos logs públicos
- Só são usados durante o clone/pull
- Podem ser revogados no GitHub a qualquer momento

