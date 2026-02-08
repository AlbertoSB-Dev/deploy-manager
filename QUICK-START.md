# 🚀 Quick Start - Deploy Manager

## Instalação com Um Comando

### Linux / Mac

```bash
curl -fsSL https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/scripts/one-line-install.sh | bash
```

### Windows (PowerShell como Administrador)

```powershell
iwr -useb https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/install.ps1 | iex
```

---

## Ou Clone e Instale

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager
```

### 2. Escolha o método de instalação

#### Opção A: Com Docker (Recomendado)

```bash
docker-compose up -d
```

#### Opção B: Manual

**Linux/Mac:**
```bash
chmod +x scripts/install.sh
./scripts/install.sh
./start.sh
```

**Windows:**
```powershell
.\install.ps1
.\start.ps1
```

#### Opção C: Com Make

```bash
make install
make start
```

---

## 3. Acesse o Painel

Abra seu navegador em: **http://localhost:3000**

---

## Comandos Úteis

### Com Docker

```bash
# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Reiniciar
docker-compose restart

# Rebuild
docker-compose up -d --build
```

### Manual (Linux/Mac)

```bash
# Iniciar
./start.sh

# Parar
./stop.sh

# Ver logs
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Manual (Windows)

```powershell
# Iniciar
.\start.ps1

# Parar
Stop-Process -Name "node"
```

### Com Make

```bash
# Ver todos os comandos
make help

# Iniciar
make start

# Parar
make stop

# Ver logs
make logs

# Docker
make docker-up
make docker-logs
make docker-down
```

---

## Primeiro Uso

1. **Acesse o painel**: http://localhost:3000

2. **Clique em "Novo Projeto"**

3. **Preencha as informações:**
   - Nome: `meu-projeto`
   - URL do Git: `https://github.com/usuario/repo.git`
   - Branch: `main`
   - Tipo: Frontend/Backend/Fullstack
   - Comandos de build e start

4. **Configure autenticação** (se repositório privado):
   - SSH Key, Token ou Username/Password

5. **Clique em "Criar Projeto"**

6. **Faça o primeiro deploy** clicando no botão "Deploy"

---

## Estrutura de Diretórios

```
deploy-manager/
├── backend/          # API Node.js
├── frontend/         # Interface Next.js
├── projects/         # Projetos gerenciados (criado automaticamente)
├── logs/             # Logs dos serviços
├── scripts/          # Scripts de instalação
├── start.sh          # Iniciar serviços (Linux/Mac)
├── stop.sh           # Parar serviços (Linux/Mac)
├── start.ps1         # Iniciar serviços (Windows)
└── docker-compose.yml # Configuração Docker
```

---

## Troubleshooting

### Porta já em uso

**Backend (3001):**
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Frontend (3000):**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MongoDB não conecta

**Verificar se está rodando:**
```bash
# Linux/Mac
ps aux | grep mongod

# Windows
tasklist | findstr mongod
```

**Iniciar MongoDB:**
```bash
# Linux
sudo systemctl start mongodb

# Mac
brew services start mongodb-community

# Windows
net start MongoDB
```

### Erro de permissão (Linux/Mac)

```bash
chmod +x scripts/*.sh
chmod +x start.sh stop.sh
```

---

## Próximos Passos

- 📖 Leia a [documentação completa](./README.md)
- 🔐 Configure [repositórios privados](./docs/PRIVATE-REPOS.md)
- 🐳 Use [Docker para produção](./docker-compose.yml)

---

## Suporte

- 🐛 Issues: https://github.com/seu-usuario/deploy-manager/issues
- 📧 Email: seu-email@example.com
- 💬 Discord: https://discord.gg/seu-servidor
