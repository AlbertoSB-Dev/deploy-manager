# Troubleshooting - Traefik 404 Not Found

## Problema
Após deploy, a aplicação roda corretamente na porta configurada (ex: 9001), mas ao acessar o domínio retorna **404 page not found** do Traefik.

## Causa
O erro "404 page not found" vem do Traefik, o que significa que:
1. ✅ Traefik está funcionando
2. ✅ Domínio está resolvendo para o servidor
3. ❌ Traefik não está encontrando o serviço/container

Possíveis causas:
- Container não está na mesma rede do Traefik
- Labels do Traefik não foram aplicados corretamente
- Traefik não detectou o novo container

## Solução Automática

### Via API
```bash
POST /api/projects/:id/fix-traefik
```

Este endpoint:
1. Verifica se Traefik está rodando
2. Detecta a rede do Traefik (coolify ou deploy-manager)
3. Conecta o container à rede do Traefik se necessário
4. Verifica se labels estão corretos
5. Reinicia o Traefik para forçar detecção
6. Testa conectividade interna

### Via Script
```bash
# No servidor remoto
bash /path/to/fix-traefik-routing.sh sistema-de-teste2 sistemadeteste2.38.242.213.195.sslip.io 9001
```

## Solução Manual

### 1. Verificar se container está rodando
```bash
docker ps | grep sistema-de-teste2
```

### 2. Verificar rede do Traefik
```bash
docker inspect traefik-proxy --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}'
```

### 3. Verificar redes do container
```bash
CONTAINER_ID=$(docker ps --filter "name=sistema-de-teste2" --format "{{.ID}}" | head -n 1)
docker inspect $CONTAINER_ID --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}'
```

### 4. Conectar container à rede do Traefik
```bash
# Se container não estiver na rede do Traefik
TRAEFIK_NETWORK=$(docker inspect traefik-proxy --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}')
docker network connect $TRAEFIK_NETWORK $CONTAINER_ID
```

### 5. Verificar labels do Traefik
```bash
docker inspect $CONTAINER_ID --format '{{range $key, $value := .Config.Labels}}{{if eq $key "traefik.enable"}}{{$key}}={{$value}}{{end}}{{end}}'
```

Se não retornar `traefik.enable=true`, o container precisa ser recriado com labels corretos.

### 6. Reiniciar Traefik
```bash
docker restart traefik-proxy
```

Aguarde 5-10 segundos para o Traefik detectar as mudanças.

### 7. Testar conectividade interna
```bash
# Pegar IP do container
CONTAINER_IP=$(docker inspect $CONTAINER_ID --format '{{range $key, $value := .NetworkSettings.Networks}}{{$value.IPAddress}}{{end}}' | head -c -1)

# Testar de dentro do Traefik
docker exec traefik-proxy wget -q -O- --timeout=2 http://$CONTAINER_IP:9001
```

## Verificação de Labels Corretos

O container deve ter estes labels:
```
traefik.enable=true
traefik.http.routers.sistemadeteste2.rule=Host(`sistemadeteste2.38.242.213.195.sslip.io`)
traefik.http.routers.sistemadeteste2.entrypoints=web
traefik.http.services.sistemadeteste2.loadbalancer.server.port=9001
traefik.docker.network=coolify (ou deploy-manager)
```

## Dashboard do Traefik

Acesse o dashboard para ver rotas registradas:
```
http://SEU_IP:8080
```

No dashboard você pode verificar:
- **HTTP Routers**: Deve aparecer o router do seu projeto
- **HTTP Services**: Deve aparecer o serviço com a porta correta
- **HTTP Middlewares**: Middlewares aplicados (se houver)

## Logs Úteis

### Logs do Traefik
```bash
docker logs traefik-proxy --tail 50
```

### Logs do Container
```bash
docker logs $CONTAINER_ID --tail 50
```

### Logs do Deploy
Verifique os logs do deploy no painel do Deploy Manager para ver se houve algum erro durante a configuração.

## Prevenção

Para evitar este problema em futuros deploys:

1. **Sempre use a mesma rede**: O sistema detecta automaticamente se Coolify existe e usa a rede `coolify`, senão cria `deploy-manager`

2. **Labels são aplicados no docker run**: Os labels do Traefik são adicionados automaticamente durante o deploy

3. **Verificação automática**: O sistema agora verifica automaticamente se o container está na rede correta após o deploy

## Checklist de Diagnóstico

- [ ] Traefik está rodando?
- [ ] Container está rodando?
- [ ] Container está na mesma rede do Traefik?
- [ ] Container tem labels do Traefik?
- [ ] Porta configurada está correta (9001)?
- [ ] Aplicação está respondendo internamente?
- [ ] Traefik foi reiniciado após mudanças?
- [ ] Aguardou 5-10 segundos após mudanças?

## Contato

Se o problema persistir após seguir todos os passos, verifique:
- Firewall do servidor (portas 80 e 443 abertas)
- DNS do domínio (sslip.io deve resolver automaticamente)
- Logs do Traefik para erros específicos
