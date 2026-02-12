# Limpeza de Dados Órfãos

## Problema Identificado

O dashboard estava mostrando "1 Bancos de Dados" para o usuário `beto@gmail.com` mesmo sem ter criado nenhum banco de dados.

## Causa

Foi encontrado 1 banco de dados órfão no MongoDB:
- Nome: `teste123`
- Tipo: `minio`
- ID: `698b205ea6d0dedb94cdd643`
- Problema: Campo `user` estava `null` (sem usuário associado)

## Solução Aplicada

1. Criado script `clean-orphan-databases.js` para identificar e limpar bancos órfãos
2. Executado o script que deletou o banco de dados órfão
3. Verificado que a rota `/databases` já filtra corretamente por usuário

## Scripts Criados

### 1. check-user-databases.js
Verifica bancos de dados de um usuário específico e lista bancos órfãos.

```bash
node scripts/check-user-databases.js
```

### 2. delete-user-databases.js
Deleta todos os bancos de dados de um usuário específico.

```bash
node scripts/delete-user-databases.js <email>
# Exemplo: node scripts/delete-user-databases.js beto@gmail.com
```

### 3. clean-orphan-databases.js
Limpa automaticamente todos os bancos de dados órfãos (sem usuário associado).

```bash
node scripts/clean-orphan-databases.js
```

## Como Prevenir

1. **Sempre associar usuário**: Ao criar qualquer recurso (banco de dados, servidor, projeto), sempre associar o `user._id`

2. **Validação no backend**: As rotas já validam e filtram por usuário:
   ```typescript
   router.get('/', protect, async (req: AuthRequest, res) => {
     const databases = await databaseService.listDatabases(req.user?._id.toString());
     res.json(databases);
   });
   ```

3. **Limpeza periódica**: Execute o script de limpeza periodicamente:
   ```bash
   node scripts/clean-orphan-databases.js
   ```

4. **Validação no modelo**: Considere tornar o campo `user` obrigatório no schema do Mongoose:
   ```typescript
   user: { 
     type: mongoose.Schema.Types.ObjectId, 
     ref: 'User',
     required: true  // Adicionar esta linha
   }
   ```

## Resultado

Após a limpeza:
- ✅ Usuário `beto@gmail.com` agora mostra corretamente "0 Bancos de Dados"
- ✅ Dashboard exibe apenas recursos do usuário logado
- ✅ Nenhum dado órfão no sistema

## Manutenção

Para manter o sistema limpo, execute periodicamente:

```bash
# Verificar se há dados órfãos
node scripts/check-user-databases.js

# Limpar dados órfãos
node scripts/clean-orphan-databases.js
```
