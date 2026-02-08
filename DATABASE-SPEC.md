# Especificação: Sistema de Bancos de Dados Remotos

## 🎯 Objetivo

Permitir criar e gerenciar bancos de dados em **servidores remotos** via SSH com um clique.

---

## 📋 Fluxo Completo

### 1. Usuário Cria Banco de Dados

```
Interface:
┌─────────────────────────────────────┐
│ Criar Banco de Dados                │
├─────────────────────────────────────┤
│ Nome: [meu-mongodb____________]     │
│ Tipo: [MongoDB ▼]                   │
│   - MongoDB                         │
│   - MySQL                           │
│   - MariaDB                         │
│   - PostgreSQL                      │
│   - Redis                           │
│                                     │
│ Versão: [7.0 ▼]                     │
│                                     │
│ Servidor: [Minha VPS ▼]            │
│   - Local (localhost)               │
│   - Minha VPS (38.242.213.195)     │
│                                     │
│ ✅ Gerar credenciais automaticamente│
│                                     │
│ [Cancelar]  [Criar Banco de Dados] │
└─────────────────────────────────────┘
```

### 2. Sistema Cria Banco Remotamente

**Via SSH no servidor remoto**:

```bash
# 1. Conectar via SSH
ssh root@38.242.213.195

# 2. Criar diretório para dados
mkdir -p /opt/databases/meu-mongodb

# 3. Criar container Docker
docker run -d \
  --name meu-mongodb \
  --restart unless-stopped \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin_abc123 \
  -e MONGO_INITDB_ROOT_PASSWORD=senha_segura_gerada \
  -e MONGO_INITDB_DATABASE=meu_mongodb \
  -v /opt/databases/meu-mongodb:/data/db \
  mongo:7.0

# 4. Aguardar container iniciar
docker ps | grep meu-mongodb

# 5. Testar conexão
docker exec meu-mongodb mongosh --eval "db.version()"
```

### 3. Sistema Mostra Credenciais

```
✅ Banco de dados criado com sucesso!

┌─────────────────────────────────────────────┐
│ Credenciais - meu-mongodb                   │
├─────────────────────────────────────────────┤
│                                             │
│ 📋 Connection String:                       │
│ ┌─────────────────────────────────────────┐ │
│ │ mongodb://admin_abc123:senha_segura@    │ │
│ │ 38.242.213.195:27017/meu_mongodb        │ │
│ └─────────────────────────────────────────┘ │
│ [📋 Copiar]                                 │
│                                             │
│ 📝 Detalhes:                                │
│ Host: 38.242.213.195                        │
│ Porta: 27017                                │
│ Usuário: admin_abc123                       │
│ Senha: senha_segura_gerada                  │
│ Database: meu_mongodb                       │
│                                             │
│ 🔗 Para usar no seu projeto:                │
│ ┌─────────────────────────────────────────┐ │
│ │ MONGODB_URI=mongodb://admin_abc123:     │ │
│ │ senha_segura@38.242.213.195:27017/      │ │
│ │ meu_mongodb                             │ │
│ └─────────────────────────────────────────┘ │
│ [📋 Copiar para .env]                       │
│                                             │
│ [Fechar]                                    │
└─────────────────────────────────────────────┘
```

---

## 🔧 Implementação Técnica

### Modelo Database

```typescript
interface IDatabase {
  name: string;              // meu-mongodb
  displayName: string;       // Meu MongoDB
  type: 'mongodb' | 'mysql' | 'mariadb' | 'postgresql' | 'redis';
  version: string;           // 7.0
  
  // Servidor
  serverId: string;          // ID do servidor
  serverName: string;        // Nome do servidor
  host: string;              // IP do servidor (38.242.213.195)
  
  // Credenciais
  port: number;              // 27017
  username: string;          // admin_abc123
  password: string;          // senha_segura_gerada
  database: string;          // meu_mongodb
  
  // Docker
  containerId: string;       // ID do container
  volumePath: string;        // /opt/databases/meu-mongodb
  
  // Status
  status: 'creating' | 'running' | 'stopped' | 'error';
  
  // Connection
  connectionString: string;  // mongodb://...
  
  createdAt: Date;
  updatedAt: Date;
}
```

### DatabaseService

```typescript
class DatabaseService {
  /**
   * Criar banco de dados no servidor remoto
   */
  async createDatabase(config: {
    name: string;
    type: DatabaseType;
    version: string;
    serverId: string;
  }): Promise<IDatabase> {
    // 1. Buscar servidor
    const server = await Server.findById(serverId);
    
    // 2. Conectar via SSH
    const ssh = await sshService.connect(server);
    
    // 3. Gerar credenciais seguras
    const username = `admin_${generateRandomString(6)}`;
    const password = generateSecurePassword();
    const database = config.name.replace(/-/g, '_');
    
    // 4. Criar diretório para dados
    await ssh.execCommand(`mkdir -p /opt/databases/${config.name}`);
    
    // 5. Criar container Docker
    const dockerCommand = this.generateDockerCommand(config, username, password, database);
    const result = await ssh.execCommand(dockerCommand);
    
    // 6. Obter container ID
    const containerId = result.stdout.trim();
    
    // 7. Aguardar container iniciar
    await this.waitForContainer(ssh, containerId);
    
    // 8. Testar conexão
    await this.testConnection(ssh, config.type, containerId);
    
    // 9. Gerar connection string
    const connectionString = this.generateConnectionString({
      type: config.type,
      host: server.host,
      port: this.getDefaultPort(config.type),
      username,
      password,
      database
    });
    
    // 10. Salvar no banco
    const db = new Database({
      name: config.name,
      displayName: config.name,
      type: config.type,
      version: config.version,
      serverId: server._id,
      serverName: server.name,
      host: server.host,
      port: this.getDefaultPort(config.type),
      username,
      password,
      database,
      containerId,
      volumePath: `/opt/databases/${config.name}`,
      status: 'running',
      connectionString
    });
    
    await db.save();
    return db;
  }
  
  /**
   * Gerar comando Docker para cada tipo de banco
   */
  private generateDockerCommand(config, username, password, database): string {
    switch (config.type) {
      case 'mongodb':
        return `
          docker run -d \
            --name ${config.name} \
            --restart unless-stopped \
            -p 27017:27017 \
            -e MONGO_INITDB_ROOT_USERNAME=${username} \
            -e MONGO_INITDB_ROOT_PASSWORD=${password} \
            -e MONGO_INITDB_DATABASE=${database} \
            -v /opt/databases/${config.name}:/data/db \
            mongo:${config.version}
        `;
        
      case 'mysql':
        return `
          docker run -d \
            --name ${config.name} \
            --restart unless-stopped \
            -p 3306:3306 \
            -e MYSQL_ROOT_PASSWORD=${password} \
            -e MYSQL_DATABASE=${database} \
            -e MYSQL_USER=${username} \
            -e MYSQL_PASSWORD=${password} \
            -v /opt/databases/${config.name}:/var/lib/mysql \
            mysql:${config.version}
        `;
        
      case 'postgresql':
        return `
          docker run -d \
            --name ${config.name} \
            --restart unless-stopped \
            -p 5432:5432 \
            -e POSTGRES_USER=${username} \
            -e POSTGRES_PASSWORD=${password} \
            -e POSTGRES_DB=${database} \
            -v /opt/databases/${config.name}:/var/lib/postgresql/data \
            postgres:${config.version}
        `;
        
      case 'redis':
        return `
          docker run -d \
            --name ${config.name} \
            --restart unless-stopped \
            -p 6379:6379 \
            -v /opt/databases/${config.name}:/data \
            redis:${config.version}-alpine redis-server --requirepass ${password}
        `;
        
      case 'mariadb':
        return `
          docker run -d \
            --name ${config.name} \
            --restart unless-stopped \
            -p 3306:3306 \
            -e MARIADB_ROOT_PASSWORD=${password} \
            -e MARIADB_DATABASE=${database} \
            -e MARIADB_USER=${username} \
            -e MARIADB_PASSWORD=${password} \
            -v /opt/databases/${config.name}:/var/lib/mysql \
            mariadb:${config.version}
        `;
    }
  }
  
  /**
   * Deletar banco de dados
   */
  async deleteDatabase(id: string): Promise<void> {
    const db = await Database.findById(id);
    if (!db) throw new Error('Banco não encontrado');
    
    const server = await Server.findById(db.serverId);
    if (!server) throw new Error('Servidor não encontrado');
    
    const ssh = await sshService.connect(server);
    
    // Parar e remover container
    await ssh.execCommand(`docker stop ${db.containerId}`);
    await ssh.execCommand(`docker rm ${db.containerId}`);
    
    // Remover volume (CUIDADO: dados serão perdidos!)
    await ssh.execCommand(`rm -rf ${db.volumePath}`);
    
    // Remover do banco
    await Database.findByIdAndDelete(id);
  }
}
```

---

## 🎨 Interface Frontend

### Componente DatabaseList

```tsx
export default function DatabaseList() {
  const [databases, setDatabases] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bancos de Dados</h1>
        <button onClick={() => setShowCreateModal(true)}>
          + Novo Banco
        </button>
      </div>
      
      <div className="grid gap-4">
        {databases.map(db => (
          <DatabaseCard key={db._id} database={db} />
        ))}
      </div>
      
      {showCreateModal && (
        <CreateDatabaseModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
```

### Componente CreateDatabaseModal

```tsx
export default function CreateDatabaseModal({ onClose }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('mongodb');
  const [version, setVersion] = useState('7.0');
  const [serverId, setServerId] = useState('');
  const [servers, setServers] = useState([]);
  
  const handleCreate = async () => {
    const response = await fetch('/api/databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, version, serverId })
    });
    
    const database = await response.json();
    
    // Mostrar credenciais
    showCredentialsModal(database);
    onClose();
  };
  
  return (
    <Modal>
      <h2>Criar Banco de Dados</h2>
      
      <input 
        placeholder="Nome do banco"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="mongodb">MongoDB</option>
        <option value="mysql">MySQL</option>
        <option value="mariadb">MariaDB</option>
        <option value="postgresql">PostgreSQL</option>
        <option value="redis">Redis</option>
      </select>
      
      <select value={version} onChange={e => setVersion(e.target.value)}>
        {getVersionsForType(type).map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      
      <select value={serverId} onChange={e => setServerId(e.target.value)}>
        <option value="">Selecione o servidor</option>
        {servers.map(s => (
          <option key={s._id} value={s._id}>
            {s.name} ({s.host})
          </option>
        ))}
      </select>
      
      <button onClick={handleCreate}>Criar Banco de Dados</button>
    </Modal>
  );
}
```

---

## 📊 Casos de Uso

### Caso 1: Criar MongoDB para Projeto

```
1. Usuário tem projeto "minha-api" no servidor VPS
2. Clica em "Bancos de Dados" → "+ Novo Banco"
3. Preenche:
   - Nome: minha-api-db
   - Tipo: MongoDB
   - Versão: 7.0
   - Servidor: Minha VPS
4. Clica em "Criar"
5. Sistema cria container no servidor remoto
6. Mostra credenciais:
   mongodb://admin_xyz:senha@38.242.213.195:27017/minha_api_db
7. Usuário copia e adiciona no .env do projeto
8. ✅ Pronto!
```

### Caso 2: Múltiplos Bancos no Mesmo Servidor

```
Servidor: 38.242.213.195

Banco 1: minha-api-db (MongoDB:27017)
Banco 2: cache-db (Redis:6379)
Banco 3: auth-db (PostgreSQL:5432)

Todos rodando no mesmo servidor, portas diferentes! ✅
```

---

## ⚠️ Considerações Importantes

### Portas

Cada tipo de banco usa uma porta padrão:
- MongoDB: 27017
- MySQL/MariaDB: 3306
- PostgreSQL: 5432
- Redis: 6379

**Problema**: Se criar 2 MongoDB no mesmo servidor, vai dar conflito de porta!

**Solução**: Alocar portas automaticamente (27017, 27018, 27019...)

### Segurança

- Senhas geradas automaticamente (32 caracteres)
- Credenciais armazenadas criptografadas
- Acesso apenas via connection string
- Firewall do servidor deve permitir portas

### Persistência

- Dados salvos em volumes Docker
- Backup manual via interface
- Restore de backups

---

## ✅ Aprovação

Antes de implementar tudo, confirme:

1. ✅ Bancos criados em servidores remotos via SSH?
2. ✅ Credenciais geradas automaticamente?
3. ✅ Mostrar connection string pronta?
4. ✅ Suportar MongoDB, MySQL, MariaDB, PostgreSQL, Redis?
5. ✅ Interface simples com lista e modal de criação?

Se aprovar, começo a implementar! 🚀
