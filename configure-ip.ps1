# Script para configurar IP público automaticamente

Write-Host "🌐 Configurador de IP Público - Deploy Manager" -ForegroundColor Cyan
Write-Host ""

# Detectar IP público
Write-Host "🔍 Detectando seu IP público..." -ForegroundColor Yellow
try {
    $publicIp = (Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content.Trim()
    Write-Host "✅ IP detectado: $publicIp" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao detectar IP público" -ForegroundColor Red
    Write-Host "Por favor, descubra seu IP manualmente em: https://ifconfig.me" -ForegroundColor Yellow
    $publicIp = Read-Host "Digite seu IP público"
}

Write-Host ""
Write-Host "📝 Configurações:" -ForegroundColor Cyan
Write-Host "   IP Público: $publicIp"
Write-Host "   Formato de domínio: abc123.$publicIp.sslip.io"
Write-Host ""

# Confirmar
$confirm = Read-Host "Deseja aplicar esta configuração? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Configuração cancelada" -ForegroundColor Red
    exit
}

# Caminho do arquivo .env
$envPath = "backend\.env"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ Arquivo .env não encontrado em: $envPath" -ForegroundColor Red
    exit
}

# Ler conteúdo atual
$envContent = Get-Content $envPath

# Atualizar SERVER_IP e BASE_DOMAIN
$envContent = $envContent -replace "SERVER_IP=.*", "SERVER_IP=$publicIp"
$envContent = $envContent -replace "BASE_DOMAIN=.*", "BASE_DOMAIN=sslip.io"

# Salvar
$envContent | Set-Content $envPath

Write-Host ""
Write-Host "✅ Configuração aplicada com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Reinicie o backend: cd backend && npm run dev"
Write-Host "   2. Crie um novo projeto"
Write-Host "   3. Deixe o campo 'Domínio' vazio"
Write-Host "   4. O domínio será gerado automaticamente no formato:"
Write-Host "      abc123xyz.$publicIp.sslip.io" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 Pronto! Seus projetos agora terão domínios públicos!" -ForegroundColor Green
