# 🚀 Guia Rápido - Deploy Manager

## 🎯 Novas Funcionalidades

### 1. 📡 Logs em Tempo Real

Agora você vê o que está acontecendo durante o deploy!

**Como usar:**
1. Clique no botão **"Deploy"** no card do projeto
2. Um modal abre automaticamente
3. Veja os logs em tempo real:
   - 📡 Buscando atualizações...
   - 🔄 Atualizando branch...
   - 🔨 Construindo imagem...
   - 🚀 Iniciando container...
   - ✅ Deploy concluído!

**Indicador de Conexão:**
- 🟢 Verde = Conectado ao servidor
- 🔴 Vermelho = Desconectado

---

### 2. 🌐 Domínios Automáticos

Não precisa mais configurar domínio manualmente!

**Como funciona:**
- Você cria um projeto chamado `meu-app`
- Sistema gera automaticamente: `meu-app.localhost`
- Aparece no card com ícone 🌐
- Badge **"Teste"** indica domínio local
- Clique para abrir em nova aba

**Domínio Customizado:**
- Quer usar seu próprio domínio?
- Preencha o campo "Domínio" ao criar projeto
- Exemplo: `app.meusite.com`
- Configure DNS para apontar para seu servidor

---

## 📝 Criar Projeto

### Opção 1: Com GitHub

1. Clique em **"Novo Projeto"**
2. Escolha **"Conectar com GitHub"**
3. Autorize o acesso
4. Selecione o repositório
5. Configure porta e variáveis
6. **Deixe domínio vazio** para gerar automaticamente
7. Clique em **"Criar Projeto"**

### Opção 2: Manual

1. Clique em **"Novo Projeto"**
2. Escolha **"Adicionar Manualmente"**
3. Preencha:
   - Nome: `meu-app` (minúsculas)
   - Nome de Exibição: `Meu App`
   - URL Git: `https://github.com/user/repo.git`
   - Branch: `main`
   - Tipo: `frontend`
   - Porta: `3000` (opcional)
   - **Domínio: deixe vazio** (será `meu-app.localhost`)
4. Clique em **"Criar Projeto"**

---

## 🚀 Fazer Deploy

1. Encontre seu projeto na lista
2. Clique no botão **"Deploy"** (ícone de foguete 🚀)
3. Modal abre mostrando logs em tempo real
4. Aguarde conclusão (✅ Deploy concluído!)
5. Clique no domínio no card para abrir

---

## 🎨 Interface

### Card do Projeto

```
┌─────────────────────────────────────┐
│ Meu App                    [Ativo]  │  ← Nome e Status
│ meu-app                             │  ← Nome técnico
├─────────────────────────────────────┤
│ 🌿 main                             │  ← Branch
│ ⏰ v1.0.0                           │  ← Versão
│ 🌐 meu-app.localhost [Teste]       │  ← Domínio (clicável)
│ Último deploy: há 2 minutos         │  ← Timestamp
├─────────────────────────────────────┤
│ [🚀 Deploy] [📜] [💻] [🗑️]         │  ← Ações
└─────────────────────────────────────┘
```

**Botões:**
- 🚀 **Deploy** - Fazer deploy (abre logs)
- 📜 **Logs** - Ver logs do container
- 💻 **Terminal** - Executar comandos
- 🗑️ **Deletar** - Remover projeto

---

## 💡 Dicas

### Domínios

✅ **Recomendado:**
- Deixe vazio para gerar automaticamente
- Use nomes descritivos: `api-backend`, `frontend-app`
- Apenas letras minúsculas, números e hífens

❌ **Evite:**
- Espaços no nome
- Caracteres especiais
- Nomes muito longos

### Logs em Tempo Real

✅ **Funciona:**
- Auto-scroll para última linha
- Timestamp em cada log
- Indicador de conexão
- Pode fechar e reabrir modal

❌ **Limitações:**
- Logs não persistem após fechar modal
- Use botão "Logs" para ver histórico completo

---

## 🔧 Configuração Avançada

### Mudar Domínio Base

Edite `backend/.env`:

```env
# Desenvolvimento
BASE_DOMAIN=localhost

# Staging
BASE_DOMAIN=staging.empresa.com

# Produção
BASE_DOMAIN=apps.empresa.com
```

Resultado:
- `localhost` → `meu-app.localhost`
- `staging.empresa.com` → `meu-app.staging.empresa.com`
- `apps.empresa.com` → `meu-app.apps.empresa.com`

### Acessar Domínio Local

**Windows:**
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

Adicione:
```
127.0.0.1  meu-app.localhost
```

**Linux/Mac:**
```bash
sudo nano /etc/hosts
```

Adicione:
```
127.0.0.1  meu-app.localhost
```

---

## 🐛 Troubleshooting

### Logs não aparecem

**Problema:** Modal abre mas logs não aparecem

**Solução:**
1. Verifique se backend está rodando (porta 8001)
2. Abra console do navegador (F12)
3. Procure por erros de WebSocket
4. Recarregue a página

### Domínio não resolve

**Problema:** `meu-app.localhost` não abre

**Solução:**
1. Adicione ao arquivo `hosts` (veja acima)
2. Ou use `localhost:porta` diretamente
3. Verifique se container está rodando: `docker ps`

### Deploy falha

**Problema:** Deploy mostra erro

**Solução:**
1. Veja os logs no modal
2. Verifique se Docker está rodando
3. Verifique credenciais Git (se privado)
4. Verifique se porta está disponível

---

## 📚 Mais Informações

- **Logs Detalhados**: `REALTIME-DEPLOY-LOGS.md`
- **Domínios**: `docs/AUTO-DOMAINS.md`
- **Status**: `IMPLEMENTATION-STATUS.md`
- **Docker**: `DOCKER-FEATURES.md`
- **GitHub**: `docs/GITHUB-OAUTH-SETUP.md`

---

## 🎉 Pronto!

Agora você pode:
- ✅ Criar projetos facilmente
- ✅ Ver logs em tempo real
- ✅ Usar domínios automáticos
- ✅ Fazer deploys com confiança

**Divirta-se deployando! 🚀**
