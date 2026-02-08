# 🔄 Melhorias GitHub - Implementação Pendente

## ✅ Já Criado

1. **`frontend/src/lib/githubAccounts.ts`** - Gerenciador de múltiplas contas

## 📋 Próximos Passos

### 1. Atualizar GitHubConnect.tsx

**Objetivo:** Suportar múltiplas contas

**Mudanças:**
- Usar `GitHubAccountManager` para salvar contas
- Mostrar lista de contas conectadas
- Permitir trocar entre contas
- Botão "Adicionar Outra Conta"

### 2. Adicionar Botão "Ver Repositórios"

**Objetivo:** Ir direto para repos sem reconectar

**Mudanças em CreateProjectWithGitHub.tsx:**
- Se já tem conta ativa, mostrar botão "Ver Repositórios"
- Pular etapa de conexão
- Ir direto para GitHubRepoSelector

### 3. Seletor de Branches

**Objetivo:** Listar branches do repositório

**Criar:** `frontend/src/components/BranchSelector.tsx`

```typescript
interface BranchSelectorProps {
  owner: string;
  repo: string;
  token: string;
  value: string;
  onChange: (branch: string) => void;
}
```

**Funcionalidade:**
- Buscar branches via API GitHub
- Dropdown com lista de branches
- Mostrar branch padrão destacado

### 4. Atualizar Backend

**Adicionar em `backend/src/routes/github.ts`:**

```typescript
// Listar branches de um repositório
router.get('/repos/:owner/:repo/branches', async (req, res) => {
  const { owner, repo } = req.params;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // Buscar branches via GitHub API
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }
  );
  
  const branches = await response.json();
  res.json(branches);
});
```

## 🎯 Resultado Final

### Interface Melhorada

```
┌─────────────────────────────────────────┐
│ Novo Projeto                       [X]  │
├─────────────────────────────────────────┤
│                                         │
│ Como deseja adicionar o projeto?       │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 🐙 Conectar com GitHub              ││
│ │                                     ││
│ │ ┌─────────────────────────────────┐││
│ │ │ ✓ Alberto Santana              X│││
│ │ │   alberto@email.com             │││
│ │ └─────────────────────────────────┘││
│ │                                     ││
│ │ ┌─────────────────────────────────┐││
│ │ │   Outra Conta                  X│││
│ │ │   outra@email.com               │││
│ │ └─────────────────────────────────┘││
│ │                                     ││
│ │ [+ Adicionar Outra Conta]          ││
│ │ [Ver Repositórios]                 ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Adicionar Manualmente               ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Fluxo Melhorado

**Antes:**
```
1. Conectar GitHub
2. Ver repos
3. Desconectar
4. Conectar outra conta
5. Ver repos
```

**Depois:**
```
1. Selecionar conta (ou adicionar nova)
2. Ver repos
3. Selecionar repo
4. Selecionar branch (dropdown)
5. Criar projeto
```

## 📝 Arquivos a Modificar

1. ✅ `frontend/src/lib/githubAccounts.ts` - Criado
2. ⏳ `frontend/src/components/GitHubConnect.tsx` - Atualizar
3. ⏳ `frontend/src/components/CreateProjectWithGitHub.tsx` - Atualizar
4. ⏳ `frontend/src/components/BranchSelector.tsx` - Criar
5. ⏳ `backend/src/routes/github.ts` - Adicionar endpoint branches

## 🚀 Benefícios

✅ **Múltiplas contas** - Gerenciar várias contas GitHub  
✅ **Sem reconectar** - Trocar entre contas facilmente  
✅ **Branches automáticas** - Dropdown em vez de input  
✅ **UX melhorada** - Fluxo mais fluido  
✅ **Igual ao Coolify** - Experiência profissional  

---

**Status**: Parcialmente implementado  
**Próximo**: Atualizar componentes existentes  
**Versão**: 1.3.0 (planejado)
