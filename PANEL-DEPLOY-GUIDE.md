# Guia de Deploy do Painel

Este guia explica como usar o novo sistema de versionamento e deploy do painel administrativo.

## 📋 Visão Geral

O sistema de deploy do painel funciona de forma similar ao sistema de deploy de projetos dos usuários:

- **Versionamento**: Cada versão do painel é armazenada como uma tag Git
- **Deploy**: Você pode escolher qual versão fazer deploy via interface do admin
- **Rollback**: Se algo der errado, você pode reverter para a versão anterior

## 🚀 Como Usar

### 1. Acessar o Gerenciador de Deploy

1. Faça login como administrador
2. Vá para **Admin Dashboard**
3. Clique em **Deploy do Painel** (botão vermelho no topo)

### 2. Criar uma Nova Versão

#### Opção A: Via Interface (Recomendado)

1. Na página de Deploy do Painel, clique em **Nova Versão**
2. Digite o número da versão (ex: `v1.0.0`)
3. (Opcional) Adicione uma mensagem descrevendo as mudanças
4. Clique em **Criar**

#### Opção B: Via Script

```bash
cd /opt/ark-deploy
./create-panel-version.sh v1.0.0 "Descrição das mudanças"
```

#### Opção C: Via Git Direto

```bash
cd /opt/ark-deploy
git tag -a v1.0.0 -m "Descrição das mudanças"
git push origin v1.0.0
```

### 3. Fazer Deploy de uma Versão

1. Na página de Deploy do Painel, localize a versão desejada
2. Clique no botão **Deploy**
3. Confirme a ação
4. Acompanhe o progresso nos logs em tempo real
5. Aguarde até que o deploy seja concluído

**O que acontece durante o deploy:**
- Containers atuais são parados
- Código da versão é baixado
- Cache do frontend é limpo
- Frontend e backend são reconstruídos
- Containers são iniciados
- Sistema aguarda containers ficarem saudáveis

### 4. Fazer Rollback

Se algo der errado após um deploy:

1. Na página de Deploy do Painel, localize a versão atual (marcada como "ATUAL")
2. Clique no botão **Rollback**
3. Confirme a ação
4. O sistema revertará para a versão anterior

**Nota**: Você precisa ter pelo menos 2 versões para fazer rollback.

## 📊 Entendendo o Status das Versões

- **Pronto** (verde): Versão está pronta para deploy
- **Construindo** (amarelo): Versão está sendo construída
- **Falhou** (vermelho): Versão falhou na construção
- **ATUAL** (azul): Esta é a versão atualmente em produção

## 🔍 Monitorando Logs

Durante um deploy, você pode acompanhar os logs em tempo real:

- Logs aparecem automaticamente na interface
- Cada linha mostra o timestamp e a mensagem
- Você pode fechar os logs a qualquer momento (o deploy continua em background)

## ⚠️ Boas Práticas

### Antes de Fazer Deploy

1. **Teste localmente**: Certifique-se de que as mudanças funcionam em desenvolvimento
2. **Crie uma versão**: Use versionamento semântico (v1.0.0, v1.0.1, v1.1.0, etc)
3. **Documente**: Adicione uma mensagem descrevendo as mudanças
4. **Faça backup**: Considere fazer backup do banco de dados antes

### Durante o Deploy

1. **Não interrompa**: Deixe o deploy completar
2. **Monitore**: Acompanhe os logs para detectar problemas
3. **Tenha paciência**: O build pode levar alguns minutos

### Se Algo Der Errado

1. **Verifique os logs**: Procure por mensagens de erro
2. **Faça rollback**: Use o botão Rollback para reverter
3. **Investigue**: Verifique o que causou o problema
4. **Corrija**: Faça as correções necessárias
5. **Crie nova versão**: Crie uma nova versão com as correções

## 🔧 Estrutura de Versões

As versões são armazenadas como tags Git no repositório:

```
v1.0.0  - Versão inicial
v1.0.1  - Patch (correção de bug)
v1.1.0  - Minor (nova feature)
v2.0.0  - Major (mudança significativa)
```

## 📝 Exemplo de Fluxo Completo

```bash
# 1. Fazer mudanças no código
# ... editar arquivos ...

# 2. Fazer commit
git add .
git commit -m "Adiciona nova feature"

# 3. Criar versão
./create-panel-version.sh v1.1.0 "Adiciona nova feature"

# 4. Acessar o painel admin
# - Ir para Admin > Deploy do Painel
# - Selecionar v1.1.0
# - Clicar em Deploy
# - Acompanhar os logs

# 5. Se algo der errado
# - Clicar em Rollback
# - Sistema volta para v1.0.0
```

## 🐛 Troubleshooting

### Deploy falha com erro de build

1. Verifique os logs para ver a mensagem de erro exata
2. Faça rollback para a versão anterior
3. Corrija o problema no código
4. Crie uma nova versão

### Containers não iniciam

1. Verifique se há espaço em disco: `df -h`
2. Verifique se as portas estão disponíveis: `netstat -tlnp`
3. Verifique os logs do Docker: `docker-compose logs`
4. Faça rollback se necessário

### Versão não aparece na lista

1. Certifique-se de que a tag foi criada: `git tag -l`
2. Certifique-se de que a tag foi feita push: `git push origin --tags`
3. Recarregue a página do navegador

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs em tempo real na interface
2. Consulte este guia
3. Verifique o arquivo `TROUBLESHOOTING.md`
4. Entre em contato com o suporte

## 🔐 Segurança

- Apenas administradores podem acessar o gerenciador de deploy
- Todos os deploys são registrados com o usuário que os executou
- Logs são mantidos para auditoria
- Rollback automático ocorre se o deploy falhar

## 📚 Referências

- [Guia de Produção](./PRODUCTION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Docker Compose](./docker-compose.yml)
