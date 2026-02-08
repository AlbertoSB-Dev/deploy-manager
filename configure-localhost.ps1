# Script para configurar de volta para localhost

Write-Host "🏠 Configurador para Localhost - Deploy Manager" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Esta configuração vai:" -ForegroundColor Yellow
Write-Host "   ✅ Mudar SERVER_IP para localhost"
Write-Host "   ✅ Mudar BASE_DOMAIN para localhost"
Write-Host "   ✅ Novos projetos terão domínios: abc123.localhost"
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
$envContent = $envContent -replace "SERVER_IP=.*", "SERVER_IP=localhost"
$envContent = $envContent -replace "BASE_DOMAIN=.*", "BASE_DOMAIN=localhost"

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
Write-Host "      abc123xyz.localhost" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Para acessar seus projetos:" -ForegroundColor Cyan
Write-Host "   http://abc123xyz.localhost:PORTA" -ForegroundColor Yellow
Write-Host "   ou"
Write-Host "   http://localhost:PORTA" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 Pronto! Seus projetos agora funcionarão localmente!" -ForegroundColor Green
