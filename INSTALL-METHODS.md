# 📦 Métodos de Instalação do Deploy Manager

Escolha o método que preferir:

---

## 🚀 Método 1: One-Line Install (Mais Rápido)

### Linux / Mac
```bash
curl -fsSL https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/scripts/one-line-install.sh | bash
cd ~/deploy-manager
./start.sh
```

### Windows (PowerShell como Admin)
```powershell
iwr -useb https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/install.ps1 | iex
```

**Tempo estimado:** 2-5 minutos

---

## 🐳 Método 2: Docker (Recomendado para Produção)

```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager
docker-compose up -d
```

**Vantagens:**
- ✅ Isolamento completo
- ✅ Fácil de gerenciar
- ✅ Não precisa instalar Node.js/MongoDB

**Tempo estimado:** 3-10 minutos (dependendo do download das imagens)

---

## 📦 Método 3: NPM (Para Desenvolvedores)

```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager
npm run install:all
npm run dev
```

**Vantagens:**
- ✅ Controle total
- ✅ Fácil de modificar
- ✅ Ideal para desenvolvimento

**Tempo estimado:** 3-5 minutos

---

## 🛠️ Método 4: Manual (Máximo Controle)

```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager

# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

**Vantagens:**
- ✅ Controle total de cada etapa
- ✅ Fácil de debugar
- ✅ Ideal para customização

**Tempo estimado:** 5-10 minutos

---

## 🎯 Método 5: Make (Linux/Mac)

```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager
make install
make start
```

**Vantagens:**
- ✅ Comandos simples
- ✅ Fácil de lembrar
- ✅ Scripts automatizados

**Tempo estimado:** 3-5 minutos

---

## 📊 Comparação

| Método | Dificuldade | Tempo | Produção | Desenvolvimento |
|--------|-------------|-------|----------|-----------------|
| One-Line | ⭐ Fácil | 2-5 min | ✅ | ✅ |
| Docker | ⭐⭐ Médio | 3-10 min | ✅✅✅ | ✅ |
| NPM | ⭐⭐ Médio | 3-5 min | ✅ | ✅✅✅ |
| Manual | ⭐⭐⭐ Difícil | 5-10 min | ✅ | ✅✅ |
| Make | ⭐ Fácil | 3-5 min | ✅✅ | ✅✅ |

---

## 🎬 Após a Instalação

Independente do método escolhido, acesse:

**Frontend:** http://localhost:3000  
**Backend API:** http://localhost:3001

---

## 🆘 Precisa de Ajuda?

- 📖 [Guia de Início Rápido](./QUICK-START.md)
- 📚 [Documentação Completa](./README.md)
- 🔐 [Repositórios Privados](./docs/PRIVATE-REPOS.md)
- 🐛 [Troubleshooting](./QUICK-START.md#troubleshooting)

---

## 💡 Recomendações

**Para começar rapidamente:**  
→ Use o **One-Line Install**

**Para produção:**  
→ Use **Docker**

**Para desenvolvimento:**  
→ Use **NPM** ou **Manual**

**Para automação:**  
→ Use **Make**
