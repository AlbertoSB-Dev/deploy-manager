# Dark Mode - Deploy Manager

## ✅ Implementado

### 1. Contexto de Tema
- **Arquivo**: `frontend/src/contexts/ThemeContext.tsx`
- Provider React para gerenciar estado do tema
- Salva preferência no localStorage
- Detecta preferência do sistema automaticamente
- Toggle entre light/dark

### 2. Configuração Tailwind
- **Arquivo**: `frontend/tailwind.config.ts`
- Adicionado `darkMode: 'class'`
- Permite usar classes `dark:` em todos os componentes

### 3. Layout Principal
- **Arquivo**: `frontend/src/app/layout.tsx`
- ThemeProvider envolvendo toda a aplicação
- Tema aplicado globalmente

### 4. Página Principal
- **Arquivo**: `frontend/src/app/page.tsx`
- Botão de toggle (Sol/Lua) no header
- Background com gradiente adaptativo
- Cards de estatísticas com cores dark
- Loading e empty states com dark mode

### 5. ProjectCard
- **Arquivo**: `frontend/src/components/ProjectCard.tsx`
- Card compacto com suporte dark
- Modal de detalhes com dark mode
- Todos os elementos adaptados

## 🎨 Paleta de Cores Dark Mode

### Backgrounds
- **Light**: `bg-white`, `bg-gray-50`, `bg-blue-50`
- **Dark**: `dark:bg-gray-800`, `dark:bg-gray-900`, `dark:bg-gray-800/80`

### Textos
- **Light**: `text-gray-900`, `text-gray-600`, `text-gray-500`
- **Dark**: `dark:text-white`, `dark:text-gray-400`, `dark:text-gray-500`

### Bordas
- **Light**: `border-gray-200`
- **Dark**: `dark:border-gray-700`, `dark:border-gray-600`

### Ícones Coloridos
- **Blue**: `text-blue-600` → `dark:text-blue-400`
- **Green**: `text-green-600` → `dark:text-green-400`
- **Orange**: `text-orange-600` → `dark:text-orange-400`
- **Red**: `text-red-600` → `dark:text-red-400`

### Backgrounds Coloridos
- **Blue**: `bg-blue-100` → `dark:bg-blue-900/30`
- **Green**: `bg-green-100` → `dark:bg-green-900/30`
- **Orange**: `bg-orange-100` → `dark:bg-orange-900/30`

## 🔧 Como Usar

### Toggle de Tema
```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { theme, toggleTheme } = useTheme();

<button onClick={toggleTheme}>
  {theme === 'light' ? <Moon /> : <Sun />}
</button>
```

### Classes Tailwind
```tsx
// Background
className="bg-white dark:bg-gray-800"

// Texto
className="text-gray-900 dark:text-white"

// Borda
className="border-gray-200 dark:border-gray-700"

// Hover
className="hover:bg-gray-100 dark:hover:bg-gray-700"
```

## 📝 Componentes com Dark Mode

### ✅ Implementados
- [x] Página Principal (page.tsx)
- [x] Header com toggle Sol/Lua
- [x] Cards de Estatísticas
- [x] ProjectCard (compacto)
- [x] Modal de Detalhes do Projeto
  - [x] Info Grid (Branch, Versão, Porta, Último Deploy)
  - [x] Domínio em destaque
  - [x] Botões de ação (Deploy, Parar/Iniciar, Rollback)
  - [x] Grid de controles secundários
  - [x] Botões secundários (Editar, Logs, Terminal, Deletar)
- [x] Modal de Histórico de Deploys
  - [x] Header com gradiente
  - [x] Lista de deploys com status coloridos
  - [x] Cards de deployment
  - [x] Botões de rollback
  - [x] Empty state
  - [x] Footer
- [x] CreateProjectWithGitHub
  - [x] Modal backdrop e container
  - [x] Header com botão fechar
  - [x] Opções de método (GitHub/Manual)
  - [x] Formulário completo
  - [x] Todos os inputs (Nome, Git URL, Branch, Tipo, Servidor)
  - [x] Campos opcionais (Porta, Domínio, Build, Start, Env Vars)
  - [x] Botões de ação
  - [x] Textos de ajuda e placeholders
- [x] GitHubRepoSelector
  - [x] Campo de busca
  - [x] Lista de repositórios
  - [x] Cards de repos
- [x] Loading States
- [x] Empty States

### 🔄 Pendentes (para implementar)
- [ ] EditProjectModal
- [ ] DeployLogs
- [ ] LogViewer
- [ ] Terminal
- [ ] GitHubConnect
- [ ] BranchSelector
- [ ] AddServerModal
- [ ] ServerList
- [ ] ProvisioningModal

## 🎯 Padrão de Implementação

Para adicionar dark mode em novos componentes:

```tsx
// 1. Background
bg-white dark:bg-gray-800

// 2. Texto principal
text-gray-900 dark:text-white

// 3. Texto secundário
text-gray-600 dark:text-gray-400

// 4. Bordas
border-gray-200 dark:border-gray-700

// 5. Hover states
hover:bg-gray-100 dark:hover:bg-gray-700

// 6. Inputs
bg-white dark:bg-gray-700
text-gray-900 dark:text-white
border-gray-300 dark:border-gray-600

// 7. Modals
bg-white dark:bg-gray-800
backdrop com dark:bg-opacity-70

// 8. Gradientes (mantém mesmos)
bg-gradient-to-r from-blue-600 to-blue-700
```

## 🚀 Próximos Passos

1. ✅ ~~Completar modal de detalhes do projeto~~
2. ✅ ~~Completar modal de histórico de deploys~~
3. **Adicionar dark mode aos modais restantes** (EditProjectModal, CreateProjectWithGitHub, etc.)
4. **Adicionar transições suaves** entre temas
5. **Testar acessibilidade** em dark mode
6. **Otimizar contraste** de cores
7. **Adicionar preferência** de tema no perfil do usuário

## 💡 Dicas

- Use `transition-colors` para transições suaves
- Teste contraste de cores (WCAG AA)
- Mantenha consistência nas cores
- Use opacity (ex: `/30`) para backgrounds coloridos em dark mode
- Gradientes podem ser mantidos iguais ou levemente ajustados
