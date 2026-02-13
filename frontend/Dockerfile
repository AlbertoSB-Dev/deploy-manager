FROM node:20-alpine AS builder

WORKDIR /app

# ARG para NEXT_PUBLIC_API_URL (build-time)
ARG NEXT_PUBLIC_API_URL=http://localhost:8001/api

# Variáveis de ambiente para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copiar package files
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm ci --include=dev

# Copiar código fonte
COPY . .

# Criar arquivo .env.local com NEXT_PUBLIC_API_URL
RUN echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > .env.local

# Build para produção
RUN npm run build

# Stage final - apenas runtime
FROM node:20-alpine AS runner

WORKDIR /app

# ARG para NEXT_PUBLIC_API_URL (precisa redeclarar)
ARG NEXT_PUBLIC_API_URL=http://localhost:8001/api

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Criar arquivo .env.production no runtime
RUN echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > .env.production

# Copiar apenas o necessário do builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Expor porta
EXPOSE 8000

# Rodar em modo produção
CMD ["npm", "start"]
