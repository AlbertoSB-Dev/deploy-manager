# Dockerfile para Backend TypeScript com ts-node
FROM node:20-alpine

# Instalar dependências do sistema necessárias para compilação
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar arquivos de dependências primeiro (melhor cache)
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies para ts-node)
RUN npm ci

# Copiar código fonte
COPY . .

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8000

# Expor porta
EXPOSE 8000

# Usar ts-node para executar TypeScript diretamente (sem compilar)
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
