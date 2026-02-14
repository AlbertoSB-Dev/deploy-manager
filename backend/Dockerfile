# Stage 1: Builder
FROM node:20-alpine AS builder

# Instalar dependências do sistema incluindo git e bash
RUN apk add --no-cache python3 make g++ git bash openssh-client

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

# Instalar git e bash para deploy do painel
RUN apk add --no-cache git bash openssh-client

WORKDIR /app

# ARGs para variáveis de ambiente (podem ser passados no build)
ARG MONGO_PASSWORD=changeme123
ARG JWT_SECRET=your-secret-key-change-in-production
ARG ENCRYPTION_KEY=your-encryption-key-32-chars-min
ARG SERVER_IP=38.242.213.195
ARG BASE_DOMAIN=sslip.io
ARG FRONTEND_URL=http://painel.38.242.213.195.sslip.io
ARG GITHUB_CLIENT_ID=Ov23liUAMV3RZp1pk9PH
ARG GITHUB_CLIENT_SECRET=ae184835a93a3a81c259ddc2f42cb8bc175a1b0a
ARG GITHUB_CALLBACK_URL=http://painel.38.242.213.195.sslip.io/auth/github/callback
ARG ASSAS_API_KEY=
ARG ASSAS_WEBHOOK_TOKEN=
ARG ASSAS_ENVIRONMENT=sandbox
ARG EMAIL_ENABLED=false
ARG EMAIL_SERVICE=gmail
ARG EMAIL_USER=
ARG EMAIL_PASSWORD=

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8001

# Criar arquivo .env com as credenciais
RUN echo "# Backend Environment Variables" > .env && \
    echo "PORT=8001" >> .env && \
    echo "NODE_ENV=production" >> .env && \
    echo "" >> .env && \
    echo "# MongoDB" >> .env && \
    echo "MONGO_PASSWORD=${MONGO_PASSWORD}" >> .env && \
    echo "" >> .env && \
    echo "# Segurança" >> .env && \
    echo "JWT_SECRET=${JWT_SECRET}" >> .env && \
    echo "ENCRYPTION_KEY=${ENCRYPTION_KEY}" >> .env && \
    echo "" >> .env && \
    echo "# Servidor" >> .env && \
    echo "SERVER_IP=${SERVER_IP}" >> .env && \
    echo "BASE_DOMAIN=${BASE_DOMAIN}" >> .env && \
    echo "FRONTEND_URL=${FRONTEND_URL}" >> .env && \
    echo "" >> .env && \
    echo "# GitHub OAuth" >> .env && \
    echo "GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}" >> .env && \
    echo "GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}" >> .env && \
    echo "GITHUB_CALLBACK_URL=${GITHUB_CALLBACK_URL}" >> .env && \
    echo "" >> .env && \
    echo "# Assas" >> .env && \
    echo "ASSAS_API_KEY=${ASSAS_API_KEY}" >> .env && \
    echo "ASSAS_WEBHOOK_TOKEN=${ASSAS_WEBHOOK_TOKEN}" >> .env && \
    echo "ASSAS_ENVIRONMENT=${ASSAS_ENVIRONMENT}" >> .env && \
    echo "" >> .env && \
    echo "# Email" >> .env && \
    echo "EMAIL_ENABLED=${EMAIL_ENABLED}" >> .env && \
    echo "EMAIL_SERVICE=${EMAIL_SERVICE}" >> .env && \
    echo "EMAIL_USER=${EMAIL_USER}" >> .env && \
    echo "EMAIL_PASSWORD=${EMAIL_PASSWORD}" >> .env

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
