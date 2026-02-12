# ✅ Middlewares de Assinatura Aplicados

## 📋 Resumo

Todos os middlewares de controle de assinatura foram aplicados com sucesso nas rotas do sistema. Agora o sistema bloqueia corretamente ações quando o trial expira ou a assinatura está inativa.

---

## 🔧 Middlewares Aplicados

### 1. checkSubscriptionActive
**Função**: Bloqueia criação de novos recursos se trial/assinatura expirou

**Aplicado em**:
- ✅ `POST /api/projects` - Criar projeto
- ✅ `POST /api/projects/:id/deploy` - Fazer deploy
- ✅ `POST /api/databases` - Criar banco de dados
- ✅ `POST /api/wordpress/install` - Instalar WordPress
- ✅ `POST /api/backups` - Criar backup manual
- ✅ `POST /api/backups/database/:databaseId` - Backup de banco
- ✅ `POST /api/backups/project/:projectId` - Backup de projeto
- ✅ `POST /api/backups/wordpress/:wordpressId` - Backup de WordPress

### 2. checkServerLimit
**Função**: Limita a 1 servidor durante trial

**Aplicado em**:
- ✅ `POST /api/servers` - Criar servidor

### 3. checkCanModify
**Função**: Bloqueia edição/exclusão quando trial expirou (modo read-only)

**Aplicado em**:
- ✅ `PUT /api/servers/:id` - Editar servidor
- ✅ `DELETE /api/servers/:id` - Deletar servidor
- ✅ `PUT /api/projects/:id` - Editar projeto
- ✅ `DELETE /api/projects/:id` - Deletar projeto
- ✅ `DELETE /api/databases/:id` - Deletar banco de dados
- ✅ `DELETE /api/wordpress/:id` - Deletar WordPress
- ✅ `PUT /api/wordpress/:id/domain` - Atualizar domínio WordPress
- ✅ `POST /api/backups/:id/restore` - Restaurar backup
- ✅ `DELETE /api/backups/:id` - Deletar backup

---

## 🎯 Comportamento do Sistema

### Durante o Trial (15 dias)
- ✅ Pode criar 1 servidor
- ✅ Pode criar projetos, bancos, WordPress
- ✅ Pode fazer deploy
- ✅ Pode editar e deletar recursos
- ✅ Pode criar e restaurar backups

### Após Trial Expirar
- ❌ Não pode criar servidor (bloqueado por `checkServerLimit`)
- ❌ Não pode criar projetos (bloqueado por `checkSubscriptionActive`)
- ❌ Não pode criar bancos de dados (bloqueado por `checkSubscriptionActive`)
- ❌ Não pode instalar WordPress (bloqueado por `checkSubscriptionActive`)
- ❌ Não pode fazer deploy (bloqueado por `checkSubscriptionActive`)
- ❌ Não pode editar recursos (bloqueado por `checkCanModify`)
- ❌ Não pode deletar recursos (bloqueado por `checkCanModify`)
- ❌ Não pode criar backups (bloqueado por `checkSubscriptionActive`)
- ❌ Não pode restaurar backups (bloqueado por `checkCanModify`)
- ✅ Pode visualizar recursos existentes (read-only)

### Com Assinatura Ativa
- ✅ Acesso total a todas as funcionalidades
- ✅ Pode criar múltiplos servidores (conforme plano)
- ✅ Sem restrições de criação/edição/exclusão

---

## 📝 Mensagens de Erro

### Trial Expirado - Criar Recursos
```json
{
  "success": false,
  "error": "Sua assinatura expirou. Por favor, renove sua assinatura para continuar.",
  "data": {
    "trialEndDate": "2026-02-11T...",
    "subscriptionStatus": "trial"
  }
}
```

### Trial - Limite de Servidores
```json
{
  "success": false,
  "error": "Você atingiu o limite de 1 servidor no período de trial. Faça upgrade para continuar.",
  "data": {
    "limit": 1,
    "current": 1,
    "trialEndDate": "2026-02-26T..."
  }
}
```

### Trial Expirado - Editar/Deletar
```json
{
  "success": false,
  "error": "Sua assinatura expirou. Você pode visualizar seus projetos, mas não pode fazer modificações. Renove sua assinatura para continuar.",
  "data": {
    "trialEndDate": "2026-02-11T...",
    "subscriptionStatus": "trial"
  }
}
```

---

## 🧪 Como Testar

### 1. Registrar Novo Usuário
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Trial",
    "email": "trial@test.com",
    "password": "Senha123"
  }'
```

### 2. Verificar Status do Trial
```bash
curl -X GET http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

Deve retornar:
```json
{
  "subscription": {
    "status": "trial",
    "daysRemaining": 15,
    "isTrialActive": true
  }
}
```

### 3. Criar 1º Servidor (Deve Funcionar)
```bash
curl -X POST http://localhost:8001/api/servers \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Servidor 1",
    "host": "192.168.1.100",
    "port": 22,
    "username": "root",
    "password": "senha123"
  }'
```

### 4. Tentar Criar 2º Servidor (Deve Falhar)
```bash
curl -X POST http://localhost:8001/api/servers \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Servidor 2",
    "host": "192.168.1.101",
    "port": 22,
    "username": "root",
    "password": "senha123"
  }'
```

Deve retornar erro: "Você atingiu o limite de 1 servidor no período de trial"

### 5. Simular Expiração do Trial
```javascript
// No MongoDB:
db.users.updateOne(
  { email: "trial@test.com" },
  { $set: { "subscription.endDate": new Date() } }
)
```

### 6. Tentar Criar Projeto (Deve Falhar)
```bash
curl -X POST http://localhost:8001/api/projects \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "meu-projeto",
    "gitUrl": "https://github.com/user/repo.git"
  }'
```

Deve retornar erro: "Sua assinatura expirou"

### 7. Tentar Editar Projeto (Deve Falhar)
```bash
curl -X PUT http://localhost:8001/api/projects/PROJECT_ID \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "novo-nome"
  }'
```

Deve retornar erro: "Você pode visualizar seus projetos, mas não pode fazer modificações"

---

## 🔄 Webhook do Assas Implementado

O webhook agora processa corretamente os eventos do Assas e atualiza o status da assinatura:

### Eventos Processados

#### 1. subscription_activated / payment_received
- Atualiza `subscription.status` para `'active'`
- Calcula nova `endDate` (30 dias ou 1 ano)
- Usuário recupera acesso total

#### 2. subscription_cancelled
- Atualiza `subscription.status` para `'cancelled'`
- Define `endDate` para agora (expira imediatamente)
- Usuário perde acesso

#### 3. payment_overdue
- Atualiza `subscription.status` para `'inactive'`
- Usuário perde acesso até regularizar pagamento

### Exemplo de Webhook
```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "subscription": "sub_123456",
    "value": 29.90,
    "status": "RECEIVED"
  }
}
```

Sistema processa e ativa assinatura automaticamente.

---

## 📋 Checklist de Implementação

- [x] Criar middlewares de assinatura
- [x] Aplicar `checkServerLimit` em POST /servers
- [x] Aplicar `checkSubscriptionActive` em rotas de criação
- [x] Aplicar `checkCanModify` em rotas de edição/exclusão
- [x] Implementar processamento de webhook do Assas
- [x] Atualizar status de assinatura via webhook
- [x] Testar limite de 1 servidor no trial
- [x] Testar bloqueio após expiração do trial
- [x] Testar modo read-only após expiração
- [ ] Criar UI para mostrar status do trial no frontend
- [ ] Criar notificações de expiração próxima
- [ ] Implementar renovação automática via Assas

---

## 🚀 Próximos Passos

### 1. Frontend - Mostrar Status do Trial
- Adicionar banner no dashboard mostrando dias restantes
- Mostrar limite de servidores (1/1 usado)
- Botão "Fazer Upgrade" destacado

### 2. Notificações
- Email 3 dias antes do trial expirar
- Email quando trial expirar
- Notificação in-app sobre status

### 3. Renovação Automática
- Configurar renovação automática no Assas
- Criar cron job para verificar assinaturas expirando
- Enviar lembretes de renovação

### 4. Validação de Webhook
- Implementar validação de assinatura do Assas
- Adicionar `ASSAS_WEBHOOK_TOKEN` no .env
- Verificar autenticidade dos eventos

---

## 📞 Suporte

Para dúvidas, consulte:
- `backend/src/middleware/subscription.ts` - Implementação dos middlewares
- `backend/src/routes/payments.ts` - Webhook do Assas
- `SISTEMA-TRIAL.md` - Documentação do sistema de trial
- `APLICAR-MIDDLEWARES-TRIAL.md` - Guia de aplicação

---

## ✅ Status Final

**TODOS OS MIDDLEWARES APLICADOS COM SUCESSO!**

O sistema agora:
- ✅ Bloqueia criação de 2º servidor no trial
- ✅ Bloqueia criação de recursos após trial expirar
- ✅ Bloqueia edição/exclusão após trial expirar
- ✅ Processa webhooks do Assas corretamente
- ✅ Atualiza status de assinatura automaticamente
- ✅ Permite visualização read-only após expiração

**Sistema de assinatura totalmente funcional!** 🎉
