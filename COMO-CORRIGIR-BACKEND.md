# Como Corrigir o Erro do Backend

## Problema
O container está tentando executar `node dist/index.js` mas não existe pasta `dist` porque estamos usando TypeScript com ts-node.

## Solução Rápida

### 1. Adicione este Dockerfile ao seu repositório backend:

Crie um arquivo chamado `Dockerfile` na raiz do seu repositório backend com este conteúdo:

```dockerfile
FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies)
RUN npm ci

# Copiar código fonte
COPY . .

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8000

# Expor porta
EXPOSE 8000

# Usar ts-node para executar TypeScript diretamente
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
```

### 2. Faça commit e push:

```bash
git add Dockerfile
git commit -m "feat: Add Dockerfile with ts-node support"
git push origin backend
```

### 3. Faça um novo deploy pelo painel

O sistema vai detectar o Dockerfile e usar ele para criar o container.

## Alternativa: Compilar TypeScript

Se preferir compilar o TypeScript ao invés de usar ts-node, use este Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Remover devDependencies
RUN npm prune --production

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

# Executar código compilado
CMD ["node", "dist/index.js"]
```

Mas você precisará ter um script `build` no seu package.json:
```json
{
  "scripts": {
    "build": "tsc"
  }
}
```

## Recomendação

Use a primeira opção (ts-node) porque é mais rápida e não precisa compilar.
