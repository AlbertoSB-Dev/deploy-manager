FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build para produção
RUN npm run build

# Expor porta
EXPOSE 8000

# Variáveis de ambiente
ENV NODE_ENV=production

# Rodar em modo produção
CMD ["npm", "start"]
