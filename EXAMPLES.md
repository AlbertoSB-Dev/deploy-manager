# 📚 Exemplos Práticos - Deploy Manager

## Exemplo 1: Deploy do Gestão Náutica Frontend

### Configuração no Painel

```
Nome do Projeto: gestao-nautica-frontend
Nome de Exibição: Gestão Náutica Frontend
URL do Git: https://github.com/AlbertoSB-Dev/Gestao-Nautica-Frontend.git
Branch: main
Tipo: Frontend
Porta: 3000

Comando de Build: npm run build
Comando de Start: npm start

Variáveis de Ambiente:
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.gestao-nautica.com
```

### Se for repositório privado:

```
Autenticação: Personal Access Token
Token: ghp_xxxxxxxxxxxxxxxxxxxx
```

---

## Exemplo 2: Deploy do Gestão Náutica Backend

### Configuração no Painel

```
Nome do Projeto: gestao-nautica-backend
Nome de Exibição: Gestão Náutica Backend
URL do Git: https://github.com/AlbertoSB-Dev/Gestao-Nautica-Backend.git
Branch: main
Tipo: Backend
Porta: 3001

Comando de Build: npm run build
Comando de Start: npm start

Variáveis de Ambiente:
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/gestao-nautica
JWT_SECRET=seu-secret-aqui
PORT=3001
```

---

## Exemplo 3: Projeto React com Vite

```
Nome do Projeto: meu-app-react
Nome de Exibição: Meu App React
URL do Git: https://github.com/usuario/meu-app-react.git
Branch: main
Tipo: Frontend
Porta: 5173

Comando de Build: npm run build
Comando de Start: npm run preview

Variáveis de Ambiente:
VITE_API_URL=https://api.example.com
VITE_APP_NAME=Meu App
```

---

## Exemplo 4: API Express Simples

```
Nome do Projeto: api-express
Nome de Exibição: API Express
URL do Git: git@github.com:usuario/api-express.git
Branch: main
Tipo: Backend
Porta: 4000

Comando de Build: (deixar vazio se não precisar)
Comando de Start: node index.js

Variáveis de Ambiente:
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

---

## Exemplo 5: Aplicação NestJS

```
Nome do Projeto: nestjs-api
Nome de Exibição: NestJS API
URL do Git: https://github.com/usuario/nestjs-api.git
Branch: develop
Tipo: Backend
Porta: 3000

Comando de Build: npm run build
Comando de Start: npm run start:prod

Variáveis de Ambiente:
NODE_ENV=production
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=senha123
DATABASE_NAME=nestjs_db
JWT_SECRET=super-secret-key
```

---

## Exemplo 6: Aplicação Vue.js

```
Nome do Projeto: vue-dashboard
Nome de Exibição: Vue Dashboard
URL do Git: https://github.com/usuario/vue-dashboard.git
Branch: main
Tipo: Frontend
Porta: 8080

Comando de Build: npm run build
Comando de Start: npm run serve

Variáveis de Ambiente:
VUE_APP_API_URL=https://api.example.com
VUE_APP_TITLE=Dashboard
```

---

## Exemplo 7: Aplicação Angular

```
Nome do Projeto: angular-app
Nome de Exibição: Angular App
URL do Git: https://github.com/usuario/angular-app.git
Branch: main
Tipo: Frontend
Porta: 4200

Comando de Build: npm run build
Comando de Start: npm start

Variáveis de Ambiente:
NG_APP_API_URL=https://api.example.com
NG_APP_ENV=production
```

---

## Exemplo 8: Aplicação Python Flask

```
Nome do Projeto: flask-api
Nome de Exibição: Flask API
URL do Git: https://github.com/usuario/flask-api.git
Branch: main
Tipo: Backend
Porta: 5000

Comando de Instalação: pip install -r requirements.txt
Comando de Build: (deixar vazio)
Comando de Start: python app.py

Variáveis de Ambiente:
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@localhost/db
SECRET_KEY=flask-secret-key
```

---

## Exemplo 9: Monorepo (Frontend + Backend)

### Frontend

```
Nome do Projeto: monorepo-frontend
Nome de Exibição: Monorepo - Frontend
URL do Git: https://github.com/usuario/monorepo.git
Branch: main
Tipo: Frontend
Porta: 3000

Comando de Build: npm run build --workspace=frontend
Comando de Start: npm start --workspace=frontend

Variáveis de Ambiente:
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend

```
Nome do Projeto: monorepo-backend
Nome de Exibição: Monorepo - Backend
URL do Git: https://github.com/usuario/monorepo.git
Branch: main
Tipo: Backend
Porta: 4000

Comando de Build: npm run build --workspace=backend
Comando de Start: npm start --workspace=backend

Variáveis de Ambiente:
PORT=4000
DATABASE_URL=mongodb://localhost:27017/app
```

---

## Exemplo 10: Deploy de Versão Específica

### Via Painel:

1. Clique no ícone de histórico (⏱️) do projeto
2. Selecione a versão desejada (ex: `v1.2.0`)
3. Clique em "Deploy"

### Via API:

```bash
curl -X POST http://localhost:3001/api/projects/PROJECT_ID/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "version": "v1.2.0",
    "deployedBy": "admin"
  }'
```

---

## Exemplo 11: Rollback para Versão Anterior

### Via Painel:

1. Acesse o projeto
2. Veja o histórico de deployments
3. Selecione o deployment anterior
4. Clique em "Rollback"

### Via API:

```bash
curl -X POST http://localhost:3001/api/projects/PROJECT_ID/rollback \
  -H "Content-Type: application/json" \
  -d '{
    "deploymentIndex": 2,
    "deployedBy": "admin"
  }'
```

---

## Exemplo 12: Múltiplos Ambientes

### Produção

```
Nome: app-production
Branch: main
Porta: 3000
Variáveis:
NODE_ENV=production
API_URL=https://api.production.com
```

### Staging

```
Nome: app-staging
Branch: develop
Porta: 3001
Variáveis:
NODE_ENV=staging
API_URL=https://api.staging.com
```

### Development

```
Nome: app-development
Branch: develop
Porta: 3002
Variáveis:
NODE_ENV=development
API_URL=http://localhost:3001
```

---

## 🔧 Comandos Úteis

### Listar todos os projetos

```bash
curl http://localhost:5000/api/projects
```

### Obter informações de um projeto

```bash
curl http://localhost:5000/api/projects/PROJECT_ID
```

### Ver logs de um projeto

```bash
curl http://localhost:5000/api/projects/PROJECT_ID/logs?lines=100
```

### Listar versões disponíveis

```bash
curl http://localhost:5000/api/projects/PROJECT_ID/versions
```

---

## 💡 Dicas

1. **Use tags Git** para versionar seus releases (v1.0.0, v1.1.0, etc.)
2. **Configure variáveis de ambiente** diferentes para cada ambiente
3. **Teste em staging** antes de fazer deploy em produção
4. **Mantenha um histórico** de deployments para facilitar rollbacks
5. **Use SSH Keys** para repositórios privados em produção
6. **Configure webhooks** do GitHub/GitLab para deploy automático
7. **Monitore os logs** regularmente para identificar problemas

---

## 🆘 Troubleshooting

### Erro: "Port already in use"

Mude a porta no projeto ou libere a porta:

```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erro: "Permission denied"

Configure as permissões da SSH key:

```bash
chmod 600 ~/.ssh/sua_chave
```

### Erro: "Build failed"

Verifique:
1. Se o comando de build está correto
2. Se as dependências foram instaladas
3. Se as variáveis de ambiente estão configuradas
4. Os logs do projeto para mais detalhes
