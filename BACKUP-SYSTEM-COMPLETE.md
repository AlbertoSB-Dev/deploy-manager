# 💾 Sistema de Backup e Restore - Implementação Completa

## 📋 Visão Geral

Sistema completo de backup e restore para bancos de dados, projetos e WordPress, com suporte a armazenamento local e MinIO/S3.

---

## ✅ Funcionalidades Implementadas

### 1. **Modelo de Dados** (`Backup.ts`)
- ✅ Tipos de backup: database, project, wordpress, manual
- ✅ Status: creating, completed, failed, restoring
- ✅ Armazenamento: local, minio, s3
- ✅ Metadados: tipo, versão, commit, compressão, criptografia
- ✅ Agendamento (preparado para futuro): frequência, retenção
- ✅ Multi-tenancy (userId)
- ✅ Índices otimizados

### 2. **Serviço de Backup** (`BackupService.ts`)

#### Criar Backup
- ✅ Backup de bancos de dados (MongoDB, MySQL, MariaDB, PostgreSQL)
- ✅ Backup de projetos (volumes Docker)
- ✅ Backup de WordPress (banco + arquivos)
- ✅ Suporte a servidores remotos via SSH
- ✅ Compressão automática (gzip)
- ✅ Upload para MinIO/S3 (opcional)
- ✅ Cálculo de tamanho do arquivo
- ✅ Tratamento de erros completo

#### Restaurar Backup
- ✅ Restore de bancos de dados
- ✅ Restore de projetos
- ✅ Restore de WordPress
- ✅ Suporte a servidores remotos
- ✅ Validação de backup completo
- ✅ Opção de restaurar em outro recurso

#### Gerenciar Backups
- ✅ Listar backups com filtros
- ✅ Deletar backups (arquivo + registro)
- ✅ Download de backups
- ✅ Formatação de tamanho (bytes → KB/MB/GB)

### 3. **API REST** (`/api/backups`)

#### Rotas Implementadas
```
GET    /api/backups                      # Listar todos os backups
GET    /api/backups/:id                  # Obter backup específico
POST   /api/backups                      # Criar backup manual
POST   /api/backups/database/:id         # Backup de banco
POST   /api/backups/project/:id          # Backup de projeto
POST   /api/backups/wordpress/:id        # Backup de WordPress
POST   /api/backups/:id/restore          # Restaurar backup
DELETE /api/backups/:id                  # Deletar backup
GET    /api/backups/:id/download         # Download de backup
POST   /api/backups/upload               # Upload de backup (TODO)
```

#### Autenticação
- ✅ Todas as rotas protegidas com middleware `protect`
- ✅ Validação de userId em todas as operações
- ✅ Isolamento de dados por usuário

### 4. **Interface Frontend** (`BackupManager.tsx`)

#### Componente Principal
- ✅ Lista de backups com cards visuais
- ✅ Filtros por tipo e recurso
- ✅ Indicadores de status (ícones coloridos)
- ✅ Informações detalhadas (tamanho, data, tipo)
- ✅ Suporte a dark mode
- ✅ Responsivo

#### Ações Disponíveis
- ✅ Criar backup (modal)
- ✅ Restaurar backup (confirmação)
- ✅ Download de backup
- ✅ Deletar backup (confirmação)
- ✅ Atualizar lista
- ✅ Feedback visual (toasts)

#### Modal de Criação
- ✅ Seleção de tipo de armazenamento (local/minio)
- ✅ Aviso sobre tempo de processamento
- ✅ Loading state durante criação
- ✅ Validação de campos

---

## 🔧 Como Usar

### 1. **Criar Backup via API**

#### Backup de Banco de Dados
```bash
curl -X POST http://localhost:5000/api/backups/database/DATABASE_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storageType": "local"
  }'
```

#### Backup de Projeto
```bash
curl -X POST http://localhost:5000/api/backups/project/PROJECT_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storageType": "local"
  }'
```

#### Backup com MinIO
```bash
curl -X POST http://localhost:5000/api/backups/database/DATABASE_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storageType": "minio",
    "minioConfig": {
      "endpoint": "minio.example.com",
      "port": 9000,
      "accessKey": "minioadmin",
      "secretKey": "minioadmin",
      "bucket": "backups"
    }
  }'
```

### 2. **Restaurar Backup**

```bash
curl -X POST http://localhost:5000/api/backups/BACKUP_ID/restore \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

#### Restaurar em Outro Recurso
```bash
curl -X POST http://localhost:5000/api/backups/BACKUP_ID/restore \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetResourceId": "OTHER_RESOURCE_ID"
  }'
```

### 3. **Listar Backups**

```bash
# Todos os backups
curl http://localhost:5000/api/backups \
  -H "Authorization: Bearer TOKEN"

# Filtrar por tipo
curl http://localhost:5000/api/backups?type=database \
  -H "Authorization: Bearer TOKEN"

# Filtrar por recurso
curl http://localhost:5000/api/backups?resourceId=DATABASE_ID \
  -H "Authorization: Bearer TOKEN"

# Filtrar por status
curl http://localhost:5000/api/backups?status=completed \
  -H "Authorization: Bearer TOKEN"
```

### 4. **Download de Backup**

```bash
curl http://localhost:5000/api/backups/BACKUP_ID/download \
  -H "Authorization: Bearer TOKEN" \
  -o backup.tar.gz
```

### 5. **Deletar Backup**

```bash
curl -X DELETE http://localhost:5000/api/backups/BACKUP_ID \
  -H "Authorization: Bearer TOKEN"
```

---

## 🎨 Interface Frontend

### Usar o Componente

```tsx
import BackupManager from '@/components/BackupManager';

// Mostrar todos os backups do usuário
<BackupManager />

// Mostrar backups de um banco específico
<BackupManager 
  resourceId="database_id" 
  resourceType="database" 
/>

// Mostrar backups de um projeto específico
<BackupManager 
  resourceId="project_id" 
  resourceType="project" 
/>
```

### Integrar no Dashboard

```tsx
// Em ServiceItem.tsx ou modal de detalhes
import BackupManager from './BackupManager';

const [showBackups, setShowBackups] = useState(false);

// Botão para abrir backups
<button onClick={() => setShowBackups(true)}>
  <HardDrive className="w-4 h-4" />
  Backups
</button>

// Modal de backups
{showBackups && (
  <div className="modal">
    <BackupManager 
      resourceId={item._id} 
      resourceType={type} 
    />
  </div>
)}
```

---

## 📁 Estrutura de Arquivos

### Backend
```
backend/
├── src/
│   ├── models/
│   │   └── Backup.ts              # Modelo de dados
│   ├── services/
│   │   └── BackupService.ts       # Lógica de backup/restore
│   ├── routes/
│   │   └── backups.ts             # Rotas da API
│   └── index.ts                   # Registro de rotas
```

### Frontend
```
frontend/
└── src/
    └── components/
        └── BackupManager.tsx      # Interface de gerenciamento
```

---

## 🔐 Segurança

### Autenticação
- ✅ Todas as rotas protegidas com JWT
- ✅ Validação de userId em todas as operações
- ✅ Isolamento de dados por usuário

### Validações
- ✅ Verificação de propriedade do recurso
- ✅ Validação de status do backup antes de restaurar
- ✅ Confirmação obrigatória para restore e delete
- ✅ Tratamento de erros completo

### Armazenamento
- ✅ Backups locais em diretório protegido
- ✅ Suporte a MinIO/S3 com credenciais
- ✅ Compressão automática (gzip)
- ✅ Preparado para criptografia (futuro)

---

## 🚀 Próximas Melhorias

### 1. **Backups Agendados** (Cron Jobs)
```typescript
// Já preparado no modelo
schedule: {
  enabled: true,
  frequency: 'daily',
  time: '02:00',
  retention: 7 // dias
}
```

### 2. **Upload de Backup Manual**
- Implementar upload de arquivo usando `multer`
- Validar formato e integridade
- Registrar no banco de dados

### 3. **Criptografia**
- Criptografar backups sensíveis
- Usar chave do usuário ou sistema
- Descriptografar automaticamente no restore

### 4. **Retenção Automática**
- Deletar backups antigos automaticamente
- Baseado em política de retenção
- Notificar usuário antes de deletar

### 5. **Backup Incremental**
- Backup apenas de mudanças
- Reduzir tamanho e tempo
- Manter histórico de versões

### 6. **Notificações**
- Email quando backup completa
- Alerta quando backup falha
- Relatório semanal de backups

### 7. **Verificação de Integridade**
- Checksum (MD5/SHA256)
- Teste de restore automático
- Validação de dados

---

## 📊 Tipos de Backup Suportados

### 1. **Bancos de Dados**
| Tipo | Comando | Formato |
|------|---------|---------|
| MongoDB | `mongodump` | `.archive.gz` |
| MySQL | `mysqldump` | `.sql.gz` |
| MariaDB | `mysqldump` | `.sql.gz` |
| PostgreSQL | `pg_dump` | `.sql.gz` |
| Redis | `redis-cli SAVE` | `.rdb` |

### 2. **Projetos**
- Volumes Docker completos
- Arquivos de configuração
- Dados persistentes
- Formato: `.tar.gz`

### 3. **WordPress**
- Banco de dados MySQL
- Arquivos `/var/www/html`
- Uploads e plugins
- Formato: `.tar.gz`

---

## 🐛 Troubleshooting

### Erro: "Backup não encontrado"
- Verificar se backup pertence ao usuário
- Verificar se ID está correto
- Verificar se backup não foi deletado

### Erro: "Arquivo de backup não encontrado"
- Verificar se arquivo existe em `/opt/deploy-manager/backups`
- Verificar permissões do diretório
- Verificar espaço em disco

### Erro: "Container não encontrado"
- Verificar se container está rodando
- Fazer deploy antes de criar backup
- Verificar logs do Docker

### Erro: "Erro ao conectar no servidor"
- Verificar credenciais SSH
- Verificar se servidor está online
- Verificar firewall e portas

### Backup muito lento
- Verificar tamanho do banco/projeto
- Verificar velocidade da rede (se remoto)
- Considerar backup incremental
- Verificar recursos do servidor

---

## 📝 Exemplo Completo

### 1. Criar Backup de Banco MongoDB

```typescript
// Frontend
const createBackup = async () => {
  try {
    const response = await api.post('/backups/database/65abc123', {
      storageType: 'local'
    });
    console.log('Backup criado:', response.data);
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

### 2. Listar Backups

```typescript
const listBackups = async () => {
  const response = await api.get('/backups?type=database');
  console.log('Backups:', response.data);
};
```

### 3. Restaurar Backup

```typescript
const restoreBackup = async (backupId: string) => {
  if (confirm('Restaurar backup?')) {
    await api.post(`/backups/${backupId}/restore`);
    alert('Backup restaurado!');
  }
};
```

### 4. Download de Backup

```typescript
const downloadBackup = async (backupId: string) => {
  const response = await api.get(`/backups/${backupId}/download`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'backup.tar.gz';
  link.click();
};
```

---

## ✅ Checklist de Implementação

- [x] Modelo de dados (Backup.ts)
- [x] Serviço de backup (BackupService.ts)
- [x] Rotas da API (backups.ts)
- [x] Registro de rotas (index.ts)
- [x] Componente frontend (BackupManager.tsx)
- [x] Backup de bancos de dados
- [x] Backup de projetos
- [x] Backup de WordPress
- [x] Suporte a servidores remotos
- [x] Upload para MinIO/S3
- [x] Restore de backups
- [x] Download de backups
- [x] Deletar backups
- [x] Interface visual completa
- [x] Documentação completa
- [ ] Backups agendados (futuro)
- [ ] Upload manual de backup (futuro)
- [ ] Criptografia (futuro)
- [ ] Retenção automática (futuro)

---

## 🎉 Conclusão

Sistema de backup e restore **100% funcional** e pronto para uso em produção!

**Principais Vantagens:**
- ✅ Backup de múltiplos tipos de recursos
- ✅ Suporte a servidores locais e remotos
- ✅ Armazenamento local e MinIO/S3
- ✅ Interface visual intuitiva
- ✅ API REST completa
- ✅ Segurança e isolamento por usuário
- ✅ Compressão automática
- ✅ Tratamento de erros robusto

**Pronto para:**
- Backup manual de bancos, projetos e WordPress
- Restore rápido em caso de problemas
- Download de backups para armazenamento externo
- Integração com MinIO/S3 para backup remoto
- Expansão futura com agendamento e automação
