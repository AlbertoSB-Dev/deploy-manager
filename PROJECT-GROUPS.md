# Sistema de Grupos/Pastas para Projetos

## ✅ STATUS: 100% COMPLETO

Sistema completo de organização de projetos em grupos/pastas com drag & drop funcional.

## 🎯 Funcionalidades Implementadas

### Backend (100%)
- ✅ Model `ProjectGroup` com campos: name, icon, color, description
- ✅ Rotas CRUD completas em `/api/groups`
- ✅ Model `Project` atualizado com `groupId` e `groupName`
- ✅ Rota PUT `/api/projects/:id` para atualizar grupo do projeto

### Frontend (100%)
- ✅ Componente `ProjectGroupView` com grupos expansíveis/colapsáveis
- ✅ Componente `CreateGroupModal` para criar novos grupos
- ✅ Componente `EditGroupModal` para editar grupos existentes
- ✅ Drag & drop funcional com @dnd-kit
- ✅ Arrastar projetos entre grupos e para "Sem Grupo"
- ✅ Grupos vazios aparecem com mensagem "Arraste projetos para cá"
- ✅ Botões de editar (✏️) e deletar (🗑️) no header de cada grupo
- ✅ Confirmação antes de deletar (projetos movidos para "Sem Grupo")
- ✅ Callback `handleDataUpdate()` recarrega projetos E grupos após editar
- ✅ **Header dos cards (parte azul) tem a cor do grupo**

## 🎨 Visual

### Grupos
- Header com borda lateral colorida (4px)
- Ícone emoji personalizável
- Nome e descrição
- Contador de projetos
- Botões de ação (editar, deletar, expandir/colapsar)

### Cards de Projetos
- **Header (parte azul com nome) na cor do grupo**
- Projetos sem grupo mantêm o azul padrão
- Drag & drop suave com feedback visual
- Overlay durante arrasto

## 📝 Como Usar

1. **Criar Grupo**: Clique em "Novo Grupo" no topo da página
2. **Organizar Projetos**: Arraste cards de "Sem Grupo" para dentro dos grupos
3. **Mover entre Grupos**: Arraste cards entre grupos diferentes
4. **Remover de Grupo**: Arraste cards de volta para "Sem Grupo"
5. **Editar Grupo**: Clique no ícone ✏️ no header do grupo
6. **Deletar Grupo**: Clique no ícone 🗑️ (projetos não são deletados)

## 🔧 Implementação Técnica

### Drag & Drop
```typescript
// @dnd-kit/core para drag & drop
// @dnd-kit/sortable para itens arrastáveis
// @dnd-kit/utilities para transformações CSS
```

### Atualização de Grupo
```typescript
// PUT /api/projects/:id
{
  groupId: string | null,
  groupName: string | null
}
```

### Cores Personalizadas
- Cada grupo tem uma cor hexadecimal
- Header do card usa gradiente da cor do grupo
- Projetos sem grupo usam azul padrão (#2563eb)

## 🎨 Cores Disponíveis
- 🔴 Vermelho: #ef4444
- 🟠 Laranja: #f97316
- 🟡 Amarelo: #eab308
- 🟢 Verde: #22c55e
- 🔵 Azul: #3b82f6
- 🟣 Roxo: #a855f7
- 🟤 Marrom: #92400e
- ⚫ Cinza: #6b7280

## 📦 Estrutura de Dados

### ProjectGroup
```typescript
{
  _id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Project (campos adicionados)
```typescript
{
  groupId?: string;
  groupName?: string;
}
```

## 🚀 Próximas Melhorias Possíveis
- [ ] Reordenar projetos dentro do grupo
- [ ] Reordenar grupos
- [ ] Filtrar/buscar projetos por grupo
- [ ] Estatísticas por grupo
- [ ] Exportar/importar configuração de grupos
