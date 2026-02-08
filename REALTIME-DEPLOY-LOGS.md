# 🚀 Deploy em Tempo Real + Domínios Customizados

## ✨ Novas Funcionalidades Implementadas

### 1. **Logs de Deploy em Tempo Real** 📡

Agora quando você faz um deploy, os logs aparecem em tempo real via WebSocket!

#### Como Funciona:
1. Clique em "Deploy" no card do projeto
2. Um modal abre automaticamente mostrando os logs
3. Veja cada etapa do deploy acontecendo em tempo real:
   - 📡 Buscando atualizações do repositório
   - 🔄 Atualizando branch
   - 📝 Configurando variáveis de ambiente
   - 📄 Gerando/usando Dockerfile
   - 🔨 Construindo imagem Docker
   - 🛑 Parando container anterior
   - 🚀 Iniciando novo container
   - ✅ Deploy concluído!

#### Tecnologia:
- **Socket.IO** para comunicação em tempo real
- **WebSocket** para baixa latência
- **Event Emitters** no backend para capturar logs

### 2. **Domínios Customizados** 🌐

Configure domínios personalizados para seus projetos, igual ao Coolify!

#### Como Usar:
1. Ao criar um projeto, preencha o campo "Domínio (opcional)"
2. Exemplo: `meuapp.com.br` ou `api.meusite.com`
3. O domínio aparece no card do projeto com link clicável
4. Clique para abrir em nova aba

#### Configuração DNS:
Para o domínio funcionar, você precisa configurar no seu provedor de DNS:

**Tipo A:**
```
meuapp.com.br  →  IP_DO_SERVIDOR
```

**Ou CNAME:**
```
meuapp.com.br  →  servidor.exemplo.com
```

## 📋 Arquivos Modificados

### Backend:
- ✅ `src/models/Project.ts` - Adicionado campo `domain`
- ✅ `src/services/DeployService.ts` - Emissão de logs em tempo real
- ✅ `src/index.ts` - Socket.IO handlers para deploy logs

### Frontend:
- ✅ `src/components/DeployLogs.tsx` - **NOVO** Modal de logs em tempo real
- ✅ `src/components/ProjectCard.tsx` - Exibição de domínio e modal de logs
- ✅ `src/components/CreateProjectModal.tsx` - Campo de domínio

### Dependências:
- ✅ `socket.io-client` instalado no frontend

## 🎯 Como Testar

### 1. Logs em Tempo Real:

```bash
# 1. Certifique-se que o sistema está rodando
cd deploy-manager
npm run dev  # Backend na porta 8001
cd frontend
npm run dev  # Frontend na porta 8000

# 2. Acesse http://localhost:8000
# 3. Crie um projeto ou use um existente
# 4. Clique em "Deploy"
# 5. Veja os logs aparecendo em tempo real!
```

### 2. Domínios Customizados:

```bash
# 1. Crie um novo projeto
# 2. Preencha o campo "Domínio": exemplo.com
# 3. Após criar, veja o domínio no card
# 4. Clique no link para abrir
```

## 🔧 Configuração Avançada

### Nginx Reverse Proxy (Produção):

Para usar domínios em produção, configure um reverse proxy:

```nginx
server {
    listen 80;
    server_name meuapp.com.br;

    location / {
        proxy_pass http://localhost:3000;  # Porta do seu container
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/HTTPS com Certbot:

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot --nginx -d meuapp.com.br

# Renovação automática
sudo certbot renew --dry-run
```

## 📊 Fluxo de Deploy com Logs

```
Cliente (Frontend)
    ↓
[Clica em Deploy]
    ↓
Socket.IO Connect
    ↓
Backend recebe request
    ↓
DeployService.deployProject()
    ↓
Emite logs via Socket.IO
    ↓
Frontend recebe logs
    ↓
Atualiza modal em tempo real
    ↓
Deploy completo!
```

## 🎨 Interface

### Modal de Deploy Logs:
```
┌─────────────────────────────────────┐
│ Deploy em Andamento                 │
│ Projeto: Meu App                    │
│ ● Conectado                         │
├─────────────────────────────────────┤
│ 10:30:15 📡 Buscando atualizações  │
│ 10:30:16 🔄 Atualizando branch     │
│ 10:30:17 📝 Configurando env vars  │
│ 10:30:18 🔨 Construindo imagem     │
│ 10:30:45 🚀 Iniciando container    │
│ 10:30:46 ✅ Deploy concluído!      │
├─────────────────────────────────────┤
│ Logs atualizados em tempo real     │
└─────────────────────────────────────┘
```

### Card do Projeto com Domínio:
```
┌─────────────────────────────────────┐
│ Meu App                    [Ativo]  │
│ meu-app                             │
├─────────────────────────────────────┤
│ 🌿 main                             │
│ ⏰ v1.0.0                           │
│ 🌐 meuapp.com.br                    │
│ Último deploy: há 2 minutos         │
├─────────────────────────────────────┤
│ [Deploy] [📜] [💻] [🗑️]            │
└─────────────────────────────────────┘
```

## 🚀 Próximos Passos

- [ ] SSL automático com Let's Encrypt
- [ ] Health checks do domínio
- [ ] Múltiplos domínios por projeto
- [ ] Subdomínios automáticos
- [ ] CDN integration
- [ ] Load balancing

## 📝 Notas

- Os logs são transmitidos via WebSocket para baixa latência
- Cada deploy cria uma "sala" única no Socket.IO
- Os logs também são salvos no banco de dados
- Domínios são opcionais - projetos funcionam sem eles
- Configure DNS antes de usar domínios customizados

---

**Status**: ✅ Implementado e funcional
**Data**: 2026-02-08
**Versão**: 1.1.0
