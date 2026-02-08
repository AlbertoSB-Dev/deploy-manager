# Correções de Deploy Remoto

## ✅ Problemas Corrigidos

### 1. Domínio com localhost em Deploy Remoto
**Problema**: Projetos remotos estavam gerando domínio com `localhost` ao invés do IP do servidor.

**Solução**:
- Domínio agora usa IP do servidor remoto: `abc123.186.208.237.101.sslip.io`
- Acesso mostra IP correto: `186.208.237.101:9000` ao invés de `localhost:9000`
- Campo `serverHost` adicionado ao modelo Project

**Arquivos**:
- `backend/src/routes/projects.ts` - Geração de domínio com IP do servidor
- `backend/src/models/Project.ts` - Campo `serverHost` adicionado
- `frontend/src/components/ProjectCard.tsx` - Mostra IP correto no acesso

---

### 2. Erro "Cannot use simple-git on a directory that does not exist"
**Problema**: UpdateCheckerService tentava verificar atualizações em projetos remotos que não têm repositório local.

**Solução**:
- Projetos remotos (`serverId` presente) são pulados na verificação periódica
- Log mostra: `⏭️ Pulando sistema-de-teste (projeto remoto)`

**Arquivo**: `backend/src/services/UpdateCheckerService.ts`

---

### 3. Erro "No such container" (HTTP 404)
**Problema**: Sistema tentava parar/iniciar containers que não existem mais.

**Solução**:
- Tratamento de erro 404: "Container não encontrado (já foi removido)"
- Tratamento de erro 304: "Container já está parado/rodando"
- Não quebra o fluxo quando container não existe

**Arquivo**: `backend/src/services/DockerService.ts`

---

## 🎯 Como Funciona Agora

### Deploy Local
```
Domínio: abc123.localhost
Acesso: localhost:3000
Verificação de atualizações: ✅ Ativa
```

### Deploy Remoto
```
Domínio: abc123.186.208.237.101.sslip.io
Acesso: 186.208.237.101:3000
Verificação de atualizações: ⏭️ Pulada (não tem repo local)
```

---

## 📋 Fluxo de Criação de Projeto Remoto

1. **Usuário cria projeto**
   - Seleciona servidor remoto
   - Sistema busca IP do servidor

2. **Domínio gerado**
   ```typescript
   // Se remoto:
   `${random}.${serverHost}.sslip.io`
   
   // Se local:
   `${random}.${SERVER_IP}.sslip.io` ou `${random}.localhost`
   ```

3. **Projeto salvo**
   ```json
   {
     "serverId": "abc123",
     "serverName": "VPS Produção",
     "serverHost": "186.208.237.101",
     "domain": "xyz789.186.208.237.101.sslip.io"
   }
   ```

4. **Interface mostra**
   - Domínio: `xyz789.186.208.237.101.sslip.io`
   - Acesso remoto: `186.208.237.101:3000`
   - Indicador: `🌐 VPS Produção`

---

## 🔧 Tratamento de Erros Docker

### Erro 404 - Container não encontrado
```typescript
// Antes: Quebrava o sistema
// Agora: Log de aviso e continua
⚠️ Container não encontrado (já foi removido)
```

### Erro 304 - Container já no estado desejado
```typescript
// Parar container já parado
⚠️ Container já está parado

// Iniciar container já rodando
⚠️ Container já está rodando
```

---

## 🚀 Próximos Passos

1. **Reinicie o backend** para aplicar correções
2. **Delete projetos com erro** (containers inexistentes)
3. **Crie novo projeto** conectando via GitHub
4. **Selecione servidor remoto**
5. **Verifique domínio gerado** - deve usar IP do servidor
6. **Faça deploy** - deve funcionar corretamente!

---

## 📝 Checklist de Verificação

- [x] Domínio usa IP do servidor remoto
- [x] Acesso mostra IP correto (não localhost)
- [x] UpdateChecker pula projetos remotos
- [x] Erros Docker tratados graciosamente
- [x] Build sem erros
- [ ] Backend reiniciado
- [ ] Projeto remoto testado
- [ ] Deploy remoto funcionando

---

## 🐛 Debug

### Ver logs do UpdateChecker
```
🔍 Verificando atualizações para 3 projetos...
⏭️ Pulando sistema-de-teste (projeto remoto)
✨ Atualização disponível para projeto-local
```

### Ver informações do projeto
No MongoDB:
```javascript
db.projects.findOne({ name: "sistema-de-teste" }, {
  serverId: 1,
  serverName: 1,
  serverHost: 1,
  domain: 1
})
```

Deve retornar:
```json
{
  "serverId": "abc123",
  "serverName": "VPS Produção",
  "serverHost": "186.208.237.101",
  "domain": "xyz789.186.208.237.101.sslip.io"
}
```

---

## 💡 Dicas

### sslip.io
Serviço que resolve qualquer subdomínio para o IP especificado:
- `abc.186.208.237.101.sslip.io` → `186.208.237.101`
- Funciona sem configurar DNS
- Perfeito para testes e desenvolvimento

### Acesso Local vs Remoto
- **Local**: Usa `localhost` porque está na mesma máquina
- **Remoto**: Usa IP público do servidor para acesso externo

