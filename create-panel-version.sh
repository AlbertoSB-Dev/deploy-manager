#!/bin/bash

# Script para criar uma nova versão do painel
# Uso: ./create-panel-version.sh v1.0.0 "Descrição das mudanças"

set -e

VERSION=${1:-}
MESSAGE=${2:-}

if [ -z "$VERSION" ]; then
  echo "❌ Erro: Versão é obrigatória"
  echo "Uso: ./create-panel-version.sh v1.0.0 \"Descrição das mudanças\""
  exit 1
fi

# Validar formato de versão
if ! [[ $VERSION =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Erro: Formato de versão inválido. Use: v1.0.0 ou 1.0.0"
  exit 1
fi

# Adicionar 'v' se não tiver
if [[ ! $VERSION =~ ^v ]]; then
  VERSION="v$VERSION"
fi

echo "📦 Criando versão $VERSION..."

# Ir para o diretório do painel
cd /opt/ark-deploy

# Verificar se a versão já existe
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "❌ Erro: Tag $VERSION já existe"
  exit 1
fi

# Criar tag
git tag -a "$VERSION" -m "${MESSAGE:-Versão $VERSION}"

# Fazer push da tag
git push origin "$VERSION"

echo "✅ Versão $VERSION criada com sucesso!"
echo ""
echo "Próximos passos:"
echo "1. Acesse o painel administrativo"
echo "2. Vá para Admin > Deploy do Painel"
echo "3. Selecione a versão $VERSION"
echo "4. Clique em 'Deploy'"
