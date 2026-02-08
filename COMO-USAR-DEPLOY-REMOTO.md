# Como Usar Deploy Remoto

## ✅ Sistema Completo Implementado

Agora você pode criar projetos em servidores VPS remotos e o sistema gerencia tudo via SSH automaticamente!

## 🚀 Passo a Passo

### 1. Adicionar Servidor VPS

1. Acesse `http://localhost:8000`
2. Clique na aba **"Servidores"**
3. Clique em **"Adicionar Servidor"**
4. Preencha:
   - Nome: "Meu VPS"
   - Host: IP do seu VPS (ex: 192.168.1.100)
   - Porta: 22
   - Usuário: root
   - Senha: sua senha
5. Clique em **"Adicionar e Provisionar"**

### 2. Aguardar Provisioning

O sistema automaticamente:
- ✅ Conecta via SSH
- ✅ Detecta sistema operacional
- ✅ Instala Docker + Docker Compose
- ✅ Instala Git
- ✅ Instala Node.js
- ✅ Configura firewall
- ✅ Cria diretórios

Você verá em tempo real:
```
[████████████████░░░░] 80%
🐳 Instalando Docker...
✅ Docker instalado com sucesso!
```

**Tempo**: 5-10 minutos

### 3. Criar Projeto no Servidor Remoto

1. Volte para aba **"Projetos"**
2. Clique em **"Novo Projeto"**
3. Conecte ao GitHub
4. Selecione repositório
5. **IMPORTANTE**: No campo "Servidor de Deploy", selecione seu VPS
   - 💻 Servidor Local (padrão) = Deploy local
   - 🌐 Meu VPS (192.168.1.100) = Deploy remoto
6. Configure porta, variáveis, etc.
7. Clique em **"Criar Projeto"**

### 4. Deploy Automático no VPS

Quando você clicar em **"Deploy"**:

1. Sistema conecta via SSH no VPS
2. Clona/atualiza repositório no VPS
3. Faz build da imagem Docker no VPS
4. Inicia container no VPS
5. Monitora status via SSH

**Tudo acontece remotamente!**

## 📊 Monitoramento

O sistema monitora o projeto remoto como se fosse local:

- ✅ Status do container (ativo/inativo)
- ✅ Logs em tempo real
- ✅ Verificação de atualizações
- ✅ Rollback rápido
- ✅ Terminal SSH

## 🎯 Diferenças: Local vs Remoto

### Deploy Local (💻 Servidor Local)
- Executa Docker na máquina onde o Deploy Manager está rodando
- Acesso direto aos containers
- Mais rápido

### Deploy Remoto (🌐 VPS)
- Executa Docker via SSH no servidor remoto
- Gerencia containers remotamente
- Permite escalar para múltiplos servidores

## 🔍 Como Identificar Projeto Remoto

No card do projeto, você verá:

```
┌────────────────────────────────────┐
│ 🚀 Meu Projeto Backend             │
│ 🌐 Meu VPS                         │ ← Indicador de servidor remoto
│ main • v1.2.3                      │
│ projeto.192.168.1.100.sslip.io     │
└────────────────────────────────────┘
```

## 📝 Exemplo Completo

```bash
# 1. Adicionar VPS
Interface: Servidores > Adicionar Servidor
IP: 192.168.1.100
Usuário: root
Senha: ******

# 2. Aguardar provisioning (5-10 min)
Status: ready ✅

# 3. Criar projeto
Interface: Projetos > Novo Projeto
Repositório: https://github.com/user/meu-projeto
Servidor: 🌐 Meu VPS (192.168.1.100)

# 4. Deploy
Clique: Deploy
Sistema executa via SSH:
  - git clone no VPS
  - docker build no VPS
  - docker run no VPS

# 5. Projeto rodando no VPS! 🎉
```

## 🔧 Comandos Executados no VPS

Quando você faz deploy, o sistema executa via SSH:

```bash
# 1. Clonar/atualizar repositório
cd /opt/projects
git clone https://github.com/user/repo meu-projeto
cd meu-projeto
git checkout main
git pull

# 2. Build da imagem
docker build -t meu-projeto:abc123 .

# 3. Parar container antigo
docker stop meu-projeto-old

# 4. Iniciar novo container
docker run -d --name meu-projeto-new -p 3000:3000 meu-projeto:abc123
```

## 🎨 Interface

### Card de Projeto Local
```
┌────────────────────────────────────┐
│ 🚀 Projeto Local                   │
│ main • v1.2.3                      │
│ projeto.localhost                  │
└────────────────────────────────────┘
```

### Card de Projeto Remoto
```
┌────────────────────────────────────┐
│ 🚀 Projeto Remoto                  │
│ 🌐 VPS Digital Ocean               │ ← Novo!
│ main • v1.2.3                      │
│ projeto.192.168.1.100.sslip.io     │
└────────────────────────────────────┘
```

## 🔄 Fluxo Completo

```
Usuário → Adiciona VPS
    ↓
Sistema → Provisiona automaticamente
    ↓
Status → Ready ✅
    ↓
Usuário → Cria projeto selecionando VPS
    ↓
Usuário → Clica em Deploy
    ↓
Sistema → Conecta SSH no VPS
    ↓
Sistema → git clone no VPS
    ↓
Sistema → docker build no VPS
    ↓
Sistema → docker run no VPS
    ↓
Projeto → Rodando no VPS remoto 🎉
    ↓
Sistema → Monitora via SSH
```

## 🎯 Funcionalidades Disponíveis

### Para Projetos Remotos:
- ✅ Deploy via SSH
- ✅ Rollback rápido
- ✅ Logs em tempo real
- ✅ Verificação de atualizações
- ✅ Terminal SSH
- ✅ Parar/Iniciar container
- ✅ Deletar projeto

### Monitoramento:
- ✅ Status do container
- ✅ Última versão deployada
- ✅ Histórico de deploys
- ✅ Indicador de servidor

## 🐛 Troubleshooting

### Erro: "Servidor não encontrado"
- Verifique se o servidor está com status "ready"
- Vá em Servidores e teste a conexão

### Deploy falha no VPS
- Veja os logs detalhados
- Verifique se Docker está rodando no VPS
- Teste SSH manualmente: `ssh root@IP`

### Container não inicia
- Verifique porta disponível no VPS
- Veja logs do container via Terminal

## 💡 Dicas

1. **Múltiplos Servidores**: Adicione vários VPS e distribua projetos
2. **Organização**: Use nomes descritivos para servidores
3. **Monitoramento**: Verifique status regularmente
4. **Backup**: Mantenha código no GitHub sempre atualizado

## 🎉 Resultado

Agora você tem:

✅ Sistema completo de deploy remoto  
✅ Auto-provisioning de VPS  
✅ Monitoramento via SSH  
✅ Interface unificada (local + remoto)  
✅ Logs em tempo real  
✅ Rollback rápido  
✅ Escalabilidade horizontal  

**Gerencie todos os seus projetos de um único lugar!**
