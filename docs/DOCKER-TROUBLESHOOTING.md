# 🐛 Docker Troubleshooting Guide

## Erro: npm I/O Error durante build

### Sintomas
```
npm warn tar TAR_ENTRY_ERROR EIO: i/o error, write
npm error A complete log of this run can be found in: /root/.npm/_logs/...
```

### Causas Comuns

#### 1. **Espaço em Disco Insuficiente**

**Verificar:**
```bash
# No host
df -h

# Espaço usado pelo Docker
docker system df
```

**Solução:**
```bash
# Limpar imagens não utilizadas
docker image prune -a

# Limpar containers parados
docker container prune

# Limpar tudo (cuidado!)
docker system prune -a --volumes
```

#### 2. **Memória Insuficiente**

**Verificar:**
```bash
# Memória disponível
free -h

# Configuração do Docker
docker info | grep Memory
```

**Solução (Docker Desktop):**
- Abra Docker Desktop
- Settings → Resources
- Aumente Memory para pelo menos 4GB
- Aumente Swap para 2GB

**Solução (Linux):**
```bash
# Editar daemon.json
sudo nano /etc/docker/daemon.json

# Adicionar:
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}

# Reiniciar Docker
sudo systemctl restart docker
```

#### 3. **Build Context Muito Grande**

**Problema:** Docker está copiando muitos arquivos (node_modules, .git, etc.)

**Solução:** O sistema agora gera automaticamente `.dockerignore`:

```
node_modules
npm-debug.log
.next
.git
.gitignore
README.md
.env
.env.local
.DS_Store
*.log
dist
build
coverage
```

**Verificar tamanho do contexto:**
```bash
cd /caminho/do/projeto
du -sh .
```

#### 4. **Problemas de Rede**

**Sintomas:** Timeout ao baixar pacotes npm

**Solução:**
```bash
# Usar mirror npm alternativo
npm config set registry https://registry.npmjs.org/

# Ou usar cache local
npm config set cache /tmp/npm-cache --global
```

#### 5. **Permissões de Arquivo**

**Windows:** Docker Desktop precisa de acesso aos drives

**Solução:**
- Docker Desktop → Settings → Resources → File Sharing
- Adicione o drive onde está o projeto

**Linux:**
```bash
# Verificar permissões
ls -la /caminho/do/projeto

# Corrigir se necessário
sudo chown -R $USER:$USER /caminho/do/projeto
```

## Erro: Container não inicia

### Sintomas
```
Deploy concluído mas status: error
Container não aparece em docker ps
```

### Diagnóstico

```bash
# Ver todos os containers (incluindo parados)
docker ps -a

# Ver logs do container
docker logs deploy-manager-<project-name>

# Inspecionar container
docker inspect deploy-manager-<project-name>
```

### Soluções Comuns

#### 1. **Porta já em uso**

```bash
# Verificar porta
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Matar processo
taskkill /PID <pid> /F        # Windows
kill -9 <pid>                 # Linux/Mac
```

#### 2. **Variáveis de ambiente faltando**

Verifique se todas as variáveis necessárias estão configuradas no projeto.

#### 3. **Comando de start incorreto**

```bash
# Testar manualmente
docker run -it deploy-manager-<project-name> sh
npm start
```

## Erro: Build muito lento

### Otimizações

#### 1. **Usar BuildKit**

```bash
# Habilitar BuildKit (mais rápido)
export DOCKER_BUILDKIT=1

# Windows PowerShell
$env:DOCKER_BUILDKIT=1
```

#### 2. **Cache de Layers**

O Dockerfile já está otimizado para cache:
```dockerfile
# Copiar apenas package.json primeiro
COPY package*.json ./
RUN npm ci

# Depois copiar código
COPY . .
```

#### 3. **Multi-stage Build**

Frontend já usa multi-stage para reduzir tamanho final.

## Erro: Imagem muito grande

### Verificar tamanho

```bash
docker images | grep deploy-manager
```

### Soluções

#### 1. **Usar Alpine**
Já implementado: `node:18-alpine`

#### 2. **Limpar cache npm**
```dockerfile
RUN npm ci --only=production && npm cache clean --force
```

#### 3. **Remover arquivos desnecessários**
```dockerfile
RUN rm -rf /tmp/* /var/cache/apk/*
```

## Comandos Úteis

### Debugging

```bash
# Entrar no container
docker exec -it deploy-manager-<project> sh

# Ver processos
docker top deploy-manager-<project>

# Ver uso de recursos
docker stats deploy-manager-<project>

# Ver logs em tempo real
docker logs -f deploy-manager-<project>
```

### Limpeza

```bash
# Remover container específico
docker rm -f deploy-manager-<project>

# Remover imagem específica
docker rmi deploy-manager-<project>:latest

# Limpar tudo do projeto
docker rm -f $(docker ps -a | grep deploy-manager-<project> | awk '{print $1}')
docker rmi $(docker images | grep deploy-manager-<project> | awk '{print $3}')
```

### Rebuild Forçado

```bash
# Build sem cache
docker build --no-cache -t deploy-manager-<project>:latest .
```

## Logs Detalhados

### Habilitar Debug

```bash
# Docker daemon debug
sudo dockerd --debug

# Build com output completo
docker build --progress=plain -t image:tag .
```

### Localização dos Logs

**Windows:**
```
C:\Users\<user>\AppData\Local\Docker\log.txt
```

**Linux:**
```
/var/log/docker.log
journalctl -u docker.service
```

**Container logs:**
```
/var/lib/docker/containers/<container-id>/<container-id>-json.log
```

## Prevenção

### Checklist antes do Deploy

- [ ] Espaço em disco > 10GB livre
- [ ] Memória Docker > 4GB
- [ ] .dockerignore presente
- [ ] package.json válido
- [ ] Porta disponível
- [ ] Variáveis de ambiente configuradas
- [ ] Docker daemon rodando

### Monitoramento

```bash
# Espaço usado
docker system df

# Recursos em uso
docker stats

# Health check
docker ps --filter health=unhealthy
```

## Suporte

Se o problema persistir:

1. Verifique os logs completos: `/root/.npm/_logs/`
2. Teste o build localmente: `docker build .`
3. Verifique a documentação do projeto
4. Abra uma issue com:
   - Logs completos
   - `docker version`
   - `docker info`
   - Sistema operacional

---

**Última atualização:** 2026-02-08
