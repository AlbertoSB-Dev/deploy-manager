# Troubleshooting - Traefik

## 🎯 Problemas Comuns e Soluções

### 1. HTTP 504 Gateway Timeout

**Sintoma**: Deploy concluído mas domínio retorna 504

**O que significa**:
- ✅ Traefik está funcionando
- ✅ Roteamento está correto
- ⏳ Container ainda está iniciando

**Solução**: Aguardar 10-30 segundos

**Verificar**:
```bash
# SSH no servidor
ssh user@servidor

# Ver se container está rodando
docker ps | grep sistema-de-teste

# Ver logs do container
docker logs container-id

# Testar novamente
curl http://1zapc6j1sdcf7mchyjkaxf.38.242.213.195.sslip.io
```

**Causas comuns**:
- Aplicação demora para iniciar (Node.js, npm install, etc)
- Aplicação não está escutando na porta correta
- Aplicação tem erro e não inicia

---

### 2. HTTP 502 Bad Gateway

**Sintoma**: Domínio retorna 502

**O que significa**:
- ✅ Traefik está funcionando
- ✅ Roteamento está correto
- ❌ Container não está respondendo

**Verificar**:
```bash
# Container está rodando?
docker ps | grep projeto

# Logs do container
docker logs container-id --tail 50

# Container está na rede coolify?
docker inspect container-id | grep coolify
```

**Soluções**:

**A. Aplicação não está escutando na porta correta**
```bash
# Verificar porta interna
docker inspect container-id | grep -A 5 Labels

# Deve mostrar:
# traefik.http.services.projeto.loadbalancer.server.port=3000

# Sua aplicação deve escutar na porta 3000
```

**B. Container não está na rede coolify**
```bash
# Conectar manualmente
docker network connect coolify container-id

# Reiniciar Traefik
docker restart coolify-proxy

# Testar novamente
curl http://seu-dominio.sslip.io
```

**C. Aplicação tem erro**
```bash
# Ver logs completos
docker logs container-id

# Entrar no container
docker exec -it container-id sh

# Testar aplicação internamente
curl http://localhost:3000
```

---

### 3. HTTP 404 Not Found

**Sintoma**: Domínio retorna 404 do Traefik

**O que significa**:
- ✅ Traefik está funcionando
- ❌ Roteamento não encontrado
- ❌ Labels incorretos ou ausentes

**Verificar**:
```bash
# Container tem labels do Traefik?
docker inspect container-id | grep traefik

# Deve mostrar:
# traefik.enable=true
# traefik.http.routers.projeto.rule=Host(`dominio.sslip.io`)
```

**Soluções**:

**A. Labels ausentes**
```bash
# Fazer novo deploy
# Sistema vai recriar container com labels corretos
```

**B. Domínio incorreto no label**
```bash
# Ver qual domínio está configurado
docker inspect container-id | grep "traefik.http.routers" | grep rule

# Acessar o domínio correto
```

**C. Traefik não detectou o container**
```bash
# Reiniciar Traefik
docker restart coolify-proxy

# Aguardar 10 segundos
sleep 10

# Testar novamente
curl http://seu-dominio.sslip.io
```

---

### 4. Connection Refused / Timeout

**Sintoma**: Não consegue acessar o domínio (timeout)

**O que significa**:
- ❌ Traefik não está rodando
- ❌ Porta 80 bloqueada
- ❌ Firewall bloqueando

**Verificar**:
```bash
# Traefik está rodando?
docker ps | grep coolify-proxy

# Porta 80 está aberta?
sudo netstat -tulpn | grep :80

# Firewall
sudo ufw status
```

**Soluções**:

**A. Traefik não está rodando**
```bash
# Iniciar Traefik
docker start coolify-proxy

# Ou instalar Coolify
curl -fsSL https://get.coolify.io | bash
```

**B. Firewall bloqueando**
```bash
# Abrir porta 80
sudo ufw allow 80/tcp

# Verificar
sudo ufw status
```

**C. Testar localmente primeiro**
```bash
# Do servidor
curl -H "Host: seu-dominio.sslip.io" http://localhost/

# Se funcionar localmente, problema é firewall/rede
```

---

### 5. Container não está na rede coolify

**Sintoma**: 502 ou 504 persistente

**Verificar**:
```bash
# Ver redes do container
docker inspect container-id --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}'

# Deve mostrar: coolify
```

**Solução**:
```bash
# Conectar à rede
docker network connect coolify container-id

# Verificar novamente
docker inspect container-id | grep coolify

# Testar
curl http://seu-dominio.sslip.io
```

---

### 6. Aplicação não escuta na porta correta

**Sintoma**: 502 Bad Gateway constante

**Verificar**:
```bash
# Ver porta configurada no Traefik
docker inspect container-id | grep "loadbalancer.server.port"

# Entrar no container
docker exec -it container-id sh

# Ver processos
ps aux

# Testar porta internamente
curl http://localhost:3000
```

**Soluções**:

**A. Aplicação escuta em porta diferente**

Se sua aplicação escuta na porta 8080 (não 3000):

1. Editar projeto no Deploy Manager
2. Mudar "Porta Interna" para 8080
3. Fazer novo deploy

**B. Aplicação não está iniciando**
```bash
# Ver logs
docker logs container-id

# Verificar variáveis de ambiente
docker inspect container-id | grep -A 20 Env

# Entrar e iniciar manualmente
docker exec -it container-id sh
npm start
```

---

## 🔍 Comandos Úteis

### Ver status do Traefik

```bash
# Container rodando?
docker ps | grep coolify-proxy

# Logs do Traefik
docker logs coolify-proxy --tail 100 -f

# Ver configuração
docker inspect coolify-proxy
```

### Ver containers gerenciados

```bash
# Todos com Traefik
docker ps --filter "label=traefik.enable=true"

# Ver labels de um container
docker inspect container-id --format '{{json .Config.Labels}}' | jq
```

### Testar roteamento

```bash
# Do servidor
curl -H "Host: seu-dominio.sslip.io" http://localhost/

# Com verbose
curl -v -H "Host: seu-dominio.sslip.io" http://localhost/

# Ver headers
curl -I http://seu-dominio.sslip.io
```

### Ver redes

```bash
# Listar redes
docker network ls

# Ver containers na rede coolify
docker network inspect coolify

# Conectar container
docker network connect coolify container-id

# Desconectar
docker network disconnect coolify container-id
```

---

## 🎯 Checklist de Diagnóstico

Quando algo não funcionar, verificar nesta ordem:

### 1. Traefik está rodando?
```bash
docker ps | grep coolify-proxy
```
- ✅ Sim → Próximo passo
- ❌ Não → Iniciar Traefik

### 2. Container está rodando?
```bash
docker ps | grep projeto-nome
```
- ✅ Sim → Próximo passo
- ❌ Não → Ver logs e reiniciar

### 3. Container tem labels?
```bash
docker inspect container-id | grep traefik
```
- ✅ Sim → Próximo passo
- ❌ Não → Fazer novo deploy

### 4. Container está na rede coolify?
```bash
docker inspect container-id | grep coolify
```
- ✅ Sim → Próximo passo
- ❌ Não → Conectar à rede

### 5. Aplicação está respondendo?
```bash
docker exec container-id curl http://localhost:3000
```
- ✅ Sim → Problema no Traefik
- ❌ Não → Problema na aplicação

### 6. Traefik está roteando?
```bash
curl -H "Host: dominio.sslip.io" http://localhost/
```
- ✅ Sim → Problema no DNS/Firewall
- ❌ Não → Reiniciar Traefik

---

## 💡 Dicas Avançadas

### Ver dashboard do Traefik

Se Traefik tem dashboard habilitado:

```bash
# Acessar dashboard
curl http://localhost:8080/api/http/routers

# Ver routers
curl http://localhost:8080/api/http/routers | jq

# Ver services
curl http://localhost:8080/api/http/services | jq
```

### Forçar Traefik a redetectar

```bash
# Reiniciar Traefik
docker restart coolify-proxy

# Aguardar 10 segundos
sleep 10

# Testar
curl http://seu-dominio.sslip.io
```

### Debug de labels

```bash
# Ver todos os labels
docker inspect container-id --format '{{range $key, $value := .Config.Labels}}{{$key}}={{$value}}{{"\n"}}{{end}}'

# Filtrar apenas Traefik
docker inspect container-id --format '{{range $key, $value := .Config.Labels}}{{if eq (index (split $key ".") 0) "traefik"}}{{$key}}={{$value}}{{"\n"}}{{end}}{{end}}'
```

### Logs em tempo real

```bash
# Container
docker logs -f container-id

# Traefik
docker logs -f coolify-proxy

# Ambos (em terminais separados)
docker logs -f container-id &
docker logs -f coolify-proxy
```

---

## 🚨 Problemas Críticos

### Porta 80 já em uso

**Erro**: `Bind for :::80 failed: port is already allocated`

**Solução**:
```bash
# Ver o que está usando porta 80
sudo netstat -tulpn | grep :80

# Parar serviço conflitante
sudo systemctl stop apache2
sudo systemctl stop nginx

# Ou usar Nginx como fallback (sistema faz automaticamente)
```

### Rede coolify não existe

**Erro**: `network coolify not found`

**Solução**:
```bash
# Criar rede
docker network create coolify

# Conectar Traefik
docker network connect coolify coolify-proxy

# Conectar container
docker network connect coolify container-id
```

### Traefik não detecta containers

**Sintoma**: Containers com labels mas Traefik não roteia

**Solução**:
```bash
# Verificar se Traefik está monitorando Docker
docker inspect coolify-proxy | grep docker.sock

# Deve mostrar:
# /var/run/docker.sock:/var/run/docker.sock

# Se não tiver, Traefik precisa ser reconfigurado
```

---

## 📊 Códigos HTTP e Significados

| Código | Significado | Ação |
|--------|-------------|------|
| 200 | ✅ Funcionando | Nada a fazer |
| 301/302 | ✅ Redirecionamento | Normal |
| 404 | ❌ Rota não encontrada | Verificar labels |
| 502 | ⚠️ Container não responde | Verificar aplicação |
| 503 | ⚠️ Serviço indisponível | Aguardar inicialização |
| 504 | ⏳ Timeout | Aguardar ou verificar app |
| 000 | ❌ Sem conexão | Verificar Traefik/Firewall |

---

## ✅ Solução Rápida

Se nada funcionar, fazer deploy limpo:

```bash
# 1. Parar e remover container
docker stop container-id
docker rm container-id

# 2. Limpar rede
docker network disconnect coolify container-id || true

# 3. Fazer novo deploy pelo Deploy Manager
# Sistema vai recriar tudo corretamente

# 4. Aguardar 30 segundos
sleep 30

# 5. Testar
curl http://seu-dominio.sslip.io
```

---

## 🎉 Quando Funcionar

Você verá:

```bash
$ curl http://seu-dominio.sslip.io
<!DOCTYPE html>
<html>
  <head>
    <title>Sua Aplicação</title>
  </head>
  ...
```

**Parabéns! Traefik está funcionando perfeitamente! 🎯**
