# 🚀 Sistema de Backup - Guia Rápido

## ✅ O que foi implementado?

Sistema completo de backup e restore para:
- 💾 Bancos de dados (MongoDB, MySQL, MariaDB, PostgreSQL)
- 📦 Projetos (volumes Docker)
- 📝 WordPress (banco + arquivos)

Com suporte a:
- 🖥️ Servidores locais e remotos (SSH)
- ☁️ Armazenamento local e MinIO/S3
- 🔄 Restore rápido e seguro
- 📥 Download de backups
- 🗑️ Gerenciamento completo

---

## 🎯 Como Usar

### 1. **Via Interface (Recomendado)**

#### Acessar Backups de um Recurso
1. Vá para o Dashboard
2. Clique em qualquer banco/projeto/WordPress
3. No modal de detalhes, clique em **"Gerenciar Backups"**
4. Pronto! Você verá todos os backups daquele recurso

#### Criar Backup
1. No modal de backups, clique em **"Criar Backup"**
2. Escolha o tipo de armazenamento (Local ou MinIO)
3. Clique em **"Criar Backup"**
4. Aguarde a conclusão (pode levar alguns minutos)

#### Restaurar Backup
1. Na lista de backups, encontre o backup desejado
2. Clique no ícone de **Upload** (seta para cima)
3. Confirme a restauração
4. Aguarde a conclusão

#### Download de Backup
1. Clique no ícone de **Download** (seta para baixo)
2. O arquivo será baixado automaticamente

#### Deletar Backup
1. Clique no ícone de **Lixeira**
2. Confirme a exclusão

### 2. **Via API**

#### Criar Backup de Banco
```bash
curl -X POST http://localhost:5000/api/backups/database/DATABASE_ID \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"storageType": "local"}'
```

#### Criar Backup de Projeto
```bash
curl -X POST http://localhost:5000/api/backups/project/PROJECT_ID \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"storageType": "local"}'
```

#### Listar Backups
```bash
curl http://localhost:5000/api/backups \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### Restaurar Backup
```bash
curl -X POST http://localhost:5000/api/backups/BACKUP_ID/restore \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 📁 Arquivos Criados

### Backend
```
✅ backend/src/models/Backup.ts              # Modelo de dados
✅ backend/src/services/BackupService.ts     # Lógica de backup/restore
✅ backend/src/routes/backups.ts             # API REST
✅ backend/src/index.ts                      # Rotas registradas
```

### Frontend
```
✅ frontend/src/components/BackupManager.tsx # Interface de gerenciamento
✅ frontend/src/components/ServiceItem.tsx   # Botão de backup adicionado
✅ frontend/src/app/backups/page.tsx         # Página dedicada
```

### Documentação
```
✅ BACKUP-SYSTEM-COMPLETE.md                 # Documentação completa
✅ BACKUP-QUICK-START.md                     # Este guia rápido
```

---

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```bash
# Diretório de backups (opcional)
BACKUP_DIR=/opt/deploy-manager/backups

# MinIO (opcional - para backup remoto)
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=backups
```

### Criar Diretório de Backups

```bash
# No servidor
sudo mkdir -p /opt/deploy-manager/backups
sudo chmod 755 /opt/deploy-manager/backups
```

---

## 📊 Tipos de Backup

### 1. Banco de Dados
- **MongoDB**: `mongodump` → `.archive.gz`
- **MySQL/MariaDB**: `mysqldump` → `.sql.gz`
- **PostgreSQL**: `pg_dump` → `.sql.gz`

### 2. Projetos
- Volumes Docker completos
- Formato: `.tar.gz`

### 3. WordPress
- Banco MySQL + arquivos `/var/www/html`
- Formato: `.tar.gz`

---

## ⚡ Exemplos Práticos

### Exemplo 1: Backup Diário de Banco

```typescript
// Criar backup automático todo dia às 2h da manhã
// (Agendamento será implementado em versão futura)

const createDailyBackup = async () => {
  await api.post('/backups/database/65abc123', {
    storageType: 'local'
  });
};
```

### Exemplo 2: Backup Antes de Deploy

```typescript
// Criar backup antes de fazer deploy
const deployWithBackup = async (projectId: string) => {
  // 1. Criar backup
  await api.post(`/backups/project/${projectId}`, {
    storageType: 'local'
  });
  
  // 2. Fazer deploy
  await api.post(`/projects/${projectId}/deploy`);
};
```

### Exemplo 3: Restore de Emergência

```typescript
// Restaurar último backup em caso de problema
const emergencyRestore = async (resourceId: string) => {
  // 1. Listar backups
  const response = await api.get(`/backups?resourceId=${resourceId}`);
  const backups = response.data;
  
  // 2. Pegar último backup completo
  const lastBackup = backups.find(b => b.status === 'completed');
  
  // 3. Restaurar
  if (lastBackup) {
    await api.post(`/backups/${lastBackup._id}/restore`);
  }
};
```

---

## 🎨 Interface Visual

### Página de Backups
- Acesse: `http://localhost:8000/backups`
- Veja todos os backups de todos os recursos
- Filtre por tipo, status, recurso

### Modal de Backups (ServiceItem)
- Clique em qualquer recurso no dashboard
- Botão **"Gerenciar Backups"** no modal de detalhes
- Interface dedicada para aquele recurso específico

### Indicadores Visuais
- 🟢 **Verde**: Backup completo
- 🔵 **Azul**: Criando/Restaurando (animado)
- 🔴 **Vermelho**: Falhou
- 📊 **Tamanho**: Formatado automaticamente (KB/MB/GB)
- 🕐 **Data**: Relativa ("há 2 horas", "há 3 dias")

---

## 🔐 Segurança

### Autenticação
- ✅ Todas as rotas protegidas com JWT
- ✅ Isolamento por usuário (userId)
- ✅ Validação de propriedade do recurso

### Confirmações
- ✅ Restaurar: "Tem certeza? Irá sobrescrever dados atuais"
- ✅ Deletar: "Tem certeza? Não pode ser desfeito"

### Armazenamento
- ✅ Backups locais em diretório protegido
- ✅ Compressão automática (gzip)
- ✅ Suporte a MinIO/S3 com credenciais

---

## 🐛 Troubleshooting

### "Backup não encontrado"
- Verifique se o backup pertence ao seu usuário
- Verifique se o ID está correto

### "Arquivo de backup não encontrado"
- Verifique se o diretório `/opt/deploy-manager/backups` existe
- Verifique permissões: `sudo chmod 755 /opt/deploy-manager/backups`

### "Container não encontrado"
- Faça um deploy antes de criar backup
- Verifique se o container está rodando

### Backup muito lento
- Normal para bancos/projetos grandes
- Considere fazer backup em horários de baixo uso
- Verifique velocidade da rede (se remoto)

---

## 📝 Checklist de Uso

### Antes de Usar
- [ ] Backend rodando (`npm run dev` em `backend/`)
- [ ] Frontend rodando (`npm run dev` em `frontend/`)
- [ ] Diretório de backups criado
- [ ] Usuário autenticado

### Primeiro Backup
- [ ] Acessar dashboard
- [ ] Selecionar um recurso (banco/projeto/wordpress)
- [ ] Clicar em "Gerenciar Backups"
- [ ] Clicar em "Criar Backup"
- [ ] Escolher tipo de armazenamento
- [ ] Aguardar conclusão
- [ ] Verificar backup na lista

### Primeiro Restore
- [ ] Ter pelo menos 1 backup completo
- [ ] Clicar no ícone de Upload
- [ ] Confirmar restauração
- [ ] Aguardar conclusão
- [ ] Verificar se dados foram restaurados

---

## 🚀 Próximos Passos

### Funcionalidades Futuras
1. **Backups Agendados** (cron jobs)
   - Diário, semanal, mensal
   - Horário configurável
   - Retenção automática

2. **Upload Manual de Backup**
   - Fazer upload de arquivo .tar.gz
   - Validar e registrar no sistema

3. **Criptografia**
   - Criptografar backups sensíveis
   - Chave por usuário

4. **Notificações**
   - Email quando backup completa
   - Alerta quando backup falha

5. **Backup Incremental**
   - Apenas mudanças desde último backup
   - Reduzir tamanho e tempo

---

## 💡 Dicas

### Boas Práticas
1. **Faça backup antes de mudanças importantes**
   - Antes de deploy
   - Antes de atualizar banco
   - Antes de mudanças de configuração

2. **Mantenha múltiplos backups**
   - Não confie em apenas 1 backup
   - Mantenha pelo menos 3-7 backups recentes

3. **Teste seus backups**
   - Faça restore em ambiente de teste
   - Verifique integridade dos dados

4. **Use MinIO/S3 para backups importantes**
   - Armazenamento redundante
   - Proteção contra falha de disco

5. **Monitore espaço em disco**
   - Backups ocupam espaço
   - Delete backups antigos regularmente

---

## ✅ Status da Implementação

- [x] Modelo de dados
- [x] Serviço de backup
- [x] API REST completa
- [x] Interface visual
- [x] Backup de bancos
- [x] Backup de projetos
- [x] Backup de WordPress
- [x] Suporte remoto (SSH)
- [x] Upload para MinIO/S3
- [x] Restore completo
- [x] Download de backups
- [x] Deletar backups
- [x] Documentação
- [ ] Backups agendados (futuro)
- [ ] Upload manual (futuro)
- [ ] Criptografia (futuro)

---

## 🎉 Pronto para Usar!

O sistema de backup está **100% funcional** e pronto para uso em produção!

**Comece agora:**
1. Acesse o dashboard
2. Clique em qualquer recurso
3. Clique em "Gerenciar Backups"
4. Crie seu primeiro backup!

**Precisa de ajuda?**
- Leia a documentação completa: `BACKUP-SYSTEM-COMPLETE.md`
- Verifique os exemplos de código acima
- Teste em ambiente de desenvolvimento primeiro
