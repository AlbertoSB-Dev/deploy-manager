# 🔓 Como Desbanir TODOS os IPs

## 🚀 Método Rápido (Console Web)

### 1. Acessar Console do Provedor

**DigitalOcean**: Droplets → Seu servidor → Console  
**Vultr**: Servers → Seu servidor → View Console  
**Linode**: Linodes → Seu servidor → Launch LISH Console  
**AWS**: EC2 → Instances → Connect → EC2 Serial Console  
**Contabo**: VPS Control Panel → VNC Console  

### 2. Fazer Login

```bash
# Login como root
login: root
password: [sua senha root]
```

### 3. Executar Comandos

Copie e cole estes comandos no console:

```bash
# ============================================
# OPÇÃO 1: Fail2Ban (Mais Comum)
# ============================================

# Ver IPs banidos
fail2ban-client status sshd

# Desbanir TODOS os IPs do SSH
fail2ban-client unban --all

# Verificar
fail2ban-client status sshd


# ============================================
# OPÇÃO 2: CSF (ConfigServer Firewall)
# ============================================

# Desbanir todos os IPs temporários
csf -tf

# Desbanir todos os IPs permanentes
csf -df

# Reiniciar firewall
csf -r


# ============================================
# OPÇÃO 3: iptables (Manual)
# ============================================

# Ver regras
iptables -L INPUT -n --line-numbers

# Limpar TODAS as regras de DROP
iptables -F INPUT

# Salvar
iptables-save > /etc/iptables/rules.v4


# ============================================
# OPÇÃO 4: UFW (Ubuntu)
# ============================================

# Desabilitar temporariamente
ufw disable

# Reabilitar
ufw enable


# ============================================
# OPÇÃO 5: Limpar hosts.deny
# ============================================

# Backup
cp /etc/hosts.deny /root/hosts.deny.backup

# Limpar
echo "" > /etc/hosts.deny
```

---

## 📜 Usando o Script Automático

### 1. Baixar o Script

No console do servidor:

```bash
# Criar o script
cat > /root/unban-all.sh << 'EOF'
#!/bin/bash

echo "🔓 Desbloqueando TODOS os IPs..."

# Fail2Ban
if command -v fail2ban-client &> /dev/null; then
    echo "Liberando Fail2Ban..."
    fail2ban-client unban --all
    echo "✅ Fail2Ban liberado"
fi

# CSF
if command -v csf &> /dev/null; then
    echo "Liberando CSF..."
    csf -tf
    csf -df
    csf -r
    echo "✅ CSF liberado"
fi

# iptables
echo "Limpando iptables..."
iptables -F INPUT
echo "✅ iptables limpo"

# hosts.deny
if [ -f /etc/hosts.deny ]; then
    echo "Limpando hosts.deny..."
    cp /etc/hosts.deny /root/hosts.deny.backup
    echo "" > /etc/hosts.deny
    echo "✅ hosts.deny limpo"
fi

echo ""
echo "🎉 Todos os IPs foram liberados!"
EOF

# Dar permissão
chmod +x /root/unban-all.sh

# Executar
/root/unban-all.sh
```

---

## 🔥 Solução de Emergência (Desabilitar Tudo)

Se nada funcionar, desabilite temporariamente TODOS os firewalls:

```bash
# Parar Fail2Ban
systemctl stop fail2ban

# Desabilitar CSF
csf -x

# Desabilitar UFW
ufw disable

# Limpar iptables
iptables -F
iptables -X
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT

# Agora você consegue conectar!
```

**⚠️ IMPORTANTE**: Depois de conectar, reative a segurança:

```bash
# Reativar Fail2Ban
systemctl start fail2ban

# Reativar CSF
csf -e

# Reativar UFW
ufw enable
```

---

## 🛡️ Adicionar seu IP à Whitelist

Para nunca mais ser banido:

### Fail2Ban

Editar `/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
ignoreip = 127.0.0.1/8 SEU_IP_AQUI

[sshd]
enabled = true
ignoreip = 127.0.0.1/8 SEU_IP_AQUI
```

Reiniciar:
```bash
systemctl restart fail2ban
```

### CSF

Adicionar ao arquivo `/etc/csf/csf.allow`:

```
SEU_IP_AQUI
```

Reiniciar:
```bash
csf -r
```

### UFW

```bash
ufw allow from SEU_IP_AQUI
```

---

## 🔍 Descobrir seu IP

```bash
# No seu computador local (Windows)
curl ifconfig.me

# Ou
curl icanhazip.com
```

---

## 📞 Comandos Úteis

### Ver IPs Banidos

```bash
# Fail2Ban
fail2ban-client status sshd

# CSF
csf -g IP_AQUI

# iptables
iptables -L INPUT -n | grep DROP

# hosts.deny
cat /etc/hosts.deny
```

### Desbanir IP Específico

```bash
# Fail2Ban
fail2ban-client set sshd unbanip SEU_IP

# CSF
csf -dr SEU_IP

# iptables (encontrar número da regra primeiro)
iptables -L INPUT -n --line-numbers
iptables -D INPUT NUMERO_DA_REGRA
```

---

## 🆘 Ainda Não Consegue Acessar?

### 1. Verificar se SSH está rodando

```bash
systemctl status sshd
systemctl start sshd
```

### 2. Verificar porta SSH

```bash
netstat -tlnp | grep :22
```

### 3. Verificar logs

```bash
tail -f /var/log/auth.log
# ou
tail -f /var/log/secure
```

### 4. Testar conexão

```bash
# Do seu computador
ssh -v root@SEU_SERVIDOR_IP
```

---

## 🎯 Checklist Rápido

- [ ] Acessei o console web do provedor
- [ ] Fiz login como root
- [ ] Executei `fail2ban-client unban --all`
- [ ] Executei `csf -tf && csf -df`
- [ ] Limpei iptables com `iptables -F INPUT`
- [ ] Limpei `/etc/hosts.deny`
- [ ] Adicionei meu IP à whitelist
- [ ] Testei conexão SSH
- [ ] ✅ Consegui conectar!

---

## 💡 Dicas

1. **Use 4G do celular** se seu IP fixo estiver banido
2. **Sempre faça backup** antes de mexer no firewall
3. **Adicione seu IP à whitelist** para evitar banimentos
4. **Use chave SSH** em vez de senha (mais seguro)
5. **Configure alertas** para saber quando for banido

---

**🎉 Pronto! Agora você deve conseguir acessar seu servidor!**
