# 🔄 Sistema de Controle de Versões e Atualizações

## Visão Geral

O Deploy Manager agora possui um sistema completo de controle de versões que permite:
- ✅ **Notificações de atualizações** - Alerta quando há nova versão no GitHub
- ✅ **Histórico de versões** - Lista todas as versões disponíveis (Git tags)
- ✅ **Rollback** - Voltar para qualquer versão anterior com um clique
- ✅ **Atualização automática** - Atualizar para a versão mais recente do GitHub

## 🎯 Funcionalidades

### 1. Verificação de Atualizações

O sistema verifica automaticamente se há atualizações disponíveis no GitHub quando você acessa a página de configurações.

**Endpoint:** `GET /admin/check-updates`

**Retorna:**
```json
{
  "hasUpdates": true,
  "localCommit": "abc1234",
  "remoteCommit": "def5678",
  "updateInfo": {
    "commitsAhead": 3,
    "latestCommit": "def5678",
    "latestCommitMessage": "feat: Nova funcionalidade",
    "latestCommitDate": "2026-02-10T10:30:00Z"
  }
}
```

**Interface:**
- Banner amarelo destacado quando há atualizações
- Mostra quantos commits estão disponíveis
- Exibe a mensagem do último commit
- Data da última atualização
- Botão "Atualizar Agora" em destaque

### 2. Histórico de Versões

Lista todas as versões disponíveis baseadas nas tags Git do repositório.

**Endpoint:** `GET /admin/versions`

**Retorna:**
```json
{
  "versions": [
    {
      "tag": "v1.2.0",
      "commit": "abc1234",
      "date": "2026-02-10T10:00:00Z",
      "message": "Release v1.2.0 - Nova funcionalidade X"
    }
  ],
  "currentCommit": "abc1234"
}
```

**Interface:**
- Painel expansível com histórico de versões
- Cada versão mostra: tag, commit, data, descrição
- Botão de rollback em cada versão
- Scroll para versões antigas

### 3. Atualização do Sistema

Atualiza o painel para a versão mais recente do GitHub.

**Endpoint:** `POST /admin/update`

**Processo:**
1. ✅ Backup do `.env`
2. ✅ Git pull do repositório
3. ✅ Instalação de dependências
4. ✅ Rebuild dos containers
5. ✅ Reinicialização automática

### 4. Rollback de Versão

Volta para uma versão específica do sistema.

**Endpoint:** `POST /admin/rollback`

**Body:**
```json
{
  "version": "v1.1.0"
}
```

**Processo:**
1. ✅ Backup do `.env`
2. ✅ Git checkout da versão
3. ✅ Instalação de dependências
4. ✅ Rebuild dos containers
5. ✅ Reinicialização automática

## 📋 Como Usar

### Verificar Atualizações

1. Acesse **Admin > Configurações**
2. O sistema verifica automaticamente
3. Se houver atualizações, um banner amarelo aparecerá no topo

### Atualizar Sistema

**Opção 1: Via Banner (quando há atualizações)**
1. Clique em **"Atualizar Agora"** no banner amarelo
2. Confirme a atualização
3. Aguarde 2-5 minutos
4. O sistema reiniciará automaticamente

**Opção 2: Via Botão (atualização manual)**
1. Na seção "Versão do Sistema"
2. Clique em **"Atualizar Sistema"**
3. Confirme a atualização
4. Aguarde 2-5 minutos
5. O sistema reiniciará automaticamente

### Ver Histórico de Versões

1. Na seção "Versão do Sistema"
2. Clique no ícone de **histórico** (relógio)
3. Painel com todas as versões aparecerá

### Fazer Rollback

1. Abra o histórico de versões
2. Encontre a versão desejada
3. Clique no ícone de **rollback** (seta circular)
4. Confirme o rollback
5. Aguarde 2-5 minutos
6. O sistema reiniciará automaticamente

## 🎨 Interface

### Banner de Atualização Disponível

```
┌─────────────────────────────────────────────────┐
│ 🎉 Nova Versão Disponível!                      │
│                                                  │
│ 3 atualizações disponíveis                      │
│                                                  │
│ Última mudança:                                  │
│ feat: Add new feature X                         │
│ 10/02/2026 10:30                                │
│                                                  │
│ [Atualizar Agora]                               │
└─────────────────────────────────────────────────┘
```

### Painel de Versão do Sistema

```
┌─────────────────────────────────────────────────┐
│ 📦 Versão do Sistema              [Histórico]   │
│                                                  │
│ Versão: v1.0.0                                  │
│ Branch: main                                     │
│ Commit: abc1234                                  │
│ Última Atualização: 09/02/2026 15:00           │
│ Uptime: 2d 5h                                   │
│                                                  │
│ [Atualizar Sistema]                             │
└─────────────────────────────────────────────────┘
```

### Histórico de Versões

```
┌─────────────────────────────────────────────────┐
│ 📜 Histórico de Versões                         │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ v1.2.0  abc1234                    [↻]     │ │
│ │ Release v1.2.0 - Nova funcionalidade       │ │
│ │ 10/02/2026 10:00                           │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ v1.1.0  def5678                    [↻]     │ │
│ │ Release v1.1.0 - Correções                 │ │
│ │ 05/02/2026 14:30                           │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 🔧 Criando Versões (Tags Git)

Para criar uma nova versão que aparecerá no histórico:

```bash
# Criar tag anotada
git tag -a v1.2.0 -m "Release v1.2.0 - Nova funcionalidade X"

# Enviar tag para o GitHub
git push origin v1.2.0

# Ou enviar todas as tags
git push --tags
```

**Convenção de Versionamento:**
- `v1.0.0` - Major release (mudanças grandes)
- `v1.1.0` - Minor release (novas funcionalidades)
- `v1.1.1` - Patch release (correções de bugs)

## 🔐 Segurança

- ✅ Apenas admins podem atualizar/fazer rollback
- ✅ Backup automático do `.env` antes de qualquer operação
- ✅ Confirmação obrigatória antes de atualizar/rollback
- ✅ Logs completos de todas as operações
- ✅ Rollback manual possível via Git

## 📊 Monitoramento

### Ver Logs da Atualização

```bash
# Logs do backend
docker-compose logs -f backend

# Logs de todos os serviços
docker-compose logs -f
```

### Verificar Status

```bash
# Ver containers rodando
docker-compose ps

# Ver versão atual
git describe --tags
```

## 🐛 Troubleshooting

### Atualização Falhou

1. **Restaurar backup do .env:**
   ```bash
   cp .env.backup .env
   ```

2. **Voltar para versão anterior:**
   ```bash
   git reset --hard HEAD~1
   ```

3. **Reiniciar containers:**
   ```bash
   docker-compose restart
   ```

### Rollback Falhou

1. **Verificar tags disponíveis:**
   ```bash
   git tag -l
   ```

2. **Fazer rollback manual:**
   ```bash
   git checkout v1.1.0
   docker-compose down
   docker-compose up -d --build
   ```

### Não Aparece Atualização

1. **Verificar conexão com GitHub:**
   ```bash
   git fetch origin
   ```

2. **Verificar branch:**
   ```bash
   git branch
   ```

3. **Forçar verificação:**
   - Recarregue a página de configurações
   - Ou faça logout/login

### Versões Não Aparecem

1. **Verificar se há tags:**
   ```bash
   git tag -l
   ```

2. **Buscar tags do remoto:**
   ```bash
   git fetch --tags
   ```

3. **Criar primeira tag:**
   ```bash
   git tag -a v1.0.0 -m "Initial release"
   git push origin v1.0.0
   ```

## 📝 Notas Importantes

- O sistema verifica atualizações automaticamente ao carregar a página
- Durante atualização/rollback, o painel fica indisponível por 2-5 minutos
- O `.env` é sempre preservado durante operações
- Certifique-se de ter backup antes de fazer rollback
- Tags Git são usadas para versões, commits para atualizações

## 🎯 Boas Práticas

1. **Sempre crie tags para releases importantes:**
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0"
   git push origin v1.2.0
   ```

2. **Teste em ambiente de desenvolvimento primeiro**

3. **Faça backup manual antes de atualizações grandes:**
   ```bash
   cp .env .env.manual-backup
   ```

4. **Documente mudanças nas mensagens de commit**

5. **Use versionamento semântico (SemVer)**

## 🚀 Fluxo de Trabalho Recomendado

### Para Desenvolvedores

1. Desenvolva nova funcionalidade
2. Commit e push para GitHub
3. Crie tag de versão
4. Push da tag

```bash
git add .
git commit -m "feat: Nova funcionalidade X"
git push origin main
git tag -a v1.2.0 -m "Release v1.2.0 - Funcionalidade X"
git push origin v1.2.0
```

### Para Administradores

1. Acesse Admin > Configurações
2. Veja banner de atualização (se houver)
3. Revise mudanças no banner
4. Clique em "Atualizar Agora"
5. Aguarde reinicialização
6. Verifique se tudo está funcionando

### Em Caso de Problemas

1. Acesse Admin > Configurações
2. Abra histórico de versões
3. Encontre última versão estável
4. Clique em rollback
5. Aguarde reinicialização
6. Reporte o problema

## 📚 Recursos Adicionais

- [Git Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
- [Semantic Versioning](https://semver.org/)
- [Docker Compose](https://docs.docker.com/compose/)
