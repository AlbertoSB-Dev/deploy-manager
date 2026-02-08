# ⚠️ DESCONTINUADO - Migrado para Traefik

> **NOTA**: Esta funcionalidade foi substituída pela integração com Traefik.
> Veja: `TRAEFIK-INTEGRATION.md`

## Por que mudamos?

- Servidor já tinha Coolify com Traefik na porta 80
- Conflito de porta com Nginx
- Traefik é mais moderno e automático
- Melhor integração com infraestrutura existente

---

# Nginx Automático no Deploy (LEGADO)

## 🎯 Funcionalidade Implementada (Descontinuada)

O sistema **configurava automaticamente** o Nginx como proxy reverso durante o deploy remoto.

### ✅ O que acontece automaticamente:

1. **Primeiro Deploy no Servidor**
   - Instala container Nginx (se não existir)
   - Configura Nginx básico
   - Cria estrutura de diretórios

2. **Deploy de Cada Projeto**
   - Cria configuração específica do projeto
   - Mapeia domínio → porta do container
   - Recarrega Nginx automaticamente

3. **Delete de Projeto**
   - Remove configuração do Nginx
   - Recarrega Nginx
   - Limpa tudo

---

## 🚀 Como Usar

### Não precisa fazer nada! 🎉

Apenas faça o deploy normalmente:

1. Crie projeto remoto
2. Clique em "Deploy"
3. Aguarde...
4. ✅ Pronto! Acesse sem porta

### Logs do Deploy

Você verá nos logs:

```
📦 Instalando Nginx proxy...
✅ Nginx proxy instalado com sucesso!
🔧 Configurando proxy reverso (Nginx)...
✅ Proxy configurado! Acesse: http://abc123.38.242.213.195.sslip.io
```

---

## 📊 Antes vs Depois

### Antes (Manual)

```bash
# 1. SSH no servidor
ssh user@servidor

# 2. Instalar Nginx
docker run -d --name nginx-proxy ...

# 3. Criar config
cat > /opt/nginx/conf.d/projeto.conf << EOF
...
EOF

# 4. Recarregar
docker exec nginx-proxy nginx -s reload
```

### Depois (Automático)

```
1. Clicar em "Deploy"
2. ✅ Pronto!
```

---

## 🔧 Como Funciona

### Estrutura no Servidor

```
/opt/nginx/
├── nginx.conf              # Configuração principal
├── conf.d/                 # Configs de cada projeto
│   ├── sistema-teste.conf
│   ├── api-usuarios.conf
│   └── api-produtos.conf
└── logs/                   # Logs do Nginx
    ├── access.log
    ├── error.log
    ├── sistema-teste-access.log
    └── sistema-teste-error.log
```

### Container Nginx

```bash
docker ps
# nginx-proxy  nginx:alpine  "Up 2 hours"  0.0.0.0:80->80/tcp
```

### Configuração Gerada

Para cada projeto, cria `/opt/nginx/conf.d/projeto-nome.conf`:

```nginx
server {
    listen 80;
    server_name abc123.38.242.213.195.sslip.io;

    access_log /var/log/nginx/projeto-nome-access.log;
    error_log /var/log/nginx/projeto-nome-error.log;

    location / {
        proxy_pass http://172.17.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # ... outros headers
    }
}
```

---

## 🎯 Fluxo Completo

### 1. Primeiro Projeto no Servidor

```
Deploy → Verificar Nginx → Não existe
       → Instalar Nginx
       → Criar estrutura
       → Configurar projeto
       → ✅ Acesso sem porta!
```

### 2. Segundo Projeto no Mesmo Servidor

```
Deploy → Verificar Nginx → Já existe ✅
       → Configurar projeto
       → Recarregar Nginx
       → ✅ Acesso sem porta!
```

### 3. Delete de Projeto

```
Delete → Parar container
       → Remover imagem
       → Remover arquivos
       → Remover config Nginx
       → Recarregar Nginx
       → ✅ Limpo!
```

---

## 📝 Exemplo Prático

### Cenário: 3 Projetos no Mesmo Servidor

**Projeto 1: Sistema de Teste**
```
Domínio: abc123.38.242.213.195.sslip.io
Porta: 9000
Acesso: http://abc123.38.242.213.195.sslip.io ✅
```

**Projeto 2: API Usuários**
```
Domínio: xyz789.38.242.213.195.sslip.io
Porta: 8001
Acesso: http://xyz789.38.242.213.195.sslip.io ✅
```

**Projeto 3: API Produtos**
```
Domínio: def456.38.242.213.195.sslip.io
Porta: 8002
Acesso: http://def456.38.242.213.195.sslip.io ✅
```

**Nginx gerencia tudo automaticamente!**

---

## 🔐 Segurança

### Isolamento

- Cada projeto tem sua própria configuração
- Logs separados por projeto
- Não há interferência entre projetos

### Validação

- Nginx testa configuração antes de recarregar
- Se houver erro, mantém configuração anterior
- Deploy não falha se Nginx der erro (apenas aviso)

### Acesso

- Apenas porta 80 exposta
- Containers não precisam expor portas publicamente
- Nginx faz proxy interno

---

## 🐛 Troubleshooting

### Nginx não instalou

**Sintoma**: Logs mostram erro ao instalar Nginx

**Solução**:
```bash
# SSH no servidor
ssh user@servidor

# Instalar manualmente
docker run -d \
  --name nginx-proxy \
  --restart unless-stopped \
  -p 80:80 \
  -v /opt/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /opt/nginx/conf.d:/etc/nginx/conf.d:ro \
  nginx:alpine
```

### Acesso não funciona

**Sintoma**: 404 ou 502 ao acessar domínio

**Verificar**:
```bash
# Container rodando?
docker ps | grep nginx-proxy

# Config existe?
ls /opt/nginx/conf.d/

# Nginx funcionando?
docker exec nginx-proxy nginx -t

# Logs
docker logs nginx-proxy
```

### Porta 80 já em uso

**Sintoma**: Erro ao iniciar Nginx (porta em uso)

**Solução**:
```bash
# Ver o que está usando porta 80
sudo netstat -tulpn | grep :80

# Parar serviço conflitante
sudo systemctl stop apache2  # ou nginx nativo
```

---

## 💡 Dicas

### Ver configurações ativas

```bash
# SSH no servidor
ls -la /opt/nginx/conf.d/

# Ver config específica
cat /opt/nginx/conf.d/sistema-teste.conf
```

### Ver logs do Nginx

```bash
# Logs gerais
docker logs nginx-proxy

# Logs de projeto específico
docker exec nginx-proxy cat /var/log/nginx/sistema-teste-access.log
```

### Testar configuração

```bash
# Testar sintaxe
docker exec nginx-proxy nginx -t

# Recarregar manualmente
docker exec nginx-proxy nginx -s reload
```

### Backup das configurações

```bash
# Fazer backup
tar -czf nginx-backup.tar.gz /opt/nginx/conf.d/

# Restaurar
tar -xzf nginx-backup.tar.gz -C /
docker exec nginx-proxy nginx -s reload
```

---

## 🚀 Próximas Melhorias

- [ ] SSL/HTTPS automático (Let's Encrypt)
- [ ] Rate limiting por projeto
- [ ] Cache de conteúdo estático
- [ ] Compressão gzip automática
- [ ] WebSocket support otimizado
- [ ] Métricas do Nginx (Prometheus)
- [ ] Dashboard de status

---

## 📊 Benefícios

### Antes (Manual)

- ⏱️ 10-15 minutos por projeto
- 🤯 Complexo (SSH, configs, reload)
- ❌ Propenso a erros
- 📝 Documentação necessária

### Agora (Automático)

- ⚡ 0 minutos (automático)
- 😊 Simples (apenas deploy)
- ✅ Sem erros
- 🎯 Funciona sempre

---

## 🎉 Resultado Final

**Você faz:**
```
1. Criar projeto
2. Clicar em "Deploy"
```

**Sistema faz:**
```
1. Clonar código
2. Build Docker
3. Iniciar container
4. Instalar Nginx (se necessário)
5. Configurar proxy
6. Recarregar Nginx
7. ✅ Pronto para usar!
```

**Você acessa:**
```
http://seu-dominio.sslip.io
```

**Sem porta! Sem configuração manual! Automático! 🎯**

