# Deploy Manager - Instalador para Windows
# Uso: iwr -useb https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/install.ps1 | iex

Write-Host "🚀 Deploy Manager - Instalador para Windows" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Verificar Node.js
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale Node.js 18+ primeiro:" -ForegroundColor Yellow
    Write-Host "https://nodejs.org/en/download" -ForegroundColor Blue
    exit 1
}

$nodeVersion = (node -v).Substring(1).Split('.')[0]
if ([int]$nodeVersion -lt 18) {
    Write-Host "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js $(node -v) encontrado" -ForegroundColor Green

# Verificar Docker
Write-Host ""
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
$useDocker = $false
if ((Get-Command docker -ErrorAction SilentlyContinue) -and (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "✅ Docker encontrado!" -ForegroundColor Green
    $response = Read-Host "Deseja instalar com Docker? (recomendado) [S/n]"
    if ($response -ne "n" -and $response -ne "N") {
        $useDocker = $true
    }
} else {
    Write-Host "⚠️  Docker não encontrado. Instalando manualmente..." -ForegroundColor Yellow
}

Write-Host ""

if ($useDocker) {
    # Instalação com Docker
    Write-Host "🐳 Instalando com Docker..." -ForegroundColor Cyan
    Write-Host ""
    
    # Criar diretório de projetos
    New-Item -ItemType Directory -Force -Path "projects" | Out-Null
    
    # Configurar .env
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    @"
# Deploy Manager Configuration
MONGODB_URI=mongodb://mongodb:27017/deploy-manager
JWT_SECRET=$jwtSecret
PROJECTS_DIR=/var/www/projects
NODE_ENV=production
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "✅ Arquivo .env criado" -ForegroundColor Green
    
    # Build e start
    Write-Host "📦 Construindo e iniciando containers..." -ForegroundColor Yellow
    docker-compose up -d --build
    
    Write-Host ""
    Write-Host "✅ Deploy Manager instalado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Informações:" -ForegroundColor Cyan
    Write-Host "   - Frontend: http://localhost:3001"
    Write-Host "   - Backend API: http://localhost:5000"
    Write-Host "   - MongoDB: localhost:27017"
    Write-Host ""
    Write-Host "🔧 Comandos úteis:" -ForegroundColor Cyan
    Write-Host "   - Ver logs: docker-compose logs -f"
    Write-Host "   - Parar: docker-compose down"
    Write-Host "   - Reiniciar: docker-compose restart"
    Write-Host ""
    
} else {
    # Instalação manual
    Write-Host "📦 Instalando manualmente..." -ForegroundColor Cyan
    Write-Host ""
    
    # Verificar MongoDB
    if (!(Get-Command mongod -ErrorAction SilentlyContinue)) {
        Write-Host "⚠️  MongoDB não encontrado!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Por favor, instale MongoDB:" -ForegroundColor Yellow
        Write-Host "https://www.mongodb.com/try/download/community" -ForegroundColor Blue
        Write-Host ""
        $continue = Read-Host "Continuar mesmo assim? [s/N]"
        if ($continue -ne "s" -and $continue -ne "S") {
            exit 1
        }
    } else {
        Write-Host "✅ MongoDB encontrado" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # Instalar backend
    Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install --silent
    
    if (!(Test-Path .env)) {
        Copy-Item .env.example .env
        $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        (Get-Content .env) -replace 'your-secret-key-here', $jwtSecret | Set-Content .env
        Write-Host "✅ Arquivo .env do backend criado" -ForegroundColor Green
    }
    
    Set-Location ..
    
    # Instalar frontend
    Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install --silent
    
    if (!(Test-Path .env.local)) {
        @"
NEXT_PUBLIC_API_URL=http://localhost:5000/api
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Host "✅ Arquivo .env.local do frontend criado" -ForegroundColor Green
    }
    
    Set-Location ..
    
    # Criar diretório de projetos
    New-Item -ItemType Directory -Force -Path "projects" | Out-Null
    New-Item -ItemType Directory -Force -Path "logs" | Out-Null
    
    # Criar scripts
    Write-Host "📝 Criando scripts de inicialização..." -ForegroundColor Yellow
    
    # start.ps1
    @"
Write-Host "🚀 Iniciando Deploy Manager..." -ForegroundColor Cyan

# Iniciar backend
Write-Host "📡 Iniciando backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Iniciar frontend
Write-Host "🎨 Iniciando frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Deploy Manager iniciado!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Informações:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3001"
Write-Host "   - Backend API: http://localhost:5000"
Write-Host ""
"@ | Out-File -FilePath "start.ps1" -Encoding UTF8
    
    Write-Host "✅ Scripts criados" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "✅ Instalação concluída!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Configure o arquivo backend\.env (se necessário)"
    Write-Host ""
    Write-Host "2. Inicie o Deploy Manager:"
    Write-Host "   .\start.ps1"
    Write-Host ""
    Write-Host "3. Acesse o painel:"
    Write-Host "   http://localhost:3001"
    Write-Host ""
}
