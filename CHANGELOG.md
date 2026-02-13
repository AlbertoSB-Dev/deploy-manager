# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.5.0] - 2026-02-13

### 🎉 Adicionado
- **Sistema de Detecção Automática de Atualizações**
  - Verificação via GitHub API para ambientes Docker
  - Banner visual quando há atualizações disponíveis
  - Detalhes completos: commits, mensagens, datas
  - Verificação automática a cada 5 minutos
  - Botão manual "Verificar Atualizações"
  - Fallback inteligente se API falhar

- **Commit Hash no Build**
  - Dockerfile captura commit hash durante build
  - Salvo no package.json para comparação
  - Permite detecção precisa de versão

- **Documentação Completa**
  - ATUALIZACAO-SISTEMA.md - Guia do sistema de updates
  - COMANDOS-ATUALIZACAO.txt - Comandos rápidos
  - CONFIGURACAO-VPS.md - Guia de configuração
  - CORRECOES-APLICADAS.md - Histórico de correções

### 🐛 Corrigido
- **Erro ENOENT ao salvar configurações**
  - Removidos imports desnecessários de fs/path
  - Sistema agora busca configurações apenas do MongoDB
  - Não tenta mais acessar arquivo .env no container

- **Frontend usando localhost:8001**
  - Documentado configuração de NEXT_PUBLIC_API_URL
  - Script automatizado configure-vps.sh
  - Guia passo a passo para configuração manual

- **CORS para subdomínios .sslip.io**
  - Backend aceita qualquer subdomínio .sslip.io
  - Socket.IO configurado corretamente
  - Permite IPs com portas 8000 ou 3000

### 📝 Melhorado
- Interface do Deploy do Painel mais informativa
- Mensagens de erro mais claras
- Logs mais detalhados para debug
- Documentação expandida e organizada

---

## [1.4.0] - 2026-02-12

### 🎉 Adicionado
- Sistema de assinaturas com Assas
- Planos de pagamento configuráveis
- Trial de 15 dias automático
- Webhook para sincronização de pagamentos
- Renovação automática de assinaturas
- Emails de notificação (configurável)

### 📝 Melhorado
- Página de perfil com CPF/CNPJ
- Termos de Uso e Política de Privacidade
- Seletor de ambiente Assas (Sandbox/Produção)

---

## [1.3.0] - 2026-02-11

### 🎉 Adicionado
- Campo CPF/CNPJ no cadastro
- Formatação automática de CPF/CNPJ
- Validação de CPF/CNPJ
- Scripts para adicionar CPF a usuários existentes

### 🐛 Corrigido
- Erro de módulo nodemailer não encontrado
- Build de produção com erros TypeScript
- Rate limit de login muito restritivo

---

## [1.2.0] - 2026-02-10

### 🎉 Adicionado
- Deploy do Painel via interface
- Gerenciamento de versões
- Rollback de versões
- Logs em tempo real via Socket.IO

### 📝 Melhorado
- Interface do painel admin
- Sistema de logs
- Documentação de instalação

---

## [1.1.0] - 2026-02-09

### 🎉 Adicionado
- Instalação em 1 comando
- Modo produção automático
- Configuração de domínios sslip.io
- Scripts de atualização

### 🐛 Corrigido
- Problemas com MongoDB em produção
- Configuração de variáveis de ambiente
- Build do frontend em produção

---

## [1.0.0] - 2026-02-08

### 🎉 Lançamento Inicial
- Gerenciamento de servidores VPS via SSH
- Deploy de projetos Git
- Logs em tempo real
- Terminal SSH integrado
- Gerenciamento de variáveis de ambiente
- Proxy reverso automático
- Interface moderna com dark mode
- GitHub OAuth
- Sistema de usuários e permissões

---

## Formato

Este changelog segue o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

### Tipos de Mudanças
- **Adicionado** - para novas funcionalidades
- **Modificado** - para mudanças em funcionalidades existentes
- **Descontinuado** - para funcionalidades que serão removidas
- **Removido** - para funcionalidades removidas
- **Corrigido** - para correções de bugs
- **Segurança** - para vulnerabilidades corrigidas
