# 📝 Instruções para Renomear o Projeto

## Opção 1: Script Automático (Recomendado)

1. **Feche o VS Code** (importante!)
2. Navegue até a pasta `C:\Sistema Marina\deploy-manager`
3. Execute o arquivo `rename-to-ark-deploy.bat`
4. Aguarde a conclusão
5. Abra a pasta `ark-deploy` no VS Code
6. Execute: `docker-compose up -d`

## Opção 2: Manual

### Passo 1: Parar Containers
```bash
cd C:\Sistema Marina\deploy-manager
docker-compose down
```

### Passo 2: Fechar VS Code
- Feche completamente o VS Code
- Feche todos os terminais

### Passo 3: Renomear Pasta
No Windows Explorer ou PowerShell:
```powershell
cd "C:\Sistema Marina"
Rename-Item -Path "deploy-manager" -NewName "ark-deploy"
```

Ou simplesmente:
- Abra o Windows Explorer
- Navegue até `C:\Sistema Marina`
- Clique com botão direito em `deploy-manager`
- Selecione "Renomear"
- Digite: `ark-deploy`
- Pressione Enter

### Passo 4: Reabrir Projeto
1. Abra o VS Code
2. File > Open Folder
3. Selecione `C:\Sistema Marina\ark-deploy`

### Passo 5: Iniciar Containers
```bash
docker-compose up -d
```

## Verificação

Após renomear, verifique se tudo está funcionando:

```bash
# Ver containers rodando
docker ps

# Deve mostrar:
# - ark-deploy-mongodb
# - ark-deploy-backend
# - ark-deploy-frontend

# Acessar o painel
# http://localhost:8000
# http://ark-deploy.SEU_IP.sslip.io
```

## Problemas Comuns

### "Arquivo em uso"
**Causa:** VS Code ou terminal ainda está usando a pasta

**Solução:**
1. Feche completamente o VS Code
2. Feche todos os terminais
3. Tente novamente

### "Permissão negada"
**Causa:** Falta de permissões

**Solução:**
1. Execute o PowerShell como Administrador
2. Tente novamente

### Containers não iniciam
**Causa:** Rede ou volumes antigos

**Solução:**
```bash
# Remover containers antigos
docker rm -f deploy-manager-mongodb deploy-manager-backend deploy-manager-frontend

# Remover rede antiga
docker network rm deploy-manager-network

# Iniciar novamente
docker-compose up -d --build
```

## Atualizar Git Remote (Opcional)

Se você renomear o repositório no GitHub:

```bash
cd ark-deploy
git remote set-url origin https://github.com/AlbertoSB-Dev/ark-deploy.git
```

## Notas

- ✅ Todos os arquivos já foram atualizados com o novo nome
- ✅ Docker Compose já usa os novos nomes de containers
- ✅ Documentação já está atualizada
- ⚠️ Apenas a pasta física precisa ser renomeada

## Suporte

Se tiver problemas:
1. Verifique se fechou o VS Code
2. Verifique se parou os containers
3. Tente renomear manualmente pelo Windows Explorer
