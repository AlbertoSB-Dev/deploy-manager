# 🌐 Integração com Traefik

## O que é Traefik?

**Traefik** é um proxy reverso moderno que:
- Configura rotas automaticamente via labels do Docker
- Gera certificados SSL automaticamente (Let's Encrypt)
- Faz load balancing
- Tem dashboard web integrado

---

## 🚀 Instalação Automática

O sistema detecta e instala Traefik automaticamente quando necessário.

### Instalação Manual (Opcional)

Se quiser instalar manualmente:

```bash
# Executar script de instalação
cd deploy-manager/scripts
chmod +x install-traefik.sh
./install-traefik.sh
```

---

## 🔍 Verificar se Traefik está Rodando

```bash
# Ver container do Traefik
docker ps | grep coolify-proxy

# Ver logs
docker logs coolify-proxy

# Acessar dashboard
# http://SEU_IP:8080
```

---

## 🎯 Como Funciona

### Fluxo de Requisição:

```
Internet → Traefik (porta 80/443) → Container Docker
```

### Configuração via Labels:

Traefik lê labels dos containers e configura rotas automaticamente:

```bash
docker run -d \
  --name meuapp \
  --network coolify \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.meuapp.rule=Host(\`meuapp.example.com\`)" \
  --label "traefik.http.services.meuapp.loadbalancer.server.port=3000" \
  minha-imagem
```

---

## 📋 Labels do Traefik

### Labels Básicos (HTTP)

```yaml
traefik.enable: "true"
traefik.http.routers.NOME.rule: "Host(`dominio.com`)"
traefik.http.services.NOME.loadbalancer.server.port: "3000"
traefik.docker.network: "coolify"
```

### Labels com SSL (HTTPS)

```yaml
traefik.enable: "true"
traefik.http.routers.NOME.rule: "Host(`dominio.com`)"
traefik.http.routers.NOME.entrypoints: "websecure"
traefik.http.routers.NOME.tls: "true"
traefik.http.routers.NOME.tls.certresolver: "letsencrypt"
traefik.http.services.NOME.loadbalancer.server.port: "3000"
traefik.docker.network: "coolify"
```

### Redirecionamento HTTP → HTTPS

```yaml
# Roteador HTTPS
traefik.http.routers.NOME.rule: "Host(`dominio.com`)"
traefik.http.routers.NOME.entrypoints: "websecure"
traefik.http.routers.NOME.tls: "true"

# Roteador HTTP (redireciona)
traefik.http.routers.NOME-http.rule: "Host(`dominio.com`)"
traefik.http.routers.NOME-http.entrypoints: "web"
traefik.http.routers.NOME-http.middlewares: "NOME-redirect"

# Middleware de redirecionamento
traefik.http.middlewares.NOME-redirect.redirectscheme.scheme: "https"
traefik.http.middlewares.NOME-redirect.redirectscheme.permanent: "true"
```

---

## 🛠️ Uso no Deploy Manager

O sistema adiciona labels automaticamente ao fazer deploy:

### 1. Deploy Simples (HTTP)

```javascript
// O sistema gera automaticamente:
{
  "traefik.enable": "true",
  "traefik.http.routers.meuapp.rule": "Host(`meuapp.38.242.213.195.sslip.io`)",
  "traefik.http.routers.meuapp.entrypoints": "web",
  "traefik.http.services.meuapp.loadbalancer.server.port": "3000",
  "traefik.docker.network": "coolify"
}
```

### 2. Deploy com SSL (HTTPS)

```javascript
// Habilitar SSL no projeto
{
  enableSSL: true
}

// Labels gerados:
{
  "traefik.enable": "true",
  "traefik.http.routers.meuapp.rule": "Host(`meuapp.example.com`)",
  "traefik.http.routers.meuapp.entrypoints": "websecure",
  "traefik.http.routers.meuapp.tls": "true",
  "traefik.http.routers.meuapp.tls.certresolver": "letsencrypt",
  // ... redirecionamento HTTP → HTTPS
}
```

---

## 🌐 Rede Docker

Todos os containers devem estar na rede `coolify`:

```bash
# Criar rede (se não existir)
docker network create coolify

# Conectar container existente
docker network connect coolify nome-do-container

# Verificar containers na rede
docker network inspect coolify
```

---

## 📊 Dashboard do Traefik

Acesse o dashboard para ver:
- Rotas configuradas
- Serviços ativos
- Certificados SSL
- Middlewares

**URL**: `http://SEU_IP:8080`

---

## 🔧 Comandos Úteis

### Ver Containers com Traefik

```bash
docker ps --filter "label=traefik.enable=true"
```

### Ver Labels de um Container

```bash
docker inspect nome-do-container | grep -A 20 Labels
```

### Recarregar Traefik

```bash
docker restart coolify-proxy
```

### Ver Logs do Traefik

```bash
docker logs -f coolify-proxy
```

### Testar Rota

```bash
curl -H "Host: meuapp.example.com" http://localhost
```

---

## 🆘 Troubleshooting

### 1. Container não aparece no Traefik

**Verificar:**
- Container está na rede `coolify`?
- Label `traefik.enable=true` está presente?
- Traefik está rodando?

```bash
docker network inspect coolify
docker inspect nome-do-container | grep traefik
docker ps | grep coolify-proxy
```

### 2. Erro 404 Not Found

**Causa**: Rota não configurada corretamente

**Solução**:
```bash
# Ver rotas no dashboard
# http://SEU_IP:8080

# Verificar labels
docker inspect nome-do-container | grep "traefik.http.routers"
```

### 3. Erro 502 Bad Gateway

**Causa**: Container não está respondendo

**Solução**:
```bash
# Verificar se container está rodando
docker ps | grep nome-do-container

# Verificar logs do container
docker logs nome-do-container

# Testar porta do container
docker exec nome-do-container curl http://localhost:3000
```

### 4. SSL não funciona

**Causa**: Domínio não aponta para o servidor ou porta 80 bloqueada

**Solução**:
```bash
# Verificar DNS
nslookup meuapp.example.com

# Verificar porta 80
netstat -tlnp | grep :80

# Ver logs do Traefik
docker logs coolify-proxy | grep -i acme
```

---

## 🔄 Migração Nginx → Traefik

Se você estava usando Nginx:

### 1. Parar Nginx

```bash
systemctl stop nginx
systemctl disable nginx
```

### 2. Instalar Traefik

```bash
./scripts/install-traefik.sh
```

### 3. Recriar Containers com Labels

```bash
# Parar container antigo
docker stop meuapp

# Recriar com labels do Traefik
docker run -d \
  --name meuapp \
  --network coolify \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.meuapp.rule=Host(\`meuapp.example.com\`)" \
  --label "traefik.http.services.meuapp.loadbalancer.server.port=3000" \
  minha-imagem
```

---

## 📝 Exemplo Completo

### Docker Run

```bash
docker run -d \
  --name meu-app-node \
  --network coolify \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.meuapp.rule=Host(\`meuapp.38.242.213.195.sslip.io\`)" \
  --label "traefik.http.routers.meuapp.entrypoints=web" \
  --label "traefik.http.services.meuapp.loadbalancer.server.port=3000" \
  -e NODE_ENV=production \
  node:20-alpine \
  node server.js
```

### Docker Compose

```yaml
version: '3.8'

services:
  meuapp:
    image: node:20-alpine
    container_name: meu-app-node
    networks:
      - coolify
    environment:
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.meuapp.rule=Host(`meuapp.38.242.213.195.sslip.io`)"
      - "traefik.http.routers.meuapp.entrypoints=web"
      - "traefik.http.services.meuapp.loadbalancer.server.port=3000"
    command: node server.js

networks:
  coolify:
    external: true
```

---

## 🎯 Vantagens do Traefik

✅ **Configuração automática** - Sem arquivos de configuração manual  
✅ **SSL automático** - Let's Encrypt integrado  
✅ **Hot reload** - Detecta novos containers automaticamente  
✅ **Dashboard visual** - Interface web para monitoramento  
✅ **Load balancing** - Distribui carga entre containers  
✅ **Middlewares** - Rate limiting, autenticação, etc  

---

## 📚 Recursos

- **Documentação oficial**: https://doc.traefik.io/traefik/
- **Dashboard**: http://SEU_IP:8080
- **Logs**: `docker logs coolify-proxy`

---

**🎉 Traefik configurado e pronto para uso!**
