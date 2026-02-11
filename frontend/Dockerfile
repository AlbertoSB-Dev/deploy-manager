FROM node:20-alpine AS builder

WORKDIR /app

# Variáveis de ambiente para build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar package files
COPY package*.json ./

# Instalar todas as dependências (necessário para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Build para produção
RUN npm run build

# Stage final - apenas runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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
