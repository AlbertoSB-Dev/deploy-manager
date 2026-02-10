# Sistema de Backup - Planejamento

## Objetivo
Implementar sistema de backup automático para bancos de dados e arquivos (MinIO/S3), com download via painel através de SSH.

## Funcionalidades

### Fluxo de Uso

#### Cenário 1: Usuário instala MongoDB
1. Usuário faz deploy de container MongoDB
2. Sistema detecta que é um banco de dados
3. Painel mostra opção "Gerenciar Backups"
4. Usuário pode:
   - ✅ Criar backup manual
   - ✅ Agendar backups automáticos
   - ✅ Listar backups existentes
   - ✅ Download de backup
   - ✅ Restaurar backup (escolhe qual backup)
   - ✅ Upload de backup externo para restaurar

#### Cenário 2: Usuário instala MinIO
1. Usuário faz deploy de container MinIO
2. Sistema detecta que é storage/object storage
3. Painel mostra opção "Gerenciar Backups"
4. Usuário pode:
   - ✅ Fazer backup de buckets específicos
   - ✅ Fazer backup de todos os buckets
   - ✅ Download de backup
   - ✅ Upload de backup para restaurar
   - ✅ Restaurar backup (escolhe qual bucket)
   - ✅ Navegar arquivos dentro do MinIO

### 1. Backup de Bancos de Dados

#### Bancos Suportados
- **PostgreSQL** - `pg_dump`
- **MySQL/MariaDB** - `mysqldump`
- **MongoDB** - `mongodump`
- **Redis** - `redis-cli SAVE` + cópia do RDB

#### Recursos
- ✅ Backup manual (sob demanda)
- ✅ Backup automático (agendado via cron)
- ✅ Retenção configurável (manter últimos N backups)
- ✅ Compressão automática (gzip)
- ✅ Download via painel
- ✅ **Upload de backup externo** (usuário envia .sql.gz ou .tar.gz)
- ✅ **Restauração via painel** (escolhe backup da lista ou upload)
- ✅ Listagem de backups disponíveis
- ✅ Exclusão de backups antigos
- ✅ **Validação de backup** (verifica integridade antes de restaurar)

### 2. Backup de Arquivos (MinIO/S3)

#### Recursos
- ✅ Backup de buckets MinIO (individual ou todos)
- ✅ Sincronização com S3 externo (opcional)
- ✅ Download de arquivos via painel
- ✅ **Upload de backup externo** (usuário envia .tar.gz)
- ✅ **Restauração de bucket** (escolhe backup ou upload)
- ✅ Navegação de diretórios/buckets
- ✅ Compressão de múltiplos arquivos
- ✅ **Preview de arquivos** (imagens, PDFs, etc)

### 3. Interface do Painel

#### Tela de Gerenciamento de Recursos
```
┌─────────────────────────────────────────────────┐
│ Projeto: Sistema de Teste                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ Recursos Detectados:                           │
│                                                 │
│ 🗄️  MongoDB (container: mongodb-prod)          │
│     Status: ✅ Rodando | Porta: 27017          │
│     [Gerenciar Backups] [Logs] [Restart]       │
│                                                 │
│ 📦 MinIO (container: minio-storage)            │
│     Status: ✅ Rodando | Porta: 9000           │
│     [Gerenciar Backups] [Acessar Console]      │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Tela de Backups - MongoDB
```
┌─────────────────────────────────────────────────┐
│ Backups - MongoDB (mongodb-prod)               │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Criar Backup] [Upload Backup] [Configurações] │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Backups Disponíveis                     │   │
│ │                                         │   │
│ │ ✓ backup-2026-02-09-18-30.tar.gz       │   │
│ │   MongoDB | 2.5 MB | Há 2 horas        │   │
│ │   Database: production                  │   │
│ │   [Download] [Restaurar] [Excluir]     │   │
│ │                                         │   │
│ │ ✓ backup-2026-02-09-12-00.tar.gz       │   │
│ │   MongoDB | 2.4 MB | Há 8 horas        │   │
│ │   Database: production                  │   │
│ │   [Download] [Restaurar] [Excluir]     │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Upload de Backup Externo                │   │
│ │                                         │   │
│ │ Arraste um arquivo .tar.gz ou clique:   │   │
│ │ [Selecionar Arquivo]                    │   │
│ │                                         │   │
│ │ ⚠️  O backup será validado antes de     │   │
│ │    permitir restauração                 │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Backup Automático                       │   │
│ │                                         │   │
│ │ ☑ Ativar backup automático              │   │
│ │ Frequência: [Diário ▼] às [03:00]      │   │
│ │ Manter últimos: [7] backups             │   │
│ │                                         │   │
│ │ [Salvar Configuração]                   │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### Tela de Backups - MinIO
```
┌─────────────────────────────────────────────────┐
│ Backups - MinIO (minio-storage)                │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Criar Backup] [Upload Backup] [Navegar]       │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Selecione o Bucket para Backup          │   │
│ │                                         │   │
│ │ ☑ uploads (2.3 GB)                      │   │
│ │ ☑ images (1.5 GB)                       │   │
│ │ ☐ temp (500 MB)                         │   │
│ │                                         │   │
│ │ [Backup Selecionados] [Backup Todos]    │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Backups Disponíveis                     │   │
│ │                                         │   │
│ │ ✓ minio-uploads-2026-02-09.tar.gz      │   │
│ │   Bucket: uploads | 2.3 GB | Há 1 dia  │   │
│ │   [Download] [Restaurar] [Excluir]     │   │
│ │                                         │   │
│ │ ✓ minio-all-2026-02-08.tar.gz          │   │
│ │   Todos os buckets | 4.1 GB | Há 2 dias│   │
│ │   [Download] [Restaurar] [Excluir]     │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Restaurar Backup                        │   │
│ │                                         │   │
│ │ Origem:                                 │   │
│ │ ○ Backup existente (selecione acima)    │   │
│ │ ● Upload novo backup                    │   │
│ │                                         │   │
│ │ [Selecionar Arquivo .tar.gz]            │   │
│ │                                         │   │
│ │ Destino:                                │   │
│ │ Bucket: [uploads ▼]                     │   │
│ │                                         │   │
│ │ ⚠️  Atenção: Isso irá sobrescrever      │   │
│ │    os dados existentes no bucket        │   │
│ │                                         │   │
│ │ [Restaurar Agora]                       │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### Modal de Restauração
```
┌─────────────────────────────────────────────────┐
│ ⚠️  Confirmar Restauração                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ Você está prestes a restaurar:                 │
│                                                 │
│ Backup: backup-2026-02-09-18-30.tar.gz         │
│ Tamanho: 2.5 MB                                │
│ Data: 09/02/2026 18:30                         │
│                                                 │
│ Destino: MongoDB (mongodb-prod)                │
│ Database: production                           │
│                                                 │
│ ⚠️  ATENÇÃO:                                    │
│ • Os dados atuais serão substituídos           │
│ • Recomendamos fazer backup antes              │
│ • O container será reiniciado                  │
│                                                 │
│ ☑ Fazer backup dos dados atuais antes          │
│                                                 │
│ [Cancelar] [Confirmar Restauração]             │
└─────────────────────────────────────────────────┘
```

## Estrutura de Arquivos

### Diretório de Backups no Servidor
```
/opt/backups/
├── databases/
│   ├── projeto-1/
│   │   ├── postgres/
│   │   │   ├── backup-2026-02-09-18-30.sql.gz
│   │   │   ├── backup-2026-02-09-12-00.sql.gz
│   │   │   └── backup-2026-02-08-18-30.sql.gz
│   │   ├── mysql/
│   │   └── mongodb/
│   └── projeto-2/
└── files/
    ├── projeto-1/
    │   ├── minio-bucket-1.tar.gz
    │   └── uploads.tar.gz
    └── projeto-2/
```

## Implementação

### Backend

#### 1. Model: Backup
```typescript
interface IBackup {
  projectId: ObjectId;
  userId: ObjectId;
  type: 'database' | 'files';
  dbType?: 'postgres' | 'mysql' | 'mongodb' | 'redis';
  filename: string;
  filepath: string;
  size: number;
  createdAt: Date;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}
```

#### 2. Service: BackupService
```typescript
class BackupService {
  // Detecção de recursos
  async detectResources(projectId): Promise<Resource[]>
  
  // Bancos de dados - BACKUP
  async backupPostgres(resourceId, dbConfig)
  async backupMySQL(resourceId, dbConfig)
  async backupMongoDB(resourceId, dbConfig)
  async backupRedis(resourceId, dbConfig)
  
  // Bancos de dados - RESTORE
  async restorePostgres(resourceId, backupId, options)
  async restoreMySQL(resourceId, backupId, options)
  async restoreMongoDB(resourceId, backupId, options)
  async restoreRedis(resourceId, backupId, options)
  
  // Arquivos - BACKUP
  async backupMinIO(resourceId, buckets: string[])
  async backupFiles(resourceId, paths: string[])
  
  // Arquivos - RESTORE
  async restoreMinIO(resourceId, backupId, targetBucket)
  async restoreFiles(resourceId, backupId, targetPath)
  
  // Upload de backup externo
  async uploadBackup(resourceId, file: File, metadata)
  async validateBackup(backupId): Promise<ValidationResult>
  
  // Gerenciamento
  async listBackups(resourceId)
  async downloadBackup(backupId): Promise<Stream>
  async deleteBackup(backupId)
  
  // Automação
  async scheduleBackup(resourceId, schedule)
  async cleanOldBackups(resourceId, keepLast)
}
```

#### 3. Model: Resource (novo)
```typescript
interface IResource {
  projectId: ObjectId;
  userId: ObjectId;
  containerId: string;
  name: string;
  type: 'postgres' | 'mysql' | 'mongodb' | 'redis' | 'minio' | 's3' | 'other';
  config: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    database?: string;
    // MinIO específico
    accessKey?: string;
    secretKey?: string;
    buckets?: string[];
  };
  backupEnabled: boolean;
  backupSchedule?: string; // cron expression
  backupRetention: number; // dias ou quantidade
  createdAt: Date;
  updatedAt: Date;
}
```

#### 4. Routes: /api/resources & /api/backups
```typescript
// Recursos
GET    /api/projects/:projectId/resources          // Listar recursos detectados
POST   /api/projects/:projectId/resources          // Adicionar recurso manualmente
GET    /api/projects/:projectId/resources/:id      // Detalhes do recurso
PUT    /api/projects/:projectId/resources/:id      // Atualizar configuração
DELETE /api/projects/:projectId/resources/:id      // Remover recurso

// Backups
GET    /api/resources/:resourceId/backups          // Listar backups
POST   /api/resources/:resourceId/backups          // Criar backup
POST   /api/resources/:resourceId/backups/upload   // Upload de backup externo
GET    /api/resources/:resourceId/backups/:id      // Detalhes do backup
DELETE /api/resources/:resourceId/backups/:id      // Excluir backup
GET    /api/resources/:resourceId/backups/:id/download  // Download
POST   /api/resources/:resourceId/backups/:id/restore   // Restaurar
POST   /api/resources/:resourceId/backups/:id/validate  // Validar integridade
PUT    /api/resources/:resourceId/schedule         // Configurar agendamento

// MinIO específico
GET    /api/resources/:resourceId/minio/buckets    // Listar buckets
GET    /api/resources/:resourceId/minio/browse     // Navegar arquivos
POST   /api/resources/:resourceId/minio/backup     // Backup de buckets específicos
```

### Scripts de Backup e Restore

#### restore-mongodb.sh
```bash
#!/bin/bash
RESOURCE_ID=$1
BACKUP_FILE=$2
DB_HOST=$3
DB_PORT=$4
DB_NAME=$5
DB_USER=$6
DB_PASSWORD=$7

echo "🔄 Restaurando MongoDB..."

# Extrair backup
TEMP_DIR="/tmp/mongorestore-$(date +%s)"
mkdir -p $TEMP_DIR
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# Restaurar
mongorestore \
  --host $DB_HOST \
  --port $DB_PORT \
  --username $DB_USER \
  --password $DB_PASSWORD \
  --db $DB_NAME \
  --drop \
  $TEMP_DIR/*/

# Limpar
rm -rf $TEMP_DIR

echo "✅ Restauração concluída!"
```

#### restore-postgres.sh
```bash
#!/bin/bash
RESOURCE_ID=$1
BACKUP_FILE=$2
DB_HOST=$3
DB_PORT=$4
DB_NAME=$5
DB_USER=$6
DB_PASSWORD=$7

echo "🔄 Restaurando PostgreSQL..."

# Descomprimir e restaurar
PGPASSWORD=$DB_PASSWORD gunzip -c $BACKUP_FILE | psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME

echo "✅ Restauração concluída!"
```

#### restore-minio.sh
```bash
#!/bin/bash
RESOURCE_ID=$1
BACKUP_FILE=$2
MINIO_HOST=$3
MINIO_ACCESS_KEY=$4
MINIO_SECRET_KEY=$5
TARGET_BUCKET=$6

echo "🔄 Restaurando MinIO bucket: $TARGET_BUCKET..."

# Extrair backup
TEMP_DIR="/tmp/miniorestore-$(date +%s)"
mkdir -p $TEMP_DIR
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# Configurar mc
mc alias set restore http://$MINIO_HOST $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Limpar bucket existente (opcional)
mc rm --recursive --force restore/$TARGET_BUCKET/

# Restaurar
mc mirror $TEMP_DIR/ restore/$TARGET_BUCKET/

# Limpar
rm -rf $TEMP_DIR

echo "✅ Restauração concluída!"
```

#### validate-backup.sh
```bash
#!/bin/bash
BACKUP_FILE=$1
BACKUP_TYPE=$2

echo "🔍 Validando backup..."

case $BACKUP_TYPE in
  "mongodb")
    # Verificar se é tar.gz válido
    if tar -tzf $BACKUP_FILE > /dev/null 2>&1; then
      echo "✅ Backup MongoDB válido"
      exit 0
    else
      echo "❌ Backup MongoDB inválido"
      exit 1
    fi
    ;;
    
  "postgres"|"mysql")
    # Verificar se é gzip válido
    if gunzip -t $BACKUP_FILE > /dev/null 2>&1; then
      echo "✅ Backup SQL válido"
      exit 0
    else
      echo "❌ Backup SQL inválido"
      exit 1
    fi
    ;;
    
  "minio")
    # Verificar se é tar.gz válido
    if tar -tzf $BACKUP_FILE > /dev/null 2>&1; then
      echo "✅ Backup MinIO válido"
      exit 0
    else
      echo "❌ Backup MinIO inválido"
      exit 1
    fi
    ;;
    
  *)
    echo "❌ Tipo de backup desconhecido"
    exit 1
    ;;
esac
```

#### backup-postgres.sh
```bash
#!/bin/bash
PROJECT_NAME=$1
DB_HOST=$2
DB_PORT=$3
DB_NAME=$4
DB_USER=$5
DB_PASSWORD=$6

BACKUP_DIR="/opt/backups/databases/$PROJECT_NAME/postgres"
TIMESTAMP=$(date +%Y-%m-%d-%H-%M)
FILENAME="backup-$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  | gzip > "$BACKUP_DIR/$FILENAME"

echo "$BACKUP_DIR/$FILENAME"
```

#### backup-mysql.sh
```bash
#!/bin/bash
PROJECT_NAME=$1
DB_HOST=$2
DB_PORT=$3
DB_NAME=$4
DB_USER=$5
DB_PASSWORD=$6

BACKUP_DIR="/opt/backups/databases/$PROJECT_NAME/mysql"
TIMESTAMP=$(date +%Y-%m-%d-%H-%M)
FILENAME="backup-$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

mysqldump \
  -h $DB_HOST \
  -P $DB_PORT \
  -u $DB_USER \
  -p$DB_PASSWORD \
  $DB_NAME \
  | gzip > "$BACKUP_DIR/$FILENAME"

echo "$BACKUP_DIR/$FILENAME"
```

#### backup-mongodb.sh
```bash
#!/bin/bash
PROJECT_NAME=$1
DB_HOST=$2
DB_PORT=$3
DB_NAME=$4
DB_USER=$5
DB_PASSWORD=$6

BACKUP_DIR="/opt/backups/databases/$PROJECT_NAME/mongodb"
TIMESTAMP=$(date +%Y-%m-%d-%H-%M)
FILENAME="backup-$TIMESTAMP.tar.gz"

mkdir -p $BACKUP_DIR

mongodump \
  --host $DB_HOST \
  --port $DB_PORT \
  --username $DB_USER \
  --password $DB_PASSWORD \
  --db $DB_NAME \
  --out /tmp/mongodump-$TIMESTAMP

tar -czf "$BACKUP_DIR/$FILENAME" -C /tmp mongodump-$TIMESTAMP
rm -rf /tmp/mongodump-$TIMESTAMP

echo "$BACKUP_DIR/$FILENAME"
```

#### backup-minio.sh
```bash
#!/bin/bash
PROJECT_NAME=$1
MINIO_HOST=$2
MINIO_ACCESS_KEY=$3
MINIO_SECRET_KEY=$4
BUCKET_NAME=$5

BACKUP_DIR="/opt/backups/files/$PROJECT_NAME"
TIMESTAMP=$(date +%Y-%m-%d-%H-%M)
FILENAME="minio-$BUCKET_NAME-$TIMESTAMP.tar.gz"

mkdir -p $BACKUP_DIR

# Configurar mc (MinIO Client)
mc alias set backup http://$MINIO_HOST $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Fazer backup do bucket
mc mirror backup/$BUCKET_NAME /tmp/minio-backup-$TIMESTAMP

# Comprimir
tar -czf "$BACKUP_DIR/$FILENAME" -C /tmp minio-backup-$TIMESTAMP
rm -rf /tmp/minio-backup-$TIMESTAMP

echo "$BACKUP_DIR/$FILENAME"
```

### Frontend

#### Componente: ResourceManager.tsx
```typescript
interface ResourceManagerProps {
  projectId: string;
}

export function ResourceManager({ projectId }: ResourceManagerProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  
  // Detectar recursos automaticamente
  // Listar recursos
  // Adicionar recurso manualmente
  // Abrir gerenciador de backups
}
```

#### Componente: BackupManager.tsx
```typescript
interface BackupManagerProps {
  resourceId: string;
  resourceType: 'mongodb' | 'postgres' | 'mysql' | 'minio' | 'redis';
}

export function BackupManager({ resourceId, resourceType }: BackupManagerProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Listar backups
  // Criar backup
  // Download backup
  // Upload backup externo
  // Restaurar backup (com confirmação)
  // Excluir backup
  // Configurar agendamento
  // Validar backup antes de restaurar
}
```

#### Componente: MinIOBrowser.tsx
```typescript
interface MinIOBrowserProps {
  resourceId: string;
}

export function MinIOBrowser({ resourceId }: MinIOBrowserProps) {
  const [buckets, setBuckets] = useState<string[]>([]);
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([]);
  
  // Listar buckets
  // Selecionar buckets para backup
  // Navegar arquivos dentro do bucket
  // Preview de arquivos
  // Fazer backup de buckets selecionados
}
```

#### Componente: RestoreModal.tsx
```typescript
interface RestoreModalProps {
  backup: Backup;
  resource: Resource;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RestoreModal({ backup, resource, onConfirm, onCancel }: RestoreModalProps) {
  const [createBackupBefore, setCreateBackupBefore] = useState(true);
  
  // Mostrar detalhes do backup
  // Avisos de segurança
  // Opção de fazer backup antes
  // Confirmar restauração
}
```

## Segurança

### Considerações
1. ✅ Backups são isolados por usuário (multi-tenancy)
2. ✅ Credenciais de banco criptografadas
3. ✅ Download via token temporário (expira em 1 hora)
4. ✅ Validação de permissões antes de qualquer operação
5. ✅ Logs de todas as operações de backup/restore
6. ✅ Rate limiting para evitar abuso

### Criptografia (Opcional)
- Backups podem ser criptografados com GPG
- Chave de criptografia armazenada de forma segura
- Descriptografia automática no restore

## Agendamento

### Cron Jobs
```bash
# Backup diário às 3h da manhã
0 3 * * * /opt/deploy-manager/scripts/backup-all-projects.sh

# Limpeza de backups antigos (manter últimos 7)
0 4 * * * /opt/deploy-manager/scripts/cleanup-old-backups.sh 7
```

### Implementação
- Usar `node-cron` para agendamento no backend
- Ou criar cron jobs no servidor via SSH
- Notificar usuário por email em caso de falha

## Monitoramento

### Métricas
- Total de backups por projeto
- Tamanho total ocupado
- Última data de backup
- Taxa de sucesso/falha
- Tempo médio de backup

### Alertas
- ⚠️ Backup falhou
- ⚠️ Espaço em disco baixo
- ⚠️ Backup não executado há X dias
- ✅ Backup concluído com sucesso

## Próximos Passos

1. ✅ Criar model `Backup`
2. ✅ Implementar `BackupService`
3. ✅ Criar scripts de backup (postgres, mysql, mongodb, minio)
4. ✅ Criar rotas da API
5. ✅ Implementar componente frontend
6. ✅ Adicionar agendamento automático
7. ✅ Implementar sistema de limpeza
8. ✅ Adicionar testes
9. ✅ Documentar uso

## Estimativa de Tempo
- Backend: 6-8 horas
- Frontend: 4-6 horas
- Scripts: 2-3 horas
- Testes: 2-3 horas
- **Total: 14-20 horas**

## Dependências
```json
{
  "node-cron": "^3.0.3",
  "archiver": "^6.0.1",
  "tar": "^6.2.0"
}
```

## Referências
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [mysqldump Documentation](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)
- [mongodump Documentation](https://www.mongodb.com/docs/database-tools/mongodump/)
- [MinIO Client](https://min.io/docs/minio/linux/reference/minio-mc.html)
