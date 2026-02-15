FROM node:20-alpine
WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build se necessário (TypeScript, etc)
RUN if [ -f "tsconfig.json" ]; then npm run build; fi

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Usar npm start ou node dist/index.js
CMD ["npm", "start"]
