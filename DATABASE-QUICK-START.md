# Guia Rápido - Sistema de Bancos de Dados

## 🚀 Backend Implementado e Funcionando!

O sistema de gerenciamento de bancos de dados está **pronto para uso** via API REST.

---

## 📋 Como Usar (Via API)

### 1. Criar Banco de Dados MongoDB

```bash
curl -X POST http://localhost:8001/api/databases \
  -H "Content-Type: application/json" \
  -d '{
    "name": "meu-mongodb",
    "displayName": "Meu MongoDB",
    "type": "mongodb",
    "version": "7.0",
    "serverId": "SEU_SERVER_ID_AQUI"
  }'
```

**Resposta**:
```json
{
  "_id": "6988d123...",
  "name": "meu-mongodb",
  "displayName": "Meu MongoDB",
  "type": "mongodb",
  "version": "7.0",
  "host": "38.242.213.195",
  "port": 27017,
  "username": "admin_abc123",
  "password": "XyZ123AbC456DeF789GhI012",
  "database": "meu_mongodb",
  "connectionString": "mongodb://admin_abc123:XyZ123AbC456DeF789GhI012@38.242.213.195:27017/meu_mongodb?authSource=admin",
  "containerId": "a1b2c3d4e5f6",
  "status": "running",
  "volumePath": "/opt/databases/meu-mongodb",
  "createdAt": "2026-02-08T18:30:00.000Z"
}
```

### 2. Listar Todos os Bancos

```bash
curl http://localhost:8001/api/databases
```

### 3. Ver Detalhes de um Banco

```bash
curl http://localhost:8001/api/databases/6988d123...
```

### 4. Ver Logs

```bash
curl http://localhost:8001/api/databases/6988d123.../logs?lines=50
```

### 5. Parar Banco

```bash
curl -X POST http://localhost:8001/api/databases/6988d123.../stop
```

### 6. Iniciar Banco

```bash
curl -X POST http://localhost:8001/api/databases/6988d123.../start
```

### 7. Reiniciar Banco

```bash
curl -X POST http://localhost:8001/api/databases/6988d123.../restart
```

### 8. Deletar Banco

```bash
curl -X DELETE http://localhost:8001/api/databases/6988d123...
```

---

## 🗄️ Tipos de Bancos Suportados

### MongoDB

```json
{
  "name": "meu-mongodb",
  "type": "mongodb",
  "version": "7.0",
  "serverId": "..."
}
```

**Connection String**:
```
mongodb://admin_xyz:senha@38.242.213.195:27017/meu_mongodb?authSource=admin
```

### MySQL

```json
{
  "name": "meu-mysql",
  "type": "mysql",
  "version": "8.0",
  "serverId": "..."
}
```

**Connection String**:
```
mysql://admin_xyz:senha@38.242.213.195:3306/meu_mysql
```

### PostgreSQL

```json
{
  "name": "meu-postgres",
  "type": "postgresql",
  "version": "16",
  "serverId": "..."
}
```

**Connection String**:
```
postgresql://admin_xyz:senha@38.242.213.195:5432/meu_postgres
```

### Redis

```json
{
  "name": "meu-redis",
  "type": "redis",
  "version": "7.2",
  "serverId": "..."
}
```

**Connection String**:
```
redis://:senha@38.242.213.195:6379
```

### MariaDB

```json
{
  "name": "meu-mariadb",
  "type": "mariadb",
  "version": "11.0",
  "serverId": "..."
}
```

**Connection String**:
```
mysql://admin_xyz:senha@38.242.213.195:3306/meu_mariadb
```

---

## 🎯 Exemplo Completo: Criar e Usar MongoDB

### Passo 1: Obter ID do Servidor

```bash
curl http://localhost:8001/api/servers
```

Copiar o `_id` do servidor desejado.

### Passo 2: Criar Banco

```bash
curl -X POST http://localhost:8001/api/databases \
  -H "Content-Type: application/json" \
  -d '{
    "name": "minha-api-db",
    "type": "mongodb",
    "version": "7.0",
    "serverId": "6988b778218e970a665f6251"
  }'
```

### Passo 3: Copiar Connection String

Da resposta, copiar o campo `connectionString`:
```
mongodb://admin_abc123:XyZ123@38.242.213.195:27017/minha_api_db?authSource=admin
```

### Passo 4: Usar no Projeto

Adicionar no `.env` do projeto:
```env
MONGODB_URI=mongodb://admin_abc123:XyZ123@38.242.213.195:27017/minha_api_db?authSource=admin
```

### Passo 5: Conectar no Código

**Node.js (Mongoose)**:
```javascript
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
```

**Node.js (Native)**:
```javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
```

### Passo 6: ✅ Pronto!

Seu projeto agora está conectado ao banco de dados remoto!

---

## 🔍 Verificar Status no Servidor

### SSH no Servidor

```bash
ssh root@38.242.213.195
```

### Ver Containers de Bancos

```bash
docker ps | grep -E "mongo|mysql|postgres|redis|mariadb"
```

### Ver Logs de um Banco

```bash
docker logs meu-mongodb
```

### Ver Volumes

```bash
ls -la /opt/databases/
```

### Testar Conexão

**MongoDB**:
```bash
docker exec meu-mongodb mongosh -u admin_abc123 -p senha --eval "db.version()"
```

**MySQL**:
```bash
docker exec meu-mysql mysql -u admin_abc123 -psenha -e "SELECT VERSION();"
```

**PostgreSQL**:
```bash
docker exec meu-postgres psql -U admin_abc123 -c "SELECT version();"
```

**Redis**:
```bash
docker exec meu-redis redis-cli -a senha PING
```

---

## 💡 Dicas

### Nomes de Bancos

Use nomes descritivos:
- ✅ `minha-api-db`
- ✅ `projeto-usuarios-db`
- ✅ `cache-redis`
- ❌ `db1`
- ❌ `teste`

### Versões

Use versões estáveis:
- MongoDB: 7.0
- MySQL: 8.0
- PostgreSQL: 16
- Redis: 7.2
- MariaDB: 11.0

### Segurança

- Senhas são geradas automaticamente (24 caracteres)
- Nunca compartilhe connection strings publicamente
- Use variáveis de ambiente (.env)

### Backup

Fazer backup regularmente:
```bash
# MongoDB
docker exec meu-mongodb mongodump --out /backup

# MySQL
docker exec meu-mysql mysqldump -u admin -p database > backup.sql

# PostgreSQL
docker exec meu-postgres pg_dump -U admin database > backup.sql
```

---

## 🎉 Próximos Passos

### Interface Frontend (Em Desenvolvimento)

Em breve terá interface visual para:
- ✅ Criar banco com formulário
- ✅ Ver lista de bancos
- ✅ Copiar credenciais com um clique
- ✅ Ver logs em tempo real
- ✅ Iniciar/Parar/Deletar

### Funcionalidades Futuras

- Backup/Restore automático
- Monitoramento de recursos
- Alertas de uso
- Replicação
- Clustering

---

## ✅ Backend Pronto!

O sistema está **100% funcional** via API REST.

Teste agora criando seu primeiro banco de dados! 🚀
