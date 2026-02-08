# ⚠️ ATUALIZADO - Agora usa Traefik

> **NOTA**: Sistema migrado de Nginx para Traefik.
> Veja: `TRAEFIK-INTEGRATION.md`

## Mudança Principal

- **Antes**: Nginx (conflito com Coolify na porta 80)
- **Agora**: Traefik (integração automática com Coolify)
- **Benefício**: Sem conflito, automático, sem configuração manual

---

# Proxy Reverso com Nginx (LEGADO)

## 🎯 Objetivo (Descontinuado)

Acessar aplicações sem porta na URL:
- ❌ Antes: `http://abc123.38.242.213.195.sslip.io:9000`
- ✅ Depois: `http://abc123.38.242.213.195.sslip.io`

## 📋 Pré-requisitos

- Servidor remoto com Docker
- Acesso SSH ao servidor
- Projetos já fazendo deploy

---

## 🚀 Opção 1: Nginx com Docker (Recomendado)

### Passo 1: Criar arquivo de configuração Nginx

No servidor remoto, crie `/opt/nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    # Configurações gerais
    client_max_body_size 100M;
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Servidor padrão (captura todos os domínios não configurados)
    server {
        listen 80 default_server;
        server_name _;
        
        location / {
            return 404 "Domínio não configurado";
        }
    }

    # Incluir configurações de cada projeto
    include /etc/nginx/conf.d/*.conf;
}
```

### Passo 2: Criar container Nginx

```bash
# No servidor remoto via SSH
docker run -d \
  --name nginx-proxy \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v /opt/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /opt/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v /opt/nginx/logs:/var/log/nginx \
  --network bridge \
  nginx:alpine
```

### Passo 3: Criar configuração para cada projeto

Para cada projeto, criar arquivo `/opt/nginx/conf.d/projeto-nome.conf`:

```nginx
# Exemplo: sistema-de-teste
server {
    listen 80;
    server_name kk1yrijeahcks62d5795b.38.242.213.195.sslip.io;

    location / {
        proxy_pass http://172.17.0.1:9000;  # IP do host Docker + porta do container
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Passo 4: Recarregar Nginx

```bash
docker exec nginx-proxy nginx -s reload
```

---

## 🔧 Opção 2: Nginx Nativo (Sem Docker)

### Passo 1: Instalar Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
```

### Passo 2: Configurar Nginx

Editar `/etc/nginx/nginx.conf` ou criar arquivo em `/etc/nginx/sites-available/`:

```nginx
server {
    listen 80;
    server_name kk1yrijeahcks62d5795b.38.242.213.195.sslip.io;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Passo 3: Ativar e reiniciar

```bash
# Testar configuração
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx

# Habilitar no boot
sudo systemctl enable nginx
```

---

## 🤖 Opção 3: Automatizar no Deploy Manager

### Modificar DeployService para criar config Nginx automaticamente

Adicionar após iniciar container:

```typescript
// 7. Configurar Nginx
this.emitLog(project._id.toString(), '🔧 Configurando proxy reverso...');

const nginxConfig = `
server {
    listen 80;
    server_name ${project.domain};

    location / {
        proxy_pass http://172.17.0.1:${project.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

// Criar arquivo de configuração
await ssh.execCommand(`echo '${nginxConfig}' > /opt/nginx/conf.d/${project.name}.conf`);

// Recarregar Nginx
await ssh.execCommand(`docker exec nginx-proxy nginx -s reload || true`);

this.emitLog(project._id.toString(), '✅ Proxy configurado!');
```

---

## 📊 Comparação de Opções

| Aspecto | Nginx Docker | Nginx Nativo | Automatizado |
|---------|--------------|--------------|--------------|
| Instalação | Fácil | Média | Automática |
| Isolamento | ✅ Alto | ❌ Baixo | ✅ Alto |
| Performance | ✅ Boa | ✅ Ótima | ✅ Boa |
| Manutenção | Fácil | Média | Automática |
| Backup | Fácil | Média | Automática |

---

## 🔐 Adicionar HTTPS (SSL)

### Com Certbot (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d kk1yrijeahcks62d5795b.38.242.213.195.sslip.io

# Renovação automática
sudo certbot renew --dry-run
```

### Configuração manual SSL

```nginx
server {
    listen 443 ssl http2;
    server_name kk1yrijeahcks62d5795b.38.242.213.195.sslip.io;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://localhost:9000;
        # ... resto da config
    }
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name kk1yrijeahcks62d5795b.38.242.213.195.sslip.io;
    return 301 https://$server_name$request_uri;
}
```

---

## 🎯 Exemplo Completo

### Cenário: 3 projetos no mesmo servidor

```nginx
# /opt/nginx/conf.d/sistema-teste.conf
server {
    listen 80;
    server_name abc123.38.242.213.195.sslip.io;
    location / {
        proxy_pass http://172.17.0.1:9000;
        # ... headers
    }
}

# /opt/nginx/conf.d/api-usuarios.conf
server {
    listen 80;
    server_name xyz789.38.242.213.195.sslip.io;
    location / {
        proxy_pass http://172.17.0.1:8001;
        # ... headers
    }
}

# /opt/nginx/conf.d/api-produtos.conf
server {
    listen 80;
    server_name def456.38.242.213.195.sslip.io;
    location / {
        proxy_pass http://172.17.0.1:8002;
        # ... headers
    }
}
```

### Acessos:
- `http://abc123.38.242.213.195.sslip.io` → Container porta 9000
- `http://xyz789.38.242.213.195.sslip.io` → Container porta 8001
- `http://def456.38.242.213.195.sslip.io` → Container porta 8002

---

## 🐛 Troubleshooting

### Erro: 502 Bad Gateway

**Causa**: Nginx não consegue conectar no container

**Solução**:
```bash
# Verificar se container está rodando
docker ps

# Verificar porta
netstat -tulpn | grep 9000

# Testar conexão
curl http://localhost:9000
```

### Erro: 404 Not Found

**Causa**: Domínio não configurado

**Solução**:
```bash
# Verificar configuração
cat /opt/nginx/conf.d/projeto.conf

# Recarregar Nginx
docker exec nginx-proxy nginx -s reload
```

### Erro: Connection refused

**Causa**: IP do host Docker errado

**Solução**:
```bash
# Descobrir IP do host Docker
ip addr show docker0

# Ou usar host.docker.internal (Docker 20.10+)
proxy_pass http://host.docker.internal:9000;
```

---

## 📝 Script de Instalação Rápida

Salve como `setup-nginx-proxy.sh`:

```bash
#!/bin/bash

echo "🚀 Instalando Nginx Proxy..."

# Criar diretórios
mkdir -p /opt/nginx/conf.d
mkdir -p /opt/nginx/logs

# Criar nginx.conf
cat > /opt/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    client_max_body_size 100M;
    
    server {
        listen 80 default_server;
        server_name _;
        return 404;
    }
    
    include /etc/nginx/conf.d/*.conf;
}
EOF

# Iniciar container Nginx
docker run -d \
  --name nginx-proxy \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v /opt/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /opt/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v /opt/nginx/logs:/var/log/nginx \
  nginx:alpine

echo "✅ Nginx Proxy instalado!"
echo "📝 Adicione configurações em: /opt/nginx/conf.d/"
```

Executar:
```bash
chmod +x setup-nginx-proxy.sh
sudo ./setup-nginx-proxy.sh
```

---

## 🎯 Próximos Passos

1. **Instalar Nginx** no servidor remoto
2. **Criar configuração** para cada projeto
3. **Testar acesso** sem porta
4. **Adicionar SSL** (opcional)
5. **Automatizar** no Deploy Manager (futuro)

---

## 💡 Dicas

- Use `172.17.0.1` para acessar host Docker de dentro do container Nginx
- Mantenha um arquivo de config por projeto
- Use `nginx -t` para testar antes de recarregar
- Monitore logs: `docker logs nginx-proxy`
- Backup das configs: `/opt/nginx/conf.d/`

