# 🎲 Domínios Aleatórios Estilo Coolify

## Como Funciona

O Deploy Manager agora gera **domínios aleatórios únicos** para cada projeto, exatamente como o Coolify!

### Formato dos Domínios

#### Desenvolvimento Local
```
abc123xyz456.localhost
```

#### Produção (com IP configurado)
```
t4kkocs8kggg04c0w8cgossg.38.242.213.195.sslip.io
```

---

## 🔧 Configuração

### Variáveis de Ambiente

Edite `backend/.env`:

```env
# Para desenvolvimento local
SERVER_IP=localhost
BASE_DOMAIN=localhost

# Para produção com IP público
SERVER_IP=38.242.213.195
BASE_DOMAIN=sslip.io
```

### O que é sslip.io?

**sslip.io** é um serviço DNS mágico que resolve qualquer subdomínio para o IP especificado.

**Exemplos:**
- `abc.38.242.213.195.sslip.io` → `38.242.213.195`
- `xyz.192.168.1.100.sslip.io` → `192.168.1.100`
- `qualquer-coisa.10.0.0.5.sslip.io` → `10.0.0.5`

**Vantagens:**
- ✅ Sem configuração DNS necessária
- ✅ Funciona imediatamente
- ✅ Ideal para desenvolvimento e staging
- ✅ Usado pelo Coolify

---

## 📋 Exemplos de Uso

### Exemplo 1: Desenvolvimento Local

```bash
# .env
SERVER_IP=localhost
BASE_DOMAIN=localhost

# Domínio gerado:
abc123xyz456.localhost

# Acesso:
http://abc123xyz456.localhost:3000
```

### Exemplo 2: Servidor de Staging

```bash
# .env
SERVER_IP=192.168.1.100
BASE_DOMAIN=sslip.io

# Domínio gerado:
t4kkocs8kggg04c0w8cgossg.192.168.1.100.sslip.io

# Acesso:
http://t4kkocs8kggg04c0w8cgossg.192.168.1.100.sslip.io
```

### Exemplo 3: Servidor de Produção

```bash
# .env
SERVER_IP=38.242.213.195
BASE_DOMAIN=sslip.io

# Domínio gerado:
m9n2p5q8r1s4t7u0v3w6x9y2.38.242.213.195.sslip.io

# Acesso:
http://m9n2p5q8r1s4t7u0v3w6x9y2.38.242.213.195.sslip.io
```

---

## 🎨 Interface

### Card do Projeto

```
┌─────────────────────────────────────────┐
│ Meu App                      [Ativo]    │
│ meu-app                                 │
├─────────────────────────────────────────┤
│ 🌿 main                                 │
│ ⏰ v1.0.0                               │
│ 🌐 abc123.localhost [Teste]            │  ← Domínio local
│ 🔌 Porta: 3000                          │
└─────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────┐
│ API Backend                  [Ativo]    │
│ api-backend                             │
├─────────────────────────────────────────┤
│ 🌿 main                                 │
│ ⏰ v2.1.0                               │
│ 🌐 xyz789.38.242.213.195.sslip.io     │  ← Domínio gerado
│   [Gerado]                              │
│ 🔌 Porta: 8080                          │
└─────────────────────────────────────────┘
```

### Badges

| Badge | Quando Aparece | Cor |
|-------|----------------|-----|
| **Teste** | Domínio contém `localhost` | Amarelo |
| **Gerado** | Domínio contém `sslip.io` | Azul |
| (nenhum) | Domínio customizado | - |

---

## 🔄 Geração de Domínios

### Algoritmo

```javascript
const generateRandomDomain = () => {
  // Gera string aleatória de 24 caracteres
  const randomString = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
  
  const serverIp = process.env.SERVER_IP || 'localhost';
  const baseDomain = process.env.BASE_DOMAIN || 'localhost';
  
  // Se tiver IP válido, usa sslip.io
  if (serverIp !== 'localhost' && serverIp.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return `${randomString}.${serverIp}.sslip.io`;
  }
  
  // Senão, usa formato simples
  return `${randomString}.${baseDomain}`;
};
```

### Características

- ✅ **Único**: Probabilidade de colisão praticamente zero
- ✅ **Curto**: ~24 caracteres (mais curto que UUID)
- ✅ **Seguro**: Apenas letras minúsculas e números
- ✅ **Compatível**: Funciona em todos os navegadores

---

## 🌐 Domínios Customizados

Você ainda pode usar domínios customizados!

### Ao Criar Projeto

```
Campo: Domínio (opcional)
Valor: app.meusite.com

Resultado: app.meusite.com (sem badge)
```

### Ao Editar Projeto

1. Clique em ✏️ Editar
2. Altere campo "Domínio"
3. Salve
4. Faça deploy

---

## 📊 Comparação

| Tipo | Exemplo | Configuração DNS | Uso |
|------|---------|------------------|-----|
| **Aleatório Local** | `abc123.localhost` | Não | Desenvolvimento |
| **Aleatório sslip.io** | `xyz789.38.242.213.195.sslip.io` | Não | Staging/Produção |
| **Customizado** | `app.meusite.com` | Sim | Produção |

---

## 🔧 Configuração de Produção

### Passo 1: Obter IP do Servidor

```bash
# Linux/Mac
curl ifconfig.me

# Windows
curl ifconfig.me

# Ou
ip addr show
```

### Passo 2: Configurar .env

```env
SERVER_IP=SEU_IP_AQUI
BASE_DOMAIN=sslip.io
```

### Passo 3: Reiniciar Backend

```bash
cd deploy-manager/backend
npm run dev
```

### Passo 4: Criar Projeto

- Deixe campo "Domínio" vazio
- Sistema gera: `abc123.SEU_IP.sslip.io`
- Acesse imediatamente!

---

## 🎯 Casos de Uso

### Desenvolvimento Local

```
✅ Use: localhost
✅ Domínio: abc123.localhost
✅ Acesso: http://abc123.localhost:3000
```

### Servidor Interno (LAN)

```
✅ Use: IP local (192.168.x.x)
✅ Domínio: xyz789.192.168.1.100.sslip.io
✅ Acesso: http://xyz789.192.168.1.100.sslip.io
```

### Servidor Público

```
✅ Use: IP público
✅ Domínio: abc123.38.242.213.195.sslip.io
✅ Acesso: http://abc123.38.242.213.195.sslip.io
```

### Produção com Domínio

```
✅ Use: Domínio customizado
✅ Domínio: app.meusite.com
✅ Configure DNS: A record → IP do servidor
✅ Acesso: https://app.meusite.com
```

---

## 💡 Dicas

### ✅ Faça

- Use domínios aleatórios para desenvolvimento
- Use sslip.io para staging
- Use domínios customizados para produção
- Configure SSL para domínios customizados

### ❌ Evite

- Usar sslip.io em produção final
- Compartilhar domínios aleatórios publicamente
- Confiar em domínios aleatórios para longo prazo

---

## 🐛 Troubleshooting

### Domínio não resolve

**Problema:** `abc123.38.242.213.195.sslip.io` não abre

**Soluções:**
1. Verifique se IP está correto no .env
2. Teste: `ping abc123.38.242.213.195.sslip.io`
3. Verifique firewall do servidor
4. Teste com IP direto: `http://38.242.213.195:porta`

### Badge não aparece

**Problema:** Badge "Gerado" não aparece

**Causa:** Badge só aparece se domínio contém `sslip.io`

**Solução:** Verifique se SERVER_IP está configurado corretamente

### Domínio muito longo

**Problema:** Domínio gerado é muito longo

**Causa:** String aleatória + IP + sslip.io

**Solução:** Use domínio customizado para URLs mais curtas

---

## 🎉 Resumo

Agora você tem **domínios automáticos** como o Coolify:

✅ **Geração automática** de domínios únicos  
✅ **sslip.io** para acesso sem DNS  
✅ **Badges** para identificar tipo  
✅ **Sempre visível** no card  
✅ **Compatível** com domínios customizados  

**Igual ao Coolify! 🚀**

---

**Versão**: 1.2.0  
**Data**: 2026-02-08  
**Status**: ✅ Implementado
