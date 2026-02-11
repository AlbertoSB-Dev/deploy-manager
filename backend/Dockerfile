# Dockerfile para Backend do Ark Deploy
FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para ts-node)
RUN npm ci

# Copiar código fonte
COPY . .

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=8001

# Expor porta
EXPOSE 8001

# Build TypeScript
RUN npm run build

# Comando de produção
CMD ["node", "dist/index.js"]
