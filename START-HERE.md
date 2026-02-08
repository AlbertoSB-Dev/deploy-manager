# 🚀 COMECE AQUI - Deploy Manager

## Instalação em 30 Segundos

### Linux / Mac
```bash
curl -fsSL https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/scripts/one-line-install.sh | bash
```

### Windows
```powershell
iwr -useb https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/install.ps1 | iex
```

---

## Ou Clone e Instale

```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager
```

**Escolha um método:**

```bash
# Opção 1: Docker (Recomendado)
docker-compose up -d

# Opção 2: NPM
npm run install:all && npm run dev

# Opção 3: Scripts
./scripts/install.sh && ./start.sh

# Opção 4: Make
make install && make start
```

---

## Acesse o Painel

**Frontend:** http://localhost:3000  
**Backend:** http://localhost:3001

---

## Primeiro Deploy

1. Clique em **"Novo Projeto"**
2. Preencha:
   - Nome: `meu-projeto`
   - Git URL: `https://github.com/usuario/repo.git`
   - Branch: `main`
   - Tipo: Frontend/Backend
3. Clique em **"Criar Projeto"**
4. Clique em **"Deploy"**

✅ Pronto!

---

## Repositório Privado?

Ao criar o projeto, configure:

**Opção 1: SSH Key**
- Tipo: SSH Key
- Path: `/home/user/.ssh/id_rsa`

**Opção 2: Token**
- Tipo: Personal Access Token
- Token: `ghp_xxxxxxxxxxxx`

---

## Documentação Completa

- 📖 [README Completo](./README.md)
- 🚀 [Guia de Início Rápido](./QUICK-START.md)
- 📦 [Métodos de Instalação](./INSTALL-METHODS.md)
- 📚 [Exemplos Práticos](./EXAMPLES.md)
- 🔐 [Repositórios Privados](./docs/PRIVATE-REPOS.md)

---

## Comandos Rápidos

```bash
# Ver logs (Docker)
docker-compose logs -f

# Ver logs (Manual)
tail -f logs/*.log

# Parar (Docker)
docker-compose down

# Parar (Manual)
./stop.sh

# Reiniciar
docker-compose restart  # ou ./start.sh
```

---

## Precisa de Ajuda?

- 🐛 [Issues](https://github.com/seu-usuario/deploy-manager/issues)
- 📧 Email: seu-email@example.com
- 💬 Discord: https://discord.gg/seu-servidor

---

**Isso é tudo! Simples assim.** 🎉
