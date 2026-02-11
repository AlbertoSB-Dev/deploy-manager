# Configurar Token do GitHub para Deploy do Painel

Se seu repositório é **privado**, você precisa de um token de acesso pessoal do GitHub para que o sistema de deploy consiga clonar e atualizar o código.

## Como Gerar um Token de Acesso Pessoal

### 1. Acesse as Configurações do GitHub

1. Vá para https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"

### 2. Configure o Token

Preencha os campos:

- **Token name**: `ark-deploy-panel` (ou qualquer nome descritivo)
- **Expiration**: Escolha uma data apropriada (recomendado: 90 dias ou "No expiration")

### 3. Selecione as Permissões (Scopes)

Marque as seguintes permissões:

- ✅ `repo` - Acesso completo a repositórios privados e públicos
  - `repo:status` - Acesso ao status do repositório
  - `repo_deployment` - Acesso a deployments
  - `public_repo` - Acesso a repositórios públicos
  - `repo:invite` - Acesso a convites de repositório

Ou simplesmente marque `repo` que inclui todas as sub-permissões.

### 4. Gere o Token

Clique em "Generate token" e **copie o token imediatamente** (você não poderá vê-lo novamente).

## Como Usar o Token

### Desenvolvimento Local

Adicione ao arquivo `deploy-manager/backend/.env`:

```env
PANEL_GIT_TOKEN=ghp_seu_token_aqui
```

### Produção (VPS)

Adicione ao arquivo `.env` no servidor:

```bash
ssh seu_usuario@seu_vps
cd /opt/ark-deploy
nano backend/.env
```

Adicione a linha:

```env
PANEL_GIT_TOKEN=ghp_seu_token_aqui
```

Salve com `Ctrl+X` → `Y` → `Enter`

## Testando a Configuração

Após adicionar o token, teste a sincronização:

```bash
curl -X POST http://localhost:8001/api/panel-deploy/sync-github \
  -H "Authorization: Bearer seu_token_jwt" \
  -H "Content-Type: application/json"
```

Você deve receber uma resposta com o commit mais recente.

## Segurança

⚠️ **IMPORTANTE:**

- Nunca compartilhe seu token
- Não faça commit do token no repositório
- Se o token vazar, revogue-o imediatamente em https://github.com/settings/tokens
- Use `.env` local e nunca versione esse arquivo

## Regenerar Token

Se precisar regenerar o token:

1. Vá para https://github.com/settings/tokens
2. Encontre o token `ark-deploy-panel`
3. Clique em "Regenerate token"
4. Copie o novo token
5. Atualize em todos os lugares onde está configurado

## Repositório Público

Se seu repositório é **público**, você pode deixar `PANEL_GIT_TOKEN` vazio ou não configurado. O sistema funcionará normalmente.

## Troubleshooting

### "Repository not found" ou "Authentication failed"

- Verifique se o token está correto
- Verifique se o token tem permissão `repo`
- Verifique se o token não expirou
- Regenere um novo token se necessário

### "Permission denied"

- O token pode ter expirado
- O token pode ter sido revogado
- Regenere um novo token

### Erro ao fazer deploy

Se receber erro durante o deploy:

```
❌ Erro ao sincronizar com GitHub: fatal: could not read Username
```

Significa que o token não está configurado corretamente. Verifique:

1. Se `PANEL_GIT_TOKEN` está no `.env`
2. Se o token está correto (sem espaços extras)
3. Se o backend foi reiniciado após adicionar o token
