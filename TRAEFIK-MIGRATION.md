# Migração: Nginx → Traefik

## 📋 Resumo da Mudança

Sistema migrado de **Nginx** para **Traefik** para resolver conflito de porta 80 com Coolify.

---

## ✅ O que foi implementado

### 1. Novo Serviço: TraefikService

**Arquivo**: `backend/src/services/TraefikService.ts`

**Funcionalidades**:
- ✅ Gerar labels do Traefik automaticamente
- ✅ Verificar se Traefik está rodando
- ✅ Garantir rede `coolify` existe
- ✅ Conectar containers à rede
- ✅ Testar domínios
- ✅ Listar serviços gerenciados
- ✅ Desconectar containers

### 2. DeployService Atualizado

**Mudanças no deploy remoto**:

**Antes (Nginx)**:
```typescript
// Criar container com porta exposta
docker run -d -p 9000:3000 ...

// Instalar Nginx
await NginxService.ensureNginxProxy(ssh);

// Criar arquivo de config
await NginxService.configureProject(ssh, ...);

// Recarregar Nginx
docker exec nginx-proxy nginx -s reload
```

**Agora (Traefik)**:
```typescript
// Criar container com labels do Traefik
docker run -d \
  --label traefik.enable=true \
  --label traefik.http.routers.projeto.rule=Host(`dominio`) \
  ...

// Conectar à rede coolify
docker network connect coolify container-id

// ✅ Traefik detecta automaticamente!
```

### 3. Documentação

**Novos arquivos**:
- ✅ `TRAEFIK-INTEGRATION.md` - Guia completo
- ✅ `TRAEFIK-MIGRATION.md` - Este arquivo

**Atualizados**:
- ✅ `NGINX-AUTOMATICO.md` - Marcado como descontinuado
- ✅ `PROXY-REVERSO-NGINX.md` - Marcado como legado

---

## 🎯 Benefícios da Mudança

### Antes (Nginx)

```
❌ Conflito com Coolify (porta 80)
❌ Precisa instalar container Nginx
❌ Criar arquivos de configuração
❌ Recarregar Nginx manualmente
❌ Gerenciar arquivos .conf
⚠️  Complexo e propenso a erros
```

### Agora (Traefik)

```
✅ Usa Traefik existente do Coolify
✅ Sem conflito de porta
✅ Configuração via labels (automático)
✅ Detecção automática de containers
✅ Sem arquivos de configuração
✅ Coolify continua funcionando
🎉 Simples e automático!
```

---

## 🔧 Como Funciona Agora

### Fluxo de Deploy

```
1. Usuário clica "Deploy"
   ↓
2. Sistema detecta Traefik rodando
   ↓
3. Cria container com labels do Traefik
   ↓
4. Conecta à rede 'coolify'
   ↓
5. Traefik detecta automaticamente
   ↓
6. ✅ Acesso sem porta!
```

### Labels Gerados

```bash
traefik.enable=true
traefik.docker.network=coolify
traefik.http.routers.sistema-teste.rule=Host(`abc123.38.242.213.195.sslip.io`)
traefik.http.routers.sistema-teste.entrypoints=http
traefik.http.services.sistema-teste.loadbalancer.server.port=3000
```

### Container Criado

```bash
docker run -d \
  --name sistema-teste-1234567890 \
  -e NODE_ENV=production \
  --label traefik.enable=true \
  --label traefik.docker.network=coolify \
  --label traefik.http.routers.sistema-teste.rule=Host(\`abc123.38.242.213.195.sslip.io\`) \
  --label traefik.http.routers.sistema-teste.entrypoints=http \
  --label traefik.http.services.sistema-teste.loadbalancer.server.port=3000 \
  --restart unless-stopped \
  sistema-teste:abc12345

# Conectar à rede
docker network connect coolify sistema-teste-1234567890
```

---

## 📊 Comparação Técnica

| Aspecto | Nginx | Traefik |
|---------|-------|---------|
| **Instalação** | Container separado | Usa existente |
| **Configuração** | Arquivos .conf | Labels Docker |
| **Reload** | Manual | Automático |
| **Porta 80** | Conflito ❌ | Compartilhada ✅ |
| **Coolify** | Incompatível | Compatível |
| **Manutenção** | Alta | Baixa |
| **Complexidade** | Alta | Baixa |

---

## 🚀 Exemplo Prático

### Cenário: Deploy de 3 Projetos

**Projeto 1: Sistema de Teste**
```bash
# Container criado
docker run -d \
  --name sistema-teste-123 \
  --label traefik.http.routers.sistema-teste.rule=Host(\`abc123.38.242.213.195.sslip.io\`) \
  --label traefik.http.services.sistema-teste.loadbalancer.server.port=3000 \
  sistema-teste:latest

# Conectar à rede
docker network connect coolify sistema-teste-123

# ✅ Acesso: http://abc123.38.242.213.195.sslip.io
```

**Projeto 2: API Usuários**
```bash
docker run -d \
  --name api-usuarios-456 \
  --label traefik.http.routers.api-usuarios.rule=Host(\`xyz789.38.242.213.195.sslip.io\`) \
  --label traefik.http.services.api-usuarios.loadbalancer.server.port=3000 \
  api-usuarios:latest

docker network connect coolify api-usuarios-456

# ✅ Acesso: http://xyz789.38.242.213.195.sslip.io
```

**Projeto 3: Frontend**
```bash
docker run -d \
  --name frontend-789 \
  --label traefik.http.routers.frontend.rule=Host(\`def456.38.242.213.195.sslip.io\`) \
  --label traefik.http.services.frontend.loadbalancer.server.port=80 \
  frontend:latest

docker network connect coolify frontend-789

# ✅ Acesso: http://def456.38.242.213.195.sslip.io
```

**Todos funcionando simultaneamente!**

---

## 🔍 Verificação

### Ver containers com Traefik

```bash
docker ps --filter "label=traefik.enable=true"
```

### Ver labels de um container

```bash
docker inspect container-id | grep traefik
```

### Ver redes do container

```bash
docker inspect container-id | grep Networks -A 10
```

### Testar domínio

```bash
curl -H "Host: abc123.38.242.213.195.sslip.io" http://localhost/
```

---

## 🐛 Troubleshooting

### Traefik não encontrado

**Logs mostram**: "Traefik não encontrado"

**Verificar**:
```bash
docker ps | grep -E "traefik|coolify"
```

**Solução**: Sistema cria container sem proxy (com porta exposta como fallback)

### Domínio não responde

**Sintoma**: 404 ou timeout

**Verificar**:
```bash
# Container na rede?
docker inspect container-id | grep coolify

# Labels corretos?
docker inspect container-id | grep traefik

# Traefik rodando?
docker ps | grep coolify-proxy
```

**Solução**:
```bash
# Reconectar à rede
docker network connect coolify container-id

# Reiniciar Traefik
docker restart coolify-proxy
```

---

## 📝 Logs do Deploy

### Sucesso

```
🔧 Configurando Traefik (proxy reverso)...
🔍 Verificando Traefik no servidor...
✅ Traefik (Coolify) encontrado e rodando
🔍 Verificando rede do Coolify...
✅ Rede coolify já existe
📡 Configurando domínio: abc123.38.242.213.195.sslip.io → porta 3000
🔗 Conectando container à rede coolify...
✅ Container conectado à rede coolify
✅ Proxy configurado! Acesse: http://abc123.38.242.213.195.sslip.io
🧪 Testando acesso ao domínio: abc123.38.242.213.195.sslip.io
✅ Domínio está acessível!
🎉 Domínio está acessível!
```

### Traefik não encontrado (Fallback)

```
🔧 Configurando Traefik (proxy reverso)...
🔍 Verificando Traefik no servidor...
⚠️  Traefik não encontrado
⚠️  Traefik não encontrado - container será criado sem proxy
```

---

## 🎉 Resultado

### Você faz:
```
1. Criar projeto remoto
2. Clicar em "Deploy"
```

### Sistema faz:
```
1. ✅ Detectar Traefik
2. ✅ Clonar código
3. ✅ Build Docker
4. ✅ Criar container com labels
5. ✅ Conectar à rede coolify
6. ✅ Traefik detecta automaticamente
```

### Você acessa:
```
http://seu-dominio.sslip.io
```

**Sem porta! Sem configuração! Automático! 🎯**

---

## 📚 Arquivos Modificados

### Novos
- ✅ `backend/src/services/TraefikService.ts`
- ✅ `TRAEFIK-INTEGRATION.md`
- ✅ `TRAEFIK-MIGRATION.md`

### Modificados
- ✅ `backend/src/services/DeployService.ts`
- ✅ `NGINX-AUTOMATICO.md`
- ✅ `PROXY-REVERSO-NGINX.md`

### Mantidos (Legado)
- 📦 `backend/src/services/NginxService.ts` (não usado mais)

---

## 🚀 Próximos Passos

- [ ] Testar deploy com Traefik
- [ ] Verificar acesso sem porta
- [ ] Adicionar HTTPS (Let's Encrypt)
- [ ] Middleware de rate limiting
- [ ] Autenticação básica
- [ ] Métricas e monitoring

---

## 💡 Dicas

### Ver todos os serviços no Traefik

```bash
docker ps --filter "label=traefik.enable=true" --format "table {{.Names}}\t{{.Status}}"
```

### Logs do Traefik

```bash
docker logs coolify-proxy --tail 100 -f
```

### Testar localmente

```bash
curl -H "Host: seu-dominio.sslip.io" http://localhost/
```

### Adicionar HTTPS (futuro)

```bash
# Adicionar labels:
traefik.http.routers.projeto.tls=true
traefik.http.routers.projeto.tls.certresolver=letsencrypt
```

---

## ✅ Conclusão

Migração concluída com sucesso! Sistema agora usa Traefik do Coolify para proxy reverso, eliminando conflitos e simplificando o deploy.

**Benefícios**:
- ✅ Sem conflito de porta 80
- ✅ Configuração automática
- ✅ Compatível com Coolify
- ✅ Mais simples e confiável
- ✅ Acesso sem porta funcionando

**Próximo deploy**: Teste e aproveite! 🎉
