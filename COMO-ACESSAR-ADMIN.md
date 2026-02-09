# Como Acessar o Painel Super Admin

## Método 1: Usando o Script Automático (Recomendado)

### Passo 1: Execute o script
```bash
cd deploy-manager/backend
npm run make-admin
```

### Passo 2: Siga as instruções
O script irá:
1. Listar todos os usuários cadastrados
2. Mostrar quem já é admin
3. Pedir para você escolher qual usuário tornar admin
4. Atualizar o usuário selecionado

### Passo 3: Acesse o painel
1. Faça login com a conta que você tornou admin
2. Clique no seu nome/avatar no canto superior direito
3. Clique em **"Painel Admin"** no menu dropdown
4. Ou acesse diretamente: `http://localhost:8000/admin`

---

## Método 2: Manualmente via MongoDB

### Opção A: MongoDB Compass (Interface Gráfica)

1. Abra o MongoDB Compass
2. Conecte em `mongodb://localhost:27017`
3. Selecione o banco `deploy-manager`
4. Abra a coleção `users`
5. Encontre seu usuário
6. Clique em "Edit Document"
7. Altere o campo `role` de `"user"` para `"admin"`
8. Clique em "Update"

### Opção B: MongoDB Shell

```bash
# Conectar ao MongoDB
mongosh

# Selecionar o banco
use deploy-manager

# Listar usuários
db.users.find({}, { name: 1, email: 1, role: 1 })

# Tornar um usuário admin (substitua o email)
db.users.updateOne(
  { email: "seu-email@exemplo.com" },
  { $set: { role: "admin" } }
)

# Verificar
db.users.findOne({ email: "seu-email@exemplo.com" })
```

---

## Verificando se Funcionou

Após tornar seu usuário admin:

1. **Faça logout** (se já estiver logado)
2. **Faça login novamente**
3. Clique no menu do usuário (canto superior direito)
4. Você deve ver a opção **"Painel Admin"** com ícone de engrenagem roxa
5. Clique nela para acessar

---

## Estrutura do Painel Admin

### Dashboard Principal (`/admin`)
- Estatísticas de usuários
- Gráfico de crescimento
- Status de assinaturas
- Recursos do sistema

### Gerenciar Usuários (`/admin/users`)
- Lista de todos os usuários
- Editar dados e assinaturas
- Deletar usuários

### Gerenciar Planos (`/admin/plans`)
- Criar novos planos
- Editar planos existentes
- Definir preços e limites
- Marcar como popular

---

## Troubleshooting

### Não vejo a opção "Painel Admin"
- Verifique se o campo `role` está como `"admin"` no banco
- Faça logout e login novamente
- Limpe o cache do navegador (Ctrl + Shift + Delete)

### Erro ao acessar /admin
- Certifique-se de estar logado
- Verifique se o backend está rodando
- Verifique os logs do console do navegador (F12)

### Script make-admin não funciona
- Certifique-se de que o MongoDB está rodando
- Verifique a variável `MONGODB_URI` no `.env`
- Certifique-se de ter pelo menos um usuário cadastrado

---

## Primeiro Acesso

Se você ainda não tem nenhum usuário:

1. Acesse `http://localhost:8000/register`
2. Crie sua conta
3. Execute `npm run make-admin` no backend
4. Selecione sua conta
5. Faça login
6. Acesse o painel admin

---

## Segurança

⚠️ **IMPORTANTE:**
- Apenas usuários com `role: "admin"` podem acessar o painel
- Todas as rotas admin são protegidas no backend
- Usuários normais são redirecionados automaticamente
- Não compartilhe credenciais de admin

---

## Próximos Passos

Após acessar o painel admin, você pode:

1. **Criar Planos de Assinatura**
   - Defina preços e limites
   - Configure funcionalidades
   - Marque planos populares

2. **Gerenciar Usuários**
   - Atribuir planos
   - Ativar/desativar contas
   - Visualizar estatísticas

3. **Monitorar o Sistema**
   - Acompanhar crescimento
   - Ver recursos em uso
   - Analisar assinaturas
