# Portas e Limpeza Remota

## 🎯 Funcionalidades Implementadas

### 1. ✅ Delete Remoto Completo
Quando você deleta um projeto remoto, o sistema agora limpa **tudo** no servidor:
- Container Docker
- Imagem Docker
- Arquivos do projeto

### 2. ✅ Mapeamento de Portas Correto
O sistema agora mapeia corretamente a porta externa (que você define) para a porta interna (que a aplicação escuta).

---

## 🗑️ Delete de Projeto Remoto

### Como Funciona

**Antes:**
- Deletava apenas do banco de dados local
- Container e arquivos ficavam no servidor remoto 😱

**Agora:**
- Conecta via SSH no servidor
- Para o container: `docker stop container_id`
- Remove o container: `docker rm container_id`
- Remove a imagem: `docker rmi projeto-nome`
- Remove os arquivos: `rm -rf /opt/projects/projeto-nome`
- Remove do banco de dados local

### Exemplo de Logs

```
🗑️ Removendo container remoto: abc123...
🗑️ Removendo imagem remota: sistema-de-teste
🗑️ Removendo arquivos remotos: /opt/projects/sistema-de-teste
✅ Projeto remoto limpo com sucesso
```

### Segurança

- Usa `|| true` para não falhar se algo já foi removido
- Continua mesmo se houver erros (graceful degradation)
- Logs detalhados de cada operação

---

## 🔌 Mapeamento de Portas

### Conceito

Docker tem dois tipos de porta:
- **Porta Externa** (Host): Porta que você acessa de fora
- **Porta Interna** (Container): Porta que a aplicação escuta dentro do container

### Exemplo

```
Aplicação escuta na porta 3000 (interna)
Você quer acessar na porta 9000 (externa)

Mapeamento: -p 9000:3000
           externa:interna
```

### Como o Sistema Funciona

#### 1. Criar Projeto

```typescript
{
  port: 9000,           // Porta externa (você define)
  internalPort: 3000    // Porta interna (padrão: 3000)
}
```

#### 2. Deploy Remoto

```bash
docker run -d \
  --name container \
  -p 9000:3000 \        # Externa:Interna
  --restart unless-stopped \
  imagem:tag
```

#### 3. Acesso

```
http://servidor:9000  →  Container:3000
```

### Portas Internas Comuns

| Framework | Porta Padrão |
|-----------|--------------|
| Node.js/Express | 3000 |
| Next.js | 3000 |
| React (dev) | 3000 |
| Vue (dev) | 8080 |
| Angular (dev) | 4200 |
| Spring Boot | 8080 |
| Django | 8000 |
| Flask | 5000 |

### Configurar Porta Interna

**Opção 1: Deixar padrão (3000)**
```typescript
// Não precisa fazer nada
// Sistema usa 3000 automaticamente
```

**Opção 2: Definir manualmente**
```typescript
// No futuro, adicionar campo no formulário
internalPort: 8080
```

**Opção 3: Variável de ambiente**
```typescript
envVars: {
  PORT: "3000"  // Aplicação lê process.env.PORT
}
```

---

## 📋 Exemplos Práticos

### Exemplo 1: Node.js na porta 9000

**Aplicação (index.js):**
```javascript
const port = process.env.PORT || 3000;
app.listen(port);
```

**Deploy Manager:**
```
Porta Externa: 9000
Porta Interna: 3000 (padrão)
```

**Resultado:**
```bash
docker run -p 9000:3000 ...
```

**Acesso:**
```
http://186.208.237.101:9000
```

---

### Exemplo 2: Múltiplos Projetos no Mesmo Servidor

**Projeto 1:**
```
Nome: api-usuarios
Porta Externa: 8001
Porta Interna: 3000
```

**Projeto 2:**
```
Nome: api-produtos
Porta Externa: 8002
Porta Interna: 3000
```

**Resultado:**
```bash
# Projeto 1
docker run -p 8001:3000 api-usuarios

# Projeto 2
docker run -p 8002:3000 api-produtos
```

**Acesso:**
```
http://servidor:8001  # API Usuários
http://servidor:8002  # API Produtos
```

---

### Exemplo 3: Aplicação com Porta Customizada

**Aplicação escuta na porta 8080:**
```javascript
app.listen(8080);
```

**Deploy Manager:**
```
Porta Externa: 9000
Porta Interna: 8080  // ⚠️ Precisa configurar!
```

**Resultado:**
```bash
docker run -p 9000:8080 ...
```

---

## 🔧 Troubleshooting

### Problema: Não consigo acessar a aplicação

**Causa 1: Porta interna errada**
```
Aplicação escuta: 8080
Configurado: 3000 (padrão)
Mapeamento: 9000:3000 ❌

Solução: Configurar internalPort: 8080
```

**Causa 2: Firewall bloqueando**
```bash
# No servidor, liberar porta
sudo ufw allow 9000
```

**Causa 3: Aplicação não iniciou**
```bash
# Ver logs
docker logs container_id
```

---

### Problema: Porta já em uso

**Erro:**
```
Error: bind: address already in use
```

**Solução:**
```
1. Escolher outra porta externa
2. Ou parar o container que está usando
```

---

## 🎯 Boas Práticas

### 1. Portas Externas

- Use portas acima de 3000
- Evite portas do sistema (80, 443, 22, etc)
- Use faixas: 8000-9000 para APIs, 3000-4000 para frontends

### 2. Portas Internas

- Mantenha 3000 como padrão quando possível
- Configure via variável de ambiente `PORT`
- Documente no README se usar porta diferente

### 3. Segurança

- Não exponha portas desnecessárias
- Use firewall para controlar acesso
- Considere usar proxy reverso (Nginx, Traefik)

---

## 📊 Comparação: Antes vs Agora

### Delete de Projeto

| Aspecto | Antes | Agora |
|---------|-------|-------|
| Container | ❌ Ficava no servidor | ✅ Removido |
| Imagem | ❌ Ficava no servidor | ✅ Removida |
| Arquivos | ❌ Ficavam no servidor | ✅ Removidos |
| Banco de dados | ✅ Removido | ✅ Removido |
| Limpeza | Manual via SSH | Automática |

### Mapeamento de Portas

| Aspecto | Antes | Agora |
|---------|-------|-------|
| Porta Externa | ✅ Configurável | ✅ Configurável |
| Porta Interna | ❌ Sempre igual externa | ✅ Configurável (padrão 3000) |
| Mapeamento | `-p 9000:9000` | `-p 9000:3000` |
| Flexibilidade | Baixa | Alta |
| Logs | Sem info | Mostra mapeamento |

---

## 🚀 Próximas Melhorias

- [ ] Campo "Porta Interna" no formulário de criação
- [ ] Detectar porta do Dockerfile automaticamente
- [ ] Validar se porta está disponível no servidor
- [ ] Sugerir portas livres automaticamente
- [ ] Proxy reverso automático (Traefik/Nginx)
- [ ] SSL/HTTPS automático (Let's Encrypt)

---

## 💡 Dicas

### Ver portas em uso no servidor

```bash
# Via SSH
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Testar se porta está acessível

```bash
# Do seu computador
curl http://servidor:9000
```

### Ver logs de mapeamento

```
📡 Mapeando porta: 9000 (externa) → 3000 (interna)
```

Aparece nos logs de deploy!

