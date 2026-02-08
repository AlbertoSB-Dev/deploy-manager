# 🌐 Domínios Automáticos

## Como Funciona

Quando você cria um projeto **sem especificar um domínio customizado**, o sistema gera automaticamente um domínio de teste, igual ao Coolify!

### Formato do Domínio Automático

```
{nome-do-projeto}.{BASE_DOMAIN}
```

**Exemplos:**
- Projeto: `meu-app` → Domínio: `meu-app.localhost`
- Projeto: `api-backend` → Domínio: `api-backend.localhost`
- Projeto: `gestao-nautica` → Domínio: `gestao-nautica.localhost`

## Configuração

### Variável de Ambiente

No arquivo `backend/.env`:

```env
BASE_DOMAIN=localhost
```

**Opções:**
- `localhost` - Para desenvolvimento local
- `deploy.local` - Domínio local customizado
- `seuservidor.com` - Para produção

### Exemplos de Configuração

#### Desenvolvimento Local:
```env
BASE_DOMAIN=localhost
```
Resultado: `meu-app.localhost`

#### Servidor de Staging:
```env
BASE_DOMAIN=staging.empresa.com
```
Resultado: `meu-app.staging.empresa.com`

#### Produção:
```env
BASE_DOMAIN=apps.empresa.com
```
Resultado: `meu-app.apps.empresa.com`

## Interface do Usuário

### Ao Criar Projeto

O campo "Domínio" mostra:
- **Placeholder dinâmico**: `{nome-do-projeto}.localhost`
- **Helper text**: "Será gerado automaticamente: projeto-nome.localhost"
- **Atualização em tempo real**: Conforme você digita o nome do projeto

### No Card do Projeto

O domínio é exibido com:
- **Ícone de globo** 🌐
- **Link clicável** para abrir em nova aba
- **Badge "Teste"** se for domínio `.localhost`
- **Porta incluída** se configurada: `meu-app.localhost:3000`

## Domínios Customizados vs Automáticos

### Domínio Automático (Teste)
```
✅ Gerado automaticamente
✅ Sem configuração DNS necessária
✅ Badge "Teste" visível
✅ Ideal para desenvolvimento
❌ Não acessível externamente
```

### Domínio Customizado
```
✅ Você escolhe o domínio
✅ Acessível externamente
✅ Sem badge "Teste"
✅ Ideal para produção
⚠️ Requer configuração DNS
```

## Exemplos de Uso

### Exemplo 1: Desenvolvimento Local

```typescript
// Criar projeto sem domínio
{
  name: "meu-app",
  displayName: "Meu App",
  gitUrl: "https://github.com/user/repo.git",
  // domain não especificado
}

// Resultado:
// domain: "meu-app.localhost"
// URL: http://meu-app.localhost:3000
```

### Exemplo 2: Domínio Customizado

```typescript
// Criar projeto com domínio
{
  name: "meu-app",
  displayName: "Meu App",
  gitUrl: "https://github.com/user/repo.git",
  domain: "app.meusite.com"
}

// Resultado:
// domain: "app.meusite.com"
// URL: http://app.meusite.com
```

## Configuração DNS (Produção)

Para usar domínios automáticos em produção, configure um wildcard DNS:

### Registro DNS Wildcard

```
*.apps.empresa.com  →  IP_DO_SERVIDOR
```

Isso permite que todos os subdomínios funcionem automaticamente:
- `projeto1.apps.empresa.com`
- `projeto2.apps.empresa.com`
- `api.apps.empresa.com`

### Nginx Wildcard

```nginx
server {
    listen 80;
    server_name *.apps.empresa.com;

    location / {
        # Extrair nome do projeto do subdomínio
        set $project "";
        if ($host ~* "^(.+)\.apps\.empresa\.com$") {
            set $project $1;
        }

        # Proxy para container do projeto
        proxy_pass http://localhost:$project_port;
        proxy_set_header Host $host;
    }
}
```

## Acesso Local

### Configurar /etc/hosts (Linux/Mac)

```bash
sudo nano /etc/hosts
```

Adicionar:
```
127.0.0.1  meu-app.localhost
127.0.0.1  api-backend.localhost
```

### Configurar hosts (Windows)

```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

Adicionar:
```
127.0.0.1  meu-app.localhost
127.0.0.1  api-backend.localhost
```

## Troubleshooting

### Domínio não resolve

**Problema:** `meu-app.localhost` não abre

**Soluções:**
1. Adicionar ao arquivo hosts
2. Usar `localhost:porta` diretamente
3. Configurar DNS local (dnsmasq)

### Porta não funciona

**Problema:** `meu-app.localhost:3000` não conecta

**Soluções:**
1. Verificar se container está rodando: `docker ps`
2. Verificar porta no projeto
3. Verificar firewall

### Badge "Teste" não aparece

**Problema:** Domínio customizado mostra badge

**Causa:** Badge aparece apenas para domínios com `.localhost`

## Boas Práticas

### ✅ Recomendado

- Use domínios automáticos para desenvolvimento
- Use domínios customizados para produção
- Configure wildcard DNS em produção
- Use nomes de projeto descritivos

### ❌ Evite

- Domínios muito longos
- Caracteres especiais no nome do projeto
- Espaços no nome do projeto
- Nomes duplicados

## Integração com Docker

Os domínios são automaticamente configurados nos containers:

```yaml
# Docker labels automáticos
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.${PROJECT_NAME}.rule=Host(`${DOMAIN}`)"
  - "traefik.http.services.${PROJECT_NAME}.loadbalancer.server.port=${PORT}"
```

## Próximas Funcionalidades

- [ ] SSL automático para domínios customizados
- [ ] Múltiplos domínios por projeto
- [ ] Aliases de domínio
- [ ] Redirecionamentos automáticos
- [ ] Health checks por domínio

---

**Status**: ✅ Implementado
**Data**: 2026-02-08
**Versão**: 1.1.0
