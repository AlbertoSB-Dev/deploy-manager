# 🚀 Comandos para Executar na VPS AGORA

## 1️⃣ Atualizar Código

```bash
cd /opt/ark-deploy
git pull
```

## 2️⃣ Resolver Erro 403 Forbidden

```bash
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.updateOne({email: 'beto@gmail.com'}, {\$set: {role: 'super_admin'}})"
```

**Resultado esperado:**
```
{ acknowledged: true, matchedCount: 1, modifiedCount: 1 }
```

## 3️⃣ Resolver Erro SSH/SFTP

### Opção A: Usar Senha (Mais Simples)

1. Acesse o painel: http://painel.38.242.213.195.sslip.io
2. Vá em "Servidores"
3. Edite o servidor "VPS Minha"
4. Mude para autenticação por **Senha**
5. Digite a senha do root
6. Salve

### Opção B: Remover Senha da Chave SSH

```bash
ssh-keygen -p -f ~/.ssh/id_rsa
# Enter old passphrase: [digite a senha atual]
# Enter new passphrase: [deixe em branco - apenas ENTER]
# Enter same passphrase again: [deixe em branco - apenas ENTER]
```

Depois copie a chave e atualize no painel:
```bash
cat ~/.ssh/id_rsa
```

## 4️⃣ Verificar se Funcionou

### Verificar Role do Usuário
```bash
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.findOne({email: 'beto@gmail.com'}, {email: 1, role: 1})"
```

Deve mostrar: `role: 'super_admin'`

### Testar Painel Admin

1. Fazer **logout** do painel
2. Fazer **login** novamente
3. Acessar: http://painel.38.242.213.195.sslip.io/admin
4. Deve funcionar sem erro 403! ✅

### Testar SFTP

1. Ir em "Servidores"
2. Clicar em "Gerenciar Arquivos" no servidor
3. Deve listar os arquivos sem erro! ✅

## 📋 Resumo Ultra-Rápido

```bash
# 1. Atualizar
cd /opt/ark-deploy && git pull

# 2. Corrigir permissão
docker-compose exec mongodb mongosh deploy-manager --eval "db.users.updateOne({email: 'beto@gmail.com'}, {\$set: {role: 'super_admin'}})"

# 3. Fazer logout e login no painel

# 4. Pronto! ✅
```

## 🎯 O Que Foi Resolvido

✅ Erro 403 Forbidden nas rotas /admin/*  
✅ Documentação completa do erro SSH/SFTP  
✅ Múltiplas soluções para o problema de autenticação  
✅ Comandos diretos sem precisar de scripts  

## 📚 Documentação Criada

- `SOLUCAO-RAPIDA-403.md` - Solução do erro 403
- `SOLUCAO-ERRO-SSH-SFTP.md` - Solução do erro SSH
- `ERRO-403-FORBIDDEN.md` - Guia completo do erro 403
- `COMANDOS-VPS-AGORA.md` - Este arquivo

## 💡 Dicas

- Use comando MongoDB direto (mais rápido que scripts)
- Para SFTP automatizado, prefira senha ou chave sem passphrase
- Sempre faça logout/login após mudar permissões
- Limpe cache do navegador se o erro persistir

## 🆘 Se Ainda Tiver Problemas

```bash
# Ver logs do backend
docker-compose logs backend | tail -100

# Ver logs do MongoDB
docker-compose logs mongodb | tail -50

# Reiniciar serviços
docker-compose restart backend frontend
```

## 📞 Próximos Passos

Depois de resolver esses erros:

1. Testar todas as funcionalidades do painel admin
2. Verificar se o gerenciador de arquivos funciona
3. Testar criação de projetos
4. Verificar monitoramento de servidores

Tudo deve funcionar perfeitamente! 🎉
