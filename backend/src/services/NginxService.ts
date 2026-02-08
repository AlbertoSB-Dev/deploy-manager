import { NodeSSH } from 'node-ssh';

export class NginxService {
  /**
   * Garante que o Nginx proxy está instalado e rodando no servidor
   */
  static async ensureNginxProxy(ssh: NodeSSH): Promise<void> {
    console.log('🔍 Verificando se Nginx proxy está instalado...');
    
    // Verificar se container existe (rodando ou parado)
    const checkExistsResult = await ssh.execCommand('docker ps -a --filter name=nginx-proxy --format "{{.Names}}"');
    
    if (checkExistsResult.stdout.includes('nginx-proxy')) {
      console.log('📦 Container nginx-proxy já existe');
      
      // Verificar se está rodando
      const checkRunningResult = await ssh.execCommand('docker ps --filter name=nginx-proxy --format "{{.Names}}"');
      
      if (checkRunningResult.stdout.includes('nginx-proxy')) {
        console.log('✅ Nginx proxy já está rodando');
        return;
      }
      
      // Container existe mas está parado - iniciar
      console.log('▶️  Iniciando container nginx-proxy existente...');
      const startResult = await ssh.execCommand('docker start nginx-proxy');
      
      if (startResult.code === 0) {
        console.log('✅ Nginx proxy iniciado com sucesso');
        return;
      }
      
      // Se falhou ao iniciar, remover e recriar
      console.log('⚠️  Falha ao iniciar, removendo container antigo...');
      await ssh.execCommand('docker rm -f nginx-proxy');
    }

    console.log('📦 Instalando Nginx proxy...');

    // Criar diretórios
    console.log('📁 Criando diretórios...');
    await ssh.execCommand('mkdir -p /opt/nginx/conf.d');
    await ssh.execCommand('mkdir -p /opt/nginx/logs');

    // Criar nginx.conf
    console.log('📝 Criando nginx.conf...');
    const nginxConf = `
events {
    worker_connections 1024;
}

http {
    client_max_body_size 100M;
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    server {
        listen 80 default_server;
        server_name _;
        
        location / {
            return 404 "Domínio não configurado no proxy";
        }
    }

    include /etc/nginx/conf.d/*.conf;
}
`;

    const createConfResult = await ssh.execCommand(`cat > /opt/nginx/nginx.conf << 'EOF'
${nginxConf}
EOF`);
    
    if (createConfResult.code !== 0) {
      console.error('❌ Erro ao criar nginx.conf:', createConfResult.stderr);
      throw new Error(`Erro ao criar nginx.conf: ${createConfResult.stderr}`);
    }

    // Iniciar container Nginx
    console.log('🚀 Iniciando container Nginx...');
    const runResult = await ssh.execCommand(`
      docker run -d \
        --name nginx-proxy \
        --restart unless-stopped \
        -p 80:80 \
        -v /opt/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
        -v /opt/nginx/conf.d:/etc/nginx/conf.d:ro \
        -v /opt/nginx/logs:/var/log/nginx \
        nginx:alpine
    `);

    if (runResult.code !== 0) {
      console.error('❌ Erro ao iniciar Nginx:', runResult.stderr);
      throw new Error(`Erro ao iniciar Nginx: ${runResult.stderr}`);
    }

    console.log('✅ Nginx proxy instalado com sucesso!');
    console.log('Container ID:', runResult.stdout.trim());
  }

  /**
   * Cria configuração do Nginx para um projeto
   */
  static async configureProject(
    ssh: NodeSSH,
    projectName: string,
    domain: string,
    port: number
  ): Promise<void> {
    console.log(`📝 Criando configuração Nginx para ${projectName}...`);
    console.log(`   Domínio: ${domain}`);
    console.log(`   Porta: ${port}`);
    
    const nginxConfig = `
server {
    listen 80;
    server_name ${domain};

    # Logs específicos do projeto
    access_log /var/log/nginx/${projectName}-access.log;
    error_log /var/log/nginx/${projectName}-error.log;

    location / {
        # Proxy para o container
        proxy_pass http://172.17.0.1:${port};
        
        # Headers necessários
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }
}
`;

    // Criar arquivo de configuração
    const createResult = await ssh.execCommand(`cat > /opt/nginx/conf.d/${projectName}.conf << 'EOF'
${nginxConfig}
EOF`);
    
    if (createResult.code !== 0) {
      console.error('❌ Erro ao criar config:', createResult.stderr);
      throw new Error(`Erro ao criar configuração: ${createResult.stderr}`);
    }
    
    console.log(`✅ Arquivo criado: /opt/nginx/conf.d/${projectName}.conf`);

    // Verificar se arquivo foi criado
    const verifyResult = await ssh.execCommand(`ls -la /opt/nginx/conf.d/${projectName}.conf`);
    console.log('📄 Verificação:', verifyResult.stdout);

    // Testar configuração do Nginx
    console.log('🧪 Testando configuração do Nginx...');
    const testResult = await ssh.execCommand('docker exec nginx-proxy nginx -t');
    
    if (testResult.code !== 0) {
      console.error('❌ Erro na configuração do Nginx:', testResult.stderr);
      throw new Error(`Configuração inválida: ${testResult.stderr}`);
    }
    
    console.log('✅ Configuração válida');

    // Recarregar Nginx
    console.log('🔄 Recarregando Nginx...');
    const reloadResult = await ssh.execCommand('docker exec nginx-proxy nginx -s reload');
    
    if (reloadResult.code !== 0) {
      console.error('⚠️  Erro ao recarregar Nginx:', reloadResult.stderr);
      throw new Error(`Erro ao recarregar: ${reloadResult.stderr}`);
    }
    
    console.log('✅ Nginx recarregado com sucesso');
    console.log(`🌐 Acesse: http://${domain}`);
  }

  /**
   * Remove configuração do Nginx para um projeto
   */
  static async removeProject(ssh: NodeSSH, projectName: string): Promise<void> {
    // Remover arquivo de configuração
    await ssh.execCommand(`rm -f /opt/nginx/conf.d/${projectName}.conf`);

    // Recarregar Nginx
    await ssh.execCommand('docker exec nginx-proxy nginx -s reload || true');
    
    console.log(`✅ Configuração Nginx removida para ${projectName}`);
  }

  /**
   * Testa se o Nginx está funcionando
   */
  static async testNginx(ssh: NodeSSH): Promise<boolean> {
    const result = await ssh.execCommand('docker exec nginx-proxy nginx -t');
    return result.code === 0;
  }
}
