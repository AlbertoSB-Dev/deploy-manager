import { NodeSSH } from 'node-ssh';

export class TraefikService {
  /**
   * Gera labels do Traefik para um container
   * Compatível com Coolify/Traefik existente
   */
  static generateTraefikLabels(
    projectName: string,
    domain: string,
    internalPort: number = 3000
  ): string[] {
    // Sanitizar nome do projeto para usar como identificador
    const serviceName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    return [
      // Habilitar Traefik
      `--label "traefik.enable=true"`,
      
      // Definir a rede do Traefik (Coolify usa 'coolify')
      `--label "traefik.docker.network=coolify"`,
      
      // Router HTTP (escapar crases para bash)
      `--label "traefik.http.routers.${serviceName}.rule=Host(\\\`${domain}\\\`)"`,
      `--label "traefik.http.routers.${serviceName}.entrypoints=http"`,
      
      // Service (porta interna do container)
      `--label "traefik.http.services.${serviceName}.loadbalancer.server.port=${internalPort}"`,
      
      // Middleware para headers (opcional mas recomendado)
      `--label "traefik.http.middlewares.${serviceName}-headers.headers.customrequestheaders.X-Forwarded-Proto=http"`,
    ];
  }

  /**
   * Verifica se Traefik está rodando no servidor
   */
  static async checkTraefik(ssh: NodeSSH): Promise<boolean> {
    console.log('🔍 Verificando Traefik no servidor...');
    
    // Verificar se container do Traefik existe
    const result = await ssh.execCommand('docker ps --filter name=coolify-proxy --format "{{.Names}}"');
    
    if (result.stdout.includes('coolify-proxy')) {
      console.log('✅ Traefik (Coolify) encontrado e rodando');
      return true;
    }
    
    // Tentar outros nomes comuns do Traefik
    const altResult = await ssh.execCommand('docker ps --filter name=traefik --format "{{.Names}}"');
    
    if (altResult.stdout.includes('traefik')) {
      console.log('✅ Traefik encontrado e rodando');
      return true;
    }
    
    console.log('⚠️  Traefik não encontrado');
    return false;
  }

  /**
   * Verifica se a rede do Coolify existe
   */
  static async ensureCoolifyNetwork(ssh: NodeSSH): Promise<void> {
    console.log('🔍 Verificando rede do Coolify...');
    
    // Verificar se rede existe
    const checkResult = await ssh.execCommand('docker network ls --filter name=coolify --format "{{.Name}}"');
    
    if (checkResult.stdout.includes('coolify')) {
      console.log('✅ Rede coolify já existe');
      return;
    }
    
    // Criar rede se não existir
    console.log('📡 Criando rede coolify...');
    const createResult = await ssh.execCommand('docker network create coolify');
    
    if (createResult.code !== 0) {
      console.warn('⚠️  Aviso: Não foi possível criar rede coolify:', createResult.stderr);
      // Não falha - pode ser que a rede já exista com outro nome
    } else {
      console.log('✅ Rede coolify criada');
    }
  }

  /**
   * Conecta um container existente à rede do Coolify
   */
  static async connectToNetwork(ssh: NodeSSH, containerId: string): Promise<void> {
    console.log(`🔗 Conectando container à rede coolify...`);
    
    // Verificar se já está conectado
    const checkResult = await ssh.execCommand(
      `docker inspect ${containerId} --format '{{range .NetworkSettings.Networks}}{{.NetworkID}}{{end}}'`
    );
    
    // Tentar conectar (ignora erro se já estiver conectado)
    const connectResult = await ssh.execCommand(
      `docker network connect coolify ${containerId} 2>&1 || true`
    );
    
    if (connectResult.stdout.includes('already exists')) {
      console.log('✅ Container já está na rede coolify');
    } else if (connectResult.code === 0) {
      console.log('✅ Container conectado à rede coolify');
    } else {
      console.warn('⚠️  Aviso ao conectar à rede:', connectResult.stderr);
    }
  }

  /**
   * Testa se o domínio está acessível via Traefik
   */
  static async testDomain(ssh: NodeSSH, domain: string): Promise<boolean> {
    console.log(`🧪 Testando acesso ao domínio: ${domain}`);
    
    // Fazer requisição HTTP local para testar
    const result = await ssh.execCommand(
      `curl -s -o /dev/null -w "%{http_code}" -H "Host: ${domain}" http://localhost/ || echo "000"`
    );
    
    const statusCode = result.stdout.trim();
    
    // 200, 301, 302 = funcionando perfeitamente
    if (statusCode === '200' || statusCode === '301' || statusCode === '302') {
      console.log(`✅ Domínio respondendo (HTTP ${statusCode})`);
      return true;
    }
    
    // 502, 503, 504 = Traefik está roteando, mas container ainda iniciando
    if (statusCode === '502' || statusCode === '503' || statusCode === '504') {
      console.log(`⏳ Traefik está roteando (HTTP ${statusCode}) - container iniciando...`);
      return true; // Considera sucesso pois Traefik está funcionando
    }
    
    console.log(`⚠️  Domínio não respondeu corretamente (HTTP ${statusCode})`);
    return false;
  }

  /**
   * Lista todos os containers gerenciados pelo Traefik
   */
  static async listTraefikServices(ssh: NodeSSH): Promise<string[]> {
    const result = await ssh.execCommand(
      'docker ps --filter "label=traefik.enable=true" --format "{{.Names}}"'
    );
    
    return result.stdout.split('\n').filter(name => name.trim());
  }

  /**
   * Remove container da rede do Traefik
   */
  static async disconnectFromNetwork(ssh: NodeSSH, containerId: string): Promise<void> {
    console.log(`🔌 Desconectando container da rede coolify...`);
    
    await ssh.execCommand(`docker network disconnect coolify ${containerId} 2>&1 || true`);
    
    console.log('✅ Container desconectado');
  }

  /**
   * Obtém informações sobre o Traefik
   */
  static async getTraefikInfo(ssh: NodeSSH): Promise<any> {
    const info: any = {
      running: false,
      containerName: null,
      networks: [],
      services: []
    };
    
    // Verificar container
    const containerResult = await ssh.execCommand(
      'docker ps --filter name=coolify-proxy --format "{{.Names}}" || docker ps --filter name=traefik --format "{{.Names}}"'
    );
    
    if (containerResult.stdout.trim()) {
      info.running = true;
      info.containerName = containerResult.stdout.trim();
    }
    
    // Listar redes
    const networkResult = await ssh.execCommand(
      'docker network ls --filter name=coolify --format "{{.Name}}"'
    );
    
    info.networks = networkResult.stdout.split('\n').filter(n => n.trim());
    
    // Listar serviços
    info.services = await this.listTraefikServices(ssh);
    
    return info;
  }
}
