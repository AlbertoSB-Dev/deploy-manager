# Guia de Desenvolvimento Local

## Pré-requisitos

- Node.js 20+
- MongoDB rodando localmente ou em Docker
- Docker e Docker Compose (opcional, para rodar tudo em containers)

## Opção 1: Rodar com Docker Compose (Recomendado)

```bash
cd deploy-manager
docker-compose up -d
```

Isso vai iniciar:
- MongoDB na porta 27017
- Backend na porta 8001
- Frontend na porta 3000

Acesse: http://localhost:3000

## Opção 2: Rodar Localmente (sem Docker)

### 1. Iniciar MongoDB

```bash
# Se tiver MongoDB instalado localmente
mongod

# Ou com Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Instalar dependências do Backend

```bash
cd deploy-manager/backend
npm install
```

### 3. Iniciar o Backend

```bash
cd deploy-manager/backend
npm run dev
```

O backend vai rodar em http://localhost:8001

### 4. Instalar dependências do Frontend

```bash
cd deploy-manager/frontend
npm install
```

### 5. Iniciar o Frontend

```bash
cd deploy-manager/frontend
npm run dev
```

O frontend vai rodar em http://localhost:3000

## Variáveis de Ambiente

As variáveis já estão configuradas nos arquivos `.env`:

- `deploy-manager/.env` - Variáveis globais
- `deploy-manager/backend/.env` - Variáveis do backend
- `deploy-manager/frontend/.env.local` - Variáveis do frontend

## Criar Usuário Admin

Depois que o backend estiver rodando:

```bash
cd deploy-manager/backend
npm run make-admin-auto
```

Isso vai criar um usuário admin com:
- Email: admin@example.com
- Senha: admin123

## Scripts Disponíveis

No backend, você pode rodar:

```bash
npm run make-admin-auto      # Criar admin automaticamente
npm run make-admin           # Criar admin interativamente
npm run seed-plans           # Criar planos padrão
npm run reset-plans          # Resetar planos
npm run reset-password       # Resetar senha de usuário
npm run list-projects        # Listar projetos
npm run delete-project       # Deletar projeto
npm run clear-servers        # Limpar servidores
npm run remove-unique-index  # Remover índice único do MongoDB
```

## Testar o Sistema de Deploy do Painel

1. Acesse http://localhost:3000
2. Faça login com admin@example.com / admin123
3. Vá para Admin > Deploy do Painel
4. Crie uma nova versão (ex: v1.0.0)
5. Faça deploy da versão

## Troubleshooting

### Erro de conexão com MongoDB
- Verifique se MongoDB está rodando
- Verifique a URI em `backend/.env`

### Erro de CORS
- Verifique se o frontend está acessando a URL correta do backend
- Verifique `NEXT_PUBLIC_API_URL` em `frontend/.env.local`

### Porta já em uso
- Backend: `lsof -i :8001` e `kill -9 <PID>`
- Frontend: `lsof -i :3000` e `kill -9 <PID>`
- MongoDB: `lsof -i :27017` e `kill -9 <PID>`

## Logs

### Backend
```bash
cd deploy-manager/backend
npm run dev
```

### Frontend
```bash
cd deploy-manager/frontend
npm run dev
```

Abra o console do navegador (F12) para ver logs do frontend.
