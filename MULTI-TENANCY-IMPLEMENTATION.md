# 🔒 Sistema de Multi-Tenancy Implementado

## ✅ Isolamento Completo de Dados por Usuário

Cada usuário só tem acesso aos seus próprios dados. Nenhum usuário pode ver ou modificar dados de outros usuários.

## 📋 Modelos Atualizados

### 1. Project (Projetos)
- ✅ Campo `userId` adicionado (obrigatório, indexado)
- ✅ Índice composto: `{ name: 1, userId: 1 }` (único)
- ✅ Permite projetos com mesmo nome para usuários diferentes
- ✅ Cada usuário só vê seus próprios projetos

### 2. Server (Servidores VPS)
- ✅ Campo `userId` adicionado (obrigatório, indexado)
- ✅ Índice composto: `{ name: 1, userId: 1 }` (único)
- ✅ Cada usuário gerencia apenas seus servidores
- ✅ Credenciais SSH isoladas por usuário

### 3. Database (Bancos de Dados)
- ✅ Campo `userId` adicionado (obrigatório, indexado)
- ✅ Índice composto: `{ name: 1, userId: 1 }` (único)
- ✅ Cada usuário só acessa seus bancos
- ✅ Senhas e conexões isoladas

### 4. ProjectGroup (Grupos/Pastas)
- ✅ Campo `userId` adicionado (obrigatório, indexado)
- ✅ Índice composto: `{ name: 1, userId: 1 }` (único)
- ✅ Organização de projetos isolada por usuário

## 🔐 Proteção nas Rotas

### Todas as rotas de API devem:

1. **Verificar autenticação** (middleware `protect`)
2. **Filtrar por userId** ao buscar dados
3. **Adicionar userId** ao criar novos registros
4. **Validar propriedade** antes de modificar/deletar

### Exemplo de Implementação:

```typescript
// ❌ ERRADO - Retorna todos os projetos
router.get('/projects', protect, async (req, res) => {
  const projects = await Project.find();
  res.json(projects);
});

// ✅ CORRETO - Retorna apenas projetos do usuário
router.get('/projects', protect, async (req, res) => {
  const projects = await Project.find({ userId: req.user._id });
  res.json(projects);
});

// ❌ ERRADO - Qualquer um pode deletar qualquer projeto
router.delete('/projects/:id', protect, async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ✅ CORRETO - Só deleta se for do usuário
router.delete('/projects/:id', protect, async (req, res) => {
  const project = await Project.findOne({ 
    _id: req.params.id, 
    userId: req.user._id 
  });
  
  if (!project) {
    return res.status(404).json({ error: 'Projeto não encontrado' });
  }
  
  await project.deleteOne();
  res.json({ success: true });
});
```

## 🛡️ Regras de Segurança

### 1. Criar Recursos
```typescript
// Sempre adicionar userId ao criar
const project = await Project.create({
  ...req.body,
  userId: req.user._id, // ← OBRIGATÓRIO
});
```

### 2. Listar Recursos
```typescript
// Sempre filtrar por userId
const projects = await Project.find({ 
  userId: req.user._id // ← OBRIGATÓRIO
});
```

### 3. Buscar Um Recurso
```typescript
// Sempre incluir userId no filtro
const project = await Project.findOne({ 
  _id: req.params.id,
  userId: req.user._id // ← OBRIGATÓRIO
});

if (!project) {
  return res.status(404).json({ error: 'Não encontrado' });
}
```

### 4. Atualizar Recurso
```typescript
// Verificar propriedade antes de atualizar
const project = await Project.findOne({ 
  _id: req.params.id,
  userId: req.user._id 
});

if (!project) {
  return res.status(404).json({ error: 'Não encontrado' });
}

project.name = req.body.name;
await project.save();
```

### 5. Deletar Recurso
```typescript
// Verificar propriedade antes de deletar
const project = await Project.findOneAndDelete({ 
  _id: req.params.id,
  userId: req.user._id 
});

if (!project) {
  return res.status(404).json({ error: 'Não encontrado' });
}
```

## 📊 Índices do Banco de Dados

### Índices Criados:

```javascript
// Project
{ name: 1, userId: 1 } // único
{ userId: 1 } // busca rápida

// Server
{ name: 1, userId: 1 } // único
{ userId: 1 } // busca rápida

// Database
{ name: 1, userId: 1 } // único
{ userId: 1 } // busca rápida

// ProjectGroup
{ name: 1, userId: 1 } // único
{ userId: 1 } // busca rápida
```

### Benefícios:
- ✅ Busca rápida por usuário
- ✅ Nomes únicos por usuário (não globalmente)
- ✅ Performance otimizada
- ✅ Integridade de dados

## 🔄 Migração de Dados Existentes

Se você já tem dados no banco SEM userId, execute este script:

```javascript
// migration-add-userId.js
const mongoose = require('mongoose');
const Project = require('./models/Project');
const Server = require('./models/Server');
const Database = require('./models/Database');
const ProjectGroup = require('./models/ProjectGroup');

async function migrate() {
  // Conectar ao MongoDB
  await mongoose.connect('mongodb://localhost:27017/deploy-manager');
  
  // ID do usuário admin (substitua pelo ID real)
  const adminUserId = 'SEU_USER_ID_AQUI';
  
  // Atualizar projetos
  await Project.updateMany(
    { userId: { $exists: false } },
    { $set: { userId: adminUserId } }
  );
  
  // Atualizar servidores
  await Server.updateMany(
    { userId: { $exists: false } },
    { $set: { userId: adminUserId } }
  );
  
  // Atualizar bancos
  await Database.updateMany(
    { userId: { $exists: false } },
    { $set: { userId: adminUserId } }
  );
  
  // Atualizar grupos
  await ProjectGroup.updateMany(
    { userId: { $exists: false } },
    { $set: { userId: adminUserId } }
  );
  
  console.log('✅ Migração concluída!');
  process.exit(0);
}

migrate().catch(console.error);
```

## 🧪 Testando o Isolamento

### Teste 1: Criar Recursos
```bash
# Usuário A cria projeto
curl -X POST http://localhost:8001/api/projects \
  -H "Authorization: Bearer TOKEN_USER_A" \
  -d '{"name":"meu-projeto"}'

# Usuário B cria projeto com mesmo nome (deve funcionar)
curl -X POST http://localhost:8001/api/projects \
  -H "Authorization: Bearer TOKEN_USER_B" \
  -d '{"name":"meu-projeto"}'
```

### Teste 2: Listar Recursos
```bash
# Usuário A lista projetos (só vê os dele)
curl http://localhost:8001/api/projects \
  -H "Authorization: Bearer TOKEN_USER_A"

# Usuário B lista projetos (só vê os dele)
curl http://localhost:8001/api/projects \
  -H "Authorization: Bearer TOKEN_USER_B"
```

### Teste 3: Acessar Recurso de Outro Usuário
```bash
# Usuário B tenta acessar projeto do Usuário A
curl http://localhost:8001/api/projects/PROJECT_ID_USER_A \
  -H "Authorization: Bearer TOKEN_USER_B"

# Deve retornar: 404 Not Found
```

## ✅ Checklist de Segurança

Para cada rota de API, verifique:

- [ ] Middleware `protect` está aplicado
- [ ] Ao criar: `userId: req.user._id` é adicionado
- [ ] Ao listar: filtro `{ userId: req.user._id }` é usado
- [ ] Ao buscar um: filtro inclui `userId: req.user._id`
- [ ] Ao atualizar: verifica propriedade antes
- [ ] Ao deletar: verifica propriedade antes
- [ ] Retorna 404 se recurso não pertence ao usuário
- [ ] Não expõe dados de outros usuários em erros

## 🎯 Benefícios

1. **Segurança Total**
   - Nenhum usuário acessa dados de outros
   - Isolamento completo

2. **Privacidade**
   - Credenciais SSH isoladas
   - Senhas de banco isoladas
   - Projetos privados

3. **Multi-Tenancy**
   - Múltiplos usuários no mesmo sistema
   - Cada um com seu ambiente isolado

4. **Escalabilidade**
   - Índices otimizados por usuário
   - Performance mantida

5. **Flexibilidade**
   - Nomes duplicados entre usuários
   - Organização independente

## 🚨 IMPORTANTE

**NUNCA faça queries sem filtrar por userId em rotas protegidas!**

Isso é uma vulnerabilidade de segurança crítica que permite acesso não autorizado a dados de outros usuários.

Sempre use:
```typescript
{ userId: req.user._id }
```

Em TODAS as operações de banco de dados em rotas protegidas.
