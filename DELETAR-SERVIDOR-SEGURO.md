# Deletar Servidor com Limpeza Completa

## Visão Geral

Sistema de segurança implementado para deletar servidores com confirmação de senha e LIMPEZA COMPLETA do servidor físico. Esta funcionalidade previne que usuários mal-intencionados deletem o servidor do painel e o adicionem novamente para continuar usando os recursos sem pagar.

## Funcionalidades

### 1. Modal de Confirmação
- Exibe informações do servidor a ser deletado
- Lista todos os recursos que serão removidos:
  - 🚀 Projetos
  - 🗄️ Bancos de Dados
  - 🌐 Sites WordPress
- **AVISO CRÍTICO**: Lista TUDO que será deletado do servidor físico:
  - Todos os containers Docker (parados e rodando)
  - Todos os volumes Docker (dados persistentes)
  - Todas as imagens Docker baixadas
  - Todas as redes Docker customizadas
  - Todos os arquivos de projetos
  - Todas as configurações de proxy (Nginx/Traefik)
  - Cache de build do Docker
- Campo de senha obrigatório para confirmar

### 2. Validação de Senha
- Endpoint: `POST /api/auth/verify-password`
- Verifica a senha do usuário antes de permitir a deleção
- Retorna erro 401 se a senha estiver incorreta

### 3. Limpeza Física do Servidor (VIA SSH)

Antes de deletar do banco de dados, o sistema executa os seguintes comandos no servidor físico:

```bash
# 1. Parar TODOS os containers
docker stop $(docker ps -aq)

# 2. Remover TODOS os containers
docker rm -f $(docker ps -aq)

# 3. Remover TODOS os volumes
docker volume rm $(docker volume ls -q)

# 4. Remover TODAS as imagens
docker rmi -f $(docker images -aq)

# 5. Remover redes customizadas
docker network prune -f

# 6. Limpar cache de build
docker builder prune -af

# 7. Remover diretórios de projetos
rm -rf /root/projects/*
rm -rf /root/deployments/*
rm -rf /opt/projects/*

# 8. Remover configurações de proxy
rm -rf /etc/nginx/sites-enabled/*
rm -rf /etc/nginx/sites-available/*
rm -rf /etc/traefik/dynamic/*

# 9. Limpar logs do Docker
truncate -s 0 /var/lib/docker/containers/*/*-json.log

# 10. Limpeza completa do sistema Docker
docker system prune -af --volumes
```

### 4. Deleção em Cascata do Banco de Dados

Após limpar o servidor físico, remove do banco de dados:
- Projetos Docker
- Bancos de dados (MySQL, PostgreSQL, MongoDB)
- Sites WordPress
- Desconecta a sessão SSH
- Deleta o registro do servidor

## Proteção Contra Fraude

### Problema Resolvido
Usuários mal-intencionados poderiam:
1. Criar servidor no plano trial/básico
2. Instalar vários projetos e bancos de dados
3. Deletar o servidor do painel (mas recursos continuam no servidor físico)
4. Adicionar o mesmo servidor novamente
5. Continuar usando os recursos sem pagar

### Solução Implementada
Ao deletar o servidor do painel:
- ✅ TUDO é removido do servidor físico via SSH
- ✅ Containers, volumes, imagens são deletados
- ✅ Arquivos de projetos são removidos
- ✅ Configurações de proxy são limpas
- ✅ Servidor fica COMPLETAMENTE LIMPO
- ✅ Se o usuário adicionar novamente, terá que reinstalar tudo do zero

## Fluxo de Uso

1. Usuário clica no botão de deletar servidor
2. Modal é exibido mostrando:
   - Nome e host do servidor
   - Lista de recursos do painel que serão deletados
   - **AVISO CRÍTICO**: Lista completa do que será removido do servidor físico
   - Aviso em vermelho sobre a ação irreversível
3. Usuário digita sua senha
4. Sistema valida a senha via API
5. Se válida, executa limpeza física:
   - Conecta via SSH no servidor
   - Para todos os containers
   - Remove containers, volumes, imagens
   - Limpa diretórios e configurações
   - Executa `docker system prune -af --volumes`
6. Deleta registros do banco de dados:
   - Projetos
   - Bancos de dados
   - WordPress
   - Servidor
7. Retorna mensagem de sucesso

## Segurança

- ✅ Confirmação de senha obrigatória
- ✅ Validação no backend
- ✅ Verificação de propriedade (userId)
- ✅ Avisos visuais claros
- ✅ Ação irreversível claramente indicada
- ✅ Limpeza completa do servidor físico
- ✅ Proteção contra fraude de reutilização

## Exemplo de Resposta

```json
{
  "success": true,
  "message": "Servidor completamente limpo! 5 recurso(s) removidos do banco de dados e TODOS os containers/volumes/imagens removidos do servidor físico.",
  "deleted": {
    "projects": 2,
    "databases": 2,
    "wordpress": 1
  }
}
```

## Logs do Backend

```
🗑️ Deletando servidor VPS-Producao e TODOS os recursos físicos...
🔌 Conectando ao servidor para limpeza física...
  🛑 Parando todos os containers...
  🗑️ Removendo todos os containers...
  💾 Removendo todos os volumes...
  🖼️ Removendo todas as imagens...
  🌐 Removendo redes customizadas...
  🧹 Limpando cache de build...
  📁 Removendo diretórios de projetos...
  ⚙️ Removendo configurações de proxy...
  📝 Limpando logs...
  🧼 Executando limpeza completa do Docker...
  ✅ Servidor físico completamente limpo!
💾 Deletando registros do banco de dados...
  ✓ 2 projetos deletados do banco
  ✓ 2 bancos de dados deletados do banco
  ✓ 1 sites WordPress deletados do banco
  ✓ Servidor deletado do banco
✅ DELEÇÃO COMPLETA! Servidor totalmente limpo e removido.
```

## Tratamento de Erros

- Se houver erro na limpeza física via SSH, o sistema continua e deleta do banco de dados
- Logs de erro são registrados mas não impedem a deleção
- Isso garante que o servidor seja removido do painel mesmo se estiver offline

## Próximos Passos (Opcional)

- Adicionar opção de backup antes de deletar
- Enviar email de confirmação após deleção
- Registrar auditoria de deleções
- Adicionar cooldown para re-adicionar o mesmo servidor
