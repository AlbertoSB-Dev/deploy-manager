#!/bin/bash

set -e

echo "🚀 Deploy Manager - Instalador Automático"
echo "=========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Detectar sistema operacional
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

print_info "Sistema operacional detectado: $OS"
echo ""

# Verificar Docker
USE_DOCKER=false
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    print_success "Docker encontrado!"
    read -p "Deseja instalar com Docker? (recomendado) [S/n]: " use_docker
    if [[ $use_docker != "n" && $use_docker != "N" ]]; then
        USE_DOCKER=true
    fi
else
    print_warning "Docker não encontrado. Instalando manualmente..."
fi

echo ""

if [ "$USE_DOCKER" = true ]; then
    # ==========================================
    # INSTALAÇÃO COM DOCKER
    # ==========================================
    echo "🐳 Instalando com Docker..."
    echo ""
    
    # Criar diretório de projetos
    print_info "Criando diretório de projetos..."
    mkdir -p projects
    
    # Configurar variáveis de ambiente
    print_info "Configurando variáveis de ambiente..."
    cat > .env << EOF
# Deploy Manager Configuration
MONGODB_URI=mongodb://mongodb:27017/deploy-manager
JWT_SECRET=$(openssl rand -hex 32)
PROJECTS_DIR=/var/www/projects
NODE_ENV=production
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF
    
    print_success "Arquivo .env criado"
    
    # Build e start com Docker Compose
    print_info "Construindo e iniciando containers..."
    docker-compose up -d --build
    
    echo ""
    print_success "Deploy Manager instalado com sucesso!"
    echo ""
    echo "📝 Informações:"
    echo "   - Frontend: http://localhost:3001"
    echo "   - Backend API: http://localhost:5000"
    echo "   - MongoDB: localhost:27017"
    echo ""
    echo "🔧 Comandos úteis:"
    echo "   - Ver logs: docker-compose logs -f"
    echo "   - Parar: docker-compose down"
    echo "   - Reiniciar: docker-compose restart"
    echo ""
    
else
    # ==========================================
    # INSTALAÇÃO MANUAL
    # ==========================================
    echo "📦 Instalando manualmente..."
    echo ""
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado!"
        echo ""
        echo "Por favor, instale Node.js 18+ primeiro:"
        echo "  - Linux: https://nodejs.org/en/download/package-manager"
        echo "  - Mac: brew install node"
        echo "  - Windows: https://nodejs.org/en/download"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js versão 18+ é necessária. Versão atual: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) encontrado"
    
    # Verificar MongoDB
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB não encontrado!"
        echo ""
        echo "Por favor, instale MongoDB:"
        echo "  - Linux: sudo apt-get install mongodb"
        echo "  - Mac: brew install mongodb-community"
        echo "  - Windows: https://www.mongodb.com/try/download/community"
        echo ""
        read -p "Continuar mesmo assim? [s/N]: " continue_without_mongo
        if [[ $continue_without_mongo != "s" && $continue_without_mongo != "S" ]]; then
            exit 1
        fi
    else
        print_success "MongoDB encontrado"
    fi
    
    echo ""
    
    # Instalar dependências do backend
    print_info "Instalando dependências do backend..."
    cd backend
    npm install --silent
    
    # Configurar .env do backend
    if [ ! -f .env ]; then
        cp .env.example .env
        # Gerar JWT secret
        if command -v openssl &> /dev/null; then
            JWT_SECRET=$(openssl rand -hex 32)
            sed -i.bak "s/your-secret-key-here/$JWT_SECRET/" .env
            rm .env.bak 2>/dev/null || true
        fi
        print_success "Arquivo .env do backend criado"
    fi
    
    cd ..
    
    # Instalar dependências do frontend
    print_info "Instalando dependências do frontend..."
    cd frontend
    npm install --silent
    
    # Configurar .env.local do frontend
    if [ ! -f .env.local ]; then
        cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF
        print_success "Arquivo .env.local do frontend criado"
    fi
    
    cd ..
    
    # Criar diretório de projetos
    mkdir -p projects
    
    # Criar scripts de inicialização
    print_info "Criando scripts de inicialização..."
    
    # Script de start
    cat > start.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando Deploy Manager..."

# Verificar MongoDB
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB não está rodando. Iniciando..."
    mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data
fi

# Iniciar backend
echo "📡 Iniciando backend..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..

# Aguardar backend iniciar
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
cd ..

echo ""
echo "✅ Deploy Manager iniciado!"
echo ""
echo "📝 Informações:"
echo "   - Frontend: http://localhost:3001"
echo "   - Backend API: http://localhost:5000"
echo ""
echo "📊 Logs:"
echo "   - Backend: tail -f logs/backend.log"
echo "   - Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 Para parar: ./stop.sh"
EOF
    
    # Script de stop
    cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Parando Deploy Manager..."

if [ -f backend.pid ]; then
    kill $(cat backend.pid) 2>/dev/null
    rm backend.pid
    echo "✅ Backend parado"
fi

if [ -f frontend.pid ]; then
    kill $(cat frontend.pid) 2>/dev/null
    rm frontend.pid
    echo "✅ Frontend parado"
fi

echo "✅ Deploy Manager parado"
EOF
    
    chmod +x start.sh stop.sh
    mkdir -p logs
    
    print_success "Scripts criados"
    
    echo ""
    print_success "Instalação concluída!"
    echo ""
    echo "📝 Próximos passos:"
    echo ""
    echo "1. Configure o arquivo backend/.env (se necessário)"
    echo ""
    echo "2. Inicie o Deploy Manager:"
    echo "   ./start.sh"
    echo ""
    echo "3. Acesse o painel:"
    echo "   http://localhost:3001"
    echo ""
    echo "4. Para parar:"
    echo "   ./stop.sh"
    echo ""
fi
