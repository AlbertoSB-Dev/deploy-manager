# 🔄 Fluxo de Atualização com Sistema de Versões

## 📋 Novo Processo de Atualização

O sistema agora usa um fluxo controlado de versões para aplicar atualizações, permitindo melhor controle e possibilidade de rollback.

---

## 🎯 Como Funciona

### 1️⃣ **Notificação de Atualização Disponível**

Quando há atualizações no GitHub, um banner azul aparece no topo:

```
┌─────────────────────────────────────────────────────────────┐
│ 🚀 🎉 Nova Atualização Disponível!                          │
│                                                              │
│ Há 3 commit(s) novos disponíveis no GitHub                 │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Última atualização:                                   │   │
│ │ Fix: Corrigido erro 403 no panel-deploy              │   │
│ │ Commit: abc1234  •  11/02/2026 14:30                 │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ 💡 Para aplicar esta atualização:                          │
│ 1. Clique em "Nova Versão" para criar uma versão           │
│ 2. Aguarde a construção da versão                          │
│ 3. Clique em "Deploy" na nova versão criada                │
│                                                              │
│                                    [🔄 Verificar Novamente] │
└─────────────────────────────────────────────────────────────┘
```

---

### 2️⃣ **Criar Nova Versão**

1. Clique no botão **"Nova Versão"** no header
2. Preencha o modal:
   ```
   ┌─────────────────────────────────┐
   │ Criar Nova Versão               │
   ├─────────────────────────────────┤
   │ Versão (ex: v1.0.0)             │
   │ [v1.2.4________________]        │
   │                                 │
   │ Mensagem (opcional)             │
   │ [Atualização com correções___] │
   │ [de bugs e melhorias_________] │
   │                                 │
   │ [Cancelar]  [Criar]            │
   └─────────────────────────────────┘
   ```

3. O sistema cria a versão com o código atual do GitHub

---

### 3️⃣ **Aguardar Construção**

A nova versão aparece na lista com status:

```
┌─────────────────────────────────────────────────────────┐
│ v1.2.4                                    🟡 Construindo │
│ Commit: abc1234                                          │
│ Atualização com correções de bugs e melhorias          │
│ Criado por admin@exemplo.com em 11/02/2026 14:35       │
└─────────────────────────────────────────────────────────┘
```

Quando pronta:

```
┌─────────────────────────────────────────────────────────┐
│ v1.2.4                                    ✅ Pronto      │
│ Commit: abc1234                                          │
│ Atualização com correções de bugs e melhorias          │
│ Criado por admin@exemplo.com em 11/02/2026 14:35       │
│                                                          │
│                                    [🚀 Deploy] [🗑️ Deletar]│
└─────────────────────────────────────────────────────────┘
```

---

### 4️⃣ **Fazer Deploy**

1. Clique no botão **"Deploy"** na versão desejada
2. Confirme a ação
3. O sistema:
   - Faz checkout da versão
   - Instala dependências
   - Reconstrói containers (se Docker)
   - Reinicia o sistema
4. A versão se torna a **ATUAL**

```
┌─────────────────────────────────────────────────────────┐
│ v1.2.4                          ✅ Pronto  🔵 ATUAL     │
│ Commit: abc1234                                          │
│ Atualização com correções de bugs e melhorias          │
│ Criado por admin@exemplo.com em 11/02/2026 14:35       │
│                                                          │
│                                              [🔄 Rollback]│
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Rollback (Voltar Versão Anterior)

Se algo der errado, você pode voltar para uma versão anterior:

1. Na versão **ATUAL**, clique em **"Rollback"**
2. Confirme a ação
3. O sistema volta para a versão anterior automaticamente

Ou escolha uma versão específica:

1. Clique em **"Deploy"** em qualquer versão anterior
2. O sistema faz deploy dessa versão

---

## ✅ Vantagens deste Fluxo

### 🎯 **Controle Total**
- Você decide quando aplicar atualizações
- Pode testar antes de aplicar em produção
- Histórico completo de versões

### 🔒 **Segurança**
- Rollback fácil se algo der errado
- Versões antigas ficam disponíveis
- Confirmação antes de cada ação

### 📊 **Rastreabilidade**
- Sabe exatamente qual versão está rodando
- Histórico de quem criou cada versão
- Mensagens descritivas para cada versão

### 🚀 **Flexibilidade**
- Pode pular versões
- Pode voltar para qualquer versão anterior
- Pode deletar versões não utilizadas

---

## 📝 Exemplo Prático

### Cenário: Há 3 atualizações disponíveis

1. **Banner aparece:**
   ```
   🎉 Nova Atualização Disponível!
   Há 3 commit(s) novos disponíveis
   ```

2. **Você cria nova versão:**
   - Versão: `v1.2.4`
   - Mensagem: "Correções de bugs e melhorias"

3. **Sistema constrói a versão:**
   - Status: 🟡 Construindo → ✅ Pronto

4. **Você faz deploy:**
   - Clica em "Deploy"
   - Confirma
   - Sistema aplica a atualização

5. **Versão atual atualizada:**
   - v1.2.3 → v1.2.4
   - Sistema funcionando com as atualizações

6. **Se algo der errado:**
   - Clica em "Rollback"
   - Volta para v1.2.3
   - Sistema restaurado

---

## 🎨 Interface Atualizada

### Banner de Atualização
- ✅ Mostra número de commits novos
- ✅ Exibe última mensagem de commit
- ✅ Instruções claras de como aplicar
- ✅ Botão "Verificar Novamente"
- ❌ Removido botão "Atualizar Agora" (automático)

### Sistema de Versões
- ✅ Lista todas as versões criadas
- ✅ Status visual (Construindo, Pronto, Falhou)
- ✅ Indicador de versão atual
- ✅ Botões de ação contextuais
- ✅ Informações detalhadas de cada versão

---

## 🔐 Permissões

- ✅ Verificar atualizações: `admin` ou `super_admin`
- ✅ Criar versões: `admin` ou `super_admin`
- ✅ Fazer deploy: `admin` ou `super_admin`
- ✅ Fazer rollback: `admin` ou `super_admin`
- ✅ Deletar versões: `admin` ou `super_admin`

---

## 💡 Dicas

### Quando Criar Nova Versão?
- ✅ Quando há atualizações importantes
- ✅ Antes de fazer mudanças críticas
- ✅ Para marcar releases estáveis
- ✅ Quando quiser um ponto de restauração

### Nomenclatura de Versões
Use versionamento semântico:
- `v1.0.0` - Release inicial
- `v1.0.1` - Correção de bugs
- `v1.1.0` - Novas funcionalidades
- `v2.0.0` - Mudanças grandes/breaking changes

### Mensagens Descritivas
Seja claro sobre o que mudou:
- ✅ "Correção do erro 403 no panel-deploy"
- ✅ "Adicionado sistema de notificações"
- ✅ "Melhorias de performance no dashboard"
- ❌ "Atualização"
- ❌ "Mudanças"

---

## 🎉 Resumo

**Fluxo Antigo (Removido):**
```
Atualização Disponível → [Atualizar Agora] → Sistema Atualizado
```

**Fluxo Novo (Atual):**
```
Atualização Disponível → [Nova Versão] → Versão Criada → [Deploy] → Sistema Atualizado
                                                              ↓
                                                         [Rollback] → Versão Anterior
```

**Benefícios:**
- ✅ Mais controle
- ✅ Mais segurança
- ✅ Rollback fácil
- ✅ Histórico completo
- ✅ Melhor rastreabilidade

---

**Implementado em**: 11 de Fevereiro de 2026
**Status**: ✅ Funcional e Testado
