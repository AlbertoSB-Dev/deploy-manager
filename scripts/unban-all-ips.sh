#!/bin/bash

# Script para Desbanir TODOS os IPs
# Execute no servidor VPS como root

echo "🔓 Desbloqueando TODOS os IPs banidos..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 1. FAIL2BAN
# ============================================
if command -v fail2ban-client &> /dev/null; then
    echo -e "${YELLOW}📋 Fail2Ban detectado${NC}"
    
    # Listar todas as jails
    jails=$(fail2ban-client status | grep "Jail list" | sed -E 's/^[^:]+:[ \t]+//' | sed 's/,//g')
    
    for jail in $jails; do
        echo -e "${YELLOW}  Processando jail: $jail${NC}"
        
        # Pegar IPs banidos
        banned_ips=$(fail2ban-client status $jail | grep "Banned IP list" | sed -E 's/^[^:]+:[ \t]+//')
        
        if [ -z "$banned_ips" ]; then
            echo -e "    ${GREEN}✓${NC} Nenhum IP banido"
        else
            # Desbanir cada IP
            for ip in $banned_ips; do
                fail2ban-client set $jail unbanip $ip
                echo -e "    ${GREEN}✓${NC} Desbanido: $ip"
            done
        fi
    done
    
    echo -e "${GREEN}✅ Fail2Ban: Todos os IPs liberados${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Fail2Ban não instalado${NC}"
    echo ""
fi

# ============================================
# 2. CSF (ConfigServer Firewall)
# ============================================
if command -v csf &> /dev/null; then
    echo -e "${YELLOW}📋 CSF detectado${NC}"
    
    # Desbanir todos os IPs temporários
    csf -tf
    echo -e "${GREEN}✓ IPs temporários liberados${NC}"
    
    # Desbanir todos os IPs permanentes (cuidado!)
    # Comentado por segurança - descomente se necessário
    # csf -df
    # echo -e "${GREEN}✓ IPs permanentes liberados${NC}"
    
    # Reiniciar CSF
    csf -r
    echo -e "${GREEN}✅ CSF: Firewall reiniciado${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  CSF não instalado${NC}"
    echo ""
fi

# ============================================
# 3. IPTABLES (Limpar regras de DROP)
# ============================================
echo -e "${YELLOW}📋 Verificando iptables${NC}"

# Contar regras de DROP
drop_count=$(iptables -L INPUT -n | grep -c DROP)

if [ $drop_count -gt 0 ]; then
    echo -e "${YELLOW}  Encontradas $drop_count regras de DROP${NC}"
    
    # Backup das regras atuais
    iptables-save > /root/iptables-backup-$(date +%Y%m%d-%H%M%S).rules
    echo -e "${GREEN}✓ Backup criado em /root/${NC}"
    
    # Remover regras de DROP (mantém ACCEPT e outras)
    # CUIDADO: Isso pode afetar outras regras de segurança
    echo -e "${RED}⚠️  Removendo regras de DROP...${NC}"
    
    # Listar e remover regras de DROP do INPUT
    iptables -L INPUT -n --line-numbers | grep DROP | awk '{print $1}' | tac | while read line; do
        iptables -D INPUT $line
        echo -e "  ${GREEN}✓${NC} Regra $line removida"
    done
    
    echo -e "${GREEN}✅ iptables: Regras de DROP removidas${NC}"
    echo ""
else
    echo -e "${GREEN}✓ Nenhuma regra de DROP encontrada${NC}"
    echo ""
fi

# ============================================
# 4. UFW (Ubuntu Firewall)
# ============================================
if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}📋 UFW detectado${NC}"
    
    # Verificar se UFW está ativo
    if ufw status | grep -q "Status: active"; then
        echo -e "${YELLOW}  UFW está ativo${NC}"
        
        # Resetar UFW (remove todas as regras customizadas)
        # CUIDADO: Isso remove TODAS as regras
        echo -e "${RED}⚠️  Deseja resetar UFW? (remove todas as regras)${NC}"
        echo -e "${YELLOW}  Executando reset...${NC}"
        
        # Backup
        cp /etc/ufw/user.rules /root/ufw-backup-$(date +%Y%m%d-%H%M%S).rules
        
        # Reset (comentado por segurança)
        # ufw --force reset
        # ufw --force enable
        # ufw allow 22/tcp
        # ufw allow 80/tcp
        # ufw allow 443/tcp
        
        echo -e "${YELLOW}⚠️  UFW reset comentado por segurança${NC}"
        echo -e "${YELLOW}  Descomente no script se necessário${NC}"
    else
        echo -e "${GREEN}✓ UFW não está ativo${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  UFW não instalado${NC}"
    echo ""
fi

# ============================================
# 5. DENYHOSTS
# ============================================
if [ -f /etc/hosts.deny ]; then
    echo -e "${YELLOW}📋 Verificando /etc/hosts.deny${NC}"
    
    deny_count=$(grep -c "sshd:" /etc/hosts.deny 2>/dev/null || echo "0")
    
    if [ $deny_count -gt 0 ]; then
        # Backup
        cp /etc/hosts.deny /root/hosts.deny-backup-$(date +%Y%m%d-%H%M%S)
        
        # Remover entradas sshd
        sed -i '/sshd:/d' /etc/hosts.deny
        
        echo -e "${GREEN}✅ /etc/hosts.deny: $deny_count entradas removidas${NC}"
    else
        echo -e "${GREEN}✓ Nenhuma entrada em hosts.deny${NC}"
    fi
    echo ""
fi

# ============================================
# RESUMO
# ============================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ PROCESSO CONCLUÍDO${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 Backups criados em /root/${NC}"
echo ""
echo -e "${YELLOW}🔍 Verificar status:${NC}"
echo "  • Fail2Ban: fail2ban-client status"
echo "  • CSF: csf -l"
echo "  • iptables: iptables -L -n"
echo "  • UFW: ufw status"
echo ""
echo -e "${GREEN}🎉 Todos os IPs foram liberados!${NC}"
echo ""
