# Multi-stage build para Ark Deploy (Backend + Frontend)
FROM node:20-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache git openssh-client

# ============================================
# Stage 1: Build Backend
# ============================================
FROM base AS backend-builder
WORKDIR /app/backend

# Copiar package files do backend
COPY backend/package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código do backend
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Remover devDependencies após build
RUN npm prune --production

# ============================================
# Stage 2: Build Frontend
# ============================================
FROM base AS frontend-builder
WORKDIR /app/frontend

# Copiar package files do frontend
COPY frontend/package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código do frontend
COPY frontend/ ./

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ============================================
# Stage 3: Runtime - Backend + Frontend
# ============================================
FROM base AS runtime
WORKDIR /app

# Instalar PM2 para gerenciar múltiplos processos
RUN npm install -g pm2

# Copiar backend compilado
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/scripts ./backend/scripts

# Copiar frontend compilado
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/next.config.* ./frontend/

# Criar diretórios necessários
RUN mkdir -p /opt/projects /opt/databases /opt/backups

# Criar arquivo de configuração do PM2
RUN echo '{\n\
  "apps": [\n\
    {\n\
      "name": "backend",\n\
      "cwd": "/app/backend",\n\
      "script": "dist/index.js",\n\
      "env": {\n\
        "PORT": "8001",\n\
        "NODE_ENV": "production"\n\
      },\n\
      "error_file": "/app/logs/backend-error.log",\n\
      "out_file": "/app/logs/backend-out.log",\n\
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z"\n\
    },\n\
    {\n\
      "name": "frontend",\n\
      "cwd": "/app/frontend",\n\
      "script": "node_modules/next/dist/bin/next",\n\
      "args": "start -p 8000",\n\
      "env": {\n\
        "NODE_ENV": "production",\n\
        "PORT": "8000"\n\
      },\n\
      "error_file": "/app/logs/frontend-error.log",\n\
      "out_file": "/app/logs/frontend-out.log",\n\
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z"\n\
    }\n\
  ]\n\
}' > /app/ecosystem.config.json

# Criar diretório de logs
RUN mkdir -p /app/logs

# Expor portas
EXPOSE 8000 8001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000 || exit 1

# Iniciar ambos os serviços com PM2
CMD ["pm2-runtime", "start", "/app/ecosystem.config.json"]
