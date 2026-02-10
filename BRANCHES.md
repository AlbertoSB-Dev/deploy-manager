# 🌿 Ark Deploy - Guia de Branches

O projeto Ark Deploy está organizado em branches para facilitar o deploy separado de frontend e backend.

## 📦 Branches Disponíveis

### `main` - Projeto Completo
Branch principal com frontend + backend + documentação completa.

```bash
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git
cd deploy-manager
./deploy-production.sh
```

**Contém:**
- ✅ Frontend (Next.js)
- ✅ Backend (Node.js + Express)
- ✅ Docker Compose
- ✅ Documentação completa
- ✅ Scripts de instalação

---

### `frontend` - Apenas Frontend
Branch com apenas o código do frontend.

```bash
git clone -b frontend https://github.com/AlbertoSB-Dev/deploy-manager.git frontend
cd frontend
docker build -f Dockerfile.prod -t ark-deploy-frontend .
docker run -d -p 8000:8000 ark-deploy-frontend
```

**Contém:**
- ✅ Código Next.js
- ✅ Componentes React
- ✅ Dockerfile otimizado
- ✅ README específico

**Ideal para:**
- Deploy separado do frontend
- Desenvolvimento focado em UI
- Escalar frontend independentemente

---

### `backend` - Apenas Backend
Branch com apenas o código do backend.

```bash
git clone -b backend https://github.com/AlbertoSB-Dev/deploy-manager.git backend
cd backend
docker build -f Dockerfile.prod -t ark-deploy-backend .
docker run -d -p 8001:8001 ark-deploy-backend
```

**Contém:**
- ✅ API Node.js + Express
- ✅ Serviços e rotas
- ✅ Dockerfile otimizado
- ✅ README específico

**Ideal para:**
- Deploy separado do backend
- Desenvolvimento focado em API
- Escalar backend independentemente

---

## 🚀 Casos de Uso

### 1. Deploy Monolítico (Recomendado para começar)

Use a branch `main` com docker-compose:

```bash
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git
cd deploy-manager
cp .env.production .env.production
# Configure as variáveis
./deploy-production.sh
```

**Vantagens:**
- ✅ Setup mais simples
- ✅ Tudo em um lugar
- ✅ Ideal para começar

---

### 2. Deploy Separado (Microserviços)

Use branches `frontend` e `backend` separadamente:

**Backend:**
```bash
git clone -b backend https://github.com/AlbertoSB-Dev/deploy-manager.git backend
cd backend
docker build -f Dockerfile.prod -t ark-backend .
docker run -d -p 8001:8001 ark-backend
```

**Frontend:**
```bash
git clone -b frontend https://github.com/AlbertoSB-Dev/deploy-manager.git frontend
cd frontend
docker build -f Dockerfile.prod -t ark-frontend .
docker run -d -p 8000:8000 \
  -e NEXT_PUBLIC_API_URL=http://backend-url:8001 \
  ark-frontend
```

**Vantagens:**
- ✅ Escala independente
- ✅ Deploy independente
- ✅ Equipes separadas
- ✅ Melhor para produção em larga escala

---

### 3. Desenvolvimento Local

Clone a branch `main` e rode em modo dev:

```bash
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git
cd deploy-manager

# Backend
cd backend
npm install
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

---

## 🔄 Sincronização de Branches

As branches são mantidas sincronizadas automaticamente:

- Mudanças no `main` são propagadas para `frontend` e `backend`
- Cada branch tem seu próprio README específico
- Dockerfiles otimizados para cada caso de uso

---

## 📝 Estrutura de Arquivos

### Branch `main`
```
deploy-manager/
├── backend/              # Código do backend
├── frontend/             # Código do frontend
├── docker-compose.yml    # Dev
├── docker-compose.prod.yml  # Produção
├── deploy-production.sh  # Script de deploy
├── PRODUCTION.md         # Guia de produção
└── README.md             # Documentação principal
```

### Branch `frontend`
```
frontend/
├── src/                  # Código React/Next.js
├── public/               # Assets estáticos
├── Dockerfile            # Dev
├── Dockerfile.prod       # Produção
└── README.md             # Guia do frontend
```

### Branch `backend`
```
backend/
├── src/                  # Código Node.js/Express
├── scripts/              # Scripts utilitários
├── Dockerfile            # Dev
├── Dockerfile.prod       # Produção
└── README.md             # Guia do backend
```

---

## 🔗 Links Úteis

- **Repositório:** https://github.com/AlbertoSB-Dev/deploy-manager
- **Issues:** https://github.com/AlbertoSB-Dev/deploy-manager/issues
- **Documentação Completa:** [README.md](./README.md)
- **Guia de Produção:** [PRODUCTION.md](./PRODUCTION.md)

---

## 💡 Dicas

1. **Para começar:** Use a branch `main` com docker-compose
2. **Para produção:** Use `docker-compose.prod.yml` ou branches separadas
3. **Para desenvolvimento:** Clone `main` e rode em modo dev
4. **Para CI/CD:** Use branches separadas com pipelines independentes

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

MIT License - veja [LICENSE](./LICENSE) para detalhes.
