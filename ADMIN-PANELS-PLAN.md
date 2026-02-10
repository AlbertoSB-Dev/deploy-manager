# 🎯 Painéis Administrativos - Plano de Implementação

## 📋 Situação Atual

### ✅ O que já funciona:
- MinIO Console na porta 9001
- Acesso via IP: `http://servidor:9001`
- URL salva no banco: `consoleUrl: http://servidor:9001`

### ❌ O que falta:
- Domínio automático para MinIO Console
- phpMyAdmin para MySQL/MariaDB
- Adminer para PostgreSQL
- Redis Commander para Redis
- Mongo Express para MongoDB
- Configuração automática com Traefik

---

## 🎯 Objetivo

Criar domínios automáticos para painéis administrativos:

```
MinIO:       minio-console-{nome}.{servidor}.sslip.io
MySQL:       phpmyadmin-{nome}.{servidor}.sslip.io
PostgreSQL:  adminer-{nome}.{servidor}.sslip.io
MongoDB:     mongo-express-{nome}.{servidor}.sslip.io
Redis:       redis-commander-{nome}.{servidor}.sslip.io
```

---

## 🔧 Implementação

### 1. MinIO Console (Prioridade Alta)

#### Situação Atual:
```bash
docker run -d \
  --name minio-storage \
  -p 9000:9000 \
  -p 9001:9001 \  # Console exposto na porta
  minio/minio server /data --console-address ":9001"
```

#### Implementação com Traefik:
```bash
docker run -d \
  --name minio-storage \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.minio-storage-api.rule=Host(\`minio-api-storage.192.168.1.100.sslip.io\`)" \
  --label "traefik.http.routers.minio-storage-api.service=minio-storage-api" \
  --label "traefik.http.services.minio-storage-api.loadbalancer.server.port=9000" \
  --label "traefik.http.routers.minio-storage-console.rule=Host(\`minio-console-storage.192.168.1.100.sslip.io\`)" \
  --label "traefik.http.routers.minio-storage-console.service=minio-storage-console" \
  --label "traefik.http.services.minio-storage-console.loadbalancer.server.port=9001" \
  minio/minio server /data --console-address ":9001"
```

**Resultado:**
- API S3: `http://minio-api-storage.192.168.1.100.sslip.io`
- Console: `http://minio-console-storage.192.168.1.100.sslip.io`

---

### 2. phpMyAdmin para MySQL/MariaDB (Prioridade Alta)

#### Container Separado:
```bash
docker run -d \
  --name phpmyadmin-{nome} \
  --network traefik-network \
  --link mysql-{nome}:db \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.phpmyadmin-{nome}.rule=Host(\`phpmyadmin-{nome}.{servidor}.sslip.io\`)" \
  --label "traefik.http.services.phpmyadmin-{nome}.loadbalancer.server.port=80" \
  -e PMA_HOST=mysql-{nome} \
  -e PMA_PORT=3306 \
  phpmyadmin/phpmyadmin:latest
```

**Resultado:**
- phpMyAdmin: `http://phpmyadmin-meudb.192.168.1.100.sslip.io`

---

### 3. Adminer para PostgreSQL (Prioridade Média)

```bash
docker run -d \
  --name adminer-{nome} \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.adminer-{nome}.rule=Host(\`adminer-{nome}.{servidor}.sslip.io\`)" \
  --label "traefik.http.services.adminer-{nome}.loadbalancer.server.port=8080" \
  adminer:latest
```

---

### 4. Mongo Express para MongoDB (Prioridade Média)

```bash
docker run -d \
  --name mongo-express-{nome} \
  --network traefik-network \
  --link mongodb-{nome}:mongo \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.mongo-express-{nome}.rule=Host(\`mongo-express-{nome}.{servidor}.sslip.io\`)" \
  --label "traefik.http.services.mongo-express-{nome}.loadbalancer.server.port=8081" \
  -e ME_CONFIG_MONGODB_SERVER=mongodb-{nome} \
  -e ME_CONFIG_MONGODB_PORT=27017 \
  -e ME_CONFIG_MONGODB_ADMINUSERNAME={username} \
  -e ME_CONFIG_MONGODB_ADMINPASSWORD={password} \
  mongo-express:latest
```

---

### 5. Redis Commander para Redis (Prioridade Baixa)

```bash
docker run -d \
  --name redis-commander-{nome} \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.redis-commander-{nome}.rule=Host(\`redis-commander-{nome}.{servidor}.sslip.io\`)" \
  --label "traefik.http.services.redis-commander-{nome}.loadbalancer.server.port=8081" \
  -e REDIS_HOSTS=local:redis-{nome}:6379 \
  rediscommander/redis-commander:latest
```

---

## 📊 Modelo de Dados Atualizado

### Database.ts
```typescript
export interface IDatabase extends Document {
  // ... campos existentes
  
  // Novos campos para painéis admin
  adminPanel?: {
    enabled: boolean;
    type: 'phpmyadmin' | 'adminer' | 'mongo-express' | 'redis-commander' | 'minio-console';
    containerId?: string;
    domain?: string;
    port?: number;
  };
  
  // URLs de acesso
  apiUrl?: string;      // Para MinIO: API S3
  consoleUrl?: string;  // Para MinIO: Console Web
  adminUrl?: string;    // Para outros: phpMyAdmin, Adminer, etc
}
```

---

## 🔧 Serviço AdminPanelService

```typescript
export class AdminPanelService {
  
  /**
   * Criar painel admin para banco de dados
   */
  async createAdminPanel(database: IDatabase): Promise<void> {
    const server = await Server.findById(database.serverId);
    if (!server) throw new Error('Servidor não encontrado');
    
    const ssh = await sshService.connect(server);
    
    // Gerar domínio
    const domain = this.generateAdminDomain(database, server);
    
    // Criar container do painel
    const containerId = await this.deployAdminPanel(database, domain, ssh);
    
    // Atualizar banco de dados
    database.adminPanel = {
      enabled: true,
      type: this.getAdminPanelType(database.type),
      containerId,
      domain,
      port: this.getAdminPanelPort(database.type)
    };
    database.adminUrl = `http://${domain}`;
    
    await database.save();
  }
  
  /**
   * Gerar domínio para painel admin
   */
  private generateAdminDomain(database: IDatabase, server: any): string {
    const prefix = this.getAdminPanelPrefix(database.type);
    return `${prefix}-${database.name}.${server.host}.sslip.io`;
  }
  
  /**
   * Obter prefixo do painel
   */
  private getAdminPanelPrefix(type: DatabaseType): string {
    const prefixes = {
      mysql: 'phpmyadmin',
      mariadb: 'phpmyadmin',
      postgresql: 'adminer',
      mongodb: 'mongo-express',
      redis: 'redis-commander',
      minio: 'minio-console'
    };
    return prefixes[type];
  }
  
  /**
   * Deploy do painel admin
   */
  private async deployAdminPanel(
    database: IDatabase, 
    domain: string, 
    ssh: NodeSSH
  ): Promise<string> {
    
    let command: string;
    
    switch (database.type) {
      case 'mysql':
      case 'mariadb':
        command = this.generatePhpMyAdminCommand(database, domain);
        break;
      case 'postgresql':
        command = this.generateAdminerCommand(database, domain);
        break;
      case 'mongodb':
        command = this.generateMongoExpressCommand(database, domain);
        break;
      case 'redis':
        command = this.generateRedisCommanderCommand(database, domain);
        break;
      case 'minio':
        // MinIO já tem console integrado, apenas configurar Traefik
        return database.containerId!;
      default:
        throw new Error(`Painel admin não suportado para ${database.type}`);
    }
    
    const result = await ssh.execCommand(command);
    if (result.code !== 0) {
      throw new Error(`Erro ao criar painel admin: ${result.stderr}`);
    }
    
    return result.stdout.trim();
  }
  
  /**
   * Gerar comando phpMyAdmin
   */
  private generatePhpMyAdminCommand(database: IDatabase, domain: string): string {
    const containerName = `phpmyadmin-${database.name}`;
    
    return `
      docker run -d \
        --name ${containerName} \
        --network traefik-network \
        --link ${database.containerId}:db \
        --label "traefik.enable=true" \
        --label "traefik.http.routers.${containerName}.rule=Host(\\\`${domain}\\\`)" \
        --label "traefik.http.services.${containerName}.loadbalancer.server.port=80" \
        -e PMA_HOST=${database.containerId} \
        -e PMA_PORT=${database.port} \
        phpmyadmin/phpmyadmin:latest
    `.trim().replace(/\s+/g, ' ');
  }
  
  // ... outros métodos para Adminer, Mongo Express, etc
}
```

---

## 🎨 Interface Frontend

### ServiceItem.tsx - Adicionar Botão

```tsx
{/* Botão de Painel Admin */}
{item.adminUrl && (
  <a
    href={item.adminUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
  >
    <ExternalLink className="w-4 h-4" />
    Abrir Painel Admin
  </a>
)}
```

### CreateDatabaseModal.tsx - Checkbox

```tsx
{/* Opção de criar painel admin */}
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={createAdminPanel}
    onChange={(e) => setCreateAdminPanel(e.target.checked)}
    className="rounded"
  />
  <label className="text-sm text-gray-700 dark:text-gray-300">
    Criar painel administrativo (phpMyAdmin, Adminer, etc)
  </label>
</div>
```

---

## 📝 Checklist de Implementação

### Fase 1: MinIO Console (Imediato)
- [ ] Adicionar labels Traefik no comando MinIO
- [ ] Gerar domínio automático para console
- [ ] Salvar `consoleUrl` com domínio
- [ ] Testar acesso via domínio

### Fase 2: phpMyAdmin (Alta Prioridade)
- [ ] Criar AdminPanelService
- [ ] Implementar deploy de phpMyAdmin
- [ ] Configurar Traefik labels
- [ ] Adicionar campo `adminPanel` no modelo
- [ ] Botão "Abrir phpMyAdmin" no frontend

### Fase 3: Outros Painéis (Média Prioridade)
- [ ] Adminer para PostgreSQL
- [ ] Mongo Express para MongoDB
- [ ] Redis Commander para Redis

### Fase 4: Interface (Baixa Prioridade)
- [ ] Checkbox "Criar painel admin" ao criar banco
- [ ] Botão "Abrir Painel" no ServiceItem
- [ ] Indicador visual de painel disponível
- [ ] Opção de criar painel depois

---

## 🎯 Prioridades

### 🔴 Alta (Fazer Agora)
1. MinIO Console com domínio Traefik
2. phpMyAdmin para MySQL/MariaDB

### 🟡 Média (Fazer Depois)
3. Adminer para PostgreSQL
4. Mongo Express para MongoDB

### 🟢 Baixa (Futuro)
5. Redis Commander
6. Interface completa com checkboxes

---

## 🚀 Próximo Passo

Implementar MinIO Console com Traefik primeiro, pois:
- ✅ MinIO já tem console integrado
- ✅ Só precisa adicionar labels Traefik
- ✅ Não precisa container adicional
- ✅ Mais simples e rápido

Depois implementar phpMyAdmin para MySQL/MariaDB.
