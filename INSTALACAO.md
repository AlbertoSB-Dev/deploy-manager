# 🚀 Guia de Instalação - Ark Deploy

## Pré-requisitos
- Servidor Ubuntu/Debian (VPS)
- Acesso root via SSH
- Mínimo 2GB RAM

---

## 📦 Instalação Completa (1 Comando)

### Passo 1: Clone o Repositório

```bash
# Opção A: HTTPS (repositório público)
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git

# Opção B: SSH (se configurou chave SSH)
git clone git@github.com:AlbertoSB-Dev/deploy-manager.git

# Entre na pasta
cd deploy-manager
```

### Passo 2: Execute o Instalador

```bash
# Dê permissão de execução
chmod +x install.sh

# Execute o instalador (instala TUDO automaticamente)
sudo ./install.sh
```

**O que o instalador faz:**
- ✅ Instala Docker e Docker Compose
- ✅ Cria redes Docker necessárias
- ✅ Configura firewall (portas 80, 443, 8000, 3000, 5000)
- ✅ Gera secrets automáticos
- ✅ Cria arquivo .env com configurações
- ✅ Inicia containers (MongoDB, Backend, Frontend)
- ✅ Cria usuário admin automaticamente

### Passo 3: Aguarde a Instalação

A instalação leva cerca de 5-10 minutos. Você verá mensagens como:

```
🚀 Instalando Ark Deploy...
📦 Instalando Docker...
🔧 Configurando firewall...
🐳 Iniciando containers...
✅ Instalação concluída!
```

### Passo 4: Acesse o Painel

Após a instalação, acesse:

```
http://SEU_IP_DO_SERVIDOR:8000
```

**Credenciais padrão:**
- Email: `admin@admin.com`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Troque a senha após o primeiro login!

---

## 🔧 Comandos Úteis

### Ver logs dos containers
```bash
cd deploy-manager
docker-compose logs -f
```

### Reiniciar o painel
```bash
cd deploy-manager
docker-compose restart
```

### Parar o painel
```bash
cd deploy-manager
docker-compose down
```

### Iniciar o painel
```bash
cd deploy-manager
docker-compose up -d
```

### Ver status dos containers
```bash
cd deploy-manager
docker-compose ps
```

---

## 🌐 Configurar Domínio (Opcional)

### Opção 1: Usar sslip.io (Automático)

O painel já vem configurado com domínio automático:
```
http://ark-deploy.SEU_IP.sslip.io
```

Exemplo: `http://ark-deploy.186.208.237.101.sslip.io`

### Opção 2: Usar seu próprio domínio

1. Aponte seu domínio para o IP do servidor (DNS A record)
2. Acesse: `http://SEU_IP:8000/admin/settings`
3. Configure:
   - **Domínio Base**: `seu-dominio.com`
   - **Frontend URL**: `http://seu-dominio.com`
4. Salve e reinicie o servidor

---

## 🔐 Configurar GitHub OAuth (Opcional)

Para fazer deploy de repositórios privados:

1. Acesse: https://github.com/settings/developers
2. Clique em "New OAuth App"
3. Preencha:
   - **Application name**: Ark Deploy
   - **Homepage URL**: `http://SEU_IP:8000`
   - **Callback URL**: `http://SEU_IP:8000/auth/github/callback`
4. Copie o **Client ID** e **Client Secret**
5. No painel, vá em: `/admin/settings`
6. Cole as credenciais do GitHub OAuth
7. Salve

---

## 🐛 Solução de Problemas

### Container não inicia
```bash
# Ver logs de erro
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

### Porta já em uso
```bash
# Verificar o que está usando a porta
sudo lsof -i :8000
sudo lsof -i :3000
sudo lsof -i :5000

# Matar processo
sudo kill -9 PID
```

### Resetar tudo e reinstalar
```bash
cd deploy-manager
docker-compose down -v
sudo ./install.sh
```

### Criar novo usuário admin
```bash
cd deploy-manager/backend
docker-compose exec backend node scripts/make-admin-auto.js
```

---

## 📊 Estrutura de Portas

- **8000**: Frontend (Next.js)
- **5000**: Backend (Node.js/Express)
- **27017**: MongoDB (interno)
- **80/443**: Traefik (proxy reverso para projetos)

---

## 🔄 Atualizar o Painel

### Opção 1: Pelo Painel (Recomendado)
1. Acesse: `/admin/settings`
2. Clique em "Atualizar Sistema"
3. Aguarde reinicialização

### Opção 2: Manual
```bash
cd deploy-manager
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📝 Próximos Passos

Após instalar:

1. ✅ Acesse o painel: `http://SEU_IP:8000`
2. ✅ Faça login com `admin@admin.com` / `admin123`
3. ✅ Troque a senha em `/admin/settings`
4. ✅ Configure GitHub OAuth (opcional)
5. ✅ Adicione seu primeiro servidor remoto
6. ✅ Faça seu primeiro deploy!

---

## 💡 Dicas

- Use **sslip.io** para domínios automáticos sem configurar DNS
- Configure **GitHub OAuth** para repos privados
- Acesse `/admin/settings` para configurações avançadas
- Use `/admin/users` para gerenciar usuários
- Monitore recursos em tempo real no dashboard

---

## 🆘 Suporte

Se tiver problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Verifique se todas as portas estão abertas no firewall
3. Certifique-se que o Docker está rodando: `docker ps`
4. Reinicie os containers: `docker-compose restart`

---

## 🎉 Pronto!

Seu painel Ark Deploy está instalado e funcionando!

Acesse: **http://SEU_IP:8000**

Login: **admin@admin.com** / **admin123**
