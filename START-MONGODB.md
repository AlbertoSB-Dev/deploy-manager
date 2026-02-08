# 🚀 Como Iniciar o MongoDB

## Opção 1: Docker Desktop (Recomendado)

1. **Inicie o Docker Desktop**
2. Aguarde até estar completamente iniciado
3. Execute:
```powershell
cd deploy-manager
docker-compose up -d
```

## Opção 2: MongoDB Instalado Localmente

1. **Baixe e instale:** https://www.mongodb.com/try/download/community
2. **Inicie o serviço:**
```powershell
net start MongoDB
```

## Opção 3: MongoDB Portable (Sem Instalação)

1. **Baixe:** https://www.mongodb.com/try/download/community (ZIP)
2. **Extraia** para uma pasta (ex: C:\mongodb)
3. **Crie pasta de dados:**
```powershell
mkdir C:\mongodb\data
```
4. **Inicie:**
```powershell
C:\mongodb\bin\mongod.exe --dbpath C:\mongodb\data
```

## Verificar se está rodando

```powershell
# Testar conexão
mongosh mongodb://localhost:27017
```

## Depois de iniciar o MongoDB

Execute o Deploy Manager:
```powershell
cd deploy-manager
npm run dev
```

Ou manualmente:
```powershell
# Terminal 1 - Backend
cd deploy-manager/backend
npm run dev

# Terminal 2 - Frontend
cd deploy-manager/frontend
npm run dev
```

Acesse: http://localhost:3000
