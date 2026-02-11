import { NodeSSH } from 'node-ssh';

export class NginxService {
  /**
   * Garante que o Nginx está instalado no servidor
   */
  static async ensureNginxInstalled(ssh: NodeSSH): Promise<void> {
    console.log('📦 Verificando Nginx...');
    
    const checkResult = await ssh.execCommand('which nginx');
    
    if (checkResult.code !== 0) {
      console.log('📦 Instalando Nginx...');
      await ssh.execCommand('apt-get update && apt-get install -y nginx');
      console.log('✅ Nginx instalado');
    } else {
      console.log('✅ Nginx já instalado');
    }
  }

  /**
   * Configura proxy reverso para um projeto
   */
  static async configureProxy(
    ssh: NodeSSH,
    projectName: string,
    domain: string,
    containerName: string,
    port: number
  ): Promise<void> {
    console.log(`📝 Configurando proxy Nginx para ${domain}...`);
    
    // Garantir que Nginx está instalado
    await this.ensureNginxInstalled(ssh);
    
    // Verificar se container está rodando
    const containerCheck = await ssh.execCommand(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`);
    if (!containerCheck.stdout.trim()) {
      throw new Error(`Container ${containerName} não está rodando`);
    }
    
    console.log(`🔍 Container encontrado: ${containerName}`);
    
    // Obter IP do container na rede coolify
    const ipResult = await ssh.execCommand(
      `docker inspect ${containerName} --format '{{range $key, $value := .NetworkSettings.Networks}}{{if eq $key "coolify"}}{{$value.IPAddress}}{{end}}{{end}}'`
    );
    
    let containerIp = ipResult.stdout.trim();
    
    // Se não tiver IP na rede coolify, tentar outras redes
    if (!containerIp) {
      console.log('⚠️  Container não está na rede coolify, buscando em outras redes...');
      const allIpsResult = await ssh.execCommand(
        `docker inspect ${containerName} --format '{{range $key, $value := .NetworkSettings.Networks}}{{$value.IPAddress}}{{println}}{{end}}' | head -n 1`
      );
      containerIp = allIpsResult.stdout.trim();
    }
    
    if (!containerIp) {
      throw new Error('Container não tem IP. Verifique se está rodando.');
    }
    
    console.log(`📡 IP do container ${containerName}: ${containerIp}`);
    
    // Remover TODAS as configurações antigas deste projeto (por nome e domínio)
    console.log(`🗑️  Removendo configurações antigas para ${projectName}...`);
    await ssh.execCommand(`rm -f /etc/nginx/sites-enabled/${projectName}*`);
    await ssh.execCommand(`rm -f /etc/nginx/sites-available/${projectName}*`);
    
    // Remover também por domínio (caso tenha sido criado com nome diferente)
    const domainSafe = domain.replace(/[^a-zA-Z0-9.-]/g, '_');
    await ssh.execCommand(`rm -f /etc/nginx/sites-enabled/${domainSafe}*`);
    await ssh.execCommand(`rm -f /etc/nginx/sites-available/${domainSafe}*`);
    
    // Criar nova configuração do Nginx
    const nginxConfig = `server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://${containerIp}:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }
}`;
    
    // Salvar configuração
    await ssh.execCommand(`cat > /etc/nginx/sites-available/${projectName} << 'EOF'
${nginxConfig}
EOF`);
    
    // Ativar site
    await ssh.execCommand(`ln -sf /etc/nginx/sites-available/${projectName} /etc/nginx/sites-enabled/${projectName}`);
    
    // Testar configuração
    const testResult = await ssh.execCommand('nginx -t');
    
    if (testResult.code !== 0) {
      throw new Error(`Erro na configuração do Nginx: ${testResult.stderr}`);
    }
    
    // Recarregar Nginx
    await ssh.execCommand('systemctl reload nginx || systemctl restart nginx');
    
    console.log(`✅ Proxy Nginx configurado: ${domain} → ${containerIp}:${port}`);
  }

  /**
   * Remove configuração de proxy de um projeto
   */
  static async removeProxy(ssh: NodeSSH, projectName: string): Promise<void> {
    console.log(`🗑️  Removendo configuração Nginx para ${projectName}...`);
    
    await ssh.execCommand(`rm -f /etc/nginx/sites-enabled/${projectName}`);
    await ssh.execCommand(`rm -f /etc/nginx/sites-available/${projectName}`);
    await ssh.execCommand('systemctl reload nginx || true');
    
    console.log('✅ Configuração removida');
  }

  /**
   * Atualiza configuração de proxy (quando IP do container muda)
   */
  static async updateProxy(
    ssh: NodeSSH,
    projectName: string,
    domain: string,
    containerName: string,
    port: number
  ): Promise<void> {
    // Remove configuração antiga
    await this.removeProxy(ssh, projectName);
    
    // Cria nova configuração
    await this.configureProxy(ssh, projectName, domain, containerName, port);
  }
}
