FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 8000

# Rodar em modo desenvolvimento (mais estável)
CMD ["npm", "run", "dev"]
