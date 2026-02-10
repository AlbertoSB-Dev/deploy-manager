# 🛡️ Validador de Comandos SSH

## Modo de Operação: BLACKLIST (Permissivo)

O validador de comandos opera em **modo permissivo**, bloqueando apenas comandos **extremamente destrutivos** que podem comprometer o servidor inteiro.

---

## ✅ Comandos Permitidos

**QUASE TODOS!** O sistema permite a maioria dos comandos Linux normais, incluindo:

### Comandos de Sistema
- `ls`, `cd`, `pwd`, `cat`, `echo`, `grep`, `find`, `tail`, `head`
- `ps`, `top`, `htop`, `kill`, `killall` (processos específicos)
- `df`, `du`, `free`, `uptime`, `whoami`, `hostname`

### Gerenciamento de Arquivos
- `rm arquivo.txt` ✅ (arquivos específicos)
- `rm -rf pasta/` ✅ (pastas específicas)
- `mv`, `cp`, `mkdir`, `touch`, `chmod`, `chown`

### Desenvolvimento
- `git` (todos os comandos)
- `npm`, `yarn`, `pnpm` (todos os comandos)
- `node`, `python`, `php`, `ruby`
- `docker` (todos os comandos)
- `make`, `cmake`, `gcc`, `g++`

### Rede
- `curl`, `wget`, `ping`, `traceroute`, `netstat`, `ss`
- `ssh`, `scp`, `rsync`

### Editores
- `vim`, `nano`, `vi`, `emacs`

### Banco de Dados
- `mysql`, `psql`, `mongo`, `redis-cli`

---

## ❌ Comandos Bloqueados

Apenas comandos **EXTREMAMENTE DESTRUTIVOS** são bloqueados:

### 1. Deletar Sistema Inteiro
```bash
rm -rf /          # ❌ BLOQUEADO
rm -rf /*         # ❌ BLOQUEADO
rm -rf /.         # ❌ BLOQUEADO
```

### 2. Sobrescrever Disco
```bash
dd if=/dev/zero of=/dev/sda    # ❌ BLOQUEADO
dd if=/dev/zero of=/dev/vda    # ❌ BLOQUEADO
```

### 3. Formatar Disco
```bash
mkfs.ext4 /dev/sda1    # ❌ BLOQUEADO
mkfs.xfs /dev/vda1     # ❌ BLOQUEADO
fdisk /dev/sda         # ❌ BLOQUEADO
parted /dev/sda        # ❌ BLOQUEADO
```

### 4. Fork Bomb
```bash
:(){ :|:& };:    # ❌ BLOQUEADO
```

### 5. Desligar/Reiniciar Servidor
```bash
shutdown now     # ❌ BLOQUEADO
reboot           # ❌ BLOQUEADO
halt             # ❌ BLOQUEADO
poweroff         # ❌ BLOQUEADO
init 0           # ❌ BLOQUEADO
init 6           # ❌ BLOQUEADO
```

---

## 🎯 Filosofia de Segurança

### Por que Modo Permissivo?

1. **Confiança no Usuário**: Usuários que conectam seus próprios servidores são administradores responsáveis
2. **Flexibilidade**: Permite uso completo do terminal SSH sem frustrações
3. **Proteção Focada**: Bloqueia apenas ações que podem destruir o servidor inteiro
4. **Experiência Real**: Terminal funciona como SSH normal

### O que é Protegido?

- ✅ **Sistema de arquivos raiz** - Não pode deletar `/`
- ✅ **Discos físicos** - Não pode formatar ou sobrescrever
- ✅ **Disponibilidade** - Não pode desligar o servidor
- ✅ **Recursos** - Não pode criar fork bombs

### O que NÃO é Protegido?

- ⚠️ **Arquivos específicos** - Usuário pode deletar seus próprios arquivos
- ⚠️ **Processos** - Usuário pode matar processos específicos
- ⚠️ **Configurações** - Usuário pode modificar configs
- ⚠️ **Serviços** - Usuário pode parar/reiniciar serviços específicos

**Isso é intencional!** O usuário é dono do servidor e deve ter controle total.

---

## 🔒 Camadas de Segurança

### 1. Validação de Comandos (Esta)
- Bloqueia comandos extremamente destrutivos
- Proteção contra acidentes graves

### 2. Autenticação Multi-tenancy
- Cada usuário só acessa seus próprios servidores
- Isolamento total entre usuários

### 3. Criptografia de Credenciais
- Senhas SSH criptografadas no banco
- Chaves privadas protegidas

### 4. Rate Limiting
- Proteção contra brute force
- Limite de requisições por IP

### 5. Logs de Auditoria
- Todos os comandos são logados
- Rastreabilidade completa

---

## 📊 Exemplos de Uso

### ✅ Casos Permitidos

```bash
# Limpar logs antigos
rm -rf /var/log/old-logs/

# Atualizar permissões
chmod -R 755 /var/www/html/

# Reiniciar serviço específico
systemctl restart nginx

# Matar processo travado
kill -9 12345

# Deploy de aplicação
git pull && npm install && pm2 restart app

# Backup de banco
mysqldump -u root -p database > backup.sql

# Limpar containers Docker
docker system prune -af
```

### ❌ Casos Bloqueados

```bash
# Deletar sistema
rm -rf /

# Formatar disco
mkfs.ext4 /dev/sda1

# Desligar servidor
shutdown now

# Fork bomb
:(){ :|:& };:

# Sobrescrever disco
dd if=/dev/zero of=/dev/sda
```

---

## 🛠️ Configuração

### Desabilitar Validação (Não Recomendado)

Se você realmente precisa desabilitar a validação:

**Arquivo**: `backend/src/routes/servers.ts` e `backend/src/routes/projects.ts`

```typescript
// Comentar estas linhas:
// const validation = validateCommand(command);
// if (!validation.valid) {
//   return res.status(403).json({ error: validation.error });
// }

// Usar comando direto:
const output = await sshService.executeCommand(command);
```

⚠️ **ATENÇÃO**: Isso remove toda proteção contra comandos destrutivos!

### Adicionar Comandos à Blacklist

**Arquivo**: `backend/src/utils/commandValidator.ts`

```typescript
const DANGEROUS_COMMANDS = [
  'rm -rf /',
  'dd if=/dev/zero',
  // Adicionar aqui:
  'seu-comando-perigoso',
];
```

---

## 🧪 Testar Validação

```bash
# Testar comando permitido
curl -X POST http://localhost:8001/api/servers/123/exec \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"ls -la"}'
# Deve funcionar ✅

# Testar comando bloqueado
curl -X POST http://localhost:8001/api/servers/123/exec \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"rm -rf /"}'
# Deve retornar erro 403 ❌
```

---

## 📝 Logs

Comandos bloqueados são logados:

```
⚠️ Comando bloqueado no servidor 123: rm -rf /
⚠️ Comando bloqueado no container abc: dd if=/dev/zero
```

---

## 🤔 FAQ

### Por que não bloquear `rm` completamente?

Usuários precisam deletar arquivos normalmente. Bloquear `rm` tornaria o terminal inútil.

### Por que não bloquear `chmod`/`chown`?

Usuários precisam gerenciar permissões de seus arquivos e aplicações.

### Por que não bloquear `kill`?

Usuários precisam matar processos travados de suas aplicações.

### E se eu precisar formatar um disco?

Acesse o servidor diretamente via SSH (fora do painel). O painel é para gerenciamento de aplicações, não administração de hardware.

### Posso desabilitar a validação?

Sim, mas não é recomendado. Veja seção "Configuração" acima.

---

## 🎯 Conclusão

O validador opera em **modo permissivo** para dar liberdade ao usuário, bloqueando apenas ações que podem **destruir o servidor inteiro**. Isso equilibra segurança com usabilidade.

**Princípio**: Proteger contra acidentes graves, não contra o próprio usuário.

---

**Última atualização**: 2026-02-09
