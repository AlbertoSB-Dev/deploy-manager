# Troubleshooting GitHub OAuth

## Problema: Erro 400 ou 401 ao conectar com GitHub

### Passo 1: Verificar se a atualização foi aplicada na VPS

```bash
# Conectar na VPS via SSH
ssh root@38.242.213.195

# Ir para o diretório do projeto
cd /root/deploy-manager

# Verificar se o código está atualizado
git log --oneline -5

# Deve aparecer o commit: "fix: Corrigir rotas do GitHub OAuth no frontend para usar rotas públicas"
```

### Passo 2: Verificar se o frontend foi reconstruído

```bash
# Ver quando o container do frontend foi criado
docker-compose -f docker-compose.prod.yml ps

# Se o frontend não foi reconstruído, fazer:
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml up -d
```

### Passo 3: Limpar cache do navegador

O navegador pode estar usando a versão antiga do JavaScript. Faça:

1. Abra o DevTools (F12)
2. Vá em "Network" (Rede)
3. Marque "Disable cache" (Desabilitar cache)
4. Faça um hard refresh: `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)

Ou simplesmente:
- **Chrome/Edge**: `Ctrl + Shift + Delete` → Limpar cache
- **Firefox**: `Ctrl + Shift + Delete` → Limpar cache

### Passo 4: Verificar logs do backend

```bash
# Ver logs em tempo real
cd /root/deploy-manager
docker-compose -f docker-compose.prod.yml logs -f backend

# Em outra janela, tente conectar ao GitHub no navegador
# Você verá os logs aparecerem aqui
```

### Passo 5: Verificar configurações do GitHub no MongoDB

```bash
# Conectar no MongoDB e verificar configurações
docker exec deploy-manager-mongodb-1 mongosh -u admin -p vQO20N8X8k41oRkAUWAEnw== --authenticationDatabase admin ark-deploy --eval "db.systemsettings.findOne()"
```

Verifique se os campos estão preenchidos:
- `githubClientId`: Deve ter um valor
- `githubClientSecret`: Deve ter um valor
- `githubCallbackUrl`: Deve ser `http://38.242.213.195.sslip.io:8000/auth/github/callback`

### Passo 6: Testar a rota manualmente

```bash
# Testar se a rota de inicialização funciona
curl http://localhost:8001/api/github/auth/github

# Deve retornar algo como:
# {"authUrl":"https://github.com/login/oauth/authorize?client_id=...","message":"Redirecione o usuário para esta URL"}
```

### Passo 7: Verificar no navegador qual URL está sendo chamada

1. Abra o DevTools (F12)
2. Vá em "Network" (Rede)
3. Clique em "Conectar com GitHub"
4. Veja qual URL está sendo chamada

**URLs CORRETAS:**
- ✅ `http://api.38.242.213.195.sslip.io/api/github/auth/github` (GET)
- ✅ `http://api.38.242.213.195.sslip.io/api/github/auth/github/callback` (POST)

**URLs ERRADAS (antigas):**
- ❌ `http://api.38.242.213.195.sslip.io/api/auth/github/connect` (GET)
- ❌ `http://api.38.242.213.195.sslip.io/api/auth/github/connect/callback` (POST)

Se ainda estiver chamando as URLs erradas, o cache do navegador não foi limpo.

### Passo 8: Forçar rebuild completo (último recurso)

Se nada funcionar, force um rebuild completo:

```bash
cd /root/deploy-manager

# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Remover imagens antigas
docker rmi deploy-manager-frontend deploy-manager-backend

# Rebuild completo
docker-compose -f docker-compose.prod.yml build --no-cache

# Subir novamente
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Passo 9: Verificar se o GitHub OAuth App está configurado corretamente

No GitHub (https://github.com/settings/developers):

1. Vá em "OAuth Apps"
2. Selecione sua aplicação
3. Verifique:
   - **Homepage URL**: `http://38.242.213.195.sslip.io:8000`
   - **Authorization callback URL**: `http://38.242.213.195.sslip.io:8000/auth/github/callback`

### Comandos úteis

```bash
# Ver todos os containers
docker ps -a

# Ver logs de um container específico
docker logs deploy-manager-backend-1 --tail=100

# Entrar no container do backend
docker exec -it deploy-manager-backend-1 sh

# Reiniciar apenas o frontend
docker-compose -f docker-compose.prod.yml restart frontend

# Reiniciar apenas o backend
docker-compose -f docker-compose.prod.yml restart backend
```

## Erro específico: "Missing state parameter"

Se você ver este erro, significa que o GitHub está esperando um parâmetro `state` na URL de autorização. Isso é uma medida de segurança.

**Solução**: Adicionar state na URL de autorização (já implementado no código atual).

## Erro específico: "Bad verification code"

Significa que o código OAuth expirou ou já foi usado. Isso é normal se você:
- Demorou muito tempo entre autorizar e fazer o callback
- Tentou usar o mesmo código duas vezes

**Solução**: Tente conectar novamente. O código OAuth expira em 10 minutos.
