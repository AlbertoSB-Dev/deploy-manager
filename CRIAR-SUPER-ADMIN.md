# Como Criar Super Admin na VPS

## Problema
O MongoDB na VPS requer autenticação. O usuário `beto@gmail.com` precisa ser promovido para `super_admin`.

## Credenciais do MongoDB (docker-compose.yml)
- Usuário: `admin`
- Senha: `changeme123` (ou valor de MONGO_PASSWORD no .env)
- Database de autenticação: `admin`
- Database do app: `ark-deploy`

## Solução 1: Comando Direto (RECOMENDADO)

Execute este comando na VPS:

```bash
docker-compose exec mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin ark-deploy --eval "db.users.updateOne({email: 'beto@gmail.com'}, {\$set: {role: 'super_admin'}})"
```

Se a senha do MongoDB for diferente, substitua `changeme123` pela senha correta do arquivo `.env` (variável `MONGO_PASSWORD`).

## Solução 2: Entrar no MongoDB Manualmente

```bash
# 1. Entrar no container do MongoDB
docker-compose exec mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin

# 2. Selecionar o database
use ark-deploy

# 3. Atualizar o usuário
db.users.updateOne({email: 'beto@gmail.com'}, {$set: {role: 'super_admin'}})

# 4. Verificar
db.users.findOne({email: 'beto@gmail.com'}, {email: 1, name: 1, role: 1})

# 5. Sair
exit
```

## Solução 3: Criar Novo Super Admin

Se preferir criar um novo usuário super admin:

```bash
docker-compose exec mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin ark-deploy --eval "db.users.insertOne({name: 'Super Admin', email: 'admin@arkdeploy.com', password: '\$2a\$10\$rZ5L3KZ9vZ5L3KZ9vZ5L3u7Z5L3KZ9vZ5L3KZ9vZ5L3KZ9vZ5L3KZ', role: 'super_admin', isActive: true, subscription: {status: 'active', startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), serversCount: 999}, createdAt: new Date(), updatedAt: new Date()})"
```

Senha padrão: `admin123`

## Verificar se Funcionou

```bash
docker-compose exec mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin ark-deploy --eval "db.users.find({role: 'super_admin'}, {email: 1, name: 1, role: 1}).pretty()"
```

## Após Atualizar

1. Faça logout no painel
2. Faça login novamente
3. O menu "Admin" deve aparecer
4. Acesse `/admin` para verificar

## Troubleshooting

### Erro: "Command update requires authentication"
- Você esqueceu de passar as credenciais `-u admin -p changeme123 --authenticationDatabase admin`

### Erro: "Authentication failed"
- A senha está incorreta. Verifique o arquivo `.env` na VPS e procure por `MONGO_PASSWORD`

### Como descobrir a senha do MongoDB

```bash
# Na VPS, execute:
cd /opt/ark-deploy
cat .env | grep MONGO_PASSWORD
```

Se não houver `MONGO_PASSWORD` no `.env`, a senha padrão é `changeme123`.
