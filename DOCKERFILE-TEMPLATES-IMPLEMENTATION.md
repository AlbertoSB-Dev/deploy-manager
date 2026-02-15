# Sistema de Templates de Dockerfile - Implementação Completa

## 📋 Resumo

Implementado sistema completo que permite ao usuário escolher entre usar o Dockerfile próprio do repositório ou templates otimizados do painel.

## ✅ O que foi implementado

### 1. Backend - Serviço de Templates (`DockerfileTemplateService.ts`)

**Já existente** - Criado anteriormente com:
- 5 templates prontos: Node.js, Next.js, React CRA, Python Flask, Python Django
- Método de detecção automática baseado em `package.json` e `requirements.txt`
- Leitura de conteúdo dos templates

### 2. Backend - Rotas de API (`routes/projects.ts`)

**Novas rotas adicionadas:**

```typescript
GET /api/projects/dockerfile-templates
// Lista todos os templates disponíveis
// Retorna: Array de { id, name, description, category }

GET /api/projects/dockerfile-templates/:id
// Obtém conteúdo de um template específico
// Retorna: { content: string }
```

**Rota de criação atualizada:**
```typescript
POST /api/projects
// Agora aceita campo adicional: dockerfileTemplate
```

### 3. Backend - Modelo de Projeto (`models/Project.ts`)

**Campo adicionado:**
```typescript
dockerfileTemplate?: string; // ID do template selecionado (opcional)
```

### 4. Backend - Serviço de Deploy (`services/DeployService.ts`)

**Lógica atualizada no método `deployRemote()`:**

Quando não existe Dockerfile no repositório:
1. Verifica se projeto tem `dockerfileTemplate` selecionado
2. Se não tem, usa detecção automática
3. Carrega conteúdo do template
4. Cria Dockerfile no servidor remoto
5. Continua com o build normalmente

**Logs informativos:**
- "📝 Dockerfile não encontrado - usando template..."
- "📋 Usando template: React (Create React App)"
- "✅ Dockerfile criado: React com build estático e Nginx"

### 5. Frontend - Formulário de Criação (`CreateProjectWithGitHub.tsx`)

**Novos estados:**
```typescript
const [templates, setTemplates] = useState<DockerfileTemplate[]>([]);
const [showTemplatePreview, setShowTemplatePreview] = useState(false);
const [templatePreview, setTemplatePreview] = useState('');
```

**Nova seção no formulário:**

```
┌─────────────────────────────────────────┐
│ Dockerfile                              │
├─────────────────────────────────────────┤
│ ○ Usar Dockerfile do Repositório       │
│   Se o projeto já tem um Dockerfile,   │
│   ele será usado automaticamente        │
├─────────────────────────────────────────┤
│ ● Usar Template do Painel              │
│   Escolha um template otimizado         │
│                                         │
│   [Dropdown com templates]              │
│   - Detecção Automática                 │
│   - Node.js - Node.js genérico          │
│   - Next.js - Next.js com build         │
│   - React (CRA) - React com Nginx       │
│   - Python Flask - Flask com Gunicorn   │
│   - Python Django - Django com Gunicorn │
│                                         │
│   👁️ Ver conteúdo do template          │
└─────────────────────────────────────────┘
```

**Modal de Preview:**
- Mostra conteúdo completo do Dockerfile
- Syntax highlighting com fundo escuro
- Botão para fechar

## 🎯 Fluxo de Uso

### Cenário 1: Projeto com Dockerfile próprio
1. Usuário seleciona "Usar Dockerfile do Repositório"
2. Campo `dockerfileTemplate` fica vazio
3. No deploy, se Dockerfile existe → usa ele
4. Se não existe → detecção automática

### Cenário 2: Projeto sem Dockerfile - Template Manual
1. Usuário seleciona "Usar Template do Painel"
2. Escolhe template específico (ex: "React (CRA)")
3. Pode visualizar preview clicando em "Ver conteúdo"
4. No deploy, se Dockerfile não existe → usa template selecionado

### Cenário 3: Projeto sem Dockerfile - Detecção Automática
1. Usuário seleciona "Usar Template do Painel"
2. Deixa dropdown em "Detecção Automática"
3. No deploy, sistema detecta tipo do projeto automaticamente

## 📁 Templates Disponíveis

### 1. Node.js (`nodejs`)
- Node.js genérico (Express, Fastify, etc)
- Categoria: backend
- Porta padrão: 3000

### 2. Next.js (`nextjs`)
- Next.js com build otimizado
- Categoria: fullstack
- Usa `npm run build` e `npm start`

### 3. React CRA (`react-cra`)
- Create React App com build estático
- Categoria: frontend
- Multi-stage build com Nginx
- **Solução para o problema do Guru-TI** ✅

### 4. Python Flask (`python-flask`)
- Flask com Gunicorn
- Categoria: backend
- Porta padrão: 5000

### 5. Python Django (`python-django`)
- Django com Gunicorn
- Categoria: backend
- Porta padrão: 8000

## 🔧 Detecção Automática

O sistema detecta automaticamente baseado em:

1. **package.json existe?**
   - Tem `next` nas dependencies? → Next.js
   - Tem `react-scripts`? → React CRA
   - Senão → Node.js genérico

2. **requirements.txt existe?**
   - Contém "django"? → Django
   - Contém "flask"? → Flask

3. **Nenhum detectado?** → Node.js genérico (fallback)

## 🐛 Problema Resolvido: Guru-TI

**Antes:**
```
> guru_ti@0.1.0 start
> react-scripts start
Starting the development server...
```

**Depois (com template React CRA):**
```
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
...
```

Agora o projeto roda em **modo produção** com Nginx servindo arquivos estáticos.

## 📝 Arquivos Modificados

### Backend
- ✅ `backend/src/routes/projects.ts` - Rotas de templates
- ✅ `backend/src/models/Project.ts` - Campo dockerfileTemplate
- ✅ `backend/src/services/DeployService.ts` - Integração com templates
- ✅ `backend/src/services/DockerfileTemplateService.ts` - Já existia

### Frontend
- ✅ `frontend/src/components/CreateProjectWithGitHub.tsx` - UI de seleção

### Templates
- ✅ `backend/src/templates/dockerfiles/nodejs.dockerfile`
- ✅ `backend/src/templates/dockerfiles/nextjs.dockerfile`
- ✅ `backend/src/templates/dockerfiles/react-cra.dockerfile`
- ✅ `backend/src/templates/dockerfiles/python-flask.dockerfile`
- ✅ `backend/src/templates/dockerfiles/python-django.dockerfile`

## 🚀 Como Testar

1. **Criar novo projeto:**
   ```bash
   # No painel, clicar em "Novo Projeto"
   # Selecionar "Usar Template do Painel"
   # Escolher "React (Create React App)"
   # Criar projeto
   ```

2. **Fazer deploy:**
   ```bash
   # Clicar em "Deploy"
   # Observar logs:
   # "📝 Dockerfile não encontrado - usando template..."
   # "📋 Usando template: React (Create React App)"
   # "✅ Dockerfile criado: React com build estático e Nginx"
   ```

3. **Verificar resultado:**
   ```bash
   # Acessar domínio do projeto
   # Deve mostrar aplicação em modo produção
   # Sem logs de desenvolvimento
   ```

## 💡 Próximos Passos (Opcional)

1. **Adicionar mais templates:**
   - Vue.js
   - Angular
   - Svelte
   - PHP Laravel
   - Ruby on Rails

2. **Editor de templates:**
   - Permitir usuário criar templates customizados
   - Salvar templates no banco de dados

3. **Validação de templates:**
   - Verificar sintaxe do Dockerfile
   - Testar build antes de salvar

## 📊 Status Final

✅ Sistema de templates implementado e funcional
✅ Problema do Guru-TI resolvido (modo desenvolvimento → produção)
✅ UI intuitiva com preview de templates
✅ Detecção automática como fallback
✅ 5 templates prontos para uso
✅ Integração completa backend + frontend

---

**Implementado em:** 14/02/2026
**Desenvolvedor:** Kiro AI Assistant
