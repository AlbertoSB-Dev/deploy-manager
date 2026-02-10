# 💾 Backup de MinIO - Guia Completo

## ✅ MinIO Totalmente Suportado!

O sistema de backup suporta MinIO de **2 formas diferentes**:

---

## 1️⃣ Backup DO MinIO (MinIO como Banco de Dados)

### O que é?
Fazer backup de uma instância MinIO que você criou no sistema.

### Como funciona?
- Faz backup do volume `/data` do container MinIO
- Inclui todos os buckets e objetos
- Comprime em `.tar.gz`
- Pode enviar para outro MinIO ou armazenar localmente

### Como usar?

#### Via Interface
1. Dashboard → Clique no seu MinIO
2. Clique em **"Gerenciar Backups"**
3. Clique em **"Criar Backup"**
4. Escolha armazenamento (Local ou MinIO)
5. Aguarde conclusão

#### Via API
```bash
# Criar backup do MinIO
curl -X POST http://localhost:5000/api/backups/database/MINIO_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storageType": "local"
  }'
```

### O que é salvo?
- ✅ Todos os buckets
- ✅ Todos os objetos (arquivos)
- ✅ Metadados
- ✅ Configurações de acesso
- ✅ Políticas de bucket

### Comandos Executados

#### Backup Local
```bash
docker run --rm \
  --volumes-from MINIO_CONTAINER_ID \
  -v /opt/deploy-manager/backups:/backup \
  alpine tar -czf /backup/backup.tar.gz /data
```

#### Backup Remoto (SSH)
```bash
docker run --rm \
  --volumes-from MINIO_CONTAINER_ID \
  -v /tmp:/backup \
  alpine tar -czf /tmp/backup.tar.gz /data
```

### Restore de MinIO

#### Via Interface
1. Dashboard → MinIO → "Gerenciar Backups"
2. Encontre o backup desejado
3. Clique no ícone de **Upload** (restaurar)
4. Confirme a restauração
5. Aguarde conclusão

#### Via API
```bash
curl -X POST http://localhost:5000/api/backups/BACKUP_ID/restore \
  -H "Authorization: Bearer TOKEN"
```

### ⚠️ Importante
- MinIO deve estar parado durante restore
- Dados atuais serão sobrescritos
- Faça backup antes de restaurar

---

## 2️⃣ Backup PARA MinIO (MinIO como Armazenamento)

### O que é?
Enviar backups de qualquer recurso (bancos, projetos, WordPress) PARA um MinIO.

### Como funciona?
- Cria backup localmente
- Faz upload para bucket MinIO
- Mantém cópia local (opcional)
- Usa SDK do MinIO (S3 compatible)

### Como usar?

#### Via Interface
1. Dashboard → Qualquer recurso → "Gerenciar Backups"
2. Clique em **"Criar Backup"**
3. Escolha **"MinIO"** como armazenamento
4. Configure credenciais do MinIO
5. Aguarde conclusão

#### Via API
```bash
# Backup de banco para MinIO
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

### Configuração do MinIO

#### 1. Criar Bucket
```bash
# Via mc (MinIO Client)
mc mb myminio/backups

# Ou via interface web
http://minio.example.com:9001
```

#### 2. Criar Access Key
```bash
# Via mc
mc admin user add myminio backup-user backup-password

# Ou via interface web
Settings → Access Keys → Create Access Key
```

#### 3. Configurar Política
```bash
# Permitir upload/download
mc admin policy set myminio readwrite user=backup-user
```

### Estrutura no MinIO
```
bucket: backups/
├── backups/database-mysql-2024-02-10.tar.gz
├── backups/project-api-2024-02-10.tar.gz
├── backups/wordpress-site-2024-02-10.tar.gz
└── backups/minio-instance-2024-02-10.tar.gz
```

---

## 🔧 Configuração Avançada

### 1. MinIO Externo (AWS S3, DigitalOcean Spaces, etc)

```typescript
// Usar qualquer serviço S3-compatible
const minioConfig = {
  endpoint: 's3.amazonaws.com',
  port: 443,
  useSSL: true,
  accessKey: 'AWS_ACCESS_KEY',
  secretKey: 'AWS_SECRET_KEY',
  bucket: 'my-backups'
};
```

### 2. MinIO Local (Self-hosted)

```typescript
const minioConfig = {
  endpoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
  bucket: 'backups'
};
```

### 3. MinIO Remoto (Outro servidor)

```typescript
const minioConfig = {
  endpoint: '192.168.1.100',
  port: 9000,
  useSSL: false,
  accessKey: 'backup-user',
  secretKey: 'backup-password',
  bucket: 'backups'
};
```

---

## 📊 Exemplos Práticos

### Exemplo 1: Backup Diário do MinIO para Outro MinIO

```typescript
// Fazer backup do MinIO principal para MinIO de backup
const createMinioBackup = async () => {
  // 1. Criar backup do MinIO principal
  const backup = await api.post('/backups/database/MINIO_PRINCIPAL_ID', {
    storageType: 'minio',
    minioConfig: {
      endpoint: 'minio-backup.example.com',
      port: 9000,
      accessKey: 'backup-user',
      secretKey: 'backup-password',
      bucket: 'minio-backups'
    }
  });
  
  console.log('Backup criado:', backup.data);
};
```

### Exemplo 2: Backup de Todos os Recursos para MinIO

```typescript
// Backup completo do sistema para MinIO
const backupEverything = async () => {
  const minioConfig = {
    endpoint: 'minio.example.com',
    port: 9000,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    bucket: 'full-backups'
  };
  
  // Buscar todos os recursos
  const databases = await api.get('/databases');
  const projects = await api.get('/projects');
  const wordpress = await api.get('/wordpress');
  
  // Backup de todos os bancos
  for (const db of databases.data) {
    await api.post(`/backups/database/${db._id}`, {
      storageType: 'minio',
      minioConfig
    });
  }
  
  // Backup de todos os projetos
  for (const proj of projects.data) {
    await api.post(`/backups/project/${proj._id}`, {
      storageType: 'minio',
      minioConfig
    });
  }
  
  // Backup de todos os WordPress
  for (const wp of wordpress.data) {
    await api.post(`/backups/wordpress/${wp._id}`, {
      storageType: 'minio',
      minioConfig
    });
  }
  
  console.log('Backup completo concluído!');
};
```

### Exemplo 3: Restore de MinIO

```typescript
// Restaurar MinIO de um backup
const restoreMinIO = async (backupId: string) => {
  // Confirmar com usuário
  const confirmed = confirm(
    'Restaurar MinIO?\n\n' +
    'ATENÇÃO: Todos os buckets e objetos atuais serão sobrescritos!\n' +
    'MinIO será parado durante o restore.'
  );
  
  if (!confirmed) return;
  
  // Restaurar
  await api.post(`/backups/${backupId}/restore`);
  
  console.log('MinIO restaurado com sucesso!');
};
```

---

## 🔐 Segurança

### Credenciais MinIO
- ✅ Nunca exponha access keys no frontend
- ✅ Use variáveis de ambiente
- ✅ Crie usuários específicos para backup
- ✅ Use políticas de acesso mínimo

### Criptografia
- ✅ Use SSL/TLS (useSSL: true)
- ✅ Criptografe backups sensíveis
- ✅ Proteja access keys

### Retenção
- ✅ Configure lifecycle policies no MinIO
- ✅ Delete backups antigos automaticamente
- ✅ Mantenha múltiplas versões

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'minio'"
```bash
# Instalar SDK do MinIO
cd backend
npm install minio
```

### Erro: "Bucket does not exist"
```bash
# Criar bucket no MinIO
mc mb myminio/backups
```

### Erro: "Access Denied"
```bash
# Verificar credenciais
mc admin user info myminio backup-user

# Verificar política
mc admin policy list myminio
```

### Erro: "Connection refused"
```bash
# Verificar se MinIO está rodando
docker ps | grep minio

# Verificar porta
curl http://minio.example.com:9000/minio/health/live
```

### Backup muito lento
- Verificar velocidade da rede
- Usar compressão (já habilitado)
- Fazer backup em horários de baixo uso
- Considerar backup incremental (futuro)

---

## 📝 Checklist de Uso

### Backup DO MinIO
- [ ] MinIO está rodando
- [ ] Container tem volume `/data`
- [ ] Espaço em disco suficiente
- [ ] Permissões de acesso ao Docker
- [ ] Testar restore em ambiente de teste

### Backup PARA MinIO
- [ ] MinIO de destino está rodando
- [ ] Bucket criado
- [ ] Access keys configuradas
- [ ] Política de acesso configurada
- [ ] Conectividade de rede OK
- [ ] Espaço no bucket suficiente

---

## 🎯 Resumo

### MinIO como Banco de Dados
- ✅ Backup do volume `/data`
- ✅ Todos os buckets e objetos
- ✅ Compressão automática
- ✅ Restore completo
- ✅ Suporte local e remoto

### MinIO como Armazenamento
- ✅ Upload de backups para MinIO
- ✅ S3-compatible
- ✅ Suporte a AWS S3, DigitalOcean Spaces, etc
- ✅ Configuração flexível
- ✅ Criptografia SSL/TLS

### Ambos
- ✅ Interface visual
- ✅ API REST
- ✅ Autenticação
- ✅ Multi-tenancy
- ✅ Logs detalhados

---

## 🚀 Pronto para Usar!

MinIO está **100% suportado** no sistema de backup!

**Comece agora:**
1. Crie uma instância MinIO no sistema
2. Faça backup dela
3. Use ela para armazenar outros backups
4. Teste restore em ambiente seguro

**Precisa de ajuda?**
- Leia a documentação completa: `BACKUP-SYSTEM-COMPLETE.md`
- Veja exemplos: `BACKUP-EXAMPLES.md`
- Guia rápido: `BACKUP-QUICK-START.md`
