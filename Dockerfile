FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    openssh-client \
    git \
    bash \
    curl

# Criar diretório da aplicação
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p /opt/projects /opt/databases /opt/backups

# Expor porta
EXPOSE 8001

# Comando padrão
CMD ["npm", "start"]
