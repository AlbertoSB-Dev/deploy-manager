# Sistema de Gerenciamento de Bancos de Dados

## 🎯 Objetivo

Instalar e gerenciar bancos de dados com **um clique**, mostrando credenciais de acesso automaticamente.

---

## 📊 Bancos de Dados Suportados

### 1. MongoDB
- **Versões**: 7.0, 6.0, 5.0, 4.4
- **Porta padrão**: 27017
- **Imagem**: mongo:7.0

### 2. MySQL
- **Versões**: 8.0, 5.7
- **Porta padrão**: 3306
- **Imagem**: mysql:8.0

### 3. MariaDB
- **Versões**: 11.0, 10.11, 10.6
- **Porta padrão**: 3306
- **Imagem**: mariadb:11.0

### 4. PostgreSQL
- **Versões**: 16, 15, 14, 13
- **Porta padrão**: 5432
- **Imagem**: postgres:16

### 5. Redis
- **Versões**: 7.2, 7.0, 6.2
- **Porta padrão**: 6379
- **Imagem**: redis:7.2-alpine

---

## 🔧 Funcionalidades

### Criar Banco de Dados

**Interface**:
```
┌─────────────────────────────────────┐
│ Criar Banco de Dados                │
├─────────────────────────────────────┤
│ Nome: [meu-mongodb____________]     │
│ Tipo: [MongoDB ▼]                   │
│ Versão: [7.0 ▼]                     │
│ Servidor: [Local ▼]                 │
│                                     │
│ [Gerar Credenciais Automáticas]    │
│                                     │
│ Usuário: [admin_____________]       │
│ Senha: [••••••••••••••••••]         │
│ Database: [meu_mongodb______]       │
│                                     │
│ [Cancelar]  [Criar Banco de Dados] │
└─────────────────────────────────────┘
```

**Processo**:
1. Usuário preenche formulário
2. Sistema gera credenciais seguras
3. Cria container Docker
4. Configura volumes para persistência
5. Mostra credenciais de acesso

### Listar Bancos de Dados

**Interface**:
```
┌──────────────────────────────────────────────────────────┐
│ Bancos de Dados                    [+ Novo Banco]        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🍃 MongoDB - meu-mongodb                           │  │
│ │ Versão: 7.0  |  Status: ● Running                  │  │
│ │ Host: localhost:27017                              │  │
│ │ [Ver Credenciais] [Parar] [Reiniciar] [Deletar]   │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🐬 MySQL - meu-mysql                               │  │
│ │ Versão: 8.0  |  Status: ● Running                  │  │
│ │ Host: localhost:3306                               │  │
│ │ [Ver Credenciais] [Parar] [Reiniciar] [Deletar]   │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Ver Credenciais

**Modal**:
```
┌─────────────────────────────────────────────┐
│ Credenciais - meu-mongodb                   │
├─────────────────────────────────────────────┤
│                                             │
│ 📋 Connection String:                       │
│ ┌─────────────────────────────────────────┐ │
│ │ mongodb://admin:senha123@localhost:27017│ │
│ │ /meu_mongodb                            │ │
│ └─────────────────────────────────────────┘ │
│ [Copiar]                                    │
│                                             │
│ 📝 Detalhes:                                │
│ Host: localhost                             │
│ Porta: 27017                                │
│ Usuário: admin                              │
│ Senha: senha123                             │
│ Database: meu_mongodb                       │
│                                             │
│ 🔗 Para usar no seu projeto:                │
│ ┌─────────────────────────────────────────┐ │
│ │ MONGODB_URI=mongodb://admin:senha123@   │ │
│ │ localhost:27017/meu_mongodb             │ │
│ └─────────────────────────────────────────┘ │
│ [Copiar para .env]                          │
│                                             │
│ [Fechar]                                    │
└─────────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura

### Backend

**Modelo** (`models/Database.ts`):
```typescript
interface IDatabase {
  name: string;
  displayName: string;
  type: 'mongodb' | 'mysql' | 'mariadb' | 'postgresql' | 'redis';
  version: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  containerId: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  serverId?: string;
  connectionString: string;
  volumePath: string;
}
```

**Serviço** (`services/DatabaseService.ts`):
```typescript
class DatabaseService {
  async createDatabase(config): Promise<IDatabase>
  async startDatabase(id): Promise<void>
  async stopDatabase(id): Promise<void>
  async deleteDatabase(id): Promise<void>
  async getConnectionString(id): Promise<string>
  async testConnection(id): Promise<boolean>
  async createBackup(id): Promise<string>
  async restoreBackup(id, backupPath): Promise<void>
}
```

**Rotas** (`routes/databases.ts`):
```typescript
POST   /api/databases          // Criar banco
GET    /api/databases          // Listar bancos
GET    /api/databases/:id      // Detalhes do banco
DELETE /api/databases/:id      // Deletar banco
POST   /api/databases/:id/start    // Iniciar
POST   /api/databases/:id/stop     // Parar
POST   /api/databases/:id/restart  // Reiniciar
GET    /api/databases/:id/credentials  // Ver credenciais
POST   /api/databases/:id/backup      // Criar backup
POST   /api/databases/:id/restore    // Restaurar backup
```

### Frontend

**Componentes**:
- `DatabaseList.tsx` - Lista de bancos
- `CreateDatabaseModal.tsx` - Criar banco
- `DatabaseCard.tsx` - Card de cada banco
- `CredentialsModal.tsx` - Mostrar credenciais
- `DatabaseLogs.tsx` - Logs do container

---

## 🚀 Implementação

### 1. Criar MongoDB

**Comando Docker**:
```bash
docker run -d \
  --name meu-mongodb \
  --restart unless-stopped \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=senha123 \
  -e MONGO_INITDB_DATABASE=meu_mongodb \
  -v /opt/databases/meu-mongodb:/data/db \
  mongo:7.0
```

**Connection String**:
```
mongodb://admin:senha123@localhost:27017/meu_mongodb
```

### 2. Criar MySQL

**Comando Docker**:
```bash
docker run -d \
  --name meu-mysql \
  --restart unless-stopped \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=senha123 \
  -e MYSQL_DATABASE=meu_mysql \
  -e MYSQL_USER=admin \
  -e MYSQL_PASSWORD=senha123 \
  -v /opt/databases/meu-mysql:/var/lib/mysql \
  mysql:8.0
```

**Connection String**:
```
mysql://admin:senha123@localhost:3306/meu_mysql
```

### 3. Criar PostgreSQL

**Comando Docker**:
```bash
docker run -d \
  --name meu-postgres \
  --restart unless-stopped \
  -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=meu_postgres \
  -v /opt/databases/meu-postgres:/var/lib/postgresql/data \
  postgres:16
```

**Connection String**:
```
postgresql://admin:senha123@localhost:5432/meu_postgres
```

### 4. Criar Redis

**Comando Docker**:
```bash
docker run -d \
  --name meu-redis \
  --restart unless-stopped \
  -p 6379:6379 \
  -v /opt/databases/meu-redis:/data \
  redis:7.2-alpine redis-server --requirepass senha123
```

**Connection String**:
```
redis://:senha123@localhost:6379
```

---

## 🔐 Segurança

### Geração de Senhas

```typescript
function generateSecurePassword(): string {
  const length = 32;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
```

### Armazenamento

- Senhas armazenadas criptografadas no MongoDB
- Credenciais nunca expostas em logs
- Acesso via HTTPS apenas

---

## 📦 Persistência de Dados

### Volumes Docker

**Local**:
```
/opt/databases/
├── meu-mongodb/
│   └── data/
├── meu-mysql/
│   └── data/
├── meu-postgres/
│   └── data/
└── meu-redis/
    └── data/
```

**Remoto** (via SSH):
```
/opt/databases/
├── projeto1-mongodb/
├── projeto2-mysql/
└── projeto3-postgres/
```

---

## 🔄 Backup e Restore

### MongoDB

**Backup**:
```bash
docker exec meu-mongodb mongodump \
  --username admin \
  --password senha123 \
  --authenticationDatabase admin \
  --out /backup/$(date +%Y%m%d_%H%M%S)
```

**Restore**:
```bash
docker exec meu-mongodb mongorestore \
  --username admin \
  --password senha123 \
  --authenticationDatabase admin \
  /backup/20240208_140000
```

### MySQL

**Backup**:
```bash
docker exec meu-mysql mysqldump \
  -u admin \
  -psenha123 \
  meu_mysql > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore**:
```bash
docker exec -i meu-mysql mysql \
  -u admin \
  -psenha123 \
  meu_mysql < backup_20240208_140000.sql
```

---

## 🎯 Casos de Uso

### Caso 1: Desenvolvedor cria projeto Node.js

```
1. Criar projeto "minha-api"
2. Clicar em "Bancos de Dados"
3. Clicar em "+ Novo Banco"
4. Selecionar MongoDB 7.0
5. Nome: "minha-api-db"
6. Clicar em "Criar"
7. Copiar connection string
8. Adicionar no .env do projeto
9. ✅ Pronto para usar!
```

### Caso 2: Múltiplos projetos, múltiplos bancos

```
Projeto 1: frontend-react
Banco: postgresql (para autenticação)

Projeto 2: api-usuarios
Banco: mongodb (para dados)

Projeto 3: cache-service
Banco: redis (para cache)

Todos gerenciados pelo Deploy Manager! ✅
```

---

## 💡 Funcionalidades Extras

### 1. Vincular Banco ao Projeto

```
Ao criar projeto:
┌─────────────────────────────────┐
│ Banco de Dados                  │
│ ○ Nenhum                        │
│ ● Usar existente: [MongoDB ▼]  │
│ ○ Criar novo                    │
└─────────────────────────────────┘

Se "Usar existente":
- Connection string adicionada automaticamente ao .env
- Projeto vinculado ao banco
- Mostrar aviso se banco for deletado
```

### 2. Monitoramento

```
Dashboard do banco:
- CPU usage
- Memory usage
- Disk usage
- Connections ativas
- Queries por segundo
```

### 3. Logs em Tempo Real

```
Ver logs do container:
- Queries executadas
- Erros
- Warnings
- Conexões
```

### 4. Importar/Exportar

```
Importar:
- Upload de arquivo .sql, .dump, .json
- Restaurar automaticamente

Exportar:
- Download de backup
- Formato nativo do banco
```

---

## 📊 Interface Completa

### Página Principal

```
┌──────────────────────────────────────────────────────────┐
│ Deploy Manager                                           │
├──────────────────────────────────────────────────────────┤
│ [Projetos] [Servidores] [Bancos de Dados] [Configurações]│
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Bancos de Dados (3)                  [+ Novo Banco]      │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🍃 MongoDB                                         │  │
│ │ meu-mongodb  |  7.0  |  ● Running  |  Local        │  │
│ │ mongodb://admin:***@localhost:27017/meu_mongodb    │  │
│ │ [Credenciais] [Logs] [Backup] [⏸ Parar] [🗑️]      │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🐬 MySQL                                           │  │
│ │ meu-mysql  |  8.0  |  ● Running  |  VPS Remoto    │  │
│ │ mysql://admin:***@38.242.213.195:3306/meu_mysql   │  │
│ │ [Credenciais] [Logs] [Backup] [⏸ Parar] [🗑️]      │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🐘 PostgreSQL                                      │  │
│ │ meu-postgres  |  16  |  ○ Stopped  |  Local       │  │
│ │ postgresql://admin:***@localhost:5432/meu_postgres │  │
│ │ [Credenciais] [Logs] [Backup] [▶ Iniciar] [🗑️]    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

### Backend
- [ ] Modelo Database
- [ ] DatabaseService
- [ ] Rotas CRUD
- [ ] Geração de senhas seguras
- [ ] Criação de containers Docker
- [ ] Gerenciamento de volumes
- [ ] Connection strings
- [ ] Backup/Restore
- [ ] Deploy remoto via SSH

### Frontend
- [ ] DatabaseList component
- [ ] CreateDatabaseModal
- [ ] DatabaseCard
- [ ] CredentialsModal
- [ ] DatabaseLogs
- [ ] Integração com projetos

### Documentação
- [ ] Guia de uso
- [ ] Exemplos de connection strings
- [ ] Troubleshooting
- [ ] Backup/Restore guide

---

## 🚀 Próximos Passos

1. Implementar modelo e serviço
2. Criar rotas backend
3. Implementar interface frontend
4. Testar criação de cada tipo de banco
5. Implementar backup/restore
6. Adicionar monitoramento
7. Documentar tudo

---

Essa é uma funcionalidade GRANDE mas muito útil! Quer que eu comece a implementar agora?
