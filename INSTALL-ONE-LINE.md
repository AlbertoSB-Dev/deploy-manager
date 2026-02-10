# 🚀 Instalação com UM COMANDO

## Instalação Rápida

Execute este comando no seu servidor Ubuntu/Debian:

```bash
curl -fsSL https://raw.githubusercontent.com/AlbertoSB-Dev/deploy-manager/main/install-simple.sh | sudo bash
```

**OU se preferir clonar primeiro:**

```bash
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git && cd deploy-manager && sudo ./install-simple.sh
```

---

## O que o instalador faz?

1. ✅ Instala Docker e Docker Compose
2. ✅ Cria redes Docker necessárias
3. ✅ Configura firewall (portas 80, 443, 8000, 3000, 8001)
4. ✅ Gera secrets de segurança automaticamente
5. ✅ Cria arquivo .env com configurações
6. ✅ Inicia containers (MongoDB, Backend, Frontend)
7. ✅ Cria usuário admin automaticamente

**Tempo de instalação:** 5-10 minutos

---

## Após a instalação

### Acesse o painel:
```
http://SEU_IP:8000
```

### Credenciais padrão:
- **Email:** admin@admin.com
- **Senha:** admin123

⚠️ **IMPORTANTE:** Troque a senha após o primeiro login!

---

## Comandos Úteis

### Ver logs em tempo real:
```bash
cd deploy-manager
docker-compose logs -f
```

### Reiniciar o painel:
```bash
cd deploy-manager
docker-compose restart
```

### Parar o painel:
```bash
cd deploy-manager
docker-compose down
```

### Ver status dos containers:
```bash
cd deploy-manager
docker-compose ps
```

### Atualizar o painel:
```bash
cd deploy-manager
./update.sh
```

---

## Requisitos

- Ubuntu 20.04+ ou Debian 10+
- Mínimo 2GB RAM
- Acesso root (sudo)
- Portas 80, 443, 8000 disponíveis

---

## Solução de Problemas

### Container não inicia:
```bash
cd deploy-manager
docker-compose logs backend
docker-compose logs frontend
```

### Resetar tudo:
```bash
cd deploy-manager
docker-compose down -v
sudo ./install-simple.sh
```

### Criar novo admin:
```bash
cd deploy-manager
docker-compose exec backend node scripts/make-admin-auto.js
```

---

## Próximos Passos

1. ✅ Acesse o painel
2. ✅ Faça login
3. ✅ Troque a senha
4. ✅ Configure GitHub OAuth (opcional)
5. ✅ Adicione seu primeiro servidor VPS
6. ✅ Faça seu primeiro deploy!

---

## Suporte

Se tiver problemas:
1. Verifique os logs: `docker-compose logs -f`
2. Verifique se as portas estão abertas: `sudo ufw status`
3. Verifique se o Docker está rodando: `docker ps`
