# ✅ Implementação: Seletor de Ambiente Assas (Sandbox/Produção)

## 📝 Resumo da Implementação

Foi implementado um seletor de ambiente no painel de administração que permite alternar entre Sandbox (teste) e Produção diretamente pela interface, sem necessidade de editar arquivos `.env` manualmente.

---

## 🔧 Alterações Realizadas

### 1. Backend - Modelo SystemSettings
**Arquivo**: `deploy-manager/backend/src/models/SystemSettings.ts`

**Alterações**:
- Adicionado campo `assasEnvironment?: 'sandbox' | 'production'` na interface
- Adicionado campo no schema com enum `['sandbox', 'production']` e default `'sandbox'`

```typescript
export interface ISystemSettings extends Document {
  // ... outros campos
  assasEnvironment?: 'sandbox' | 'production';
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
  // ... outros campos
  assasEnvironment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
});
```

---

### 2. Backend - Rotas Admin
**Arquivo**: `deploy-manager/backend/src/routes/admin.ts`

**Alterações**:

#### GET /admin/settings
- Retorna o campo `assasEnvironment` do banco
- Se não existir, usa valor do `.env` ou default `'sandbox'`

#### PUT /admin/settings
- Recebe `assasEnvironment` no body
- Atualiza no banco de dados
- Atualiza no arquivo `.env`
- Atualiza `process.env.ASSAS_ENVIRONMENT` em memória

```typescript
// GET
settings = new SystemSettings({
  // ... outros campos
  assasEnvironment: (process.env.ASSAS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
});

// PUT
settings.assasEnvironment = assasEnvironment || 'sandbox';

// Atualizar .env
if (envContent.includes('ASSAS_ENVIRONMENT=')) {
  envContent = envContent.replace(/ASSAS_ENVIRONMENT=.*/g, `ASSAS_ENVIRONMENT=${assasEnvironment || 'sandbox'}`);
} else {
  envContent += `\nASSAS_ENVIRONMENT=${assasEnvironment || 'sandbox'}`;
}

process.env.ASSAS_ENVIRONMENT = assasEnvironment || 'sandbox';
```

---

### 3. Backend - AssasService
**Arquivo**: `deploy-manager/backend/src/services/AssasService.ts`

**Alterações**:
- Adicionado campo `environment: 'sandbox' | 'production'`
- URL base agora é dinâmica baseada no ambiente
- Logs mostram qual ambiente está ativo

```typescript
export class AssasService {
  private environment: 'sandbox' | 'production' = 'sandbox';
  private baseURL = 'https://sandbox.asaas.com/api/v3';

  private async initializeClient() {
    const settings = await SystemSettings.findOne();
    this.environment = settings?.assasEnvironment || 'sandbox';

    // Definir URL baseada no ambiente
    this.baseURL = this.environment === 'production' 
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    console.log(`🔧 Assas configurado em modo: ${this.environment.toUpperCase()}`);
    console.log(`🌐 URL Base: ${this.baseURL}`);
  }
}
```

---

### 4. Frontend - Página de Configurações
**Arquivo**: `deploy-manager/frontend/src/app/admin/settings/page.tsx`

**Alterações**:

#### Estado
- Adicionado `assasEnvironment: 'sandbox' | 'production'` no estado

#### Indicador Visual
- Card com borda colorida (amarelo = sandbox, verde = produção)
- Badge animado mostrando ambiente ativo
- Mensagem clara sobre o que cada ambiente faz

#### Dropdown
- Seletor com opções "Sandbox (Teste)" e "Produção"
- Texto de ajuda explicando quando usar cada um
- Placeholder dinâmico no campo API Key

```tsx
{/* Indicador de Ambiente Ativo */}
<div className={`mb-4 p-3 rounded-xl border-2 ${
  settings.assasEnvironment === 'production' 
    ? 'bg-green-50 border-green-500' 
    : 'bg-yellow-50 border-yellow-500'
}`}>
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${
      settings.assasEnvironment === 'production' ? 'bg-green-500' : 'bg-yellow-500'
    } animate-pulse`}></div>
    <span className="font-semibold">
      Ambiente Ativo: {settings.assasEnvironment === 'production' ? 'PRODUÇÃO' : 'SANDBOX (Teste)'}
    </span>
  </div>
</div>

{/* Dropdown */}
<select 
  value={settings.assasEnvironment} 
  onChange={(e) => setSettings({ ...settings, assasEnvironment: e.target.value as 'sandbox' | 'production' })}
>
  <option value="sandbox">Sandbox (Teste)</option>
  <option value="production">Produção</option>
</select>
```

---

## 📚 Documentação Criada

### 1. ASSAS-AMBIENTE-SANDBOX-PRODUCAO.md
Guia completo explicando:
- Como usar o seletor
- Diferenças entre Sandbox e Produção
- Como obter credenciais para cada ambiente
- Indicadores visuais
- Troubleshooting
- Checklists de configuração

---

## 🎯 Funcionalidades

### ✅ Implementado
- [x] Campo `assasEnvironment` no modelo SystemSettings
- [x] Rota GET retorna ambiente configurado
- [x] Rota PUT atualiza ambiente no banco, .env e memória
- [x] AssasService usa URL correta baseada no ambiente
- [x] Dropdown no frontend para selecionar ambiente
- [x] Indicador visual mostrando ambiente ativo
- [x] Cores diferentes por ambiente (amarelo/verde)
- [x] Mensagens claras sobre cada ambiente
- [x] Logs no console mostrando ambiente ativo
- [x] Documentação completa

### 🔄 Fluxo de Funcionamento
1. Admin acessa `/admin/settings`
2. Vê indicador visual do ambiente atual
3. Seleciona novo ambiente no dropdown
4. Atualiza credenciais correspondentes
5. Clica em "Salvar Configurações"
6. Backend atualiza banco, .env e memória
7. AssasService reinicializa com nova URL
8. Próximas requisições usam ambiente correto

---

## 🧪 Como Testar

### Teste 1: Alternar para Sandbox
1. Acesse `/admin/settings`
2. Selecione "Sandbox (Teste)"
3. Insira API Key de Sandbox
4. Salve
5. Verifique indicador ficou amarelo
6. Crie uma assinatura de teste
7. Confirme que aparece no painel Sandbox do Assas

### Teste 2: Alternar para Produção
1. Acesse `/admin/settings`
2. Selecione "Produção"
3. Insira API Key de Produção
4. Salve
5. Verifique indicador ficou verde
6. Crie assinatura com valor baixo
7. Confirme que aparece no painel de Produção do Assas

### Teste 3: Verificar Logs
1. Reinicie o backend
2. Verifique logs no console:
```
🔧 Assas configurado em modo: SANDBOX
🌐 URL Base: https://sandbox.asaas.com/api/v3
```

---

## ⚠️ Pontos de Atenção

### 1. Credenciais Diferentes
- Sandbox e Produção têm credenciais DIFERENTES
- Sempre atualize TODAS as credenciais ao trocar de ambiente
- API Key de Sandbox não funciona em Produção e vice-versa

### 2. Teste Antes de Produção
- SEMPRE teste no Sandbox primeiro
- Verifique webhooks funcionando
- Confirme fluxo completo de pagamento
- Só então mude para Produção

### 3. Reinicialização
- AssasService reinicializa automaticamente
- Não precisa reiniciar o servidor
- Próximas requisições já usam novo ambiente

---

## 📊 Impacto

### Benefícios
- ✅ Não precisa editar .env manualmente
- ✅ Não precisa reiniciar servidor
- ✅ Interface visual clara
- ✅ Menos erros de configuração
- ✅ Fácil alternar entre ambientes
- ✅ Indicadores visuais previnem erros

### Segurança
- ✅ Credenciais armazenadas no banco
- ✅ Também salvas no .env como backup
- ✅ Validação de enum no schema
- ✅ Alertas visuais sobre ambiente ativo

---

## 🎉 Conclusão

A implementação está completa e funcional. O admin pode agora alternar entre Sandbox e Produção facilmente pelo painel, com indicadores visuais claros e sem necessidade de editar arquivos manualmente.

**Status**: ✅ CONCLUÍDO
**Data**: 2026-02-12
**Versão**: 1.0.0
