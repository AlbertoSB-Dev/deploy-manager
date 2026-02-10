# 🎨 Ark Deploy - Branding

## Nome do Projeto

**Ark Deploy** - Sistema de gerenciamento de deploy multi-projeto

## Identidade Visual

### Nome
- **Nome Completo:** Ark Deploy
- **Nome Curto:** Ark
- **Tagline:** "Painel centralizado para gerenciar servidores VPS via SSH"

### Conceito
O nome "Ark" (Arca) representa:
- **Proteção:** Como uma arca que protege seus projetos
- **Organização:** Centraliza tudo em um único lugar
- **Confiabilidade:** Um porto seguro para seus deploys

## URLs e Domínios

### Produção
- **Domínio Principal:** `ark-deploy.SEU_IP.sslip.io`
- **Acesso Direto:** `http://SEU_IP:8000`
- **API:** `http://SEU_IP:8001`

### Desenvolvimento
- **Frontend:** `http://localhost:8000`
- **Backend:** `http://localhost:8001`

## Containers Docker

### Nomes dos Containers
- **MongoDB:** `ark-deploy-mongodb`
- **Backend:** `ark-deploy-backend`
- **Frontend:** `ark-deploy-frontend`

### Rede Docker
- **Nome:** `ark-deploy-network`

### Database
- **Nome:** `ark-deploy`

## Package Names

### Root
```json
{
  "name": "ark-deploy",
  "version": "1.0.0"
}
```

### Backend
```json
{
  "name": "ark-deploy-backend",
  "version": "1.0.0"
}
```

### Frontend
```json
{
  "name": "ark-deploy-frontend",
  "version": "1.0.0"
}
```

## Mensagens e Textos

### Instalação
```
🚀 Ark Deploy - Instalação Completa
Ark Deploy está rodando! 🚀
```

### Interface
- Título da página: "Ark Deploy"
- Confirmações: "Deseja atualizar o Ark Deploy..."
- Notificações: "Ark Deploy atualizado com sucesso!"

## Repositório GitHub

### URL Atual
```
https://github.com/AlbertoSB-Dev/deploy-manager
```

### URL Futura (Recomendada)
```
https://github.com/AlbertoSB-Dev/ark-deploy
```

**Nota:** Para renomear o repositório no GitHub:
1. Acesse: Settings > General
2. Em "Repository name", altere para `ark-deploy`
3. Clique em "Rename"
4. Atualize o remote local:
   ```bash
   git remote set-url origin https://github.com/AlbertoSB-Dev/ark-deploy.git
   ```

## Arquivos Atualizados

### Configuração
- ✅ `package.json` - Nome do projeto
- ✅ `backend/package.json` - Nome do backend
- ✅ `frontend/package.json` - Nome do frontend
- ✅ `docker-compose.yml` - Nomes dos containers e rede

### Documentação
- ✅ `README.md` - Título e referências
- ✅ `SYSTEM-UPDATE-FEATURE.md` - Referências ao projeto
- ✅ `VERSION-CONTROL.md` - Referências ao projeto
- ✅ `install.sh` - Mensagens de instalação

### Frontend
- ✅ `frontend/src/app/admin/settings/page.tsx` - Mensagens de confirmação

## Checklist de Rebranding

- [x] Atualizar package.json (root, backend, frontend)
- [x] Atualizar docker-compose.yml
- [x] Atualizar README.md
- [x] Atualizar documentação
- [x] Atualizar install.sh
- [x] Atualizar mensagens do frontend
- [x] Commit e push das mudanças
- [ ] Renomear repositório no GitHub (opcional)
- [ ] Atualizar logo/favicon (futuro)
- [ ] Criar identidade visual completa (futuro)

## Próximos Passos

### Logo e Identidade Visual
- [ ] Criar logo do Ark Deploy
- [ ] Definir paleta de cores
- [ ] Criar favicon
- [ ] Criar imagens para documentação

### Marketing
- [ ] Criar landing page
- [ ] Preparar screenshots
- [ ] Criar vídeo demo
- [ ] Documentação de uso

### Distribuição
- [ ] Publicar no Docker Hub
- [ ] Criar releases no GitHub
- [ ] Documentar instalação
- [ ] Criar guias de uso

## Notas

- O rebranding foi feito mantendo compatibilidade total
- Todos os containers precisam ser recriados após o update
- O banco de dados será migrado automaticamente
- Nenhuma funcionalidade foi alterada, apenas o nome

## Comandos Úteis

### Recriar Containers com Novo Nome
```bash
# Parar containers antigos
docker-compose down

# Remover containers antigos (opcional)
docker rm deploy-manager-mongodb deploy-manager-backend deploy-manager-frontend

# Iniciar com novos nomes
docker-compose up -d --build
```

### Verificar Novos Nomes
```bash
# Ver containers
docker ps

# Ver rede
docker network ls | grep ark-deploy
```

### Migrar Dados (se necessário)
```bash
# Backup do banco antigo
docker exec deploy-manager-mongodb mongodump --out /backup

# Restaurar no novo banco
docker exec ark-deploy-mongodb mongorestore /backup
```

## Suporte

Para questões sobre o rebranding:
- Verifique a documentação atualizada
- Consulte o CHANGELOG.md
- Abra uma issue no GitHub
