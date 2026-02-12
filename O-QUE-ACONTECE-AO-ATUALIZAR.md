# 🚀 O Que Acontece Quando Você Clica em "Atualizar Agora"

## 📋 Fluxo Completo da Atualização

### 1️⃣ **Confirmação de Segurança**
```
⚠️ "Tem certeza que deseja atualizar o sistema? O painel será reiniciado."
```
- Você precisa confirmar a ação
- Se cancelar, nada acontece

---

### 2️⃣ **Detecção do Ambiente**

O sistema detecta automaticamente onde está rodando:

#### 🐳 **Se estiver em Docker (Produção)**
```bash
📍 Ambiente: Docker
🐳 Detectado ambiente Docker - Executando atualização em produção
```

**Processo:**
1. **Verifica atualizações disponíveis**
   ```bash
   cd /opt/ark-deploy
   git fetch origin main
   git status -uno
   ```

2. **Se já estiver atualizado:**
   - ✅ Retorna: "Sistema já está atualizado!"
   - ❌ Não faz nada

3. **Se houver atualizações, cria script temporário:**
   ```bash
   /tmp/ark-deploy-update.sh
   ```

4. **Executa o script em background:**
   ```bash
   #!/bin/bash
   cd /opt/ark-deploy
   
   # 📥 Atualizar código
   git reset --hard HEAD
   git pull origin main
   
   # ⏹️ Parar containers
   docker-compose down
   
   # 🗑️ Remover imagens antigas
   docker rmi ark-deploy-frontend ark-deploy-backend
   
   # 🧹 Limpar cache
   docker builder prune -af
   rm -rf frontend/.next frontend/node_modules/.cache backend/dist
   
   # 🔨 Reconstruir em modo PRODUÇÃO
   docker-compose build --no-cache --pull
   
   # 🚀 Iniciar containers
   docker-compose up -d
   
   # ✅ Concluído!
   ```

5. **Resposta imediata:**
   ```json
   {
     "message": "Atualização iniciada! O sistema será reiniciado automaticamente em alguns minutos.",
     "success": true,
     "requiresReload": true
   }
   ```

6. **Frontend recarrega automaticamente após 10 segundos**

---

#### 💻 **Se estiver no Host (Desenvolvimento Local)**
```bash
📍 Ambiente: Host
💻 Detectado ambiente Host
```

**Processo:**

1. **Backup do .env**
   ```bash
   📦 Fazendo backup do .env...
   cp .env .env.backup
   ```

2. **Verifica se é repositório Git**
   ```bash
   git rev-parse --is-inside-work-tree
   ```
   - Se não for: ❌ Erro "Não é um repositório Git"

3. **Git Pull**
   ```bash
   ⬇️ Baixando atualizações do GitHub...
   git pull origin main
   ```
   - Se já estiver atualizado: ✅ "Sistema já está atualizado!"

4. **Instalar Dependências Backend**
   ```bash
   📦 Instalando dependências do backend...
   cd backend && npm install
   ```

5. **Instalar Dependências Frontend**
   ```bash
   📦 Instalando dependências do frontend...
   cd frontend && npm install
   ```

6. **Resposta de Sucesso**
   ```json
   {
     "message": "Sistema atualizado com sucesso! Reiniciando em 5 segundos...",
     "output": "...",
     "success": true
   }
   ```

7. **Reinicia o processo Node.js após 5 segundos**
   ```javascript
   setTimeout(() => {
     process.exit(0);
   }, 5000);
   ```

---

## 🎬 Experiência Visual no Frontend

### Durante a Atualização:

1. **Modal de Confirmação**
   ```
   ⚠️ Tem certeza que deseja atualizar o sistema?
   O painel será reiniciado.
   
   [Cancelar]  [Confirmar]
   ```

2. **Logs em Tempo Real** (se disponível)
   ```
   ┌─────────────────────────────────────┐
   │ Logs de Deploy                      │
   ├─────────────────────────────────────┤
   │ [14:30:15] 📥 Atualizando código... │
   │ [14:30:20] ⏹️ Parando containers...  │
   │ [14:30:25] 🗑️ Removendo imagens...   │
   │ [14:30:30] 🔨 Reconstruindo...       │
   │ [14:30:45] 🚀 Iniciando...          │
   │ [14:31:00] ✅ Concluído!            │
   └─────────────────────────────────────┘
   ```

3. **Toast de Sucesso**
   ```
   ✅ Atualização iniciada! O sistema será reiniciado...
   ```

4. **Reload Automático**
   - Após 10 segundos (Docker) ou 5 segundos (Host)
   - Página recarrega automaticamente
   - Você volta para a tela de login ou dashboard

---

## ⚠️ Possíveis Cenários

### ✅ **Sucesso Total**
- Código atualizado
- Dependências instaladas
- Containers reconstruídos
- Sistema reiniciado
- Página recarregada
- **Resultado:** Sistema atualizado e funcionando

### ⚠️ **Sistema Já Atualizado**
- Verifica e detecta que não há atualizações
- **Resultado:** Mensagem "Sistema já está atualizado!"
- Nada é modificado

### ❌ **Erro Durante Atualização (Docker)**
- Se falhar, retorna instruções manuais:
  ```
  Para atualizar o sistema, execute no servidor:
  
  cd /opt/ark-deploy
  ./switch-to-production.sh
  
  Ou manualmente:
  cd /opt/ark-deploy
  git pull
  docker-compose down
  docker-compose build --no-cache
  docker-compose up -d
  ```

### ❌ **Erro Durante Atualização (Host)**
- Mostra erro específico
- Sistema permanece na versão anterior
- Backup do .env é mantido

---

## 🔒 Segurança

### Backups Automáticos:
- ✅ `.env` → `.env.backup` (antes de atualizar)
- ✅ Código anterior permanece no Git (pode fazer rollback)

### Validações:
- ✅ Verifica se é repositório Git
- ✅ Verifica se há atualizações disponíveis
- ✅ Confirmação do usuário antes de executar

### Permissões:
- ✅ Apenas usuários `admin` ou `super_admin`
- ✅ Token JWT válido obrigatório

---

## ⏱️ Tempo Estimado

### Docker (Produção):
- **2-5 minutos** (depende da velocidade do servidor)
  - Git pull: ~10s
  - Docker build: ~2-4min
  - Docker up: ~10s

### Host (Desenvolvimento):
- **30-60 segundos**
  - Git pull: ~5s
  - npm install backend: ~15s
  - npm install frontend: ~20s
  - Restart: ~5s

---

## 📊 Logs Disponíveis

### No Servidor (Docker):
```bash
# Ver logs da atualização
cat /tmp/ark-deploy-update.log

# Ver logs dos containers
docker-compose logs -f
```

### No Console do Backend:
```
🔄 Iniciando atualização do sistema...
📍 Ambiente: Docker
🐳 Detectado ambiente Docker
🚀 Executando script de atualização em produção...
✅ Atualização iniciada!
```

---

## 🎯 Resumo

Quando você clica em "Atualizar Agora":

1. ✅ **Confirma** a ação
2. 🔍 **Detecta** o ambiente (Docker ou Host)
3. 📥 **Baixa** as atualizações do GitHub
4. 📦 **Instala** dependências atualizadas
5. 🐳 **Reconstrói** containers (se Docker)
6. 🔄 **Reinicia** o sistema
7. 🔃 **Recarrega** a página automaticamente
8. ✅ **Sistema atualizado** e funcionando!

**É seguro, automático e com backup!** 🚀

---

**Última Atualização**: 11 de Fevereiro de 2026
