# 🔍 Como Funciona a Geração de Domínio

## 📋 Fluxo Completo

### Quando você cria um projeto:

```
1. Usuário preenche formulário
   ↓
2. Campo "Domínio" está vazio?
   ↓
   SIM → Gera domínio automático
   NÃO → Usa domínio fornecido
   ↓
3. Salva no banco de dados
   ↓
4. Exibe no card do projeto
```

---

## 🎲 Geração Automática

### Código Atual (backend/src/routes/projects.ts)

```typescript
const generateRandomDomain = () => {
  // 1. Gera string aleatória de ~24 caracteres
  const randomString = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
  
  // 2. Pega configurações do .env
  const serverIp = process.env.SERVER_IP || 'localhost';
  const baseDomain = process.env.BASE_DOMAIN || 'localhost';
  
  // 3. Decide o formato baseado no IP
  if (serverIp !== 'localhost' && serverIp.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    // IP válido → usa sslip.io
    return `${randomString}.${serverIp}.sslip.io`;
  }
  
  // localhost → usa formato simples
  return `${randomString}.${baseDomain}`;
};

// 4. Usa domínio fornecido OU gera automático
const finalDomain = req.body.domain || generateRandomDomain();
```

---

## 🔧 Configuração Atual (.env)

```env
SERVER_IP=localhost
BASE_DOMAIN=localhost
```

### Resultado com essa configuração:

```
Domínio gerado: abc123xyz456.localhost
```

---

## 📊 Exemplos de Geração

### Exemplo 1: Desenvolvimento Local (Atual)

```env
# .env
SERVER_IP=localhost
BASE_DOMAIN=localhost
```

**Processo:**
1. `randomString` = `"k8m2n5p9q1r4s7t0"`
2. `serverIp` = `"localhost"`
3. `baseDomain` = `"localhost"`
4. Verifica: `serverIp !== 'localhost'` → **FALSO**
5. **Resultado:** `k8m2n5p9q1r4s7t0.localhost`

**Card mostra:**
```
🌐 k8m2n5p9q1r4s7t0.localhost [Teste]
```

---

### Exemplo 2: Servidor com IP Público

```env
# .env
SERVER_IP=38.242.213.195
BASE_DOMAIN=sslip.io
```

**Processo:**
1. `randomString` = `"t4kkocs8kggg04c0w8cgossg"`
2. `serverIp` = `"38.242.213.195"`
3. `baseDomain` = `"sslip.io"`
4. Verifica: `serverIp !== 'localhost'` → **VERDADEIRO**
5. Verifica: IP válido (regex) → **VERDADEIRO**
6. **Resultado:** `t4kkocs8kggg04c0w8cgossg.38.242.213.195.sslip.io`

**Card mostra:**
```
🌐 t4kkocs8kggg04c0w8cgossg.38.242.213.195.sslip.io [Gerado]
```

---

### Exemplo 3: Domínio Customizado

**Usuário preenche:**
```
Campo Domínio: app.meusite.com
```

**Processo:**
1. `req.body.domain` = `"app.meusite.com"`
2. Verifica: `req.body.domain` existe? → **SIM**
3. **Resultado:** `app.meusite.com` (não gera aleatório)

**Card mostra:**
```
🌐 app.meusite.com
```
(sem badge)

---

## 🎯 Decisão de Formato

```
┌─────────────────────────────────────┐
│ Campo "Domínio" preenchido?         │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
   SIM           NÃO
    │             │
    │      ┌──────┴──────────────────┐
    │      │ SERVER_IP = localhost?  │
    │      └──────┬──────────────────┘
    │             │
    │      ┌──────┴──────┐
    │      │             │
    │     SIM           NÃO
    │      │             │
    │      │      ┌──────┴──────────────┐
    │      │      │ IP é válido?        │
    │      │      └──────┬──────────────┘
    │      │             │
    │      │      ┌──────┴──────┐
    │      │      │             │
    │      │     SIM           NÃO
    │      │      │             │
    ↓      ↓      ↓             ↓
    │      │      │             │
Customizado  Random  Random+IP  Random
    │      │      │             │
    │      │      │             │
app.com  abc.local  abc.IP.sslip  abc.local
```

---

## 🔍 Detalhes Técnicos

### 1. Geração da String Aleatória

```javascript
Math.random().toString(36).substring(2, 15)
```

**O que faz:**
- `Math.random()` → `0.8234567890123456`
- `.toString(36)` → `"0.tg8k2n5p9q1r4s7"`
- `.substring(2, 15)` → `"tg8k2n5p9q1r"`

**Faz 2 vezes e concatena:**
```javascript
"tg8k2n5p9q1r" + "4s7t0u3v6w9x" = "tg8k2n5p9q1r4s7t0u3v6w9x"
```

**Resultado:** String de ~24 caracteres com letras e números

---

### 2. Validação de IP

```javascript
serverIp.match(/^\d+\.\d+\.\d+\.\d+$/)
```

**Valida:**
- ✅ `38.242.213.195` → válido
- ✅ `192.168.1.100` → válido
- ❌ `localhost` → inválido
- ❌ `meuservidor.com` → inválido

---

### 3. sslip.io

**O que é:**
- Serviço DNS mágico
- Resolve qualquer subdomínio para o IP especificado

**Como funciona:**
```
abc.38.242.213.195.sslip.io
    └─────┬─────┘
          │
    Extrai IP
          │
          ↓
    38.242.213.195
```

**Teste:**
```bash
# Resolve para 38.242.213.195
ping qualquercoisa.38.242.213.195.sslip.io

# Resolve para 192.168.1.100
ping teste.192.168.1.100.sslip.io
```

---

## 📝 Resumo do Fluxo

### Cenário 1: Usuário NÃO preenche domínio (localhost)

```
1. Campo vazio
2. generateRandomDomain() é chamado
3. randomString = "k8m2n5p9q1r4s7t0"
4. serverIp = "localhost"
5. Não é IP válido
6. Retorna: "k8m2n5p9q1r4s7t0.localhost"
7. Salva no banco
8. Card mostra: 🌐 k8m2n5p9q1r4s7t0.localhost [Teste]
```

### Cenário 2: Usuário NÃO preenche domínio (IP público)

```
1. Campo vazio
2. generateRandomDomain() é chamado
3. randomString = "t4kkocs8kggg04c0w8cgossg"
4. serverIp = "38.242.213.195"
5. É IP válido!
6. Retorna: "t4kkocs8kggg04c0w8cgossg.38.242.213.195.sslip.io"
7. Salva no banco
8. Card mostra: 🌐 t4kkocs8kggg04c0w8cgossg.38.242.213.195.sslip.io [Gerado]
```

### Cenário 3: Usuário preenche domínio

```
1. Campo = "app.meusite.com"
2. generateRandomDomain() NÃO é chamado
3. Usa: "app.meusite.com"
4. Salva no banco
5. Card mostra: 🌐 app.meusite.com
```

---

## 🎨 Exibição no Card

### Código (frontend/src/components/ProjectCard.tsx)

```typescript
// Gerar domínio de fallback se não existir
const getDisplayDomain = () => {
  if (project.domain) {
    return project.domain;
  }
  // Gerar domínio temporário para projetos antigos
  return `${project.name}.localhost`;
};

const displayDomain = getDisplayDomain();

// Sempre exibe o domínio
<div className="flex items-center text-sm">
  <Globe className="w-4 h-4 mr-2 text-gray-600" />
  <a href={`http://${displayDomain}...`}>
    {displayDomain}
    
    {/* Badge "Teste" para localhost */}
    {displayDomain.includes('localhost') && (
      <span className="...">Teste</span>
    )}
    
    {/* Badge "Gerado" para sslip.io */}
    {displayDomain.includes('sslip.io') && (
      <span className="...">Gerado</span>
    )}
  </a>
</div>
```

---

## 🔄 Para Mudar para Produção

### Passo 1: Descubra seu IP

```bash
curl ifconfig.me
# Resultado: 38.242.213.195
```

### Passo 2: Edite .env

```env
SERVER_IP=38.242.213.195
BASE_DOMAIN=sslip.io
```

### Passo 3: Reinicie o backend

```bash
cd deploy-manager/backend
npm run dev
```

### Passo 4: Crie um novo projeto

- Deixe campo "Domínio" vazio
- Sistema gera: `abc123xyz.38.242.213.195.sslip.io`
- Funciona imediatamente!

---

## ❓ FAQ

### Por que a string é aleatória?

Para garantir que cada projeto tenha um domínio único, evitando conflitos.

### Por que usar sslip.io?

Porque não precisa configurar DNS! O sslip.io resolve automaticamente para o IP.

### Posso usar meu próprio domínio?

Sim! Basta preencher o campo "Domínio" ao criar o projeto.

### O domínio muda se eu fizer deploy novamente?

Não! O domínio é gerado apenas na criação e fica fixo.

### Posso editar o domínio depois?

Sim! Use o botão ✏️ Editar no card do projeto.

---

## 🎉 Conclusão

**Como funciona:**
1. ✅ Campo vazio → Gera domínio aleatório
2. ✅ Campo preenchido → Usa o que você digitou
3. ✅ localhost → Formato simples
4. ✅ IP público → Formato sslip.io
5. ✅ Sempre visível no card

**Simples e automático, igual ao Coolify! 🚀**

---

**Versão**: 1.2.0  
**Data**: 2026-02-08
