# 🌐 Configurar Domínio Customizado

## Problema

Quando você cria um projeto com domínio customizado como `teste.icbgravata.com.br`, o sistema retorna "available server" porque o DNS não está configurado corretamente.

## Como Funciona

```
Cliente → DNS → IP do Servidor → Traefik (porta 80) → Container do Projeto
```

## Passo a Passo

### 1. Verificar Configuração Atual

Execute o script de diagnóstico:

```bash
bash scripts/check-domain-config.sh
```

### 2. Configurar DNS

No painel de controle do seu domínio (ex: Registro.br, GoDaddy, Cloudflare):

**Opção A: Subdomínio**
```
Tipo: A
Nome: teste
Valor: 186.208.237.101  (IP do seu servidor)
TTL: 300
```

**Opção B: Domínio Raiz**
```
Tipo: A
Nome: @
Valor: 186.208.237.101
TTL: 300
```

### 3. Aguardar Propagação

A propagação do DNS pode levar de alguns minutos até 24 horas.

Teste com:
```bash
# Verificar DNS
nslookup teste.icbgravata.com.br

# Testar conectividade
ping teste.icbgravata.com.br

# Testar HTTP
curl -I http://teste.icbgravata.com.br
```

### 4. Verificar Traefik

O Traefik deve estar:
- ✅ Rodando
- ✅ Escutando na porta 80
- ✅ Escutando na porta 443 (para HTTPS)

```bash
# Verificar se Traefik está rodando
docker ps | grep traefik

# Verificar portas
docker ps --filter "name=traefik" --format "{{.Ports}}"
```

Se Traefik não estiver rodando:
```bash
bash scripts/install-traefik.sh
```

### 5. Liberar Portas no Firewall

Se estiver usando firewall (ufw, iptables, etc):

```bash
# UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# Verificar
sudo ufw status
```

### 6. Criar Projeto

Agora você pode criar o projeto com o domínio customizado:

```json
{
  "name": "meu-projeto",
  "domain": "teste.icbgravata.com.br",
  "gitUrl": "https://github.com/usuario/repo",
  "port": 3000
}
```

## Troubleshooting

### Erro: "available server"

**Causa:** DNS não está apontando para o servidor correto

**Solução:**
1. Verifique o DNS: `nslookup teste.icbgravata.com.br`
2. Deve retornar o IP do servidor: `186.208.237.101`
3. Se não retornar, aguarde propagação ou verifique configuração do DNS

### Erro: "Connection refused"

**Causa:** Traefik não está escutando na porta 80

**Solução:**
```bash
# Reinstalar Traefik
bash scripts/install-traefik.sh

# Verificar portas
docker ps --filter "name=traefik" --format "{{.Ports}}"
```

### Erro: "502 Bad Gateway"

**Causa:** Container não está na mesma rede do Traefik

**Solução:**
```bash
# Verificar rede
docker network ls | grep -E "coolify|deploy-manager"

# Conectar container à rede
docker network connect coolify nome-do-container
```

### Erro: "404 Not Found"

**Causa:** Labels do Traefik não estão configuradas corretamente

**Solução:**
```bash
# Verificar labels do container
docker inspect nome-do-container | grep traefik

# Deve mostrar:
# "traefik.enable": "true"
# "traefik.http.routers.xxx.rule": "Host(`teste.icbgravata.com.br`)"
```

## Exemplo Completo

### 1. Configurar DNS
```
Tipo: A
Nome: teste
Valor: 186.208.237.101
TTL: 300
```

### 2. Aguardar e Testar
```bash
# Aguardar 5-10 minutos
sleep 300

# Testar DNS
nslookup teste.icbgravata.com.br
# Deve retornar: 186.208.237.101

# Testar ping
ping -c 4 teste.icbgravata.com.br
# Deve responder
```

### 3. Verificar Traefik
```bash
bash scripts/check-domain-config.sh
```

### 4. Criar Projeto
```bash
curl -X POST http://localhost:8001/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "name": "teste-projeto",
    "domain": "teste.icbgravata.com.br",
    "gitUrl": "https://github.com/usuario/repo",
    "branch": "main",
    "port": 3000
  }'
```

### 5. Fazer Deploy
```bash
curl -X POST http://localhost:8001/projects/PROJECT_ID/deploy \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 6. Testar
```bash
# Aguardar deploy concluir (1-2 minutos)
sleep 60

# Testar aplicação
curl http://teste.icbgravata.com.br
```

## Domínios Automáticos vs Customizados

### Domínios Automáticos (sslip.io)
- ✅ Funcionam imediatamente
- ✅ Não precisam configuração DNS
- ✅ Formato: `nomedoprojeto.186.208.237.101.sslip.io`
- ❌ Domínio longo e feio

### Domínios Customizados
- ✅ Domínio bonito e profissional
- ✅ Formato: `teste.icbgravata.com.br`
- ❌ Precisa configurar DNS
- ❌ Precisa aguardar propagação

## Dicas

1. **Use sslip.io para testes rápidos**
   - Não precisa configurar DNS
   - Funciona imediatamente

2. **Use domínio customizado para produção**
   - Configure DNS antes de criar o projeto
   - Aguarde propagação completa

3. **Teste o DNS antes de fazer deploy**
   ```bash
   nslookup seu-dominio.com.br
   ```

4. **Verifique logs do Traefik**
   ```bash
   docker logs traefik-proxy -f
   ```

5. **Use HTTPS em produção**
   - Traefik pode gerar certificados Let's Encrypt automaticamente
   - Configure `enableSSL: true` no projeto

## Referências

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [sslip.io](https://sslip.io/)
- [Let's Encrypt](https://letsencrypt.org/)
