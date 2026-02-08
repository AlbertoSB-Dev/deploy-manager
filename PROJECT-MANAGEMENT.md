# 🎛️ Gerenciamento de Projetos

## Novas Funcionalidades de Controle

### 1. 🌐 Domínio Visível

O domínio do projeto agora está **destacado** no card com:
- **Ícone de globo** 🌐
- **Link clicável** em azul
- **Badge "Teste"** para domínios `.localhost`
- **Porta visível** (ex: 🔌 Porta: 3000)

```
┌─────────────────────────────────────┐
│ Meu Projeto              [Ativo]    │
│ meu-projeto                         │
├─────────────────────────────────────┤
│ 🌿 main                             │
│ ⏰ v1.0.0                           │
│ 🌐 meu-projeto.localhost [Teste]   │  ← Clicável!
│ 🔌 Porta: 3000                      │
└─────────────────────────────────────┘
```

---

### 2. ✏️ Editar Projeto

Agora você pode **editar as configurações** do projeto sem precisar deletar e recriar!

**Como usar:**
1. Clique no botão **✏️ Editar** no card do projeto
2. Modal abre com todos os campos editáveis
3. Faça as alterações necessárias
4. Clique em **"Salvar Alterações"**
5. Faça um novo deploy para aplicar

**Campos Editáveis:**
- ✅ Nome de Exibição
- ✅ Branch
- ✅ Porta
- ✅ Domínio
- ✅ Comando de Build
- ✅ Comando de Start
- ✅ Variáveis de Ambiente

**⚠️ Importante:**
- Após editar, você precisa fazer um **novo deploy** para aplicar as mudanças
- O nome técnico do projeto (slug) **não pode ser alterado**
- Alterações nas variáveis de ambiente só são aplicadas após deploy

---

### 3. ▶️ Iniciar/Parar Container

Controle o estado do container sem fazer deploy!

#### ▶️ Iniciar Container

**Quando usar:**
- Container foi parado manualmente
- Projeto está com status "Inativo"
- Quer reativar sem fazer novo deploy

**Como usar:**
1. Clique no botão **▶️ Iniciar** (verde)
2. Container é iniciado
3. Status muda para "Ativo"
4. Aplicação fica acessível novamente

#### ⏹️ Parar Container

**Quando usar:**
- Quer economizar recursos
- Projeto não está sendo usado
- Manutenção temporária

**Como usar:**
1. Clique no botão **⏹️ Parar** (vermelho)
2. Container é parado
3. Status muda para "Inativo"
4. Aplicação fica inacessível

**💡 Dica:**
- Parar o container **não deleta** nada
- Você pode iniciar novamente a qualquer momento
- Ideal para projetos em desenvolvimento

---

## 🎨 Nova Interface do Card

### Layout Atualizado

```
┌─────────────────────────────────────────┐
│ Gestão Náutica Frontend      [Ativo]    │
│ gestao-nautica-frontend                 │
├─────────────────────────────────────────┤
│ 🌿 main                                 │
│ ⏰ v1.0.0                               │
│ 🌐 gestao-nautica.localhost [Teste]    │  ← Link clicável
│ 🔌 Porta: 3000                          │  ← Porta visível
│ Último deploy: há 5 minutos             │
├─────────────────────────────────────────┤
│ [🚀 Deploy]                             │  ← Botão principal
├─────────────────────────────────────────┤
│ [⏹️ Parar] [✏️] [📜] [💻] [🗑️]         │  ← Controles
└─────────────────────────────────────────┘
```

### Botões Disponíveis

| Botão | Ícone | Função | Cor |
|-------|-------|--------|-----|
| Deploy | 🚀 | Fazer deploy | Azul |
| Iniciar | ▶️ | Iniciar container | Verde |
| Parar | ⏹️ | Parar container | Vermelho |
| Editar | ✏️ | Editar configurações | Cinza |
| Versões | 🔄 | Ver versões disponíveis | Cinza |
| Logs | 📜 | Ver logs do container | Cinza |
| Terminal | 💻 | Abrir terminal | Cinza |
| Deletar | 🗑️ | Deletar projeto | Vermelho |

---

## 📋 Fluxos de Uso

### Fluxo 1: Editar e Fazer Deploy

```
1. Clique em ✏️ Editar
   ↓
2. Altere as configurações
   ↓
3. Clique em "Salvar Alterações"
   ↓
4. Clique em 🚀 Deploy
   ↓
5. Veja logs em tempo real
   ↓
6. Alterações aplicadas!
```

### Fluxo 2: Parar e Iniciar Container

```
1. Clique em ⏹️ Parar
   ↓
2. Container é parado
   ↓
3. Status: Inativo
   ↓
4. Clique em ▶️ Iniciar
   ↓
5. Container é iniciado
   ↓
6. Status: Ativo
```

### Fluxo 3: Acessar Aplicação

```
1. Veja o domínio no card
   ↓
2. Clique no link azul
   ↓
3. Abre em nova aba
   ↓
4. Aplicação carregada!
```

---

## 🔧 API Endpoints

### Editar Projeto
```http
PUT /api/projects/:id
Content-Type: application/json

{
  "displayName": "Novo Nome",
  "branch": "develop",
  "port": 3001,
  "domain": "app.meusite.com",
  "buildCommand": "npm run build",
  "startCommand": "npm start",
  "envVars": {
    "NODE_ENV": "production",
    "API_URL": "https://api.example.com"
  }
}
```

### Iniciar Container
```http
POST /api/projects/:id/container/start
```

### Parar Container
```http
POST /api/projects/:id/container/stop
```

---

## 💡 Dicas e Boas Práticas

### Edição de Projetos

✅ **Faça:**
- Edite configurações antes de fazer deploy
- Teste alterações em ambiente de desenvolvimento
- Salve backup das variáveis de ambiente importantes

❌ **Evite:**
- Editar durante um deploy ativo
- Alterar porta para uma já em uso
- Esquecer de fazer deploy após editar

### Controle de Containers

✅ **Faça:**
- Pare containers não utilizados para economizar recursos
- Use start/stop para manutenção rápida
- Verifique logs antes de parar

❌ **Evite:**
- Parar containers em produção sem aviso
- Deixar muitos containers parados ocupando espaço
- Confundir "Parar" com "Deletar"

### Domínios

✅ **Faça:**
- Use domínios descritivos
- Configure DNS para domínios customizados
- Teste domínios locais antes de produção

❌ **Evite:**
- Domínios muito longos
- Caracteres especiais
- Conflitos de porta

---

## 🎯 Exemplos Práticos

### Exemplo 1: Mudar Branch de Deploy

```bash
# 1. Clique em ✏️ Editar
# 2. Altere branch de "main" para "develop"
# 3. Salve
# 4. Clique em 🚀 Deploy
# 5. Projeto agora usa branch develop
```

### Exemplo 2: Adicionar Variável de Ambiente

```bash
# 1. Clique em ✏️ Editar
# 2. Adicione no campo "Variáveis de Ambiente":
API_KEY=abc123
DATABASE_URL=mongodb://localhost:27017/db
# 3. Salve
# 4. Faça deploy para aplicar
```

### Exemplo 3: Mudar Domínio

```bash
# 1. Clique em ✏️ Editar
# 2. Altere domínio de "app.localhost" para "app.meusite.com"
# 3. Salve
# 4. Configure DNS:
#    app.meusite.com → IP_DO_SERVIDOR
# 5. Faça deploy
# 6. Acesse pelo novo domínio
```

### Exemplo 4: Economizar Recursos

```bash
# Parar projetos não utilizados:
# 1. Identifique projetos inativos
# 2. Clique em ⏹️ Parar em cada um
# 3. Containers são parados
# 4. Recursos liberados
# 5. Inicie quando precisar com ▶️
```

---

## 🐛 Troubleshooting

### Problema: Botão "Editar" não aparece

**Solução:**
- Recarregue a página
- Verifique se o projeto existe
- Atualize o frontend

### Problema: Alterações não aplicadas

**Solução:**
- Certifique-se de clicar em "Salvar Alterações"
- Faça um novo deploy após editar
- Verifique logs de erro

### Problema: Container não inicia

**Solução:**
- Verifique se porta está disponível
- Veja logs do container
- Verifique se imagem existe
- Tente fazer novo deploy

### Problema: Domínio não resolve

**Solução:**
- Verifique configuração DNS
- Adicione ao arquivo hosts
- Verifique se container está rodando
- Teste com `localhost:porta` primeiro

---

## 📊 Status do Container

| Status | Cor | Significado | Ações Disponíveis |
|--------|-----|-------------|-------------------|
| Ativo | 🟢 Verde | Container rodando | Parar, Logs, Terminal |
| Inativo | ⚪ Cinza | Container parado | Iniciar, Deploy |
| Deploying | 🔵 Azul | Deploy em andamento | Aguardar |
| Erro | 🔴 Vermelho | Erro no deploy | Ver logs, Deploy |

---

## 🎉 Resumo

Agora você tem **controle total** sobre seus projetos:

✅ **Domínio visível** e clicável  
✅ **Editar configurações** facilmente  
✅ **Iniciar/Parar** containers  
✅ **Interface melhorada**  
✅ **Mais controle**  
✅ **Mais eficiência**  

**Aproveite as novas funcionalidades! 🚀**

---

**Versão**: 1.2.0  
**Data**: 2026-02-08  
**Status**: ✅ Implementado
