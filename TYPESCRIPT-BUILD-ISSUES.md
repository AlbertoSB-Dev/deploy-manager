# Problemas de Build TypeScript

## 📋 Status Atual

O projeto está funcional em desenvolvimento, mas há **61 erros de TypeScript** que impedem o build de produção.

## ⚠️ Erros Principais

### 1. Tipos de Parâmetros de Rota (50+ erros)
**Problema**: `req.params` pode retornar `string | string[]`, mas os serviços esperam apenas `string`

**Arquivos Afetados**:
- `src/routes/backups.ts` (11 erros)
- `src/routes/projects.ts` (13 erros)
- `src/routes/sftp.ts` (19 erros)
- `src/routes/wordpress.ts` (8 erros)
- `src/routes/databases.ts` (3 erros)
- `src/routes/panel-deploy.ts` (1 erro)

**Exemplo**:
```typescript
// ❌ Erro
await deployService.deleteProject(req.params.id);

// ✅ Solução
await deployService.deleteProject(req.params.id as string);
// ou
import { getParamAsString } from '../utils/paramHelper';
await deployService.deleteProject(getParamAsString(req.params.id));
```

### 2. Tipos de ObjectId (11 erros)
**Problema**: `req.user?._id` retorna `ObjectId`, mas serviços esperam `string`

**Arquivos Afetados**:
- `src/routes/backups.ts`

**Solução**:
```typescript
// ❌ Erro
userId: req.user?._id!

// ✅ Solução
userId: req.user?._id!.toString()
```

### 3. Métodos Inexistentes (4 erros)
**Problema**: Métodos chamados que não existem nos serviços

**Arquivos Afetados**:
- `src/services/DeployService.ts` (2 erros)
  - `TraefikService.disconnectFromNetwork` não existe
  - `NginxService.removeProject` não existe
- `src/services/WordPressService.ts` (2 erros)
  - `TraefikService.detectTraefikNetwork` não existe

**Solução**: Comentar ou remover chamadas a métodos inexistentes

### 4. Tipo de Log Inválido (1 erro)
**Problema**: `'warning'` não é um tipo válido de log

**Arquivo**: `src/services/DatabaseService.ts:257`

**Solução**:
```typescript
// ❌ Erro
emitLog(`⚠️  Container existente encontrado, removendo...`, 'warning');

// ✅ Solução
emitLog(`⚠️  Container existente encontrado, removendo...`, 'info');
```

### 5. Namespace 'cron' (1 erro)
**Problema**: Tipo `cron.ScheduledTask` não encontrado

**Arquivo**: `src/services/SubscriptionRenewalService.ts:9`

**Solução**:
```typescript
// ❌ Erro
private cronJob: cron.ScheduledTask | null = null;

// ✅ Solução
import * as cron from 'node-cron';
private cronJob: cron.ScheduledTask | null = null;
```

## 🛠️ Soluções Implementadas

### Helper de Parâmetros
Criado `src/utils/paramHelper.ts` com funções auxiliares:

```typescript
export function getParamAsString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return param || '';
}

export function getParamAsNumber(param: string | string[] | undefined): number {
  const str = getParamAsString(param);
  return parseInt(str, 10);
}
```

### Configuração TypeScript
- `tsconfig.json`: Modo menos rigoroso para desenvolvimento
- `tsconfig.prod.json`: Configuração para build de produção (ainda com erros)

## 🚀 Workaround Atual

O projeto usa o **dist existente** que foi compilado anteriormente. Para desenvolvimento:

```bash
npm run dev  # Usa ts-node-dev com --transpile-only (ignora erros de tipo)
```

Para produção:
```bash
npm start  # Usa o dist/ existente
```

## 📝 Plano de Correção

### Fase 1: Correções Rápidas (1-2 horas)
1. Adicionar `as string` em todos os `req.params.*`
2. Adicionar `.toString()` em todos os `req.user?._id`
3. Corrigir tipo de log em DatabaseService
4. Corrigir import do cron

### Fase 2: Refatoração (3-4 horas)
1. Usar `paramHelper` em todas as rotas
2. Criar tipos personalizados para Request com params tipados
3. Remover ou implementar métodos inexistentes

### Fase 3: Testes (1-2 horas)
1. Testar build de produção
2. Verificar funcionamento de todas as rotas
3. Validar tipos com `tsc --noEmit`

## 💡 Recomendações

1. **Curto Prazo**: Usar dist existente e focar em novas funcionalidades
2. **Médio Prazo**: Corrigir erros gradualmente por arquivo
3. **Longo Prazo**: Implementar testes automatizados para prevenir regressões

## 📊 Estatísticas

- **Total de Erros**: 61
- **Arquivos Afetados**: 10
- **Tempo Estimado de Correção**: 6-8 horas
- **Prioridade**: Média (não bloqueia desenvolvimento)

## ✅ Status do Projeto

- ✅ Desenvolvimento funcional
- ✅ Servidor rodando sem erros
- ✅ Todas as funcionalidades operacionais
- ⚠️ Build de produção com erros de tipo
- ⚠️ Necessita correções para deploy limpo

## 🔗 Arquivos Relacionados

- `backend/src/utils/paramHelper.ts` - Helper criado
- `backend/tsconfig.json` - Configuração de desenvolvimento
- `backend/tsconfig.prod.json` - Configuração de produção
- `backend/package.json` - Scripts de build

## 📅 Última Atualização

12 de Fevereiro de 2026 - Documentação inicial dos problemas
