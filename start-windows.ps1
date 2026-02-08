# Deploy Manager - Iniciar no Windows

Write-Host "🚀 Deploy Manager - Iniciando..." -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
$dockerRunning = $false
try {
    docker ps | Out-Null
    $dockerRunning = $true
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker não está rodando" -ForegroundColor Yellow
}

# Verificar MongoDB
$mongoRunning = $false
try {
    $mongoTest = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
    if ($mongoTest.TcpTestSucceeded) {
        $mongoRunning = $true
        Write-Host "✅ MongoDB está rodando" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  MongoDB não está rodando" -ForegroundColor Yellow
}

Write-Host ""

# Se nenhum estiver rodando, mostrar instruções
if (-not $dockerRunning -and -not $mongoRunning) {
    Write-Host "❌ MongoDB não está disponível!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, inicie o MongoDB primeiro:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opção 1 - Docker Desktop:" -ForegroundColor Cyan
    Write-Host "  1. Inicie o Docker Desktop"
    Write-Host "  2. Execute: docker-compose up -d"
    Write-Host ""
    Write-Host "Opção 2 - MongoDB Local:" -ForegroundColor Cyan
    Write-Host "  1. Instale: https://www.mongodb.com/try/download/community"
    Write-Host "  2. Execute: net start MongoDB"
    Write-Host ""
    Write-Host "Opção 3 - MongoDB Portable:" -ForegroundColor Cyan
    Write-Host "  1. Baixe e extraia o MongoDB"
    Write-Host "  2. Execute: mongod.exe --dbpath C:\mongodb\data"
    Write-Host ""
    Write-Host "📖 Veja mais detalhes em: START-MONGODB.md" -ForegroundColor Blue
    Write-Host ""
    
    $continue = Read-Host "Deseja continuar mesmo assim? (o backend não funcionará) [s/N]"
    if ($continue -ne "s" -and $continue -ne "S") {
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 Iniciando serviços..." -ForegroundColor Cyan
Write-Host ""

# Iniciar Backend
Write-Host "📡 Iniciando Backend (porta 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Backend Deploy Manager' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 3

# Iniciar Frontend
Write-Host "🎨 Iniciando Frontend (porta 3010)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '🎨 Frontend Deploy Manager' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "✅ Deploy Manager iniciado!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Informações:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3010" -ForegroundColor White
Write-Host "   - Backend API: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dica: Feche as janelas do PowerShell para parar os serviços" -ForegroundColor Yellow
Write-Host ""
