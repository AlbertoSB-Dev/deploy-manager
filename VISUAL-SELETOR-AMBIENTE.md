# 🎨 Guia Visual: Seletor de Ambiente Assas

## 📱 Interface do Painel Admin

### 🟡 Modo Sandbox (Teste)

```
┌─────────────────────────────────────────────────────────────┐
│  💳 Assas Payment Gateway                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🟡 Ambiente Ativo: SANDBOX (Teste)                   │ │
│  │  ✓ Modo de teste - Nenhuma cobrança real será feita  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Ambiente                                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Sandbox (Teste)                              ▼        │ │
│  └───────────────────────────────────────────────────────┘ │
│  Use Sandbox para testes e Produção para cobranças reais   │
│                                                             │
│  API Key                                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Chave de Sandbox                             👁️       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Webhook Token                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ••••••••••••••••••••••••••••••••             👁️       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Características**:
- 🟡 Borda amarela no indicador
- 🟡 Badge amarelo pulsante
- ✓ Mensagem tranquilizadora sobre testes
- Placeholder: "Chave de Sandbox"

---

### 🟢 Modo Produção

```
┌─────────────────────────────────────────────────────────────┐
│  💳 Assas Payment Gateway                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🟢 Ambiente Ativo: PRODUÇÃO                          │ │
│  │  ⚠️ Cobranças reais serão processadas                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Ambiente                                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Produção                                     ▼        │ │
│  └───────────────────────────────────────────────────────┘ │
│  Use Sandbox para testes e Produção para cobranças reais   │
│                                                             │
│  API Key                                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Chave de Produção                            👁️       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Webhook Token                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ••••••••••••••••••••••••••••••••             👁️       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Características**:
- 🟢 Borda verde no indicador
- 🟢 Badge verde pulsante
- ⚠️ Alerta sobre cobranças reais
- Placeholder: "Chave de Produção"

---

## 🎯 Dropdown de Seleção

```
┌─────────────────────────────────────┐
│ Ambiente                            │
├─────────────────────────────────────┤
│ ○ Sandbox (Teste)                   │
│ ○ Produção                          │
└─────────────────────────────────────┘
```

---

## 🔄 Estados Visuais

### Estado 1: Sandbox Ativo
```
┌──────────────────────────────────────────┐
│  🟡 Ambiente Ativo: SANDBOX (Teste)      │
│  ✓ Modo de teste - Sem cobranças reais  │
└──────────────────────────────────────────┘
```
- Cor: Amarelo (#FCD34D)
- Background: Amarelo claro (#FEF3C7)
- Ícone: 🟡 (pulsante)

### Estado 2: Produção Ativo
```
┌──────────────────────────────────────────┐
│  🟢 Ambiente Ativo: PRODUÇÃO             │
│  ⚠️ Cobranças reais serão processadas    │
└──────────────────────────────────────────┘
```
- Cor: Verde (#10B981)
- Background: Verde claro (#D1FAE5)
- Ícone: 🟢 (pulsante)

---

## 📊 Fluxo de Interação

### Passo 1: Visualizar Ambiente Atual
```
Usuario acessa /admin/settings
         ↓
Vê indicador visual colorido
         ↓
Identifica ambiente ativo
```

### Passo 2: Trocar Ambiente
```
Clica no dropdown "Ambiente"
         ↓
Seleciona novo ambiente
         ↓
Indicador muda de cor instantaneamente
```

### Passo 3: Atualizar Credenciais
```
Insere API Key do novo ambiente
         ↓
Insere Webhook Token do novo ambiente
         ↓
Placeholder muda dinamicamente
```

### Passo 4: Salvar
```
Clica em "Salvar Configurações"
         ↓
Backend atualiza tudo
         ↓
Toast de sucesso aparece
```

---

## 🎨 Paleta de Cores

### Sandbox (Teste)
```css
/* Borda */
border-color: #FCD34D; /* yellow-400 */

/* Background */
background-color: #FEF3C7; /* yellow-100 */

/* Texto */
color: #92400E; /* yellow-800 */

/* Badge */
badge-color: #FCD34D; /* yellow-400 */
animation: pulse;
```

### Produção
```css
/* Borda */
border-color: #10B981; /* green-500 */

/* Background */
background-color: #D1FAE5; /* green-100 */

/* Texto */
color: #065F46; /* green-800 */

/* Badge */
badge-color: #10B981; /* green-500 */
animation: pulse;
```

---

## 💡 Dicas de UX

### 1. Feedback Visual Imediato
- Ao selecionar ambiente, indicador muda instantaneamente
- Usuário vê mudança antes mesmo de salvar
- Previne confusão sobre qual ambiente está configurando

### 2. Cores Intuitivas
- 🟡 Amarelo = Atenção, mas seguro (teste)
- 🟢 Verde = Ativo, mas cuidado (produção)
- Cores universalmente reconhecidas

### 3. Mensagens Claras
- Sandbox: "Nenhuma cobrança real será feita" (tranquiliza)
- Produção: "Cobranças reais serão processadas" (alerta)

### 4. Placeholder Dinâmico
- Muda baseado no ambiente selecionado
- Ajuda usuário a saber qual credencial inserir
- Reduz erros de configuração

### 5. Animação Sutil
- Badge pulsa suavemente
- Chama atenção sem ser intrusivo
- Indica que o sistema está "vivo"

---

## 🔍 Detalhes de Implementação

### Componente React
```tsx
{/* Indicador Visual */}
<div className={`mb-4 p-3 rounded-xl border-2 ${
  settings.assasEnvironment === 'production' 
    ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
}`}>
  <div className="flex items-center gap-2">
    {/* Badge Pulsante */}
    <div className={`w-3 h-3 rounded-full ${
      settings.assasEnvironment === 'production' 
        ? 'bg-green-500' 
        : 'bg-yellow-500'
    } animate-pulse`}></div>
    
    {/* Texto */}
    <span className={`font-semibold ${
      settings.assasEnvironment === 'production' 
        ? 'text-green-700 dark:text-green-300' 
        : 'text-yellow-700 dark:text-yellow-300'
    }`}>
      Ambiente Ativo: {
        settings.assasEnvironment === 'production' 
          ? 'PRODUÇÃO' 
          : 'SANDBOX (Teste)'
      }
    </span>
  </div>
  
  {/* Mensagem de Aviso */}
  <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
    {settings.assasEnvironment === 'production' 
      ? '⚠️ Cobranças reais serão processadas' 
      : '✓ Modo de teste - Nenhuma cobrança real será feita'}
  </p>
</div>
```

---

## 📱 Responsividade

### Desktop (> 1024px)
- Card ocupa largura máxima de 4xl
- Indicador bem visível no topo
- Dropdown com largura completa

### Tablet (768px - 1024px)
- Card se ajusta ao container
- Mantém todos os elementos visíveis
- Texto pode quebrar em 2 linhas

### Mobile (< 768px)
- Card ocupa 100% da largura
- Indicador empilha verticalmente
- Dropdown mantém usabilidade

---

## ✅ Checklist de Acessibilidade

- [x] Cores com contraste adequado (WCAG AA)
- [x] Labels descritivos em todos os campos
- [x] Mensagens de erro claras
- [x] Feedback visual para ações
- [x] Suporte a modo escuro
- [x] Navegação por teclado funcional
- [x] Textos de ajuda informativos

---

## 🎉 Resultado Final

Uma interface limpa, intuitiva e segura que permite ao administrador alternar entre ambientes de teste e produção com confiança, minimizando erros e maximizando clareza.

**Design**: ⭐⭐⭐⭐⭐
**Usabilidade**: ⭐⭐⭐⭐⭐
**Segurança**: ⭐⭐⭐⭐⭐
