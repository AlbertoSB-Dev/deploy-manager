# CPF/CNPJ Não Aparece no Perfil - Solução

## 🔍 Problema

O CPF/CNPJ não está aparecendo na página de perfil do usuário.

## 📋 Causa

Usuários criados **antes** da implementação do campo CPF/CNPJ não possuem esse campo no banco de dados. O campo só foi adicionado recentemente e é obrigatório apenas para novos cadastros.

## ✅ Verificação

Execute o script para verificar quais usuários não têm CPF/CNPJ:

```bash
cd backend
node scripts/add-cpf-to-users.js
```

## 🔧 Soluções

### Solução 1: Adicionar CPF/CNPJ Manualmente (Recomendado)

Use o script interativo para adicionar CPF/CNPJ a um usuário específico:

```bash
cd backend
node scripts/update-user-cpf.js
```

O script irá:
1. Pedir o email do usuário
2. Mostrar os dados do usuário
3. Pedir o CPF (11 dígitos) ou CNPJ (14 dígitos)
4. Confirmar a atualização
5. Salvar no banco de dados

**Exemplo:**
```
Digite o email do usuário: beto@gmail.com
Digite o CPF (11 dígitos) ou CNPJ (14 dígitos): 12345678900
Confirmar atualização? (s/n): s
✅ CPF/CNPJ atualizado com sucesso!
```

### Solução 2: Via MongoDB Compass ou CLI

Se preferir usar o MongoDB diretamente:

```javascript
db.users.updateOne(
  { email: "beto@gmail.com" },
  { $set: { cpfCnpj: "12345678900" } }
)
```

### Solução 3: Usuário Atualizar pelo Perfil (Futuro)

Você pode adicionar um campo editável no perfil para o usuário atualizar seu próprio CPF/CNPJ.

## 📊 Usuários Afetados

Atualmente, 4 usuários não possuem CPF/CNPJ cadastrado:

1. **beto.albertosantanabeto@gmail.com** - Trial
2. **beto@gmail.com** - Active
3. **beto123@gmail.com** - Active
4. **beto1234@gmail.com** - Trial

## 🔄 Após Atualizar

Depois de adicionar o CPF/CNPJ:

1. O usuário deve fazer **logout**
2. Fazer **login** novamente
3. O CPF/CNPJ aparecerá automaticamente no perfil

## 💡 Novos Usuários

Novos usuários que se cadastrarem a partir de agora **já terão o campo CPF/CNPJ obrigatório** no formulário de registro, então não terão esse problema.

## 🎨 Como Aparece no Perfil

Quando o usuário tiver CPF/CNPJ cadastrado, aparecerá assim:

```
┌─────────────────────────────┐
│ 💳 CPF/CNPJ                 │
│ 123.456.789-00              │  (CPF formatado)
│ ou                          │
│ 12.345.678/0001-90          │  (CNPJ formatado)
└─────────────────────────────┘
```

## 🔐 Validação

O sistema valida automaticamente:
- CPF: 11 dígitos → Formato: 000.000.000-00
- CNPJ: 14 dígitos → Formato: 00.000.000/0000-00

## 📝 Notas

- O campo CPF/CNPJ é **opcional** para usuários existentes
- É **obrigatório** apenas para novos cadastros
- O campo só aparece no perfil se estiver preenchido
- A formatação é automática (adiciona pontos, traços e barras)
