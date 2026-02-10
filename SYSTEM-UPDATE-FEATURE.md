# 🔄 Sistema de Atualização Automática

## Visão Geral

O Ark Deploy agora possui um sistema completo de atualização automática que permite atualizar o painel diretamente do GitHub, similar ao sistema de deploy de projetos.

## ✨ Funcionalidades Implementadas

### 1. Domínio Automático com sslip.io

O painel agora é acessível através de um domínio automático:
- **Acesso direto:** `http://SEU_IP:8000`
- **Via Traefik:** `http://ark-deploy.SEU_IP.sslip.io`

Configurado no `docker-compose.yml` com labels do Traefik:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.ark-deploy.rule=Host(`ark-deploy.${SERVER_IP}.sslip.io`)"
  - "traefik.http.routers.ark-deploy.entrypoints=web"
  - "traefik.http.services.ark-deploy.loadbalancer.server.port=3000"
```

### 2. Informações do Sistema

Nova rota: `GET /admin/system-info`

Retorna:
- **version:** Versão do package.json
- **gitCommit:** Hash do commit atual
- **gitBranch:** Branch Git atual
- **lastUpdate:** Data da última atualização
- **nodeVersion:** Versão do Node.js
- **platform:** Sistema operacional
- **uptime:** Tempo de execução

### 3. Sistema de Atualização

Nova rota: `POST /admin/update`

Processo de atualização:
1. ✅ Backup do arquivo `.env`
2. ✅ Git pull do repositório
3. ✅ Instalação de dependências (backend e frontend)
4. ✅ Rebuild dos containers Docker
5. ✅ Reinicialização automática

### 4. Interface de Administração

Página: `/admin/settings`

**Seção "Versão do Sistema":**
- Exibe versão atual
- Mostra branch Git
- Exibe commit atual
- Data da última atualização
- Uptime do sistema
- Botão "Atualizar Sistema"

**Seção "Status do Sistema":**
- Status do Backend
- Status do MongoDB
- Status do Traefik
- Versão do Node.js

## 📋 Como Usar

### Atualizar o Sistema

1. Acesse o painel: `http://SEU_IP:8000`
2. Faça login como admin
3. Vá para **Admin > Configurações**
4. Na seção "Versão do Sistema", clique em **"Atualizar Sistema"**
5. Confirme a atualização
6. Aguarde o processo (2-5 minutos)
7. O sistema reiniciará automaticamente

### Configurar Domínio Personalizado

1. Acesse **Admin > Configurações**
2. Na seção "Configurações de Domínio":
   - **IP do Servidor:** Seu IP público
   - **Domínio Base:** `sslip.io` ou seu domínio
   - **URL do Frontend:** URL completa do painel
3. Clique em **"Salvar Configurações"**
4. Clique em **"Reiniciar Servidor"**

## 🔧 Arquivos Modificados

### Backend
- `backend/src/routes/admin.ts` - Rotas de system-info e update
- `backend/src/models/SystemSettings.ts` - Modelo de configurações

### Frontend
- `frontend/src/app/admin/settings/page.tsx` - Interface de configurações

### Infraestrutura
- `docker-compose.yml` - Labels do Traefik para domínio automático
- `install.sh` - Informações sobre domínio e atualização
- `README.md` - Documentação atualizada

## 🚀 Instalação

O sistema de atualização é instalado automaticamente com o script de instalação:

```bash
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git
cd deploy-manager
chmod +x install.sh
sudo ./install.sh
```

Após a instalação, o painel estará acessível em:
- `http://SEU_IP:8000`
- `http://deploy-manager.SEU_IP.sslip.io`

## 🔐 Segurança

- ✅ Apenas admins podem atualizar o sistema
- ✅ Backup automático do `.env` antes da atualização
- ✅ Processo de atualização registrado nos logs
- ✅ Rollback manual possível via Git

## 📊 Monitoramento

Logs da atualização podem ser visualizados:

```bash
# Ver logs do backend
docker-compose logs -f backend

# Ver logs de todos os serviços
docker-compose logs -f
```

## 🐛 Troubleshooting

### Atualização falhou

```bash
# Restaurar backup do .env
cp .env.backup .env

# Voltar para versão anterior
git reset --hard HEAD~1

# Reiniciar containers
docker-compose restart
```

### Containers não iniciam

```bash
# Ver logs
docker-compose logs

# Reconstruir do zero
docker-compose down
docker-compose up -d --build
```

### Domínio não funciona

1. Verifique se a rede `coolify` existe:
   ```bash
   docker network ls | grep coolify
   ```

2. Verifique se o Traefik está rodando:
   ```bash
   docker ps | grep traefik
   ```

3. Verifique os labels do container:
   ```bash
   docker inspect deploy-manager-frontend | grep traefik
   ```

## 📝 Notas

- O sistema de atualização requer acesso ao GitHub
- A atualização pode levar 2-5 minutos
- Durante a atualização, o painel ficará indisponível
- Certifique-se de ter backup antes de atualizar
- O `.env` é preservado durante atualizações

## 🎯 Próximos Passos

- [ ] Notificações de novas versões disponíveis
- [ ] Changelog automático
- [ ] Rollback com um clique
- [ ] Agendamento de atualizações
- [ ] Backup automático antes de atualizar
