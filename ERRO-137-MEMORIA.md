# 🔴 Erro 137: Servidor Sem Memória

## 🔍 O que é o Erro 137?

**Código 137 = SIGKILL (OOM - Out Of Memory)**

O servidor ficou sem memória RAM durante a instalação de pacotes e o kernel matou o processo.

---

## 🚨 Solução Rápida (5 minutos)

### 1. Acessar Console do Servidor

Acesse o console web do seu provedor e faça login como root.

### 2. Criar SWAP (Memória Virtual)

Cole estes comandos:

```bash
# Criar SWAP de 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verificar
free -h
```

### 3. Tentar Provisioning Novamente

Agora tente provisionar o servidor novamente pelo painel.

---

## 📊 Verificar Memória do Servidor

```bash
# Ver memória total e disponível
free -h

# Ver uso em tempo real
watch -n 1 free -h

# Ver processos que mais usam memória
ps aux --sort=-%mem | head -10
```

### Interpretação:

```
              total        used        free      shared  buff/cache   available
Mem:           512M        450M         20M        10M         42M         30M
Swap:            0B          0B          0B
```

- **Total < 1GB**: ⚠️ Memória muito baixa, precisa de SWAP
- **Free < 50MB**: 🔴 Crítico, sistema pode travar
- **Swap = 0**: ❌ Sem memória virtual

---

## 🛠️ Soluções Detalhadas

### Solução 1: Adicionar SWAP (Recomendado)

SWAP é memória virtual que usa o disco quando a RAM acaba.

```bash
# Verificar se já tem SWAP
swapon --show

# Se não tiver, criar 2GB de SWAP
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente (sobrevive a reboot)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Ajustar swappiness (quanto usar SWAP)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Verificar
free -h
swapon --show
```

**Tamanho recomendado de SWAP:**
- 512MB RAM → 2GB SWAP
- 1GB RAM → 2GB SWAP
- 2GB RAM → 1GB SWAP
- 4GB+ RAM → 512MB SWAP (opcional)

### Solução 2: Liberar Memória Antes de Instalar

```bash
# Parar serviços desnecessários
systemctl stop snapd
systemctl stop unattended-upgrades
systemctl stop apache2 2>/dev/null || true

# Limpar cache de pacotes
apt-get clean
apt-get autoclean

# Limpar cache do sistema
sync
echo 3 > /proc/sys/vm/drop_caches

# Verificar memória livre
free -h

# Agora instalar
apt-get install -y [pacotes]
```

### Solução 3: Instalar Pacotes em Etapas

Em vez de instalar tudo de uma vez:

```bash
# Atualizar
apt-get update

# Instalar em grupos pequenos
apt-get install -y apt-transport-https ca-certificates
apt-get install -y curl gnupg
apt-get install -y lsb-release git
apt-get install -y wget unzip

# Limpar após cada grupo
apt-get clean
```

### Solução 4: Usar Script Otimizado

Use o script `provision-low-memory.sh`:

```bash
# Baixar script
wget https://raw.githubusercontent.com/seu-repo/deploy-manager/main/scripts/provision-low-memory.sh

# Dar permissão
chmod +x provision-low-memory.sh

# Executar
./provision-low-memory.sh
```

### Solução 5: Upgrade do Servidor

Se nada funcionar, considere fazer upgrade:

**Planos recomendados:**
- **Mínimo**: 1GB RAM
- **Recomendado**: 2GB RAM
- **Ideal**: 4GB RAM

---

## 🔧 Otimizações Permanentes

### 1. Configurar Swappiness

```bash
# Ver valor atual (padrão: 60)
cat /proc/sys/vm/swappiness

# Definir para 10 (usa SWAP apenas quando necessário)
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

### 2. Limitar Uso de Memória do Docker

Editar `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "memlock": {
      "Name": "memlock",
      "Hard": -1,
      "Soft": -1
    }
  }
}
```

Reiniciar Docker:
```bash
systemctl restart docker
```

### 3. Desabilitar Serviços Desnecessários

```bash
# Ver serviços ativos
systemctl list-units --type=service --state=running

# Desabilitar snapd (se não usar)
systemctl disable snapd
systemctl stop snapd

# Desabilitar ModemManager (se não usar)
systemctl disable ModemManager
systemctl stop ModemManager
```

### 4. Configurar Limites de Memória

Editar `/etc/security/limits.conf`:

```
* soft memlock unlimited
* hard memlock unlimited
```

---

## 📈 Monitorar Memória

### Comando Simples

```bash
# Ver uso de memória
free -h

# Ver em tempo real
watch -n 1 free -h
```

### Comando Detalhado

```bash
# Top 10 processos por memória
ps aux --sort=-%mem | head -10

# Ver uso por container Docker
docker stats --no-stream

# Ver histórico de OOM (processos mortos)
dmesg | grep -i "killed process"
```

### Instalar htop (Recomendado)

```bash
apt-get install -y htop

# Executar
htop
```

Teclas úteis no htop:
- `F6` - Ordenar por memória
- `F9` - Matar processo
- `F10` - Sair

---

## 🚨 Sinais de Problema de Memória

### Sintomas:

- ❌ Processos morrem aleatoriamente
- ❌ Servidor trava ou fica lento
- ❌ SSH desconecta sozinho
- ❌ Docker containers param
- ❌ Erro 137 em instalações

### Verificar Logs:

```bash
# Ver processos mortos por OOM
dmesg | grep -i "out of memory"
dmesg | grep -i "killed process"

# Ver logs do sistema
journalctl -xe | grep -i "memory"

# Ver logs do kernel
tail -f /var/log/kern.log
```

---

## 📊 Requisitos de Memória

### Por Tipo de Servidor:

| Uso | RAM Mínima | RAM Recomendada |
|-----|------------|-----------------|
| Servidor básico | 512MB | 1GB |
| Servidor web (Nginx) | 1GB | 2GB |
| Servidor com Docker | 2GB | 4GB |
| Servidor de produção | 4GB | 8GB |

### Por Aplicação:

| Aplicação | Memória |
|-----------|---------|
| Nginx | ~10MB |
| Node.js app | 50-200MB |
| MongoDB | 100-500MB |
| PostgreSQL | 100-500MB |
| Docker daemon | 50-100MB |
| Container Docker | 50-500MB cada |

---

## 🎯 Checklist de Resolução

- [ ] Verificar memória disponível: `free -h`
- [ ] Criar SWAP se não existir
- [ ] Limpar cache: `apt-get clean`
- [ ] Parar serviços desnecessários
- [ ] Instalar pacotes em etapas
- [ ] Usar script otimizado
- [ ] Considerar upgrade se < 1GB RAM
- [ ] Configurar swappiness
- [ ] Monitorar uso de memória
- [ ] ✅ Provisioning funcionando!

---

## 💡 Dicas

1. **Sempre crie SWAP** em servidores com < 2GB RAM
2. **Monitore a memória** regularmente com `htop`
3. **Limite recursos** dos containers Docker
4. **Desabilite serviços** que não usa
5. **Faça upgrade** se o servidor ficar constantemente sem memória

---

## 🆘 Ainda com Problemas?

### Opção 1: Usar Servidor Maior

Considere fazer upgrade para um plano com mais RAM.

### Opção 2: Provisionar Manualmente

Execute os comandos um por um via SSH em vez de usar script automático.

### Opção 3: Usar Servidor Pré-configurado

Alguns provedores oferecem imagens pré-configuradas com Docker, Node.js, etc.

---

**🎉 Com SWAP configurado, o erro 137 deve desaparecer!**
