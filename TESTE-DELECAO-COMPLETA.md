# Teste de Deleção Completa de Servidor

## Como Testar

### 1. Preparar Ambiente de Teste

```bash
# Adicionar um servidor de teste
# Instalar alguns recursos:
# - 2 projetos Docker
# - 2 bancos de dados
# - 1 WordPress
```

### 2. Verificar Estado Inicial no Servidor

Conecte via SSH no servidor e execute:

```bash
# Ver containers rodando
docker ps -a

# Ver volumes
docker volume ls

# Ver imagens
docker images

# Ver redes
docker network ls

# Ver diretórios de projetos
ls -la /root/projects/
ls -la /root/deployments/
```

### 3. Deletar Servidor pelo Painel

1. Acesse o painel
2. Vá em "Servidores"
3. Clique no botão de deletar (ícone de lixeira vermelho)
4. Observe o modal mostrando:
   - ⚠️ Aviso de limpeza completa
   - Lista de recursos do painel
   - Lista do que será removido do servidor físico
5. Digite sua senha
6. Clique em "Deletar Servidor"

### 4. Verificar Limpeza no Servidor

Conecte novamente via SSH e execute:

```bash
# Verificar containers (deve estar vazio)
docker ps -a
# Resultado esperado: nenhum container

# Verificar volumes (deve estar vazio)
docker volume ls
# Resultado esperado: nenhum volume

# Verificar imagens (deve estar vazio ou apenas imagens base)
docker images
# Resultado esperado: nenhuma imagem ou apenas imagens do sistema

# Verificar diretórios (devem estar vazios)
ls -la /root/projects/
ls -la /root/deployments/
# Resultado esperado: diretórios vazios

# Verificar configurações de proxy (devem estar vazias)
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/sites-available/
# Resultado esperado: diretórios vazios
```

### 5. Verificar Logs do Backend

No terminal do backend, você deve ver:

```
🗑️ Deletando servidor VPS-Test e TODOS os recursos físicos...
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

## Teste de Fraude (Cenário Real)

### Cenário: Usuário Mal-Intencionado

1. Usuário cria servidor no plano trial
2. Instala 5 projetos e 3 bancos de dados
3. Deleta o servidor do painel
4. Tenta adicionar o mesmo servidor novamente

### Resultado Esperado

- ✅ Servidor físico está completamente limpo
- ✅ Nenhum container está rodando
- ✅ Nenhum volume com dados existe
- ✅ Nenhuma imagem está baixada
- ✅ Usuário precisa reinstalar tudo do zero
- ✅ Fraude prevenida com sucesso!

### Resultado SEM a Limpeza (Problema Antigo)

- ❌ Containers continuam rodando
- ❌ Volumes com dados permanecem
- ❌ Imagens continuam baixadas
- ❌ Usuário adiciona servidor novamente
- ❌ Tudo continua funcionando sem pagar
- ❌ Fraude bem-sucedida

## Comandos de Verificação Rápida

```bash
# Verificar se há containers
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

# Verificar uso de disco do Docker
docker system df

# Verificar volumes
docker volume ls --format "table {{.Name}}\t{{.Driver}}"

# Verificar imagens
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Verificar espaço em disco
df -h /

# Verificar processos Docker
ps aux | grep docker
```

## Checklist de Validação

- [ ] Modal exibe aviso de limpeza completa
- [ ] Modal lista recursos do painel
- [ ] Modal lista o que será removido do servidor físico
- [ ] Senha é obrigatória
- [ ] Senha incorreta retorna erro
- [ ] Todos os containers são parados
- [ ] Todos os containers são removidos
- [ ] Todos os volumes são removidos
- [ ] Todas as imagens são removidas
- [ ] Diretórios de projetos são limpos
- [ ] Configurações de proxy são removidas
- [ ] Registros do banco de dados são deletados
- [ ] Servidor é removido do painel
- [ ] Logs do backend mostram todas as etapas
- [ ] Mensagem de sucesso é exibida

## Troubleshooting

### Erro: "Falha ao conectar via SSH"
- Verifique se o servidor está online
- Verifique as credenciais SSH
- Sistema continua e deleta do banco de dados

### Erro: "Alguns containers não foram removidos"
- Sistema executa `docker rm -f` para forçar remoção
- Verifica novamente e força remoção se necessário

### Erro: "Senha incorreta"
- Usuário precisa digitar a senha correta
- Deleção não é executada até senha ser validada

## Segurança Adicional (Futuro)

- [ ] Adicionar cooldown de 24h para re-adicionar o mesmo servidor
- [ ] Registrar IP e timestamp de deleções
- [ ] Enviar email de confirmação após deleção
- [ ] Adicionar auditoria de deleções no painel admin
- [ ] Implementar backup automático antes de deletar
- [ ] Adicionar limite de deleções por dia
