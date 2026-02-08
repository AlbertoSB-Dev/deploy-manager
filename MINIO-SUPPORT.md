# Suporte ao MinIO - Object Storage

## ✅ Implementado

O sistema agora suporta criação e gerenciamento de instâncias MinIO (S3-compatible object storage).

---

## 🎯 O que é MinIO?

MinIO é um servidor de object storage de alta performance, compatível com a API S3 da Amazon. É ideal para:

- Armazenamento de arquivos (imagens, vídeos, documentos)
- Backup e arquivamento
- Data lakes
- Machine learning datasets
- Alternativa self-hosted ao AWS S3

---

## 📦 Características

### Portas
- **9000**: API S3 (para aplicações)
- **9001**: Console Web (interface administrativa)

### Credenciais
- **Access Key**: Equivalente ao username (gerado automaticamente)
- **Secret Key**: Equivalente à senha (gerado automaticamente)

### Compatibilidade
- 100% compatível com API S3
- Funciona com SDKs AWS (boto3, aws-sdk, etc.)
- Suporta ferramentas S3 (s3cmd, mc, etc.)

---

## 🚀 Como Usar

### 1. Criar Instância MinIO

```bash
POST /api/databases
{
  "name": "meu-minio",
  "displayName": "Meu MinIO Storage",
  "type": "minio",
  "version": "latest",
  "serverId": "ID_DO_SERVIDOR"
}
```

**Resposta:**
```json
{
  "_id": "...",
  "name": "meu-minio",
  "type": "minio",
  "version": "latest",
  "host": "38.242.213.195",
  "port": 9000,
  "consolePort": 9001,
  "accessKey": "admin_abc123",
  "secretKey": "senha_gerada_automaticamente",
  "connectionString": "http://38.242.213.195:9000",
  "consoleUrl": "http://38.242.213.195:9001",
  "status": "running"
}
```

### 2. Acessar Console Web

Abra o navegador em: `http://SEU_IP:9001`

Login:
- **Username**: Access Key (ex: admin_abc123)
- **Password**: Secret Key

### 3. Usar na Aplicação

#### Node.js (aws-sdk)
```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: 'http://38.242.213.195:9000',
  accessKeyId: 'admin_abc123',
  secretAccessKey: 'senha_gerada',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

// Criar bucket
await s3.createBucket({ Bucket: 'meu-bucket' }).promise();

// Upload arquivo
await s3.putObject({
  Bucket: 'meu-bucket',
  Key: 'arquivo.txt',
  Body: 'Conteúdo do arquivo'
}).promise();

// Download arquivo
const data = await s3.getObject({
  Bucket: 'meu-bucket',
  Key: 'arquivo.txt'
}).promise();
```

#### Python (boto3)
```python
import boto3

s3 = boto3.client(
    's3',
    endpoint_url='http://38.242.213.195:9000',
    aws_access_key_id='admin_abc123',
    aws_secret_access_key='senha_gerada'
)

# Criar bucket
s3.create_bucket(Bucket='meu-bucket')

# Upload arquivo
s3.upload_file('local.txt', 'meu-bucket', 'arquivo.txt')

# Download arquivo
s3.download_file('meu-bucket', 'arquivo.txt', 'local.txt')
```

#### MinIO Client (mc)
```bash
# Configurar alias
mc alias set myminio http://38.242.213.195:9000 admin_abc123 senha_gerada

# Listar buckets
mc ls myminio

# Criar bucket
mc mb myminio/meu-bucket

# Upload arquivo
mc cp arquivo.txt myminio/meu-bucket/

# Download arquivo
mc cp myminio/meu-bucket/arquivo.txt ./
```

---

## 🔧 Configuração no .env

```env
# MinIO Configuration
MINIO_ENDPOINT=http://38.242.213.195:9000
MINIO_ACCESS_KEY=admin_abc123
MINIO_SECRET_KEY=senha_gerada
MINIO_USE_SSL=false
MINIO_REGION=us-east-1
```

---

## 📝 Casos de Uso

### 1. Upload de Imagens de Perfil
```javascript
// Upload
const file = req.file;
await s3.putObject({
  Bucket: 'avatars',
  Key: `${userId}.jpg`,
  Body: file.buffer,
  ContentType: 'image/jpeg'
}).promise();

// URL pública
const url = `http://38.242.213.195:9000/avatars/${userId}.jpg`;
```

### 2. Backup de Banco de Dados
```bash
# Fazer backup
mongodump --out=/tmp/backup

# Comprimir
tar -czf backup.tar.gz /tmp/backup

# Upload para MinIO
mc cp backup.tar.gz myminio/backups/$(date +%Y%m%d).tar.gz
```

### 3. Armazenamento de Logs
```javascript
// Salvar logs diários
const logs = await getLogs();
await s3.putObject({
  Bucket: 'logs',
  Key: `app-${new Date().toISOString().split('T')[0]}.log`,
  Body: logs
}).promise();
```

### 4. CDN de Assets
```javascript
// Upload de assets estáticos
const files = ['logo.png', 'banner.jpg', 'style.css'];

for (const file of files) {
  await s3.putObject({
    Bucket: 'assets',
    Key: file,
    Body: fs.readFileSync(file),
    ACL: 'public-read'
  }).promise();
}
```

---

## 🎨 Interface Frontend

### Modal de Criação
- Ícone: 📦
- Nome: MinIO
- Grid de 3 colunas (6 tipos de banco)
- Versões dinâmicas do Docker Hub

### Card do Banco
- Mostra porta API (9000) e Console (9001)
- Link direto para console web
- Botão "Ver Credenciais"

### Modal de Credenciais
- Access Key ao invés de Username
- Secret Key ao invés de Password
- Link clicável para Console
- Exemplo de uso com SDK

---

## 🔐 Segurança

### Boas Práticas
1. **Nunca exponha credenciais**: Use variáveis de ambiente
2. **Buckets privados**: Configure ACLs apropriadas
3. **HTTPS**: Em produção, use SSL/TLS
4. **Políticas de acesso**: Crie usuários com permissões limitadas
5. **Backup**: Faça backup regular dos dados

### Configurar Política de Bucket
```javascript
const policy = {
  Version: '2012-10-17',
  Statement: [{
    Effect: 'Allow',
    Principal: { AWS: ['*'] },
    Action: ['s3:GetObject'],
    Resource: ['arn:aws:s3:::meu-bucket/*']
  }]
};

await s3.putBucketPolicy({
  Bucket: 'meu-bucket',
  Policy: JSON.stringify(policy)
}).promise();
```

---

## 📊 Monitoramento

### Ver Logs
```bash
# Via API
GET /api/databases/:id/logs?lines=100

# Via Docker
docker logs meu-minio
```

### Métricas no Console
- Espaço usado
- Número de objetos
- Número de buckets
- Tráfego de rede

---

## 🆚 MinIO vs AWS S3

| Característica | MinIO | AWS S3 |
|---------------|-------|--------|
| Custo | Grátis (self-hosted) | Pay-per-use |
| Controle | Total | Limitado |
| Performance | Alta (local) | Depende da região |
| Compatibilidade | 100% S3 API | Nativo |
| Escalabilidade | Manual | Automática |
| Manutenção | Você gerencia | AWS gerencia |

---

## 🚀 Próximos Passos

### Implementado
- [x] Criação de instância MinIO
- [x] Credenciais automáticas (Access/Secret Key)
- [x] Console Web (porta 9001)
- [x] Connection string
- [x] Interface frontend completa
- [x] Versões dinâmicas do Docker Hub

### Futuro (Opcional)
- [ ] Configuração de buckets via interface
- [ ] Upload de arquivos direto pela interface
- [ ] Visualizador de objetos
- [ ] Configuração de políticas de acesso
- [ ] Métricas de uso (espaço, objetos)
- [ ] Backup automático

---

## 📚 Documentação Oficial

- [MinIO Docs](https://min.io/docs/minio/linux/index.html)
- [MinIO Client (mc)](https://min.io/docs/minio/linux/reference/minio-mc.html)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Boto3 (Python)](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)

---

**MinIO totalmente integrado e pronto para uso!** 📦🚀
