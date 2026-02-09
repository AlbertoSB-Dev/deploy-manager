# 📋 Sistema Atual - Deploy Manager

## 🔐 Autenticação

### Login/Cadastro
- ✅ **Email/Senha** - Totalmente funcional
- 🔜 **Google OAuth** - Placeholder (em breve)
- ❌ **GitHub OAuth** - Removido (era confuso)

### Recuperação de Senha
- ✅ Solicitar recuperação (`/forgot-password`)
- ✅ Resetar senha com token (`/reset-password/:token`)

## 🔗 Integração GitHub

### Conectar GitHub (Repositórios)
- ✅ Botão "Conectar GitHub" no dashboard
- ✅ OAuth apenas para listar repositórios
- ✅ Token salvo separadamente do login
- ✅ Pode desconectar a qualquer momento

**Como usar:**
1. Faça login com email/senha
2. No dashboard, clique em "Conectar GitHub"
3. Autorize no GitHub
4. Agora pode listar seus repositórios

## 📁 Estrutura de Páginas

### Públicas (Sem login)
- `/` - Landing page (vendas)
- `/login` - Página de login
- `/register` - Página de cadastro
- `/forgot-password` - Solicitar recuperação
- `/reset-password/:token` - Resetar senha

### Privadas (Requer login)
- `/dashboard` - Dashboard principal
  - Aba: Projetos
  - Aba: Servidores
  - Aba: Bancos de Dados

## 🎨 Componentes Principais

### GitHubConnectButton
Usado no dashboard para conectar GitHub e listar repositórios.

```typescript
import { GitHubConnectButton } from '@/components/GitHubConnectButton';

<GitHubConnectButton />
```

**Estados:**
- Desconectado: Botão "Conectar GitHub"
- Conectando: Loading spinner
- Conectado: Badge verde + botão "Desconectar"

### useAuth Hook
Gerencia autenticação do usuário.

```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, loading, logout } = useAuth();
```

## 🔒 Segurança

### Multi-Tenancy
Todos os recursos são isolados por usuário:
- ✅ Projetos
- ✅ Servidores
- ✅ Bancos de Dados
- ✅ Grupos de Projetos

**Importante:** As rotas de API ainda precisam ser atualizadas para filtrar por `userId`.

### Tokens
- **JWT Token**: Autenticação no sistema (salvo em `localStorage.token`)
- **GitHub Token**: Acesso aos repositórios (salvo em `localStorage.github_token`)

## 🚀 Como Rodar

### Backend
```bash
cd deploy-manager/backend
npm install
npm run dev
# Roda na porta 8001
```

### Frontend
```bash
cd deploy-manager/frontend
npm install
npm run dev
# Roda na porta 3000
```

### MongoDB
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongodb
```

## 📝 Variáveis de Ambiente

### Backend (.env)
```env
PORT=8001
MONGODB_URI=mongodb://localhost:27017/deploy-manager
JWT_SECRET=your-secret-key-here
NODE_ENV=development

# GitHub (apenas para conectar repos)
GITHUB_CLIENT_ID=seu-client-id
GITHUB_CLIENT_SECRET=seu-client-secret

# Google (em breve)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

## 🎯 Próximos Passos

### 1. Implementar Google OAuth
- [ ] Criar OAuth App no Google Cloud
- [ ] Adicionar credenciais no .env
- [ ] Criar rotas no backend
- [ ] Criar página de callback
- [ ] Atualizar botões

### 2. Atualizar Rotas de API (Multi-Tenancy)
- [ ] Filtrar projetos por userId
- [ ] Filtrar servidores por userId
- [ ] Filtrar bancos de dados por userId
- [ ] Filtrar grupos por userId

### 3. Implementar Listagem de Repositórios
- [ ] Criar componente para listar repos
- [ ] Usar GitHub token para buscar repos
- [ ] Permitir selecionar repo ao criar projeto

## 📚 Documentação

- `README.md` - Visão geral do projeto
- `QUICK-START.md` - Guia de início rápido
- `MUDANÇAS-OAUTH.md` - Mudanças no sistema de autenticação
- `MULTI-TENANCY-IMPLEMENTATION.md` - Isolamento de dados por usuário
- `AUTH-IMPLEMENTATION.md` - Implementação de autenticação
- `DASHBOARD-AUTH-INTEGRATION.md` - Integração do dashboard com auth

## ✅ Status Atual

| Funcionalidade | Status |
|----------------|--------|
| Login Email/Senha | ✅ Funcional |
| Cadastro Email/Senha | ✅ Funcional |
| Recuperação de Senha | ✅ Funcional |
| Login Google | 🔜 Em breve |
| Conectar GitHub (Repos) | ✅ Funcional |
| Dashboard | ✅ Funcional |
| Multi-Tenancy (Models) | ✅ Implementado |
| Multi-Tenancy (Routes) | ⚠️ Pendente |
| Listar Repositórios | ⚠️ Pendente |

---

**Última atualização:** 2026-02-08
