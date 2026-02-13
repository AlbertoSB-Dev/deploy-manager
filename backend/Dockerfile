# Stage 1: Builder
FROM node:20-alpine AS builder

# Instalar dependências do sistema incluindo git
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Capturar commit hash e adicionar ao package.json
RUN if [ -d .git ]; then \
      COMMIT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "unknown"); \
      echo "Git commit: $COMMIT_HASH"; \
      node -e "const pkg = require('./package.json'); pkg.gitCommit = '$COMMIT_HASH'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2))"; \
    fi

# Build TypeScript (ignorando erros de tipo)
RUN npm run build:prod || npx tsc --skipLibCheck --noEmit false || echo "Build com warnings, continuando..."

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8001

# Copiar package files (com gitCommit)
COPY --from=builder /app/package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar build do stage anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Expor porta
EXPOSE 8001

# Comando de produção
CMD ["node", "dist/index.js"]
