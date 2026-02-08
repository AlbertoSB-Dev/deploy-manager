# 🐳 Docker Integration

O Deploy Manager agora usa Docker para gerenciar todos os deployments, proporcionando isolamento, portabilidade e facilidade de gerenciamento.

## 📋 Funcionalidades

### 1. **Deploy com Docker**
- Cada projeto é executado em seu próprio container Docker
- Geração automática de Dockerfile se não existir
- Build de imagens otimizadas
- Gerenciamento automático de containers

### 2. **Logs em Tempo Real**
- Visualização de logs do container em tempo real
- Auto-refresh configurável
- Interface limpa e fácil de usar

### 3. **Terminal Interativo**
- Execute comandos diretamente no container
- Histórico de comandos
- Interface tipo terminal

### 4. **Gerenciamento Completo**
- Deletar projetos (remove container, imagem e arquivos)
- Stop/Start containers
- Rebuild de imagens

## 🚀 Como Funciona

### Deploy Process

1. **Git Pull**: Atualiza o código do repositório
2. **Dockerfile**: Gera automaticamente se não existir
3. **Build**: Constrói a imagem Docker
4. **Container**: Para o container antigo e inicia um novo
5. **Status**: Atualiza o status do projeto

### Dockerfile Automático

O sistema gera Dockerfiles otimizados baseado no tipo de projeto:

#### Frontend (Next.js/React)
```dockerfile
FROM node:18-alpine AS base

# Instalar dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Produção
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

#### Backend (Node.js)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build || true
EXPOSE 3000
CMD ["npm", "start"]
```

## 🎯 Usando a Interface

### Ver Logs

1. Clique no ícone de **documento** (📄) no card do projeto
2. Os logs do container serão exibidos em tempo real
3. Use o toggle "Auto-refresh" para atualizar automaticamente
4. Clique em "Atualizar" para forçar uma atualização

### Terminal Interativo

1. Clique no ícone de **terminal** (💻) no card do projeto
2. Digite comandos no input inferior
3. Pressione Enter ou clique em "Executar"
4. Veja o output em tempo real

**Comandos úteis:**
```bash
# Ver arquivos
ls -la

# Ver diretório atual
pwd

# Ver variáveis de ambiente
env

# Ver versão do Node
node --version

# Ver processos
ps aux

# Ver logs da aplicação
cat /app/.next/server.log

# Testar conectividade
ping -c 3 google.com
```

### Deletar Projeto

1. Clique no ícone de **lixeira** (🗑️) no card do projeto
2. Confirme a ação
3. O sistema irá:
   - Parar o container
   - Remover o container
   - Remover a imagem Docker
   - Deletar os arquivos do projeto
   - Remover do banco de dados

## 🔧 API Endpoints

### Logs
```http
GET /api/projects/:id/logs
```

**Response:**
```json
{
  "logs": "2024-02-08T10:30:00.000Z Starting application...\n..."
}
```

### Terminal (Exec)
```http
POST /api/projects/:id/exec
Content-Type: application/json

{
  "command": "ls -la"
}
```

**Response:**
```json
{
  "output": "total 48\ndrwxr-xr-x  12 nextjs nodejs  384 Feb  8 10:30 .\n..."
}
```

### Delete Project
```http
DELETE /api/projects/:id
```

**Response:**
```json
{
  "message": "Projeto deletado com sucesso"
}
```

## 🐛 Troubleshooting

### Container não inicia

1. Verifique os logs do deploy
2. Verifique se a porta está disponível
3. Verifique as variáveis de ambiente
4. Tente fazer rebuild

### Logs não aparecem

1. Verifique se o container está rodando
2. Aguarde alguns segundos após o deploy
3. Clique em "Atualizar"

### Terminal não responde

1. Verifique se o container está ativo
2. Tente comandos simples primeiro (ls, pwd)
3. Alguns comandos interativos podem não funcionar

### Erro ao deletar

1. Verifique se você tem permissões
2. O container pode estar travado (force stop)
3. Tente parar o container manualmente primeiro

## 📊 Monitoramento

### Status do Container

O status do projeto reflete o estado do container:
- **Active**: Container rodando
- **Deploying**: Build/start em progresso
- **Error**: Falha no deploy ou container parado
- **Inactive**: Container não iniciado

### Recursos

Para ver uso de recursos dos containers:
```bash
docker stats deploy-manager-<project-name>
```

## 🔐 Segurança

- Containers rodam com usuário não-root quando possível
- Variáveis de ambiente são injetadas de forma segura
- Isolamento completo entre projetos
- Restart policy: unless-stopped

## 🎓 Boas Práticas

1. **Use Dockerfile customizado** quando possível para otimizar
2. **Configure variáveis de ambiente** corretamente
3. **Monitore logs** regularmente
4. **Faça backup** antes de deletar projetos
5. **Use versões específicas** do Node.js no Dockerfile

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Next.js Docker Example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
