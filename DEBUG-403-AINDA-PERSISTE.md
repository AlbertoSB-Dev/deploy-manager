# 🔍 Debug: Erro 403 Ainda Persiste

## ❌ Situação

Você já executou:
```bash
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.updateOne({email: 'beto@gmail.com'}, {\$set: {role: 'super_admin'}})"
```

Mas ainda recebe erro 403 em `/api/admin/settings`

## 🔍 Diagnóstico

### 1. Verificar Role no Banco de Dados

```bash
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.findOne({email: 'beto@gmail.com'}, {email: 1, role: 1, name: 1})"
```

**Resultado esperado:**
```javascript
{
  _id: ObjectId("..."),
  email: 'beto@gmail.com',
  name: 'Seu Nome',
  role: 'super_admin'  // ← DEVE estar assim!
}
```

Se não estiver como `super_admin`, execute novamente o comando de atualização.

### 2. Verificar Token JWT no Navegador

Abra o Console do Navegador (F12) e execute:

```javascript
// Ver token armazenado
const token = localStorage.getItem('token');
console.log('Token:', token);

// Decodificar payload do token
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Payload do Token:', payload);
  console.log('Role no Token:', payload.role);
  console.log('User ID:', payload.id);
}
```

**O que verificar:**
- Se `payload.role` é `'super_admin'` → Token está correto
- Se `payload.role` é `'user'` ou `'admin'` → Token está desatualizado

### 3. Limpar Cache e Fazer Logout/Login

#### Opção A: Limpar Tudo (Recomendado)

No Console do Navegador (F12):
```javascript
// Limpar tudo
localStorage.clear();
sessionStorage.clear();
console.log('✅ Cache limpo!');

// Recarregar página
location.href = '/login';
```

#### Opção B: Logout Manual

1. Clicar no menu do usuário
2. Clicar em "Sair"
3. Fazer login novamente

### 4. Verificar Logs do Backend

```bash
# Ver logs em tempo real
docker-compose logs -f backend

# Ou últimas 100 linhas
docker-compose logs backend | tail -100
```

Procure por:
- `❌ Acesso negado. Apenas super administradores.`
- `403 Forbidden`
- Informações sobre o usuário que está fazendo a requisição

### 5. Testar Endpoint Diretamente

No Console do Navegador (F12):

```javascript
// Pegar token
const token = localStorage.getItem('token');

// Fazer requisição de teste
fetch('http://api.38.242.213.195.sslip.io/api/admin/settings', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Resposta:', data))
.catch(err => console.error('Erro:', err));
```

## 🔧 Soluções

### Solução 1: Forçar Novo Login

```javascript
// No Console do Navegador (F12)
localStorage.removeItem('token');
localStorage.removeItem('user');
location.href = '/login';
```

Faça login novamente. O novo token terá a role atualizada.

### Solução 2: Verificar se Backend Está Atualizado

```bash
cd /opt/ark-deploy
git log -1 --oneline
```

Deve mostrar o último commit. Se não estiver atualizado:
```bash
git pull
docker-compose restart backend
```

### Solução 3: Reiniciar Serviços

```bash
docker-compose restart backend frontend
```

Aguarde 30 segundos e tente novamente.

### Solução 4: Verificar Variáveis de Ambiente

```bash
# Ver JWT_SECRET
docker-compose exec backend printenv | grep JWT_SECRET
```

Se não aparecer nada, adicione ao `.env`:
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

E reinicie:
```bash
docker-compose restart backend
```

## 🎯 Checklist de Verificação

- [ ] Role no banco está como `super_admin`
- [ ] Fez logout do painel
- [ ] Limpou localStorage/sessionStorage
- [ ] Fez login novamente
- [ ] Token novo tem role `super_admin`
- [ ] Backend está rodando sem erros
- [ ] Testou acessar `/admin/settings` novamente

## 🚨 Se AINDA Não Funcionar

### Debug Avançado

Adicione logs temporários no backend:

```bash
# Editar middleware
nano /opt/ark-deploy/backend/src/middleware/auth.ts
```

Adicione antes do `next()` no middleware `superAdmin`:

```typescript
export const superAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('🔍 [DEBUG] Verificando super_admin:');
  console.log('   User:', req.user?.email);
  console.log('   Role:', req.user?.role);
  console.log('   Is super_admin?', req.user?.role === 'super_admin');
  
  if (req.user && req.user.role === 'super_admin') {
    next();
  } else {
    console.log('❌ Acesso negado para:', req.user?.email, 'com role:', req.user?.role);
    res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas super administradores.',
    });
  }
};
```

Salve, rebuild e veja os logs:
```bash
docker-compose restart backend
docker-compose logs -f backend
```

Tente acessar `/admin/settings` e veja o que aparece nos logs.

## 💡 Causa Mais Comum

**Token JWT desatualizado!**

O token é gerado no momento do login e contém a role do usuário naquele momento. Se você mudou a role no banco mas não fez logout/login, o token antigo ainda tem a role antiga.

**Solução**: Sempre faça logout e login após mudar permissões!

## 📞 Comando Rápido para Resolver

```bash
# 1. Verificar role no banco
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.findOne({email: 'beto@gmail.com'}, {email: 1, role: 1})"

# 2. Se não for super_admin, atualizar
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.updateOne({email: 'beto@gmail.com'}, {\$set: {role: 'super_admin'}})"

# 3. No navegador (F12 Console):
localStorage.clear(); location.href = '/login';

# 4. Fazer login novamente

# 5. Testar /admin/settings
```

## ✅ Teste Final

Após fazer tudo acima, teste:

1. Abrir Console (F12)
2. Executar:
```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Minha role:', payload.role);
```

3. Deve mostrar: `Minha role: super_admin`

4. Acessar: http://painel.38.242.213.195.sslip.io/admin/settings

5. Deve funcionar! ✅

## 🎉 Quando Funcionar

Você verá a página de configurações do admin com:
- Configurações do Sistema
- Credenciais Assas
- Ambiente Assas (Sandbox/Produção)
- Outras configurações

Tudo sem erro 403! 🚀
