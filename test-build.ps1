# Script para testar build antes de fazer push para GitHub

Write-Host "🧪 Testando build do projeto..." -ForegroundColor Cyan
Write-Host ""

# Função para verificar status
function Check-Status {
    param($message)
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $message" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $message" -ForegroundColor Red
        return $false
    }
}

# 1. Testar build do Backend
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📦 BACKEND - TypeScript Build" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Set-Location backend

Write-Host "→ Instalando dependências..." -ForegroundColor Yellow
npm install --silent
if (-not (Check-Status "Dependências do backend instaladas")) { exit 1 }

Write-Host "→ Compilando TypeScript..." -ForegroundColor Yellow
npm run build
if (-not (Check-Status "Build do backend concluído")) { exit 1 }

Write-Host ""
Set-Location ..

# 2. Testar build do Frontend
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎨 FRONTEND - Next.js Build" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Set-Location frontend

Write-Host "→ Instalando dependências..." -ForegroundColor Yellow
npm install --silent
if (-not (Check-Status "Dependências do frontend instaladas")) { exit 1 }

Write-Host "→ Compilando Next.js..." -ForegroundColor Yellow
npm run build
if (-not (Check-Status "Build do frontend concluído")) { exit 1 }

# Verificar se standalone foi gerado
if (Test-Path ".next/standalone") {
    Write-Host "✅ Diretório .next/standalone gerado corretamente" -ForegroundColor Green
} else {
    Write-Host "❌ Diretório .next/standalone NÃO foi gerado!" -ForegroundColor Red
    Write-Host "⚠️  Verifique se next.config.js tem: output: 'standalone'" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Set-Location ..

# 3. Resumo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RESUMO DO BUILD" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Backend compilado com sucesso" -ForegroundColor Green
Write-Host "✅ Frontend compilado com sucesso" -ForegroundColor Green
Write-Host "✅ Standalone gerado corretamente" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Projeto pronto para deploy!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:"
Write-Host "  1. git add ."
Write-Host "  2. git commit -m 'sua mensagem'"
Write-Host "  3. git push origin main"
Write-Host ""
