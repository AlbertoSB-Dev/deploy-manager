# Integração com Traefik (Coolify)

## 🎯 Funcionalidade Implementada

O sistema agora se integra automaticamente com o **Traefik do Coolify** para proxy reverso!

### ✅ Vantagens

- **Sem conflito de porta**: Usa Traefik existente (porta 80)
- **Automático**: Labels do Traefik adicionados automaticamente
- **Coolify continua funcionando**: Não interfere com outros serviços
- **Acesso sem porta**: `http://dominio.sslip.io` ✅

---

## 🚀 Como Funciona

### 1. Deploy Automático

Quando você faz deploy de um projeto remoto:

```
1. Sistema detecta Traefik rodando
2. Cria container com labels do Traefik
3. Conecta à rede 'coolify'
4. Traefik detecta automaticamente
5. ✅ Acesso sem porta!
```

### 2. Labels do Traefik

O sistema adiciona automaticamente:

```bash
traefik.enable=true
traefik.docker.network=coolify
traefik.http.routers.projeto.rule=Host(`dominio.sslip.io`)
traefik.http.routers.projeto.entrypoints=http
traefik.http.services.projeto.loadbalancer.server.port=3000
```

### 3. Rede Coolify

Containers são conectados à rede `coolify` para comunicação com Traefik:

```bash
docker network connect coolify container-id
```

---

## 📊 Logs do Deploy

Você verá nos logs:

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

---

## 🔧 Estrutura Técnica

### Container com Traefik

```bash
docker run -d \
  --name projeto-123456 \
  -e NODE_ENV=production \
  --label traefik.enable=true \
  --label traefik.docker.network=coolify \
  --label traefik.http.routers.projeto.rule=Host(\`dominio.sslip.io\`) \
  --label traefik.http.routers.projeto.entrypoints=http \
  --label traefik.http.services.projeto.loadbalancer.server.port=3000 \
  --restart unless-stopped \
  projeto:abc12345

# Conectar à rede
docker network connect coolify projeto-123456
```

### Verificar Configuração

```bash
# Ver labels do container
docker inspect projeto-123456 | grep traefik

# Ver redes do container
docker inspect projeto-123456 | grep Networks -A 10

# Listar serviços no Traefik
docker ps --filter "label=traefik.enable=true"
```

---

## 🎯 Exemplo Completo

### Cenário: 3 Projetos no Mesmo Servidor

**Projeto 1: Sistema de Teste**
```
Domínio: abc123.38.242.213.195.sslip.io
Porta Interna: 3000
Acesso: http://abc123.38.242.213.195.sslip.io ✅
```

**Projeto 2: API Usuários**
```
Domínio: xyz789.38.242.213.195.sslip.io
Porta Interna: 3000
Acesso: http://xyz789.38.242.213.195.sslip.io ✅
```

**Projeto 3: API Produtos**
```
Domínio: def456.38.242.213.195.sslip.io
Porta Interna: 8080
Acesso: http://def456.38.242.213.195.sslip.io ✅
```

**Traefik gerencia tudo automaticamente!**

---

## 🔍 Troubleshooting

### Traefik não encontrado

**Sintoma**: Logs mostram "Traefik não encontrado"

**Verificar**:
```bash
# SSH no servidor
ssh user@servidor

# Ver containers rodando
docker ps | grep -E "traefik|coolify"

# Deve mostrar algo como:
# coolify-proxy  traefik:v2.10  "Up 5 days"
```

**Solução**: Se Traefik não estiver rodando, o sistema cria container sem proxy (com porta exposta).

### Domínio não responde

**Sintoma**: 404 ou timeout ao acessar domínio

**Verificar**:
```bash
# Container está na rede coolify?
docker inspect container-id | grep coolify

# Labels estão corretos?
docker inspect container-id | grep traefik

# Testar localmente
curl -H "Host: dominio.sslip.io" http://localhost/
```

**Solução**:
```bash
# Reconectar à rede
docker network connect coolify container-id

# Reiniciar Traefik
docker restart coolify-proxy
```

### Container não aparece no Traefik

**Sintoma**: Container rodando mas Traefik não roteia

**Verificar**:
```bash
# Ver logs do Traefik
docker logs coolify-proxy | tail -50

# Verificar se container tem labels
docker inspect container-id --format '{{json .Config.Labels}}' | jq
```

**Solução**:
```bash
# Recriar container com labels corretos
# (sistema faz isso automaticamente no próximo deploy)
```

---

## 💡 Dicas

### Ver todos os serviços no Traefik

```bash
docker ps --filter "label=traefik.enable=true" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Ver configuração do Traefik

```bash
# Dashboard do Traefik (se habilitado)
curl http://localhost:8080/api/http/routers

# Ou ver logs
docker logs coolify-proxy --tail 100
```

### Testar domínio localmente

```bash
# Do servidor
curl -H "Host: seu-dominio.sslip.io" http://localhost/

# De fora (seu computador)
curl http://seu-dominio.sslip.io
```

### Adicionar HTTPS (futuro)

```bash
# Traefik pode usar Let's Encrypt automaticamente
# Adicionar labels:
traefik.http.routers.projeto.tls=true
traefik.http.routers.projeto.tls.certresolver=letsencrypt
```

---

## 🆚 Comparação: Nginx vs Traefik

### Nginx (Anterior)

```
❌ Conflito com Coolify (porta 80)
❌ Configuração manual de arquivos
❌ Reload necessário
✅ Simples e conhecido
```

### Traefik (Atual)

```
✅ Usa infraestrutura existente
✅ Configuração via labels (automático)
✅ Detecção automática de containers
✅ Compatível com Coolify
✅ Sem conflito de porta
```

---

## 🔐 Segurança

### Isolamento

- Cada container tem suas próprias labels
- Traefik roteia baseado no domínio
- Não há interferência entre projetos

### Rede

- Containers na rede `coolify` (isolada)
- Apenas Traefik expõe porta 80
- Comunicação interna via Docker network

### Headers

- X-Forwarded-Proto adicionado automaticamente
- X-Real-IP preservado
- Headers customizados via labels

---

## 📈 Próximas Melhorias

- [ ] HTTPS automático (Let's Encrypt)
- [ ] Middleware de rate limiting
- [ ] Autenticação básica via Traefik
- [ ] Compressão gzip
- [ ] Cache de conteúdo estático
- [ ] WebSocket support otimizado
- [ ] Métricas do Traefik (Prometheus)
- [ ] Dashboard de status

---

## 🎉 Resultado Final

**Você faz:**
```
1. Criar projeto remoto
2. Clicar em "Deploy"
```

**Sistema faz:**
```
1. Detectar Traefik
2. Clonar código
3. Build Docker
4. Criar container com labels
5. Conectar à rede coolify
6. ✅ Traefik detecta automaticamente!
```

**Você acessa:**
```
http://seu-dominio.sslip.io
```

**Sem porta! Sem configuração! Automático! 🎯**

---

## 📚 Referências

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Docker Labels](https://docs.docker.com/config/labels-custom-metadata/)
- [Coolify](https://coolify.io/)
- [sslip.io](https://sslip.io/)
