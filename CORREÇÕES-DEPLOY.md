# Correções de Deploy - Sistema Completo

## ✅ Problemas Corrigidos

### 1. Erro "projectId is not defined"
**Problema**: Variável `projectId` não estava definida no método `deployLocal` do `DeployService`.

**Solução**: Adicionada linha `const projectId = project._id.toString();` no início do método.

**Arquivo**: `backend/src/services/DeployService.ts`

---

### 2. Deploy Remoto Não Funcionando
**Problema**: Ao criar projeto com servidor remoto selecionado, o `serverId` e `serverName` não estavam sendo salvos no banco de dados.

**Solução**: 
- Adicionado `serverId` e `serverName` na desestruturação do `req.body`
- Incluído esses campos ao criar o objeto `Project`
- Clone do repositório agora só acontece se for deploy local (`!serverId`)

**Arquivo**: `backend/src/routes/projects.ts`

**Código**:
```typescript
const { serverId, serverName } = req.body;

const project = new Project({
  // ... outros campos
  serverId: serverId || undefined,
  serverName: serverName || undefined
});

// Clone apenas se for local
if (!serverId) {
  const gitService = new GitService(workDir, project.gitAuth);
  await gitService.clone(gitUrl, branch || 'main');
}
```

---

### 3. Erro "pathspec 'main' did not match any file(s)"
**Problema**: Repositório usa branch `master` mas sistema tentava fazer checkout em `main`.

**Solução**: Melhorado método `checkout` do `GitService` para:
- Tentar o branch especificado primeiro
- Se falhar, verificar branches disponíveis
- Tentar alternativas comuns (main ↔ master)
- Usar primeiro branch disponível como fallback

**Arquivo**: `backend/src/services/GitService.ts`

**Código**:
```typescript
async checkout(branchOrTag: string): Promise<void> {
  const git = await this.initGit();
  try {
    await git.checkout(branchOrTag);
  } catch (error: any) {
    // Tentar alternativas (main/master)
    const branches = await git.branch();
    // ... lógica de fallback
  }
}
```

---

## 🔄 Como Aplicar as Correções

### 1. Reiniciar o Backend
```powershell
# Parar o backend atual (Ctrl+C)
# Depois reiniciar:
cd deploy-manager
.\start-windows.ps1
```

### 2. Testar Deploy Local
1. Criar novo projeto
2. Deixar "Servidor Local (padrão)" selecionado
3. Clicar em Deploy
4. Deve funcionar mesmo se o branch for master ou main

### 3. Testar Deploy Remoto
1. Adicionar um servidor na aba "Servidores"
2. Provisionar o servidor (instalar Docker, Git, etc)
3. Criar novo projeto
4. Selecionar o servidor remoto
5. Clicar em Deploy
6. Sistema deve conectar via SSH e fazer deploy no servidor remoto

---

## 📋 Checklist de Verificação

- [x] `projectId` definido no `deployLocal`
- [x] `serverId` e `serverName` sendo salvos ao criar projeto
- [x] Clone do repositório só acontece em deploy local
- [x] Checkout de branch com fallback automático
- [x] Build do backend sem erros
- [ ] Backend reiniciado
- [ ] Deploy local testado
- [ ] Deploy remoto testado

---

## 🐛 Problemas Conhecidos

### Branch Padrão
Se o repositório usar um branch diferente de `main` ou `master`, você pode:
1. Especificar o branch correto ao criar o projeto
2. Ou deixar o sistema detectar automaticamente (implementado)

### Primeiro Deploy
O primeiro deploy pode demorar mais porque:
- Clona o repositório completo
- Faz build da imagem Docker
- Baixa dependências

Deploys subsequentes são mais rápidos (usa cache).

---

## 📝 Notas Técnicas

### Deploy Local vs Remoto
O sistema detecta automaticamente baseado no `serverId`:
- **Local** (`!serverId`): Usa Docker local, clona repo localmente
- **Remoto** (`serverId`): Conecta via SSH, executa comandos remotamente

### Logs em Tempo Real
Ambos os tipos de deploy emitem logs via WebSocket:
```typescript
this.emitLog(projectId, 'mensagem');
```

Frontend recebe via:
```typescript
socket.on('deploy-log', (data) => {
  // Exibe log em tempo real
});
```

---

## 🚀 Próximos Passos

1. ✅ Corrigir erro de projectId
2. ✅ Salvar serverId ao criar projeto
3. ✅ Melhorar detecção de branch
4. 🔄 Testar deploy remoto completo
5. 📝 Adicionar validação de servidor antes do deploy
6. 🔐 Melhorar autenticação SSH
7. 📊 Adicionar métricas de deploy (tempo, sucesso/falha)

