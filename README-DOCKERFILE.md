# Dockerfile para Backend TypeScript

Este Dockerfile está configurado para executar projetos TypeScript usando `ts-node`.

## Como funciona

1. **Base**: Node 20 Alpine (leve)
2. **Dependências**: Instala todas as dependências incluindo devDependencies (necessário para ts-node)
3. **Execução**: Usa `ts-node --transpile-only` para executar TypeScript diretamente sem compilar

## Vantagens

- ✅ Não precisa compilar TypeScript (mais rápido)
- ✅ Não precisa configurar build scripts
- ✅ Funciona imediatamente com qualquer projeto TypeScript
- ✅ Ideal para desenvolvimento e produção

## Porta

A porta padrão é 8000, mas pode ser alterada via variável de ambiente PORT.

## Uso

Este Dockerfile já está na raiz do projeto. Ao fazer deploy pelo Ark Deploy, ele será usado automaticamente.
