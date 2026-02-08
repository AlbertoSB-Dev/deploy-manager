# Domínios com Nome do Projeto

## 🎯 Mudança Implementada

Domínios agora usam o **nome do projeto** ao invés de hash aleatório!

---

## 📊 Antes vs Depois

### Antes (Hash Aleatório)

```
Projeto: Sistema-de-Teste
Domínio: 1zapc6j1sdcf7mchyjkaxf.38.242.213.195.sslip.io
         ^^^^^^^^^^^^^^^^^^^^^^
         Hash aleatório (difícil de lembrar)
```

### Depois (Nome do Projeto)

```
Projeto: Sistema-de-Teste
Domínio: sistema-de-teste.38.242.213.195.sslip.io
         ^^^^^^^^^^^^^^^^
         Nome do projeto (fácil de lembrar!)
```

---

## ✅ Vantagens

### Fácil de Lembrar

```
❌ Antes: 1zapc6j1sdcf7mchyjkaxf.38.242.213.195.sslip.io
✅ Agora: sistema-de-teste.38.242.213.195.sslip.io
```

### Fácil de Identificar

```
Projeto: minha-api
Domínio: minha-api.38.242.213.195.sslip.io
         ^^^^^^^^
         Óbvio qual projeto é!
```

### Fácil de Compartilhar

```
"Acesse sistema-de-teste.38.242.213.195.sslip.io"
Muito mais fácil que:
"Acesse 1zapc6j1sdcf7mchyjkaxf.38.242.213.195.sslip.io"
```

---

## 🎯 Exemplos

### Projeto Frontend

```
Nome: meu-frontend
Domínio: meu-frontend.38.242.213.195.sslip.io
```

### Projeto Backend

```
Nome: api-usuarios
Domínio: api-usuarios.38.242.213.195.sslip.io
```

### Projeto com Nome Complexo

```
Nome: Sistema de Gestão Náutica
Sanitizado: sistema-de-gestao-nautica
Domínio: sistema-de-gestao-nautica.38.242.213.195.sslip.io
```

---

## 🔧 Como Funciona

### Sanitização do Nome

O nome do projeto é convertido para formato válido de domínio:

```typescript
// Entrada
"Sistema de Teste"

// Processo
1. Lowercase: "sistema de teste"
2. Substituir espaços: "sistema-de-teste"
3. Remover caracteres especiais: "sistema-de-teste"

// Resultado
"sistema-de-teste"
```

### Geração do Domínio

**Deploy Remoto**:
```
Nome: sistema-de-teste
IP Servidor: 38.242.213.195
Domínio: sistema-de-teste.38.242.213.195.sslip.io
```

**Deploy Local**:
```
Nome: sistema-de-teste
IP Local: 192.168.1.100
Domínio: sistema-de-teste.192.168.1.100.sslip.io
```

---

## 📝 Regras de Sanitização

### Caracteres Permitidos

- ✅ Letras minúsculas (a-z)
- ✅ Números (0-9)
- ✅ Hífen (-)

### Caracteres Removidos

- ❌ Letras maiúsculas → convertidas para minúsculas
- ❌ Espaços → substituídos por hífen
- ❌ Caracteres especiais → removidos
- ❌ Acentos → removidos

### Exemplos

| Nome Original | Domínio Gerado |
|---------------|----------------|
| Sistema de Teste | sistema-de-teste |
| API Usuários | api-usuarios |
| Frontend_React | frontend-react |
| Backend@2024 | backend2024 |
| Meu Site! | meu-site |

---

## 🎯 Múltiplos Projetos

### Mesmo Servidor

```
Projeto 1: sistema-de-teste
Domínio: sistema-de-teste.38.242.213.195.sslip.io

Projeto 2: api-usuarios
Domínio: api-usuarios.38.242.213.195.sslip.io

Projeto 3: frontend-react
Domínio: frontend-react.38.242.213.195.sslip.io
```

**Todos fáceis de identificar!** ✅

### Servidores Diferentes

```
Servidor 1 (38.242.213.195):
- sistema-de-teste.38.242.213.195.sslip.io
- api-usuarios.38.242.213.195.sslip.io

Servidor 2 (45.123.456.789):
- sistema-de-teste.45.123.456.789.sslip.io
- api-usuarios.45.123.456.789.sslip.io
```

**Mesmo nome, IPs diferentes = domínios diferentes** ✅

---

## ⚠️ Conflitos de Nome

### Problema

Se criar dois projetos com o mesmo nome no mesmo servidor:

```
Projeto 1: sistema-de-teste
Domínio: sistema-de-teste.38.242.213.195.sslip.io

Projeto 2: sistema-de-teste (mesmo nome!)
Domínio: sistema-de-teste.38.242.213.195.sslip.io (conflito!)
```

### Solução

**Opção 1: Nomes únicos** (recomendado)
```
Projeto 1: sistema-de-teste
Projeto 2: sistema-de-teste-v2
```

**Opção 2: Sufixo automático** (futuro)
```
Projeto 1: sistema-de-teste
Domínio: sistema-de-teste.38.242.213.195.sslip.io

Projeto 2: sistema-de-teste (duplicado)
Domínio: sistema-de-teste-2.38.242.213.195.sslip.io
```

---

## 💡 Dicas

### Escolher Bons Nomes

**Bom**:
```
✅ api-usuarios
✅ frontend-react
✅ backend-node
✅ sistema-vendas
```

**Evitar**:
```
❌ teste
❌ projeto1
❌ app
❌ sistema
```

### Padrões Recomendados

**Por Tipo**:
```
frontend-[nome]
backend-[nome]
api-[nome]
```

**Por Ambiente**:
```
[nome]-dev
[nome]-staging
[nome]-prod
```

**Por Versão**:
```
[nome]-v1
[nome]-v2
[nome]-v3
```

---

## 🔄 Migração de Projetos Existentes

### Projetos com Hash Aleatório

Projetos criados antes desta mudança mantêm o domínio antigo:

```
Projeto antigo:
Domínio: 1zapc6j1sdcf7mchyjkaxf.38.242.213.195.sslip.io
Status: Continua funcionando ✅
```

### Atualizar para Novo Formato

**Opção 1: Fazer novo deploy**
```
1. Fazer novo deploy
2. Sistema gera novo domínio com nome
3. Domínio antigo continua funcionando
```

**Opção 2: Editar projeto** (futuro)
```
1. Editar projeto
2. Atualizar domínio manualmente
3. Fazer deploy
```

---

## 📊 Comparação Completa

| Aspecto | Hash Aleatório | Nome do Projeto |
|---------|----------------|-----------------|
| **Memorização** | ❌ Difícil | ✅ Fácil |
| **Identificação** | ❌ Impossível | ✅ Óbvio |
| **Compartilhamento** | ❌ Complicado | ✅ Simples |
| **Conflitos** | ✅ Nunca | ⚠️ Possível |
| **Profissional** | ❌ Não | ✅ Sim |

---

## 🎉 Resultado

### Antes

```
"Acesse o sistema em 1zapc6j1sdcf7mchyjkaxf.38.242.213.195.sslip.io"

Cliente: "Como assim? Não consigo decorar isso!"
```

### Agora

```
"Acesse o sistema em sistema-de-teste.38.242.213.195.sslip.io"

Cliente: "Perfeito! Fácil de lembrar!"
```

---

## 🚀 Próximas Melhorias

- [ ] Validar nomes únicos antes de criar
- [ ] Sugerir nomes alternativos se houver conflito
- [ ] Permitir editar domínio depois de criado
- [ ] Suporte a domínios customizados (sem sslip.io)
- [ ] Aliases de domínio (múltiplos domínios por projeto)
- [ ] Subdomínios automáticos por branch

---

## ✅ Conclusão

Domínios agora são **fáceis de lembrar e identificar**!

**Antes**:
```
1zapc6j1sdcf7mchyjkaxf.38.242.213.195.sslip.io
```

**Agora**:
```
sistema-de-teste.38.242.213.195.sslip.io
```

**Muito melhor! 🎯**
