# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar apenas o necessário
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
