# 🔍 Auditoria de Segurança - Deploy Manager

**Data**: 2024  
**Status**: ⚠️ VULNERABILIDADES CRÍTICAS ENCONTRADAS

---

## 🚨 VULNERABILIDADES CRÍTICAS (Prioridade Alta)

### 1. **Command Injection via Terminal SSH** ⚠️⚠️⚠️
**Severidade**: CRÍTICA  
**Arquivo**: `backend/src/routes/servers.ts`, `backend/src/routes/projects.ts`

**Problema**:
```typescript
// Usuário pode executar QUALQUER comando SSH
router.post('/servers/:id/exec', protect, async (req: AuthRequest, res) => {
  const { command } = req.body;
  const result = await sshService.executeCommand(serverId, command);
});
```

**Risco**:
- Usuário pode executar comandos maliciosos: `rm -rf /`, `cat /etc/passwd`, etc
- Acesso root ao servidor
- Roubo de dados sensíveis
- Destruição do sistema

**Solução**:
```typescript
// Whitelist de comandos permitidos
const ALLOWED_COMMANDS = ['ls', 'pwd', 'df', 'free', 'docker ps', 'docker logs'];

function sanitizeCommand(command: string): string {
  const baseCommand = command.split(' ')[0];
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    throw new Error('Comando não permitido');
  }
  // Escapar caracteres perigosos
  return command.replace(/[;&|`$()]/g, '');
}
```

---

### 2. **Credenciais em Logs** ⚠️⚠️
**Severidade**: ALTA  
**Arquivo**: `backend/src/middleware/auth.ts`

**Problema**:
```typescript
console.log('✅ Token extraído:', token.substring(0, 20) + '...');
```

**Risco**:
- Tokens JWT expostos em logs
- Possível acesso não autorizado se logs vazarem

**Solução**:
```typescript
// Remover logs de tokens em produção
if (process.env.NODE_ENV !== 'production') {
  console.log('✅ Token extraído');
}
```

---

### 3. **Falta de Rate Limiting** ⚠️⚠️
**Severidade**: ALTA  
**Arquivo**: `backend/src/index.ts`

**Problema**:
- Sem proteção contra brute force
- Sem limite de requisições por IP
- Vulnerável a DDoS

**Risco**:
- Ataques de força bruta em login
- Sobrecarga do servidor
- Custo elevado de infraestrutura

**Solução**:
```typescript
import rateLimit from 'express-rate-limit';

// Rate limit geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições
  message: 'Muitas requisições, tente novamente mais tarde'
});

// Rate limit para login (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas
  skipSuccessfulRequests: true
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
```

---

### 4. **CORS Muito Permissivo** ⚠️
**Severidade**: MÉDIA  
**Arquivo**: `backend/src/index.ts`

**Problema**:
```typescript
const io = new Server(server, {
  cors: {
    origin: '*', // QUALQUER origem pode conectar!
  }
});
```

**Risco**:
- Qualquer site pode fazer requisições
- CSRF attacks
- Roubo de dados via XSS

**Solução**:
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:8000',
  'http://localhost:3000',
  'https://yourdomain.com'
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true
  }
});
```

---

### 5. **Senha Mínima Fraca** ⚠️
**Severidade**: MÉDIA  
**Arquivo**: `backend/src/routes/auth.ts`

**Problema**:
```typescript
if (password.length < 6) {
  return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres.' });
}
```

**Risco**:
- Senhas fracas fáceis de quebrar
- Vulnerável a ataques de dicionário

**Solução**:
```typescript
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Senha deve ter no mínimo 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Senha deve conter letra maiúscula' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Senha deve conter letra minúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Senha deve conter número' };
  }
  return { valid: true };
}
```

---

### 6. **Token de Reset Sem Expiração Curta** ⚠️
**Severidade**: MÉDIA  
**Arquivo**: `backend/src/routes/auth.ts`

**Problema**:
```typescript
user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
```

**Risco**:
- 30 minutos é muito tempo
- Janela grande para interceptação

**Solução**:
```typescript
// Reduzir para 10 minutos
user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
```

---

### 7. **Falta de Helmet (Security Headers)** ⚠️
**Severidade**: MÉDIA  
**Arquivo**: `backend/src/index.ts`

**Problema**:
- Sem headers de segurança HTTP
- Vulnerável a XSS, clickjacking, etc

**Solução**:
```bash
npm install helmet
```

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

### 8. **Falta de Validação de Input** ⚠️
**Severidade**: MÉDIA  
**Arquivos**: Múltiplos

**Problema**:
- Inputs não validados antes de usar
- Possível NoSQL injection
- XSS via inputs

**Solução**:
```bash
npm install express-validator
```

```typescript
import { body, validationResult } from 'express-validator';

router.post('/servers',
  protect,
  [
    body('name').trim().isLength({ min: 3, max: 50 }).escape(),
    body('host').trim().isIP().withMessage('IP inválido'),
    body('port').isInt({ min: 1, max: 65535 }),
    body('username').trim().isLength({ min: 1, max: 50 }).escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... resto do código
  }
);
```

---

### 9. **JWT Secret Fraco** ⚠️
**Severidade**: ALTA  
**Arquivo**: `backend/src/middleware/auth.ts`

**Problema**:
```typescript
jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
```

**Risco**:
- Fallback para chave fraca
- Tokens podem ser forjados

**Solução**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your-secret-key') {
  throw new Error('JWT_SECRET não configurado ou usando valor padrão!');
}
jwt.verify(token, JWT_SECRET);
```

---

### 10. **Exposição de Informações Sensíveis** ⚠️
**Severidade**: BAIXA  
**Arquivo**: `backend/src/routes/auth.ts`

**Problema**:
```typescript
// Em desenvolvimento, retornar o token
...(process.env.NODE_ENV === 'development' && { resetToken }),
```

**Risco**:
- Token de reset exposto em resposta
- Pode ser interceptado

**Solução**:
```typescript
// Nunca retornar token, mesmo em dev
// Usar email ou logs do servidor
```

---

## 📊 Resumo de Vulnerabilidades

| Severidade | Quantidade | Status |
|------------|------------|--------|
| 🔴 CRÍTICA | 1 | ⚠️ Não Corrigido |
| 🟠 ALTA | 3 | ⚠️ Não Corrigido |
| 🟡 MÉDIA | 6 | ⚠️ Não Corrigido |
| 🟢 BAIXA | 1 | ⚠️ Não Corrigido |

---

## ✅ Checklist de Correções

### Imediatas (Fazer AGORA)
- [ ] Implementar whitelist de comandos SSH
- [ ] Adicionar rate limiting
- [ ] Corrigir CORS do Socket.IO
- [ ] Validar JWT_SECRET na inicialização
- [ ] Remover logs de tokens

### Curto Prazo (Esta Semana)
- [ ] Instalar e configurar Helmet
- [ ] Implementar validação de inputs com express-validator
- [ ] Aumentar requisitos de senha (8+ chars, maiúscula, número)
- [ ] Reduzir tempo de expiração de reset token
- [ ] Adicionar logs de auditoria

### Médio Prazo (Este Mês)
- [ ] Implementar 2FA (autenticação de dois fatores)
- [ ] Adicionar monitoramento de segurança
- [ ] Implementar WAF (Web Application Firewall)
- [ ] Fazer penetration testing
- [ ] Configurar alertas de segurança

---

## 🛡️ Boas Práticas Adicionais

### 1. Variáveis de Ambiente
```env
# Nunca usar valores padrão em produção
JWT_SECRET=<chave-forte-aleatoria-64-chars>
ENCRYPTION_KEY=<chave-forte-32-chars>
MONGODB_URI=mongodb://user:pass@host/db
NODE_ENV=production
```

### 2. MongoDB
```typescript
// Usar autenticação
mongoose.connect(MONGODB_URI, {
  authSource: 'admin',
  ssl: true,
  sslValidate: true
});
```

### 3. HTTPS
```typescript
// Forçar HTTPS em produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 4. Logs de Auditoria
```typescript
// Registrar ações importantes
function auditLog(userId: string, action: string, details: any) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    userId,
    action,
    details,
    ip: req.ip
  }));
}
```

---

## 📞 Próximos Passos

1. **Priorizar correções críticas** (Command Injection)
2. **Implementar rate limiting** imediatamente
3. **Revisar e validar todos os inputs**
4. **Adicionar testes de segurança** automatizados
5. **Fazer auditoria periódica** (mensal)

---

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**⚠️ ATENÇÃO**: Este sistema NÃO deve ir para produção sem corrigir as vulnerabilidades críticas!
