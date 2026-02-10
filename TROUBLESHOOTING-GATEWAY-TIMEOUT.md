# 🔴 Gateway Timeout - Troubleshooting

## 🔍 O que é Gateway Timeout?

**504 Gateway Timeout** significa que o Nginx não conseguiu se conectar ao container da aplicação dentro do tempo limite.

---

## 🚨 Verificações Rápidas

### 1. Verificar se o Container está Rodando

```bash
# Ver todos os containers
docker ps -a

# Ver logs do container
docker logs nome-do-container

# Ver logs em tempo real
docker logs -f nome-do-container
```

**O que procurar:**
- ✅ Container com status `Up`
- ❌ Container com status `Exited` ou `Restarting`

### 2. Verificar se a Aplicação está Respondendo

```bash
# Testar dentro do servidor
curl http://localhost:PORTA_DO_CONTAINER

# Exemplo:
curl http://localhost:9000

# Ou testar dentro do container
docker exec -it nome-do-container curl http://localhost:PORTA
```

**Resposta esperada:**
- ✅ HTML da aplicação ou JSON
- ❌ `Connection refused` ou timeout

### 3. Verificar Configuração do Nginx

```bash
# Ver configuração do Nginx para o projeto
cat /etc/nginx/sites-available/nome-do-projeto

# Testar configuração
nginx -t

# Ver logs de erro do Nginx
tail -f /var/log/nginx/error.log
```

---

## 🛠️ Soluções Comuns

### Solução 1: Container Parado - Iniciar

```bash
# Listar containers parados
docker ps -a | grep Exited

# Iniciar container
docker start nome-do-container

# Verificar logs
docker logs -f nome-do-container
```

### Solução 2: Aplicação Não Iniciou - Ver Logs

```bash
# Ver logs completos
docker logs nome-do-container

# Procurar por erros
docker logs nome-do-container 2>&1 | grep -i error
```

**Erros comuns:**
- `EADDRINUSE` - Porta já em uso
- `MODULE_NOT_FOUND` - Dependências não instaladas
- `ECONNREFUSED` - Banco de dados não conecta
- Erro de sintaxe no código

### Solução 3: Porta Errada no Nginx

Verificar se a porta no Nginx bate com a porta do container:

```bash
# Ver porta do container
docker ps | grep nome-do-container

# Ver configuração do Nginx
cat /etc/nginx/sites-available/nome-do-projeto | grep proxy_pass
```

**Exemplo correto:**
```nginx
# Container rodando na porta 9000
proxy_pass http://localhost:9000;
```

### Solução 4: Nginx Não Configurado

Se o Nginx não foi configurado automaticamente:

```bash
# Criar configuração manualmente
cat > /etc/nginx/sites-available/meuapp << 'EOF'
server {
    listen 80;
    server_name meuapp.38.242.213.195.sslip.io;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout aumentado
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Criar link simbólico
ln -s /etc/nginx/sites-available/meuapp /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx
```

### Solução 5: Firewall Bloqueando

```bash
# Verificar se porta está aberta
netstat -tlnp | grep :9000

# Permitir porta no firewall
ufw allow 9000/tcp

# Ou desabilitar firewall temporariamente (teste)
ufw disable
```

### Solução 6: Aplicação Travada - Reiniciar

```bash
# Reiniciar container
docker restart nome-do-container

# Ou parar e iniciar
docker stop nome-do-container
docker start nome-do-container

# Ver logs
docker logs -f nome-do-container
```

---

## 🔧 Comandos de Diagnóstico Completo

Execute estes comandos e me envie o resultado:

```bash
echo "=== CONTAINERS ==="
docker ps -a

echo ""
echo "=== LOGS DO CONTAINER ==="
docker logs nome-do-container --tail 50

echo ""
echo "=== PORTAS EM USO ==="
netstat -tlnp | grep LISTEN

echo ""
echo "=== CONFIGURAÇÃO NGINX ==="
cat /etc/nginx/sites-available/nome-do-projeto

echo ""
echo "=== LOGS NGINX ==="
tail -20 /var/log/nginx/error.log

echo ""
echo "=== TESTE LOCAL ==="
curl -I http://localhost:9000
```

---

## 📋 Checklist de Verificação

- [ ] Container está rodando? (`docker ps`)
- [ ] Aplicação iniciou sem erros? (`docker logs`)
- [ ] Porta do container está correta?
- [ ] Nginx está configurado? (`/etc/nginx/sites-available/`)
- [ ] Configuração do Nginx está correta? (`nginx -t`)
- [ ] Aplicação responde localmente? (`curl localhost:PORTA`)
- [ ] Firewall permite a porta?
- [ ] Nginx foi recarregado? (`systemctl reload nginx`)

---

## 🎯 Solução Passo a Passo

### Passo 1: Verificar Container

```bash
docker ps -a | grep nome-do-projeto
```

**Se estiver `Exited`:**
```bash
docker start nome-do-container
docker logs -f nome-do-container
```

### Passo 2: Testar Aplicação

```bash
# Substituir 9000 pela porta do seu container
curl http://localhost:9000
```

**Se funcionar:** Problema é no Nginx  
**Se não funcionar:** Problema é na aplicação

### Passo 3: Verificar Nginx

```bash
# Ver configuração
cat /etc/nginx/sites-available/nome-do-projeto

# Testar
nginx -t

# Recarregar
systemctl reload nginx
```

### Passo 4: Testar Domínio

```bash
# Do servidor
curl -I http://meuapp.38.242.213.195.sslip.io

# Do seu computador
# Abrir no navegador
```

---

## 🆘 Ainda Não Funciona?

### Opção 1: Acessar Direto pelo IP:PORTA

Temporariamente, acesse direto:
```
http://38.242.213.195:9000
```

Isso confirma se a aplicação está funcionando.

### Opção 2: Logs Detalhados

```bash
# Logs do container em tempo real
docker logs -f nome-do-container

# Logs do Nginx em tempo real
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Opção 3: Reiniciar Tudo

```bash
# Reiniciar container
docker restart nome-do-container

# Reiniciar Nginx
systemctl restart nginx

# Aguardar 10 segundos
sleep 10

# Testar
curl http://localhost:9000
```

---

## 💡 Dicas

1. **Sempre verifique os logs primeiro**: `docker logs nome-do-container`
2. **Teste localmente antes**: `curl localhost:PORTA`
3. **Nginx precisa ser recarregado** após mudanças: `systemctl reload nginx`
4. **Aguarde a aplicação iniciar**: Algumas apps levam 10-30 segundos
5. **Verifique a porta**: Container e Nginx devem usar a mesma porta

---

## 📞 Informações Úteis

**Qual domínio está dando erro?**
```
meuapp.38.242.213.195.sslip.io
```

**Qual porta do container?**
```
9000
```

**Container está rodando?**
```bash
docker ps | grep meuapp
```

**Aplicação responde localmente?**
```bash
curl http://localhost:9000
```

---

**🎯 Na maioria dos casos, o problema é:**
1. Container não está rodando (70%)
2. Aplicação não iniciou corretamente (20%)
3. Nginx mal configurado (10%)

Execute os comandos de diagnóstico e me envie o resultado! 🚀
