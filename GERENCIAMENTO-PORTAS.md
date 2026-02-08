# 🔌 Gerenciamento Automático de Portas

## 🎯 Problema Resolvido

**Antes:** Se você criasse dois projetos com a mesma porta, o segundo falharia com erro de porta em uso.

**Agora:** O sistema detecta automaticamente conflitos e aloca portas disponíveis!

---

## ✨ Como Funciona

### Cenário 1: Porta Especificada Disponível

```
Você cria projeto:
- Nome: meu-app
- Porta: 3000

Sistema verifica:
✅ Porta 3000 está disponível

Resultado:
✅ Projeto criado na porta 3000
```

### Cenário 2: Porta Especificada em Uso

```
Você cria projeto:
- Nome: outro-app
- Porta: 3000 (já em uso!)

Sistema verifica:
❌ Porta 3000 está em uso
🔍 Buscando porta alternativa...
✅ Porta 3001 disponível

Resultado:
✅ Projeto criado na porta 3001
⚠️  Aviso: "Porta 3000 em uso, usando porta 3001"
```

### Cenário 3: Sem Porta Especificada

```
Você cria projeto:
- Nome: novo-app
- Porta: (vazio)

Sistema:
🔍 Buscando porta disponível...
✅ Porta 3002 disponível

Resultado:
✅ Projeto criado na porta 3002
💡 "Porta alocada automaticamente: 3002"
```

---

## 📋 Range de Portas

**Portas Permitidas:** 3000 - 9000

**Por que esse range?**
- ✅ Evita portas do sistema (< 1024)
- ✅ Evita portas comuns (80, 443, 8080)
- ✅ Amplo o suficiente para muitos projetos

---

## 🔍 Verificar Portas

### API Endpoints

#### 1. Verificar Porta Específica

```http
GET /api/projects/check-port/3000
```

**Resposta:**
```json
{
  "port": 3000,
  "available": false,
  "message": "Porta 3000 já está em uso"
}
```

#### 2. Sugerir Portas Disponíveis

```http
GET /api/projects/suggest-ports?count=5
```

**Resposta:**
```json
{
  "suggestions": [3000, 3001, 3002, 3003, 3004],
  "usedPorts": [4000, 5000, 8080]
}
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Múltiplos Projetos Frontend

```
Projeto 1: gestao-nautica-frontend
- Porta solicitada: 3000
- Porta alocada: 3000 ✅

Projeto 2: outro-frontend
- Porta solicitada: 3000
- Porta alocada: 3001 ✅ (3000 em uso)

Projeto 3: mais-um-frontend
- Porta solicitada: (vazio)
- Porta alocada: 3002 ✅ (automático)
```

### Exemplo 2: Backends com Portas Específicas

```
API 1: api-usuarios
- Porta solicitada: 8000
- Porta alocada: 8000 ✅

API 2: api-produtos
- Porta solicitada: 8001
- Porta alocada: 8001 ✅

API 3: api-pedidos
- Porta solicitada: 8000 (em uso!)
- Porta alocada: 8002 ✅ (próxima disponível)
```

---

## 🎨 Interface

### Card do Projeto

```
┌─────────────────────────────────────┐
│ Meu App                  [Ativo]    │
│ meu-app                             │
├─────────────────────────────────────┤
│ 🌿 main                             │
│ ⏰ v1.0.0                           │
│ 🌐 abc123.localhost [Teste]        │
│ 🔌 Porta: 3001                      │  ← Porta alocada
│ 💡 Acesso local: localhost:3001    │
└─────────────────────────────────────┘
```

### Logs do Backend

```
✅ Porta alocada automaticamente: 3001
⚠️  Porta 3000 em uso, usando porta 3001
```

---

## 🔧 Configuração

### Alterar Range de Portas

Edite `backend/src/services/PortManager.ts`:

```typescript
export class PortManager {
  private static MIN_PORT = 3000;  // ← Porta mínima
  private static MAX_PORT = 9000;  // ← Porta máxima
  
  // ...
}
```

---

## 📊 Monitoramento

### Ver Portas em Uso

```bash
# Via API
curl http://localhost:8001/api/projects/suggest-ports

# Via Docker
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

**Exemplo de saída:**
```
NAMES                      PORTS
deploy-manager-app1        0.0.0.0:3000->3000/tcp
deploy-manager-app2        0.0.0.0:3001->3000/tcp
deploy-manager-app3        0.0.0.0:3002->3000/tcp
```

---

## ⚠️ Avisos e Limitações

### Avisos

1. **Porta Alterada:**
   ```
   ⚠️  Porta 3000 em uso, usando porta 3001
   ```
   Seu projeto foi criado, mas em porta diferente da solicitada.

2. **Porta Automática:**
   ```
   💡 Porta alocada automaticamente: 3002
   ```
   Você não especificou porta, sistema escolheu uma.

### Limitações

1. **Range Limitado:**
   - Máximo de ~6000 projetos simultâneos (3000-9000)
   - Se esgotar, erro: "Nenhuma porta disponível"

2. **Apenas Projetos Ativos:**
   - Portas de projetos inativos são liberadas
   - Ao parar um projeto, porta fica disponível

3. **Sem Reserva:**
   - Portas não são reservadas
   - Primeiro a criar, primeiro a usar

---

## 🚀 Boas Práticas

### ✅ Recomendado

1. **Deixe o sistema escolher:**
   - Não especifique porta
   - Sistema aloca automaticamente

2. **Use portas específicas para produção:**
   - API principal: 8000
   - API secundária: 8001
   - Frontend: 3000

3. **Documente portas importantes:**
   - Anote portas de APIs críticas
   - Use variáveis de ambiente

### ❌ Evite

1. **Forçar mesma porta:**
   - Não insista em usar porta ocupada
   - Aceite a sugestão do sistema

2. **Portas fora do range:**
   - Não use portas < 3000
   - Não use portas > 9000

3. **Muitos projetos ativos:**
   - Pare projetos não utilizados
   - Libere portas desnecessárias

---

## 🔍 Troubleshooting

### Problema: "Porta já está em uso"

**Causa:** Outro projeto está usando a porta

**Solução:**
1. Deixe campo porta vazio (sistema escolhe)
2. Ou escolha outra porta manualmente
3. Ou pare o projeto que está usando a porta

### Problema: "Nenhuma porta disponível"

**Causa:** Todas as portas (3000-9000) estão em uso

**Solução:**
1. Pare projetos inativos
2. Delete projetos não utilizados
3. Aumente o range de portas no código

### Problema: "Não consigo acessar na porta X"

**Causa:** Porta foi alterada automaticamente

**Solução:**
1. Veja a porta real no card do projeto
2. Use o link "Acesso local" fornecido
3. Verifique logs do backend

---

## 📝 Resumo

**Antes:**
```
❌ Conflito de porta → Erro
❌ Precisa verificar manualmente
❌ Projetos falham ao criar
```

**Agora:**
```
✅ Conflito detectado automaticamente
✅ Porta alternativa alocada
✅ Projetos sempre funcionam
✅ Avisos claros no log
```

---

## 🎉 Benefícios

1. ✅ **Sem conflitos** - Sistema gerencia automaticamente
2. ✅ **Sem erros** - Sempre encontra porta disponível
3. ✅ **Transparente** - Avisos claros quando porta muda
4. ✅ **Flexível** - Aceita porta específica ou automática
5. ✅ **Escalável** - Suporta muitos projetos simultâneos

**Crie quantos projetos quiser, sem se preocupar com portas! 🚀**

---

**Versão**: 1.2.0  
**Data**: 2026-02-08  
**Status**: ✅ Implementado
