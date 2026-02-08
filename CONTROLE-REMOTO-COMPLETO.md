# Controle Remoto Completo via SSH

## 🎯 Funcionalidades Implementadas

Agora você pode controlar projetos remotos **diretamente pela interface**, sem precisar acessar o servidor via SSH manualmente!

### ✅ O que funciona remotamente:

1. **📋 Ver Logs** - Busca logs do container remoto via SSH
2. **💻 Terminal** - Executa comandos no container remoto
3. **▶️ Iniciar Container** - Inicia container parado no servidor remoto
4. **⏸️ Parar Container** - Para container rodando no servidor remoto
5. **🚀 Deploy** - Faz deploy completo no servidor remoto
6. **🔄 Rollback** - Volta para versão anterior (quando implementado)

## 🔧 Como Funciona

### 1. Ver Logs (Botão "Logs")

**Local:**
```typescript
docker logs container_id
```

**Remoto:**
```typescript
SSH → docker logs --tail 100 container_id
```

**Interface:**
- Clique em "Logs" no card do projeto
- Sistema conecta via SSH automaticamente
- Busca últimas 100 linhas de log
- Mostra na interface em tempo real

---

### 2. Terminal (Botão "Terminal")

**Local:**
```typescript
docker exec container_id comando
```

**Remoto:**
```typescript
SSH → docker exec container_id comando
```

**Interface:**
- Clique em "Terminal" no card do projeto
- Digite comandos como: `ls`, `pwd`, `npm run test`
- Sistema executa via SSH no container remoto
- Retorna output na interface

**Exemplos de comandos:**
```bash
ls -la                    # Listar arquivos
pwd                       # Ver diretório atual
node -v                   # Ver versão do Node
npm run test              # Rodar testes
cat package.json          # Ver arquivo
```

---

### 3. Iniciar/Parar Container

**Local:**
```typescript
docker start/stop container_id
```

**Remoto:**
```typescript
SSH → docker start/stop container_id
```

**Interface:**
- Botão "Iniciar" quando container está parado
- Botão "Parar" quando container está rodando
- Sistema executa via SSH automaticamente
- Status atualiza no banco de dados

---

## 📊 Comparação Local vs Remoto

| Funcionalidade | Local | Remoto | Diferença |
|---------------|-------|--------|-----------|
| **Deploy** | Docker local | SSH + Docker remoto | Clona no servidor |
| **Logs** | Docker API | SSH + docker logs | Busca via SSH |
| **Terminal** | Docker exec | SSH + docker exec | Executa via SSH |
| **Start/Stop** | Docker API | SSH + docker start/stop | Controla via SSH |
| **Rollback** | Troca containers | SSH + troca containers | Via SSH |
| **Verificar Updates** | ❌ Pulado | ❌ Pulado | Não tem repo local |

---

## 🚀 Fluxo Completo de Uso

### Criar Projeto Remoto

1. Clique em "Novo Projeto"
2. Conecte com GitHub
3. Selecione repositório
4. **Escolha servidor remoto** no dropdown
5. Configure porta, domínio, etc
6. Clique em "Criar Projeto"

### Fazer Deploy

1. Clique em "Deploy" no card
2. Sistema:
   - Conecta via SSH no servidor
   - Clona repositório (com token se privado)
   - Faz build da imagem Docker
   - Inicia container
   - Retorna logs em tempo real

### Ver Logs

1. Clique em "Logs" no card
2. Sistema:
   - Conecta via SSH
   - Executa `docker logs --tail 100 container_id`
   - Mostra na interface

### Usar Terminal

1. Clique em "Terminal" no card
2. Digite comando: `ls -la`
3. Sistema:
   - Conecta via SSH
   - Executa `docker exec container_id ls -la`
   - Mostra output

### Parar/Iniciar

1. Clique em "Parar" ou "Iniciar"
2. Sistema:
   - Conecta via SSH
   - Executa `docker stop/start container_id`
   - Atualiza status

---

## 🔐 Segurança

### Conexão SSH
- Usa credenciais salvas no servidor (host, port, username, password/key)
- Conexão criptografada
- Timeout configurável
- Reconexão automática

### Comandos Permitidos
- Apenas comandos dentro do container (`docker exec`)
- Não permite comandos no host diretamente
- Sanitização de input (previne injection)

---

## ⚠️ Tratamento de Erros

### Container não encontrado
```
Container não encontrado no servidor remoto.
O container pode ter sido removido. Faça um novo deploy.
```

### Servidor não encontrado
```
Servidor não encontrado.
O servidor pode ter sido removido.
```

### Erro de conexão SSH
```
Erro ao conectar no servidor:
[mensagem de erro detalhada]
```

### Comando falhou
```
Erro: [stderr do comando]
[stdout se houver]
```

---

## 📝 Exemplos de Uso

### Ver estrutura do projeto
```bash
Terminal → ls -la
```

### Ver logs de erro
```bash
Logs → (automático, últimas 100 linhas)
```

### Verificar variáveis de ambiente
```bash
Terminal → env
```

### Ver processos rodando
```bash
Terminal → ps aux
```

### Testar conectividade
```bash
Terminal → ping -c 3 google.com
```

### Ver uso de memória
```bash
Terminal → free -h
```

---

## 🎯 Benefícios

### Antes (sem controle remoto)
```
1. Abrir terminal local
2. ssh user@servidor
3. docker logs container_id
4. Copiar logs manualmente
5. Sair do SSH
```

### Agora (com controle remoto)
```
1. Clicar em "Logs"
2. Ver logs na interface ✅
```

### Economia de tempo
- **90% menos passos** para ver logs
- **Sem necessidade de SSH manual**
- **Interface unificada** para todos os servidores
- **Logs em tempo real** na interface

---

## 🔄 Próximas Melhorias

- [ ] Logs em tempo real (streaming via WebSocket)
- [ ] Terminal interativo (shell completo)
- [ ] Métricas do container (CPU, RAM, Network)
- [ ] Restart automático em caso de falha
- [ ] Backup automático antes de deploy
- [ ] Notificações de erro via email/webhook

---

## 🐛 Debug

### Ver conexão SSH
```javascript
// No backend
console.log('Conectando em:', server.host, server.port);
```

### Testar comando manualmente
```bash
ssh user@servidor "docker logs container_id"
```

### Ver logs do backend
```bash
# Windows
Get-Content logs/backend.log -Tail 50 -Wait
```

---

## 💡 Dicas

1. **Logs grandes**: Use filtros no terminal
   ```bash
   Terminal → docker logs container_id | grep ERROR
   ```

2. **Múltiplos comandos**: Use `&&`
   ```bash
   Terminal → cd /app && ls -la
   ```

3. **Ver arquivo específico**: Use `cat`
   ```bash
   Terminal → cat /app/package.json
   ```

4. **Buscar em arquivos**: Use `grep`
   ```bash
   Terminal → grep -r "error" /app/logs
   ```

