# ⚡ Solução Rápida: Erro 403 Forbidden

## 🎯 Comando Direto (Use Este!)

Execute na VPS:

```bash
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.updateOne({email: 'beto@gmail.com'}, {\$set: {role: 'super_admin'}})"
```

## ✅ Resultado Esperado

```
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 1,
  modifiedCount: 1,
  upsertedCount: 0
}
```

## 🔄 Próximos Passos

1. **Fazer logout** do painel
2. **Fazer login** novamente
3. Acessar `/admin` - deve funcionar agora! ✅

## 🔍 Verificar se Funcionou

```bash
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.findOne({email: 'beto@gmail.com'}, {email: 1, role: 1})"
```

Deve mostrar:
```javascript
{
  _id: ObjectId("..."),
  email: 'beto@gmail.com',
  role: 'super_admin'  // ← Deve estar assim!
}
```

## 🚨 Se Ainda Der Erro

### 1. Limpar Cache do Navegador

```javascript
// No console do navegador (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Verificar Token JWT

```javascript
// No console do navegador
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Role no token:', payload.role);
}
```

Se mostrar `role: 'user'`, faça logout e login novamente.

### 3. Verificar Logs do Backend

```bash
docker-compose logs backend | tail -50
```

Procure por:
- `❌ Acesso negado: super_admin necessário`
- `403 Forbidden`

## 📋 Outros Usuários

Para tornar outro usuário super_admin:

```bash
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.updateOne({email: 'outro@email.com'}, {\$set: {role: 'super_admin'}})"
```

## 🎯 Resumo Ultra-Rápido

```bash
# 1. Atualizar role
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.updateOne({email: 'beto@gmail.com'}, {\$set: {role: 'super_admin'}})"

# 2. Fazer logout e login no painel

# 3. Pronto! ✅
```

## 💡 Por Que o Script Não Funcionou?

O script `make-user-super-admin.js` foi criado mas não foi commitado no git, então não existe na VPS. O comando direto no MongoDB é mais rápido e não depende de arquivos.

## 🔐 Hierarquia de Permissões

| Role | Acesso |
|------|--------|
| `user` | Dashboard básico |
| `admin` | Gerenciar usuários |
| `super_admin` | **Tudo** (incluindo /admin/*) |

## ✨ Dica

Depois que resolver, você pode criar o script na VPS:

```bash
cd /opt/ark-deploy
git pull
cd backend
npm install
node scripts/make-user-super-admin.js beto@gmail.com
```

Mas o comando direto MongoDB é sempre mais rápido! 🚀
