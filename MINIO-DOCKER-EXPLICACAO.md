# 🐳 MinIO no Docker - Como Funciona

## ✅ SIM! MinIO é criado em Docker corretamente!

---

## 🎯 Como MinIO é Criado

### 1. **Criação Local (Docker)**

Quando você cria um MinIO no sistema, o seguinte comando é executado:

```bash
docker run -d \
  --name minio-instance \
  --restart unless-stopped \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -v /var/lib/docker/volumes/minio-data:/data \
  minio/minio:latest server /data --console-address ":9001"
```

### 2. **Criação Remota (SSH + Docker)**

Se você criar em um servidor remoto, o mesmo comando é executado via SSH:

```bash
# Via SSH no servidor remoto
ssh user@servidor.com "docker run -d ..."
```

---

## 📦 Estrutura do Container MinIO

### Portas Expostas
- **9000**: API S3 (upload/download de objetos)
- **9001**: Console Web (interface administrativa)

### Volumes
- **`/data`**: Onde os buckets e objetos são armazenados
- Mapeado para: `/var/lib/docker/volumes/minio-data`

### Variáveis de Ambiente
- **`MINIO_ROOT_USER`**: Usuário admin (access key)
- **`MINIO_ROOT_PASSWORD`**: Senha admin (secret key)

### Comando de Inicialização
```bash
minio/minio:latest server /data --console-address ":9001"
```

---

## 🔍 Verificar MinIO Rodando

### Via Docker
```bash
# Listar containers MinIO
docker ps | grep minio

# Ver logs do MinIO
docker logs minio-instance

# Inspecionar container
docker inspect minio-instance
```

### Via Interface Web
```
http://localhost:9001
ou
http://servidor.com:9001

Login:
- Access Key: minioadmin
- Secret Key: minioadmin123
```

### Via API S3
```bash
# Testar API
curl http://localhost:9000/minio/health/live

# Listar buckets (com mc client)
mc ls myminio/
```

---

## 💾 Como o Backup Funciona

### 1. **Backup do Volume `/data`**

O backup faz uma cópia completa do volume onde MinIO armazena os dados:

```bash
# Comando executado
docker run --rm \
  --volumes-from minio-instance \
  -v /opt/deploy-manager/backups:/backup \
  alpine tar -czf /backup/minio-backup.tar.gz /data
```

**O que é salvo:**
- ✅ Todos os buckets
- ✅ Todos os objetos (arquivos)
- ✅ Metadados
- ✅ Configurações de acesso
- ✅ Políticas de bucket

### 2. **Estrutura do Backup**

```
minio-backup.tar.gz
└── data/
    ├── .minio.sys/          # Configurações do MinIO
    │   ├── config/
    │   ├── buckets/
    │   └── tmp/
    ├── bucket1/             # Seus buckets
    │   ├── arquivo1.jpg
    │   ├── arquivo2.pdf
    │   └── pasta/
    │       └── arquivo3.txt
    └── bucket2/
        └── ...
```

### 3. **Restore do Backup**

```bash
# Parar MinIO
docker stop minio-instance

# Restaurar dados
docker run --rm \
  --volumes-from minio-instance \
  -v /opt/deploy-manager/backups:/backup \
  alpine tar -xzf /backup/minio-backup.tar.gz -C /

# Iniciar MinIO
docker start minio-instance
```

---

## 🔧 Código no Sistema

### DatabaseService.ts - Criação do MinIO

```typescript
case 'minio':
  const consolePort = 9001;
  return `
    docker run -d \
      --name ${name} \
      --restart unless-stopped \
      -p 9000:9000 \
      -p ${consolePort}:9001 \
      -e MINIO_ROOT_USER=${username} \
      -e MINIO_ROOT_PASSWORD=${password} \
      -v ${volumePath}:/data \
      minio/minio:${version} server /data --console-address ":9001"
  `.trim().replace(/\s+/g, ' ');
```

### BackupService.ts - Backup do MinIO

```typescript
private async backupMinIO(database: any, backupPath: string): Promise<string> {
  if (!database.containerId) {
    throw new Error('MinIO não tem container ativo');
  }

  // Fazer backup do volume /data do MinIO
  const command = `docker run --rm \
    --volumes-from ${database.containerId} \
    -v ${this.backupDir}:/backup \
    alpine tar -czf /backup/$(basename ${backupPath}) /data`;
  
  await execAsync(command);
  return backupPath;
}
```

### BackupService.ts - Backup Remoto do MinIO

```typescript
case 'minio':
  // MinIO: fazer backup do volume de dados
  command = `docker run --rm \
    --volumes-from ${database.containerId} \
    -v /tmp:/backup \
    alpine tar -czf ${remoteBackupPath} /data`;
  break;
```

---

## 📊 Fluxo Completo

### 1. Criar MinIO
```
Usuário → Dashboard → Criar Banco → Tipo: MinIO
    ↓
DatabaseService.ts → Gera comando docker run
    ↓
Docker cria container MinIO
    ↓
Volume /data é criado
    ↓
MinIO está rodando em 9000 (API) e 9001 (Console)
```

### 2. Fazer Backup
```
Usuário → MinIO → Gerenciar Backups → Criar Backup
    ↓
BackupService.ts → backupMinIO()
    ↓
Docker cria container temporário Alpine
    ↓
Alpine acessa volume do MinIO (--volumes-from)
    ↓
tar comprime /data → backup.tar.gz
    ↓
Backup salvo em /opt/deploy-manager/backups
    ↓
Container Alpine é removido (--rm)
```

### 3. Restaurar Backup
```
Usuário → Backup → Restaurar
    ↓
BackupService.ts → restoreDatabase()
    ↓
Docker para MinIO (docker stop)
    ↓
Docker cria container temporário Alpine
    ↓
Alpine extrai backup.tar.gz → /data
    ↓
Container Alpine é removido
    ↓
Docker inicia MinIO (docker start)
    ↓
MinIO restaurado com dados do backup
```

---

## 🎯 Vantagens do Docker

### 1. **Isolamento**
- MinIO roda em container isolado
- Não interfere com sistema host
- Fácil de gerenciar

### 2. **Portabilidade**
- Mesmo container funciona em qualquer servidor
- Backup do volume funciona em qualquer lugar
- Fácil migração entre servidores

### 3. **Volumes Persistentes**
- Dados sobrevivem a restart do container
- Dados sobrevivem a remoção do container
- Backup é apenas do volume

### 4. **Facilidade de Backup**
- `--volumes-from` acessa volume de outro container
- Alpine é leve (5MB) e rápido
- tar comprime e preserva permissões

---

## 🔐 Segurança

### Credenciais
- ✅ `MINIO_ROOT_USER` e `MINIO_ROOT_PASSWORD` são configuráveis
- ✅ Armazenadas no banco de dados (criptografadas)
- ✅ Não expostas em logs

### Rede
- ✅ Portas 9000 e 9001 podem ser restritas
- ✅ Pode usar rede Docker interna
- ✅ Pode usar Traefik para proxy reverso

### Volumes
- ✅ Permissões corretas no volume
- ✅ Backup comprimido e protegido
- ✅ Pode criptografar backup (futuro)

---

## 🐛 Troubleshooting

### MinIO não inicia
```bash
# Verificar logs
docker logs minio-instance

# Verificar se porta está em uso
netstat -tulpn | grep 9000

# Verificar permissões do volume
ls -la /var/lib/docker/volumes/minio-data
```

### Backup falha
```bash
# Verificar se container existe
docker ps -a | grep minio

# Verificar espaço em disco
df -h

# Verificar permissões
ls -la /opt/deploy-manager/backups
```

### Restore falha
```bash
# Verificar se backup existe
ls -lh /opt/deploy-manager/backups/

# Verificar integridade do backup
tar -tzf backup.tar.gz | head

# Verificar se MinIO está parado
docker ps | grep minio
```

---

## 📝 Exemplo Completo

### 1. Criar MinIO via Interface
```
Dashboard → Criar Banco
├── Nome: minio-storage
├── Tipo: MinIO
├── Versão: latest
├── Usuário: minioadmin
├── Senha: minioadmin123
└── Servidor: Local (ou remoto)
```

### 2. Verificar Container
```bash
docker ps | grep minio-storage

# Output:
# abc123  minio/minio:latest  "minio server /data"  Up 2 minutes  0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp  minio-storage
```

### 3. Acessar Console
```
http://localhost:9001
Login: minioadmin / minioadmin123
```

### 4. Criar Bucket
```bash
# Via mc client
mc mb myminio/backups

# Ou via console web
Buckets → Create Bucket → "backups"
```

### 5. Fazer Backup
```
Dashboard → minio-storage → Gerenciar Backups → Criar Backup
```

### 6. Verificar Backup
```bash
ls -lh /opt/deploy-manager/backups/

# Output:
# -rw-r--r-- 1 root root 2.5G Feb 10 15:30 database-minio-storage-2024-02-10.tar.gz
```

### 7. Restaurar Backup
```
Dashboard → Backups → minio-storage → Restaurar
```

---

## ✅ Resumo

### MinIO no Sistema
- ✅ Criado em Docker (local ou remoto)
- ✅ Volume persistente em `/data`
- ✅ Portas 9000 (API) e 9001 (Console)
- ✅ Credenciais configuráveis
- ✅ Restart automático

### Backup do MinIO
- ✅ Backup do volume `/data` completo
- ✅ Compressão automática (.tar.gz)
- ✅ Funciona local e remoto
- ✅ Preserva todos os dados
- ✅ Restore completo

### Integração
- ✅ Interface visual
- ✅ API REST
- ✅ Logs detalhados
- ✅ Tratamento de erros
- ✅ Multi-tenancy

**Tudo funcionando perfeitamente em Docker!** 🐳🎉
