#!/bin/bash

echo "🔍 Diagnóstico do Nginx"
echo "======================="
echo ""

echo "1. Container Nginx está rodando?"
docker ps | grep nginx-proxy
echo ""

echo "2. Porta 80 está mapeada?"
docker port nginx-proxy
echo ""

echo "3. Arquivos de configuração existem?"
ls -la /opt/nginx/conf.d/
echo ""

echo "4. Conteúdo da configuração do projeto:"
cat /opt/nginx/conf.d/*.conf 2>/dev/null || echo "Nenhuma configuração encontrada"
echo ""

echo "5. Nginx está escutando na porta 80?"
netstat -tulpn | grep :80 || ss -tulpn | grep :80
echo ""

echo "6. Logs do Nginx:"
docker logs --tail 20 nginx-proxy
echo ""

echo "7. Teste de configuração do Nginx:"
docker exec nginx-proxy nginx -t
echo ""

echo "8. Processos dentro do container:"
docker exec nginx-proxy ps aux
echo ""

echo "9. Testar acesso local:"
curl -I http://localhost
echo ""

echo "10. Testar com domínio:"
curl -I -H "Host: 1zapc6j1sdcf7mchyjkaxf.38.242.213.195.sslip.io" http://localhost
echo ""
