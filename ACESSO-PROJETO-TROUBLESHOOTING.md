# 🔧 Troubleshooting - Acesso ao Projeto

## ❌ Problema: "Não consigo chegar a esta página"

### 🔍 Diagnóstico

Você vê o domínio:
```
l91i4uymb7mxgni903ape.186.208.237.101.sslip.io
```

Mas ao clicar, aparece:
```
ERR_CONNECTION_TIMED_OUT
Não consigo chegar a esta página
```

---

## 🎯 Causa do Problema

### Situação Atual:

1. ✅ Container está rodando: `deploy-manager-guru-ti`
2. ✅ Porta exposta: `3000`
3. ✅ Domínio gerado: `abc.186.208.237.101.sslip.io`
4. ❌ **Problema**: Container está na sua máquina local, mas domínio aponta para IP público

### Por que não funciona:

```
Seu Navegador
    ↓
Tenta acessar: abc.186.208.237.101.sslip.io
    ↓
DNS resolve para: 186.208.237.101
    ↓
Tenta conectar no IP público
    ↓
❌ Mas o container está rodando LOCALMENTE
    (não está acessível pelo IP público)
```

---

## ✅ Soluções

### Solução 1: Acessar via Localhost (Desenvolvimento)

**Use esta URL:**
```
http://localhost:3000
```

Ou com a porta do seu projeto:
```
http://localhost:PORTA_DO_PROJETO
```

**Vantagens:**
- ✅ Funciona imediatamente
- ✅ Sem configuração adicional
- ✅ Ideal para desenvolvimento

**Desvantagens:**
- ❌ Só funciona na sua máquina
- ❌ Não compartilhável

---

### Solução 2: Configurar para Localhost (Recomendado para Dev)

**1. Edite `backend/.env`:**
```env
SERVER_IP=localhost
BASE_DOMAIN=localhost
```

**2. Reinicie o backend:**
```bash
cd backend
npm run dev
```

**3. Crie novos projetos:**
- Domínio gerado: `abc123.localhost`
- Acesso: `http://abc123.localhost:3000`

**Vantagens:**
- ✅ Domínios funcionam localmente
- ✅ Sem confusão com IP público

**Desvantagens:**
- ❌ Não acessível pela internet

---

### Solução 3: Expor Container Publicamente (Produção)

Para que o domínio `abc.186.208.237.101.sslip.io` funcione, você precisa:

#### Opção A: Nginx Reverse Proxy

**1. Instalar Nginx:**
```bash
# Windows (via Chocolatey)
choco install nginx

# Linux
sudo apt install nginx
```

**2. Configurar Nginx:**

Crie arquivo: `/etc/nginx/sites-available/deploy-manager`

```nginx
server {
    listen 80;
    server_name *.186.208.237.101.sslip.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3. Ativar e reiniciar:**
```bash
sudo ln -s /etc/nginx/sites-available/deploy-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**4. Abrir porta 80 no firewall:**
```bash
# Windows
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80

# Linux
sudo ufw allow 80
```

#### Opção B: Traefik (Mais Avançado)

Traefik detecta containers automaticamente e configura rotas.

---

### Solução 4: Usar IP Local (LAN)

Se você quer compartilhar com pessoas na mesma rede:

**1. Descubra seu IP local:**
```powershell
ipconfig
# Procure por "IPv4 Address": 192.168.1.100
```

**2. Configure .env:**
```env
SERVER_IP=192.168.1.100
BASE_DOMAIN=sslip.io
```

**3. Acesso:**
```
http://abc123.192.168.1.100.sslip.io:3000
```

**Funciona para:**
- ✅ Você
- ✅ Qualquer pessoa na mesma rede WiFi
- ❌ Pessoas fora da sua rede

---

## 🎯 Recomendação por Cenário

### Desenvolvimento Solo (Você sozinho)
```env
SERVER_IP=localhost
BASE_DOMAIN=localhost
```
**Acesso:** `http://abc.localhost:3000`

### Desenvolvimento em Equipe (Mesma rede)
```env
SERVER_IP=192.168.1.100  # Seu IP local
BASE_DOMAIN=sslip.io
```
**Acesso:** `http://abc.192.168.1.100.sslip.io:3000`

### Produção (Internet)
```env
SERVER_IP=186.208.237.101  # IP público
BASE_DOMAIN=sslip.io
```
**Requer:** Nginx/Traefik + Firewall configurado  
**Acesso:** `http://abc.186.208.237.101.sslip.io`

---

## 🔍 Como Verificar

### 1. Container está rodando?
```bash
docker ps
```
Deve mostrar: `deploy-manager-guru-ti`

### 2. Porta está exposta?
```bash
docker ps
```
Deve mostrar: `0.0.0.0:3000->3000/tcp`

### 3. Aplicação responde localmente?
```bash
curl http://localhost:3000
```
Deve retornar HTML ou JSON

### 4. Firewall está bloqueando?
```powershell
# Windows - Testar porta
Test-NetConnection -ComputerName localhost -Port 3000
```

---

## 🚀 Solução Rápida (Agora)

Para acessar seu projeto **AGORA**:

1. **Veja a porta do container:**
   ```bash
   docker ps
   ```
   Procure por: `0.0.0.0:XXXX->3000/tcp`

2. **Acesse via localhost:**
   ```
   http://localhost:PORTA
   ```

3. **Exemplo:**
   Se a porta é 3000:
   ```
   http://localhost:3000
   ```

---

## 📝 Ajustar Sistema para Localhost

Vou criar um script para você:

```powershell
# configure-localhost.ps1
$envPath = "backend\.env"
$envContent = Get-Content $envPath
$envContent = $envContent -replace "SERVER_IP=.*", "SERVER_IP=localhost"
$envContent = $envContent -replace "BASE_DOMAIN=.*", "BASE_DOMAIN=localhost"
$envContent | Set-Content $envPath
Write-Host "✅ Configurado para localhost!"
Write-Host "Reinicie o backend: cd backend && npm run dev"
```

Execute:
```powershell
.\configure-localhost.ps1
```

---

## 🎉 Resumo

**Problema:** Domínio aponta para IP público, mas container está local

**Solução Imediata:** Use `http://localhost:PORTA`

**Solução Permanente:** Configure `.env` para `localhost` em desenvolvimento

**Para Produção:** Configure Nginx/Traefik para expor containers publicamente

---

**Versão**: 1.2.0  
**Data**: 2026-02-08
