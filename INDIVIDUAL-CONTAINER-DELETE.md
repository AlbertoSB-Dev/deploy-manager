# Sistema de Deleção de Containers Individuais

## ✅ IMPLEMENTAÇÃO COMPLETA

### Problema Resolvido
- **Erro 404**: URL estava indo para `/versions/error` em vez de `/versions/61ecf416`
- **Campo faltando**: `containerId` não estava sendo salvo nos deployments
- **Rota faltando**: Não havia rota para deletar container individual

---

## 🔧 Correções Aplicadas

### 1. Backend - Model (Project.ts)
**Adicionado campo `containerId` na interface e schema:**
```typescript
export interface IDeployment {
  version: string;
  branch: string;
  commit: string;
  deployedAt: Date;
  status: 'success' | 'failed' | 'deploying';
  logs: string;
  deployedBy: string;
  containerId?: string; // ✅ NOVO: ID do container Docker criado neste deploy
}

const DeploymentSchema = new Schema({
  // ... outros campos
  containerId: { type: String } // ✅ NOVO
});
```

### 2. Backend - DeployService.ts
**Salvando `containerId` em cada deployment:**
```typescript
// Deploy local com sucesso
const deployment = {
  version: version || branch,
  branch,
  commit,
  deployedAt: new Date(),
  status: 'success' as const,
  logs,
  deployedBy,
  containerId: newContainerId // ✅ NOVO
};

// Deploy remoto com sucesso
project.deployments.push({
  version: commit.substring(0, 8),
  branch: project.branch,
  commit,
  deployedAt: new Date(),
  status: 'success',
  logs,
  deployedBy,
  containerId: newContainerId // ✅ NOVO
});
```

### 3. Backend - Routes (projects.ts)
**Rota melhorada para deletar versão completa:**
```typescript
router.delete('/:id/versions/:version', protect, async (req, res) => {
  // ✅ Agora busca por versão semântica OU commit
  const versionDeployments = project.deployments.filter((d: any) => {
    return d.version === version || d.commit === version || d.commit?.startsWith(version);
  });
  
  // ✅ Logs detalhados
  console.log('🗑️ Deletando versão:', version);
  console.log(`📦 Encontrados ${versionDeployments.length} deploys para deletar`);
  
  // Deleta todos os containers da versão
  // Remove do histórico
});
```

**Nova rota para deletar container individual:**
```typescript
router.delete('/:id/deployments/:deploymentIndex', protect, async (req, res) => {
  const deploymentIndex = parseInt(req.params.deploymentIndex);
  const deployment = project.deployments[deploymentIndex];
  
  // ✅ Proteção: não permite deletar container em execução
  if (deployment.containerId === project.containerId) {
    return res.status(400).json({ error: 'Não é possível deletar o container em execução' });
  }
  
  // Deleta container via Docker
  // Remove do histórico
});
```

### 4. Frontend - ServiceItem.tsx
**Botão de deletar versão com log de debug:**
```typescript
<button
  onClick={() => {
    console.log('Deletando versão:', version); // ✅ Debug
    handleDeleteVersion(version, latestDeploy.containerId || '');
  }}
  disabled={deploying}
  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium flex items-center gap-2"
  title="Deletar containers desta versão"
>
  {deploying ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
  Deletar
</button>
```

**Botão de deletar container individual:**
```typescript
{!isCurrentContainer && deployment.containerId && (
  <button
    onClick={() => handleDeleteSingleContainer(
      deploymentIndex.toString(),
      deployment.containerId,
      formatDistanceToNow(new Date(deployment.deployedAt), { addSuffix: true, locale: ptBR })
    )}
    disabled={deploying}
    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-50"
    title="Deletar este container"
  >
    {deploying ? (
      <Loader className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" />
    ) : (
      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
    )}
  </button>
)}
```

---

## 🎯 Funcionalidades

### Deletar Versão Completa
- Deleta **todos os containers** de uma versão específica
- Funciona com versões semânticas (`v1.0.0`) e commits (`61ecf416`)
- Remove do histórico de deployments
- Proteção: não permite deletar versão atual

### Deletar Container Individual
- Deleta **um container específico** dentro de uma versão
- Badge "⚡ Rodando" no container atual
- Botão de deletar (🗑️) em cada deploy
- Proteção: não mostra botão no container em execução
- Confirmação antes de deletar

---

## 🔒 Proteções Implementadas

1. **Não deletar container atual**: Sistema verifica se é o container em execução
2. **Confirmação obrigatória**: Usuário precisa confirmar antes de deletar
3. **Validação de índice**: Backend valida se o índice do deployment é válido
4. **Logs detalhados**: Console mostra o que está sendo deletado
5. **Tratamento de erros**: Se falhar ao deletar container Docker, retorna erro claro

---

## 📊 Fluxo de Uso

### Cenário 1: Deletar Versão Completa
```
1. Usuário clica em "Ver Versões"
2. Escolhe uma versão antiga (ex: v1.0.0)
3. Clica no botão "Deletar" no header da versão
4. Confirma a ação
5. Sistema deleta todos os 10 containers da versão v1.0.0
6. Remove do histórico
7. Atualiza a lista
```

### Cenário 2: Deletar Container Individual
```
1. Usuário clica em "Ver Versões"
2. Expande uma versão (ex: v1.0.0 com 10 deploys)
3. Vê lista de 10 containers
4. Clica no botão 🗑️ em um container específico
5. Confirma a ação
6. Sistema deleta apenas aquele container
7. Remove do histórico
8. Atualiza a lista (agora mostra 9 deploys)
```

---

## 🧪 Como Testar

### Teste 1: Deletar Versão
```bash
# 1. Fazer múltiplos deploys da mesma versão
# 2. Abrir modal "Ver Versões"
# 3. Clicar em "Deletar" em uma versão antiga
# 4. Verificar no console do navegador: "Deletando versão: v1.0.0"
# 5. Verificar no backend: logs de containers deletados
# 6. Confirmar que versão sumiu da lista
```

### Teste 2: Deletar Container Individual
```bash
# 1. Abrir modal "Ver Versões"
# 2. Expandir uma versão com múltiplos deploys
# 3. Verificar badge "⚡ Rodando" no container atual
# 4. Clicar em 🗑️ em um container antigo
# 5. Confirmar deleção
# 6. Verificar que container sumiu da lista
# 7. Verificar que container atual ainda está rodando
```

---

## 📝 Notas Importantes

1. **Novos deploys**: A partir de agora, todos os deploys salvam o `containerId`
2. **Deploys antigos**: Deploys feitos antes desta correção podem não ter `containerId`
3. **Compatibilidade**: Sistema funciona mesmo se `containerId` for `undefined`
4. **Rollback**: Sistema de rollback continua funcionando normalmente
5. **Versões**: Sistema agrupa por versão semântica ou commit automaticamente

---

## 🚀 Próximos Passos (Opcional)

- [ ] Adicionar confirmação com input de texto para versões com muitos containers
- [ ] Mostrar tamanho total dos containers antes de deletar
- [ ] Adicionar opção de "Limpar containers antigos" (deletar todos exceto últimos 5)
- [ ] Adicionar filtro por status (sucesso/falha) no histórico
- [ ] Exportar histórico de deploys para CSV

---

## ✅ Status: COMPLETO

Todas as funcionalidades foram implementadas e testadas. O sistema agora permite:
- ✅ Deletar versão completa (todos os containers)
- ✅ Deletar container individual
- ✅ Proteção contra deletar container em execução
- ✅ Logs detalhados para debug
- ✅ Confirmação antes de deletar
- ✅ Suporte a versões semânticas e commits
