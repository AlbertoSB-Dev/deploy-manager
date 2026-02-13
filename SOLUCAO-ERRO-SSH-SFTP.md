# 🔧 Solução: Erro SSH "bad decrypt" no SFTP

## 🔴 Problema

Erro ao tentar listar diretório SFTP:
```
error:1C800064:Provider routines::bad decrypt
Falha na conexão SSH: error:1C800064:Provider routines::bad decrypt
```

## 🔍 Causa

A chave SSH privada armazenada no banco de dados está **criptografada com senha (passphrase)**. O sistema não consegue descriptografar automaticamente porque não tem a senha.

## ✅ Soluções

### Solução 1: Usar Autenticação por Senha (Mais Simples)

1. Acesse o painel de servidores
2. Edite o servidor "VPS Minha"
3. Mude o tipo de autenticação para **"Senha"**
4. Digite a senha do usuário root da VPS
5. Salve

### Solução 2: Remover Senha da Chave SSH Existente

Na VPS, execute:

```bash
# Remover senha da chave privada
ssh-keygen -p -f ~/.ssh/id_rsa

# Quando pedir:
# Enter old passphrase: [digite a senha atual]
# Enter new passphrase (empty for no passphrase): [deixe em branco]
# Enter same passphrase again: [deixe em branco]
```

Depois, atualize a chave no painel:

```bash
# Copiar chave sem senha
cat ~/.ssh/id_rsa
```

Cole no campo "Chave Privada SSH" do servidor no painel.

### Solução 3: Gerar Nova Chave SSH Sem Senha

```bash
# Gerar nova chave sem senha
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_nopass -N ""

# Adicionar ao authorized_keys
cat ~/.ssh/id_rsa_nopass.pub >> ~/.ssh/authorized_keys

# Copiar chave privada
cat ~/.ssh/id_rsa_nopass
```

Cole no campo "Chave Privada SSH" do servidor no painel.

### Solução 4: Atualizar Diretamente no Banco (Avançado)

Se você tem acesso ao MongoDB:

```bash
docker-compose exec mongodb mongosh deploy-manager
```

```javascript
// Atualizar servidor para usar senha
db.servers.updateOne(
  { name: "VPS Minha" },
  { 
    $set: { 
      authType: "password",
      password: "SUA_SENHA_AQUI"
    },
    $unset: {
      privateKey: ""
    }
  }
)
```

## 🎯 Recomendação

Para ambientes de produção automatizados, **use autenticação por senha** ou **chaves SSH sem passphrase**.

Chaves com passphrase são mais seguras para uso manual, mas não funcionam bem em sistemas automatizados que precisam conectar sem intervenção humana.

## 🔒 Segurança

Se usar senha:
- Use senhas fortes e únicas
- As senhas são criptografadas no banco de dados
- Limite acesso SSH por IP quando possível

Se usar chave sem senha:
- Mantenha a chave privada segura
- Use permissões corretas (chmod 600)
- Considere usar chaves específicas por aplicação

## 🧪 Testar Conexão

Após fazer as mudanças:

1. Vá para o painel de servidores
2. Clique em "Gerenciar Arquivos" no servidor
3. Tente listar o diretório raiz (/)
4. Se funcionar, o problema está resolvido! ✅

## 📝 Logs para Debug

Se ainda tiver problemas, verifique os logs:

```bash
# Logs do backend
docker-compose logs backend | grep -i "sftp\|ssh"

# Testar conexão SSH manualmente
ssh -v root@38.242.213.195
```

## ⚠️ Nota Importante

O sistema atual usa **SSH via comando** como fallback quando SFTP não está disponível. Isso significa que mesmo sem SFTP configurado, você pode gerenciar arquivos usando comandos SSH padrão (ls, cat, etc).

Para habilitar SFTP completo no servidor:

```bash
# Verificar se SFTP está instalado
which sftp-server

# Se não estiver, instalar
apt-get update && apt-get install -y openssh-sftp-server

# Verificar configuração SSH
grep -i "Subsystem sftp" /etc/ssh/sshd_config

# Deve mostrar:
# Subsystem sftp /usr/lib/openssh/sftp-server

# Reiniciar SSH
systemctl restart sshd
```
