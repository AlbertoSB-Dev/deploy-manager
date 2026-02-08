#!/bin/bash
# Deploy Manager - Instalador de Uma Linha
# curl -fsSL https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/scripts/one-line-install.sh | bash

set -e

REPO_URL="https://github.com/seu-usuario/deploy-manager.git"
INSTALL_DIR="$HOME/deploy-manager"

echo "🚀 Deploy Manager - Instalação Automática"
echo "=========================================="
echo ""

# Verificar Git
if ! command -v git &> /dev/null; then
    echo "❌ Git não encontrado. Instalando..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y git
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install git
    fi
fi

# Clonar ou atualizar repositório
if [ -d "$INSTALL_DIR" ]; then
    echo "📂 Diretório já existe. Atualizando..."
    cd "$INSTALL_DIR"
    git pull
else
    echo "📥 Clonando repositório..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo ""

# Tornar scripts executáveis
chmod +x scripts/*.sh

# Executar instalador
./scripts/install.sh

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📂 Deploy Manager instalado em: $INSTALL_DIR"
echo ""
echo "🚀 Para iniciar:"
echo "   cd $INSTALL_DIR"
echo "   ./start.sh"
echo ""
