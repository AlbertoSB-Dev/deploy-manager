# � Como Usar Templates de Dockerfile

## 🎯 O que é?

Sistema que permite escolher entre usar o Dockerfile do seu repositório ou templates otimizados do painel.

## 🚀 Como Usar

### 1. Criar Novo Projeto

1. Acesse o painel: http://painel.38.242.213.195.sslip.io
2. Clique em **"Novo Projeto"**
3. Escolha método (GitHub ou Manual)
4. Preencha os dados básicos

### 2. Escolher Dockerfile

Na seção **"Dockerfile"**, você tem 2 opções:

#### Opção A: Usar Dockerfile do Repositório ✅
```
○ Usar Dockerfile do Repositório
  Se o projeto já tem um Dockerfile,
  ele será usado automaticamente
```

**Quando usar:**
- Seu projeto já tem Dockerfile customizado
- Você quer controle total sobre o build
- Dockerfile está no repositório

**O que acontece:**
- Se Dockerfile existe → usa ele
- Se não existe → detecção automática

---

#### Opção B: Usar Template do Painel 🎨
```
● Usar Template do Painel
  Escolha um template otimizado
  
  [Dropdown]
  - Detecção Automática
  - Node.js - Node.js genérico
  - Next.js - Next.js com build otimizado
  - React (CRA) - React com Nginx
  - Python Flask - Flask com Gunicorn
  - Python Django - Django com Gunicorn
  
  👁️ Ver conteúdo do template
```

**Quando usar:**
- Projeto não tem Dockerfile
- Quer usar configuração otimizada
- Quer ver exemplo de Dockerfile

**Como funciona:**
1. Selecione template específico OU deixe "Detecção Automática"
2. Clique em "Ver conteúdo" para preview (opcional)
3. Crie o projeto
4. No deploy, se não houver Dockerfile, usa o template

---

## 📋 Templates Disponíveis

### 1. Node.js Genérico
**Ideal para:** Express, Fastify, APIs Node.js
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
ENV PORT=${PORT:-3000}
EXPOSE ${PORT}
CMD ["npm", "start"]
```

### 2. Next.js
**Ideal para:** Aplicações Next.js
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. React (Create React App) ⭐
**Ideal para:** React com react-scripts
**Resolve:** Problema do Guru-TI rodando em modo dev

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Benefícios:**
- ✅ Build de produção otimizado
- ✅ Arquivos estáticos servidos pelo Nginx
- ✅ Sem logs de desenvolvimento
- ✅ Performance máxima

### 4. Python Flask
**Ideal para:** APIs Flask
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV FLASK_ENV=production
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

### 5. Python Django
**Ideal para:** Aplicações Django
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV DJANGO_SETTINGS_MODULE=project.settings
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "project.wsgi:application"]
```

---

## 🔍 Detecção Automática

Se você escolher **"Detecção Automática"**, o sistema detecta automaticamente:

### Detecção Node.js
```
package.json existe?
├─ Tem "next" nas dependencies? → Next.js
├─ Tem "react-scripts"? → React CRA
└─ Senão → Node.js genérico
```

### Detecção Python
```
requirements.txt existe?
├─ Contém "django"? → Django
├─ Contém "flask"? → Flask
└─ Senão → Python genérico
```

---

## 🐛 Exemplo: Corrigir Guru-TI

**Problema:** Projeto rodando em modo desenvolvimento
```
> guru_ti@0.1.0 start
> react-scripts start
Starting the development server...
```

**Solução:**

1. **Criar novo projeto ou editar existente**
2. **Selecionar:** "Usar Template do Painel"
3. **Escolher:** "React (Create React App)"
4. **Fazer deploy**

**Resultado:**
```
📝 Dockerfile não encontrado - usando template...
📋 Usando template: React (Create React App)
✅ Dockerfile criado: React com build estático e Nginx
🔨 Construindo imagem Docker...
✅ Build concluído
🚀 Container rodando em modo produção
```

Agora o projeto roda com:
- ✅ Build otimizado (`npm run build`)
- ✅ Nginx servindo arquivos estáticos
- ✅ Sem logs de desenvolvimento
- ✅ Performance máxima

---

## 📊 Fluxo Completo

```
┌─────────────────────────────────────┐
│  1. Criar Projeto                   │
│     - Preencher dados               │
│     - Selecionar servidor           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Escolher Dockerfile             │
│     ○ Usar do repositório           │
│     ● Usar template do painel       │
│       └─ [Dropdown de templates]    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Criar Projeto                   │
│     - Salva dockerfileTemplate      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Fazer Deploy                    │
│     - Clona repositório             │
│     - Verifica se tem Dockerfile    │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌─────────────┐ ┌─────────────────┐
│ Tem         │ │ Não tem         │
│ Dockerfile  │ │ Dockerfile      │
│             │ │                 │
│ Usa ele ✅  │ │ Usa template ✅ │
└─────────────┘ └─────────────────┘
        │             │
        └──────┬──────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Build e Deploy                  │
│     - docker build                  │
│     - docker run                    │
│     - Configura Traefik             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. Projeto Rodando! 🎉             │
│     http://projeto.IP.sslip.io      │
└─────────────────────────────────────┘
```

---

## 💡 Dicas

### ✅ Boas Práticas

1. **Use template específico** quando souber o tipo do projeto
2. **Use detecção automática** para projetos novos/desconhecidos
3. **Visualize o preview** antes de criar o projeto
4. **Teste localmente** antes de fazer deploy em produção

### ⚠️ Atenção

1. **Template só é usado se não houver Dockerfile** no repositório
2. **Detecção automática** pode não funcionar para projetos customizados
3. **Sempre revise os logs** durante o deploy
4. **Mantenha package.json atualizado** para detecção correta

### 🔧 Troubleshooting

**Problema:** Template não está sendo usado
- ✅ Verifique se repositório não tem Dockerfile
- ✅ Confirme que template foi selecionado
- ✅ Veja logs do deploy

**Problema:** Build falha com template
- ✅ Verifique se package.json está correto
- ✅ Confirme comandos de build (npm run build)
- ✅ Teste template localmente primeiro

**Problema:** Aplicação não inicia
- ✅ Verifique porta configurada
- ✅ Confirme variáveis de ambiente
- ✅ Veja logs do container

---

## 📞 Suporte

Se tiver problemas:

1. **Veja os logs do deploy** no modal de terminal
2. **Verifique logs do container** na aba Logs
3. **Teste template localmente** antes de usar
4. **Consulte documentação** em DOCKERFILE-TEMPLATES-IMPLEMENTATION.md

---

**Última atualização:** 14/02/2026
**Versão:** 1.0.0
