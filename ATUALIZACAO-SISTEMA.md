# Sistema de Verificação de Atualizações

## 🎯 Problema Resolvido

O sistema não estava mostrando quando havia atualizações disponíveis no GitHub porque:
1. O container Docker não tem acesso ao repositório git
2. Os comandos `git fetch` e `git log` não funcionam dentro do container

## ✅ Solução Implementada

### 1. Detecção de Ambiente
O sistema agora detecta se está rodando em Docker (`/.dockerenv`) e usa métodos diferentes:

**Em Docker (Produção)**:
- Usa a API pública do GitHub para verificar o último commit
- Compara com o commit hash salvo no `package.json` durante o build
- Não precisa de acesso git

**No Host (Desenvolvimento)**:
- Usa comandos git normalmente
- Mais preciso e detalhado

### 2. Commit Hash no Build
O Dockerfile agora captura o commit hash durante o build:

```dockerfile
# Capturar commit hash e adicionar ao package.json
RUN if [ -d .git ]; then \
      COMMIT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "unknown"); \
      echo "Git commit: $COMMIT_HASH"; \
      node -e "const pkg = require('./package.json'); pkg.gitCommit = '$COMMIT_HASH'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2))"; \
    fi
```

### 3. API do GitHub
Quando em Docker, o sistema faz uma requisição HTTPS para:
```
https://api.github.com/repos/AlbertoSB-Dev/deploy-manager/commits/main
```

Isso retorna:
- SHA do último commit
- Mensagem do commit
- Data do commit
- Autor

### 4. Fallback Inteligente
Se a API do GitHub falhar (rate limit, sem internet, etc):
- Mostra mensagem indicando que há possíveis atualizações
- Sugere verificação manual no GitHub
- Não quebra o sistema

## 🚀 Como Usar

### Na VPS (após atualizar)

1. **Atualizar código**:
```bash
cd /opt/ark-deploy
git pull origin main
```

2. **Rebuild com novo Dockerfile**:
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

3. **Verificar no painel**:
- Acessar: Admin > Deploy do Painel
- Clicar em "Verificar Atualizações"
- Deve mostrar banner se houver atualizações

## 📊 Resposta da API

### Quando há atualizações:
```json
{
  "hasUpdates": true,
  "localCommit": "abc1234",
  "remoteCommit": "def5678",
  "updateInfo": {
    "commitsAhead": 1,
    "latestCommit": "def5678",
    "latestCommitMessage": "feat: Nova funcionalidade",
    "latestCommitDate": "2026-02-13T..."
  },
  "method": "github-api"
}
```

### Quando está atualizado:
```json
{
  "hasUpdates": false,
  "localCommit": "abc1234",
  "remoteCommit": "abc1234",
  "updateInfo": null,
  "method": "github-api"
}
```

### Quando não consegue verificar:
```json
{
  "hasUpdates": false,
  "localCommit": "unknown",
  "remoteCommit": "unknown",
  "updateInfo": null,
  "error": "...",
  "note": "Não foi possível verificar atualizações automaticamente"
}
```

## 🎨 Interface

Quando há atualizações, aparece um banner azul no topo da página:

```
🎉 Nova Atualização Disponível!

Há X commit(s) novos disponíveis no GitHub

Última atualização:
feat: Nova funcionalidade
Commit: def5678
13/02/2026 15:30

💡 Para aplicar esta atualização:
1. Clique em "Nova Versão" para criar uma versão com as atualizações
2. Aguarde a construção da versão
3. Clique em "Deploy" na nova versão criada
```

## 🔧 Configuração

### Variáveis de Ambiente
Não precisa de configuração adicional! O sistema usa:
- Repositório: `AlbertoSB-Dev/deploy-manager`
- Branch: `main`
- API: `api.github.com` (pública, sem autenticação)

### Rate Limits do GitHub
A API pública do GitHub permite:
- 60 requisições por hora por IP
- Suficiente para verificações periódicas

Se atingir o limite:
- Sistema usa fallback
- Mostra mensagem genérica
- Não quebra

## 🐛 Troubleshooting

### "Versão atual: unknown"
**Causa**: Build foi feito sem acesso ao git
**Solução**: 
```bash
docker-compose build --no-cache backend
```

### "Não foi possível verificar atualizações"
**Causa**: Erro na API do GitHub ou sem internet
**Solução**: Verificar manualmente no GitHub

### Banner não aparece mesmo com atualizações
**Causa**: Frontend em cache
**Solução**: 
```bash
docker-compose restart frontend
# ou
Ctrl+Shift+R no navegador
```

## 📝 Logs

Para debug, verificar logs do backend:
```bash
docker-compose logs backend | grep -i "update\|commit\|github"
```

Deve mostrar:
```
Git commit: abc1234567890...
✅ Conectado ao MongoDB
🚀 Deploy Manager rodando na porta 8001
```

## 🎯 Próximos Passos

1. ✅ Atualizar código na VPS
2. ✅ Rebuild do backend
3. ✅ Testar verificação de atualizações
4. ✅ Criar nova versão quando houver updates
5. ✅ Fazer deploy da nova versão

## 💡 Dicas

- Verificação automática a cada 5 minutos (configurável)
- Botão manual "Verificar Atualizações" sempre disponível
- Sistema não faz deploy automático (segurança)
- Sempre cria versão antes de fazer deploy
- Permite rollback para versões anteriores
