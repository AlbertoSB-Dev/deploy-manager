# 🌐 Configurar IP para Domínios Públicos

## 🎯 Objetivo

Gerar domínios no formato: `abc123xyz.SEU-IP.sslip.io` em vez de `abc123xyz.localhost`

---

## 📋 Passo a Passo

### 1️⃣ Descobrir seu IP Público

#### Opção A: Via Navegador
Acesse: https://ifconfig.me

#### Opção B: Via Terminal (Windows)
```powershell
curl ifconfig.me
```

#### Opção C: Via Terminal (Linux/Mac)
```bash
curl ifconfig.me
```

**Exemplo de resultado:**
```
38.242.213.195
```

---

### 2️⃣ Editar o arquivo .env

Abra o arquivo: `deploy-manager/backend/.env`

**Antes:**
```env
SERVER_IP=localhost
BASE_DOMAIN=localhost
```

**Depois:**
```env
SERVER_IP=38.242.213.195
BASE_DOMAIN=sslip.io
```

⚠️ **Substitua `38.242.213.195` pelo SEU IP real!**

---

### 3️⃣ Reiniciar o Backend

```bash
# Pare o backend (Ctrl+C)
# Inicie novamente:
cd deploy-manager/backend
npm run dev
```

---

### 4️⃣ Criar um Novo Projeto

1. Acesse http://localhost:8000
2. Clique em "Novo Projeto"
3. Preencha os dados
4. **Deixe o campo "Domínio" VAZIO**
5. Clique em "Criar Projeto"

**Resultado:**
```
Domínio gerado: t4kkocs8kggg04c0w8cgossg.38.242.213.195.sslip.io
```

---

## 🎨 Como Vai Aparecer

### No Card do Projeto:

```
┌─────────────────────────────────────────────────────┐
│ Meu Projeto                            [Ativo]      │
│ meu-projeto                                         │
├─────────────────────────────────────────────────────┤
│ 🌿 main                                             │
│ ⏰ v1.0.0                                           │
│ 🌐 t4kkocs8kggg04c0w8cgossg.38.242.213.195.sslip.io│
│    [Gerado]                                         │
│ 🔌 Porta: 3000                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Verificar se Funcionou

### Teste 1: Criar Projeto Novo

Após configurar o IP, crie um projeto novo e veja se o domínio tem o formato:
```
abc123xyz.SEU-IP.sslip.io
```

### Teste 2: Ping no Domínio

```bash
ping t4kkocs8kggg04c0w8cgossg.38.242.213.195.sslip.io
```

Deve resolver para: `38.242.213.195`

### Teste 3: Acessar no Navegador

```
http://t4kkocs8kggg04c0w8cgossg.38.242.213.195.sslip.io:3000
```

---

## 🌍 Diferentes Ambientes

### Desenvolvimento Local (Atual)
```env
SERVER_IP=localhost
BASE_DOMAIN=localhost
```
**Gera:** `abc123.localhost`

### Servidor Local (LAN)
```env
SERVER_IP=192.168.1.100
BASE_DOMAIN=sslip.io
```
**Gera:** `abc123.192.168.1.100.sslip.io`

### Servidor Público (Internet)
```env
SERVER_IP=38.242.213.195
BASE_DOMAIN=sslip.io
```
**Gera:** `abc123.38.242.213.195.sslip.io`

---

## ❓ FAQ

### Por que ainda mostra .localhost?

**Causa:** O `SERVER_IP` ainda está como `localhost` no `.env`

**Solução:** Altere para seu IP público e reinicie o backend

### Projetos antigos não mudaram

**Causa:** O domínio é gerado apenas na criação do projeto

**Solução:** 
1. Edite o projeto (botão ✏️)
2. Altere o campo "Domínio"
3. Salve
4. Faça deploy

### Como voltar para localhost?

Edite o `.env`:
```env
SERVER_IP=localhost
BASE_DOMAIN=localhost
```

Reinicie o backend.

---

## 🎯 Exemplo Completo

### Cenário: Servidor com IP 38.242.213.195

**1. Configurar .env:**
```env
SERVER_IP=38.242.213.195
BASE_DOMAIN=sslip.io
```

**2. Reiniciar backend:**
```bash
cd deploy-manager/backend
npm run dev
```

**3. Criar projeto:**
- Nome: `meu-app`
- Domínio: (deixar vazio)

**4. Resultado:**
```
Domínio: k8m2n5p9q1r4s7t0.38.242.213.195.sslip.io
```

**5. Acessar:**
```
http://k8m2n5p9q1r4s7t0.38.242.213.195.sslip.io:3000
```

---

## 🚀 Pronto!

Agora seus projetos terão domínios públicos acessíveis de qualquer lugar, igual ao Coolify! 🎉

---

**Versão**: 1.2.0  
**Data**: 2026-02-08
