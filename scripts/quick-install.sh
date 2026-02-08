#!/bin/bash

# Deploy Manager - Instalador Rápido (One-Line Install)
# Uso: curl -fsSL https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/scripts/quick-install.sh | bash

set -e

REPO_URL="https://github.com/seu-usuario/deploy-manager.git"
INSTALL_DIR="$HOME/deploy-manager"

echo "🚀 Deploy Manager - Instalação Rápida"
echo "======================================"
echo ""

# Verificar Git
if ! command -v git &> /dev/null; then
    echo "❌ Git não encontrado. Por favor, instale Git primeiro."
    exit 1
fi

# Clonar repositório
echo "📥 Baixando Deploy Manager..."
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Diretório já existe. Atualizando..."
    cd "$INSTALL_DIR"
    git pull
else
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo ""

# Executar instalador
chmod +x scripts/install.sh
./scripts/install.sh

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📂 Deploy Manager instalado em: $INSTALL_DIR"
echo ""
