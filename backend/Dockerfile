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

# A porta será definida via variável de ambiente no deploy
ENV PORT=8000

# Expor porta
EXPOSE 8000

# Usar ts-node para executar sem compilar (mais rápido para deploy)
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
