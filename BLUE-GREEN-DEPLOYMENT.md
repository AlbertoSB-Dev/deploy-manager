# Blue-Green Deployment - Sistema de Versões

## 🎯 Objetivo

Sistema de deploy sem downtime onde:
- ✅ Container antigo continua rodando durante novo deploy
- ✅ Nova versão sobe em paralelo
- ✅ Troca automática quando nova versão estiver pronta
- ✅ Container antigo fica parado (não deletado) para rollback instantâneo
- ✅ Notificação automática de atualizações disponíveis no GitHub

## 🔄 Como Funciona

### 1. Deploy Normal
```
Estado Inicial:
  Container A (v1.0) → RODANDO na porta 3000

Novo Deploy:
  1. Busca código atualizado do Git
  2. Build da nova imagem Docker
  3. Container B (v1.1) → INICIA na porta 3000
  4. Aguarda Container B ficar saudável (health check)
  5. Container A → PARA (mas não é deletado!)
  6. Container B → ATIVO

Estado Final:
  Container A (v1.0) → PARADO (disponível para rollback)
  Container B (v1.1) → RODANDO na porta 3000
```

### 2. Rollback Rápido
```
Se der problema na v1.1:
  1. Container B (v1.1) → PARA
  2. Container A (v1.0) → REINICIA
  3. Troca instantânea (sem rebuild!)

Tempo: ~2-5 segundos ⚡
```

### 3. Rollback Completo
```
Para voltar para versão específica do histórico:
  1. Faz checkout do commit desejado
  2. Executa deploy completo
  3. Cria novo container

Tempo: ~30-60 segundos (depende do build)
```

## 📊 Verificação de Atualizações

### Automática
O sistema verifica atualizações a cada 5 minutos:
```typescript
// Iniciado automaticamente no backend
updateChecker.startPeriodicCheck(5); // 5 minutos
```

### Manual
Clique em "Verificar novamente" no card do projeto

### Indicador Visual
Quando há atualização disponível:
```
✨ Nova versão disponível
```
Badge verde piscando no card do projeto

## 🎮 Interface do Usuário

### Card do Projeto

```
┌─────────────────────────────────────┐
│ Meu Projeto                    [🟢] │
│ meu-projeto                          │
│ ✨ Nova versão disponível            │
│                                      │
│ 🌿 Branch: main                      │
│ 🕐 Versão: abc123                    │
│ 🌐 Domínio: xyz.localhost            │
│ 🔌 Porta: 3000                       │
│                                      │
│ [🚀 Deploy]                          │
│ [⏸️ Parar] [⏮️ Rollback] [✏️] [📜]   │
└─────────────────────────────────────┘
```

### Botões

1. **Deploy** - Faz novo deploy da versão mais recente
2. **Parar/Iniciar** - Controla container atual
3. **Rollback** - Volta para container anterior (instantâneo)
4. **Editar** - Edita configurações do projeto
5. **Versões** - Ver histórico de deploys
6. **Logs** - Ver logs do container
7. **Terminal** - Acesso ao terminal do container

## 🗄️ Estrutura no Banco de Dados

```typescript
Project {
  containerId: "abc123",           // Container atual (ativo)
  previousContainerId: "def456",   // Container anterior (parado)
  currentVersion: "abc123xyz",     // Commit atual
  latestGitCommit: "def789abc",    // Último commit no GitHub
  hasUpdate: true,                 // Indica se há atualização
  deployments: [                   // Histórico completo
    {
      version: "main",
      commit: "abc123",
      deployedAt: "2024-01-15",
      status: "success"
    }
  ]
}
```

## 🔧 Endpoints da API

### Verificar Atualizações
```bash
GET /api/projects/:id/check-updates

Response:
{
  "hasUpdate": true,
  "latestCommit": "def789abc",
  "currentCommit": "abc123xyz"
}
```

### Rollback Rápido
```bash
POST /api/projects/:id/rollback/fast
Body: { "deployedBy": "admin" }

Response:
{
  "success": true,
  "type": "fast",
  "message": "Rollback rápido realizado"
}
```

### Rollback Completo
```bash
POST /api/projects/:id/rollback
Body: { 
  "deploymentIndex": 2,
  "deployedBy": "admin" 
}

Response:
{
  "success": true,
  "type": "complete",
  "deployment": { ... }
}
```

## 📝 Logs do Deploy

Durante o deploy, você verá:

```
📡 Buscando atualizações do repositório...
🔄 Atualizando branch: main
📝 Configurando variáveis de ambiente...
📄 Usando Dockerfile existente
🔨 Construindo imagem Docker...
🚀 Iniciando novo container...
⏳ Verificando saúde do novo container...
⏸️  Parando container anterior (mantido para rollback)...
✅ Deploy concluído com sucesso!
💾 Container anterior mantido para rollback rápido
```

## 🎯 Casos de Uso

### Cenário 1: Deploy com Sucesso
```
1. Desenvolvedor faz push no GitHub
2. Sistema detecta atualização (badge aparece)
3. Admin clica em "Deploy"
4. Nova versão sobe sem derrubar a antiga
5. Troca automática quando pronto
6. Container antigo fica disponível para rollback
```

### Cenário 2: Deploy com Erro
```
1. Admin clica em "Deploy"
2. Build falha ou container não inicia
3. Sistema automaticamente reativa container anterior
4. Aplicação continua rodando na versão antiga
5. Zero downtime!
```

### Cenário 3: Rollback Necessário
```
1. Nova versão tem bug em produção
2. Admin clica em "Rollback"
3. Container antigo reinicia em ~3 segundos
4. Aplicação volta para versão estável
5. Problema resolvido rapidamente!
```

## ⚙️ Configuração

### Intervalo de Verificação
Edite em `backend/src/index.ts`:
```typescript
updateChecker.startPeriodicCheck(5); // minutos
```

### Health Check Timeout
Edite em `backend/src/services/DeployService.ts`:
```typescript
await this.waitForContainerHealth(containerId, 30000); // ms
```

## 🚀 Vantagens

✅ **Zero Downtime**: Aplicação nunca fica offline
✅ **Rollback Instantâneo**: Volta para versão anterior em segundos
✅ **Segurança**: Sempre tem versão anterior disponível
✅ **Rastreabilidade**: Histórico completo de deploys
✅ **Automação**: Detecta atualizações automaticamente
✅ **Simplicidade**: Interface intuitiva

## 📚 Comparação com Coolify

| Recurso | Deploy Manager | Coolify |
|---------|---------------|---------|
| Blue-Green Deploy | ✅ | ✅ |
| Rollback Rápido | ✅ | ✅ |
| Verificação Auto | ✅ | ✅ |
| Container Anterior | ✅ Mantido | ❌ Deletado |
| Health Check | ✅ | ✅ |
| Zero Downtime | ✅ | ✅ |

## 🔮 Próximas Melhorias

- [ ] Limpeza automática de containers antigos (após X dias)
- [ ] Múltiplas versões simultâneas (A/B testing)
- [ ] Canary deployment (deploy gradual)
- [ ] Métricas de saúde do container
- [ ] Notificações por email/Slack
- [ ] Webhook do GitHub para deploy automático
