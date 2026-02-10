# 🔒 Segurança do Deploy Manager

## Criptografia de Credenciais

### Como Funciona

As credenciais dos servidores (senhas e chaves SSH) são **criptografadas** antes de serem salvas no banco de dados usando o algoritmo **AES-256-CBC**.

### Implementação

1. **Criptografia Automática**: Quando um servidor é cadastrado, as credenciais são automaticamente criptografadas antes de salvar no MongoDB
2. **Descriptografia sob Demanda**: As credenciais só são descriptografadas quando necessário (conexão SSH)
3. **Nunca Expostas**: As credenciais nunca são retornadas para o frontend via API

### Configuração

#### 1. Gerar Chave de Criptografia

A chave deve ter **exatamente 32 caracteres**. Você pode gerar uma usando:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex').substring(0, 32))"

# Ou manualmente
# Exemplo: my-super-secret-encryption-key
```

#### 2. Adicionar no .env

```env
ENCRYPTION_KEY=your-32-character-secret-key!!
```

⚠️ **IMPORTANTE**: 
- Nunca commite o arquivo `.env` no Git
- Use chaves diferentes para desenvolvimento e produção
- Guarde a chave em um local seguro (gerenciador de senhas, vault, etc)

### Fluxo de Segurança

```
┌─────────────────┐
│  Usuário        │
│  Cadastra       │
│  Servidor       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend        │
│  Criptografa    │
│  Credenciais    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB        │
│  Armazena       │
│  Criptografado  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SSH Service    │
│  Descriptografa │
│  Para Conectar  │
└─────────────────┘
```

## Outras Medidas de Segurança

### 1. Autenticação JWT
- Tokens com expiração
- Refresh tokens para renovação
- Middleware de proteção de rotas

### 2. Multi-tenancy
- Isolamento total entre usuários
- Cada usuário só acessa seus próprios recursos
- Validação de propriedade em todas as rotas

### 3. Senhas de Usuários
- Hash com bcrypt (salt rounds: 10)
- Nunca armazenadas em texto plano
- Validação de força de senha

### 4. Proteção de Rotas
- Middleware de autenticação
- Verificação de roles (admin/user)
- Rate limiting (recomendado para produção)

### 5. CORS
- Configurado para aceitar apenas origens permitidas
- Headers de segurança configurados

## Recomendações para Produção

### 1. Variáveis de Ambiente
```env
NODE_ENV=production
ENCRYPTION_KEY=<chave-forte-32-chars>
JWT_SECRET=<chave-forte-aleatoria>
JWT_REFRESH_SECRET=<outra-chave-forte>
```

### 2. HTTPS
- Use sempre HTTPS em produção
- Certificados SSL/TLS válidos
- Redirecione HTTP para HTTPS

### 3. Firewall
- Restrinja acesso ao MongoDB
- Use VPN ou IP whitelist
- Feche portas desnecessárias

### 4. Backup
- Faça backup regular do banco de dados
- **IMPORTANTE**: Guarde a `ENCRYPTION_KEY` junto com o backup
- Sem a chave, os dados criptografados são irrecuperáveis

### 5. Monitoramento
- Log de acessos
- Alertas de tentativas de acesso não autorizado
- Auditoria de ações administrativas

### 6. Rate Limiting
Adicione rate limiting para prevenir ataques:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições
});

app.use('/api/', limiter);
```

### 7. Helmet
Use Helmet para headers de segurança:

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

## Recuperação de Desastres

### Se Perder a ENCRYPTION_KEY

⚠️ **ATENÇÃO**: Se você perder a `ENCRYPTION_KEY`, **não será possível** recuperar as credenciais criptografadas!

**Soluções**:
1. Recadastrar todos os servidores
2. Restaurar backup da chave
3. Usar backup do banco antes da perda

### Rotação de Chaves

Para trocar a chave de criptografia:

1. Descriptografar todas as credenciais com a chave antiga
2. Atualizar `ENCRYPTION_KEY` no .env
3. Re-criptografar todas as credenciais com a nova chave
4. Reiniciar aplicação

## Auditoria

### Logs de Segurança

O sistema registra:
- ✅ Tentativas de login (sucesso/falha)
- ✅ Criação/edição de servidores
- ✅ Conexões SSH
- ✅ Execução de comandos

### Verificação de Integridade

Periodicamente verifique:
- Credenciais criptografadas no banco
- Logs de acesso
- Usuários ativos
- Servidores cadastrados

## Contato

Para reportar vulnerabilidades de segurança, entre em contato através de:
- Email: security@yourdomain.com
- GitHub Issues (para bugs não críticos)

---

**Última atualização**: 2024
**Versão**: 1.0.0
