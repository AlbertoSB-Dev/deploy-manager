import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { GitService } from './GitService';
import { DockerService } from './DockerService';
import Project, { IProject } from '../models/Project';
import { Server } from '../models/Server';
import { sshService } from './SSHService';
import { io } from '../index';

const execAsync = promisify(exec);

export class DeployService {
  private dockerService: DockerService;

  constructor() {
    this.dockerService = new DockerService();
  }

  private emitLog(projectId: string, message: string) {
    console.log(message);
    io.to(`deploy-${projectId}`).emit('deploy-log', {
      message,
      timestamp: new Date().toISOString()
    });
  }

  async deployProject(projectId: string, version?: string, deployedBy: string = 'system'): Promise<any> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Projeto não encontrado');

    // Verificar se é deploy remoto
    if (project.serverId) {
      return this.deployRemote(project, version, deployedBy);
    } else {
      return this.deployLocal(project, version, deployedBy);
    }
  }

  private async deployRemote(project: IProject, version?: string, deployedBy: string = 'system'): Promise<any> {
    console.log('🚀 Deploy Remoto - Versão recebida:', version);
    
    const server = await Server.findById(project.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    project.status = 'deploying';
    await project.save();

    let logs = '';
    
    try {
      this.emitLog(project._id.toString(), `🌐 Conectando ao servidor ${server.name}...`);
      logs += `🌐 Conectando ao servidor ${server.name}...\n`;
      
      const ssh = await sshService.connect(server);
      
      // Diretório do projeto no servidor remoto
      const remoteProjectPath = `/opt/projects/${project.name}`;
      
      // 1. Clonar ou atualizar repositório
      this.emitLog(project._id.toString(), '📡 Clonando/atualizando repositório no servidor remoto...');
      logs += '📡 Clonando/atualizando repositório no servidor remoto...\n';
      
      // Preparar URL do Git (adicionar token se disponível)
      let gitUrl = project.gitUrl;
      if (project.gitAuth?.type === 'token' && project.gitAuth.token) {
        // Adicionar token na URL para autenticação
        this.emitLog(project._id.toString(), '🔐 Usando token de autenticação GitHub...');
        logs += '🔐 Usando token de autenticação GitHub...\n';
        gitUrl = gitUrl.replace('https://', `https://${project.gitAuth.token}@`);
      } else {
        this.emitLog(project._id.toString(), '⚠️ Nenhum token encontrado - repositório deve ser público');
        logs += '⚠️ Nenhum token encontrado - repositório deve ser público\n';
      }
      
      const cloneResult = await ssh.execCommand(`
        if [ -d "${remoteProjectPath}" ]; then
          cd ${remoteProjectPath} && git fetch && git checkout ${project.branch} && git pull
        else
          GIT_TERMINAL_PROMPT=0 git clone ${gitUrl} ${remoteProjectPath} && cd ${remoteProjectPath} && git checkout ${project.branch}
        fi
      `);
      
      if (cloneResult.code !== 0) {
        throw new Error(`Erro ao clonar repositório: ${cloneResult.stderr}`);
      }
      
      // 2. Obter commit atual
      const commitResult = await ssh.execCommand(`cd ${remoteProjectPath} && git rev-parse HEAD`);
      const commit = commitResult.stdout.trim();
      
      // 3. Criar arquivo .env com PORT configurada
      this.emitLog(project._id.toString(), '📝 Configurando variáveis de ambiente...');
      logs += '📝 Configurando variáveis de ambiente...\n';
      
      // Adicionar PORT às variáveis de ambiente
      const allEnvVars = {
        ...project.envVars,
        PORT: project.port?.toString() || '3000', // Garantir que PORT seja definida
      };
      
      const envContent = Object.entries(allEnvVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\\n');
      
      await ssh.execCommand(`echo "${envContent}" > ${remoteProjectPath}/.env`);
      
      // 3.5. Verificar se existe Dockerfile, se não, criar automaticamente
      this.emitLog(project._id.toString(), '📄 Verificando Dockerfile...');
      logs += '📄 Verificando Dockerfile...\n';
      
      const dockerfileCheck = await ssh.execCommand(`test -f ${remoteProjectPath}/Dockerfile && echo "exists" || echo "missing"`);
      
      if (dockerfileCheck.stdout.trim() === 'missing') {
        this.emitLog(project._id.toString(), '📝 Dockerfile não encontrado - gerando automaticamente...');
        logs += '📝 Dockerfile não encontrado - gerando automaticamente...\n';
        
        // Detectar tipo de projeto
        const packageJsonCheck = await ssh.execCommand(`test -f ${remoteProjectPath}/package.json && echo "nodejs" || echo "unknown"`);
        const projectType = packageJsonCheck.stdout.trim() === 'nodejs' ? 'nodejs' : 'generic';
        
        // Gerar Dockerfile baseado no tipo
        let dockerfileContent = '';
        
        if (projectType === 'nodejs') {
          // Detectar se é Next.js, React, ou Node puro
          const packageCheck = await ssh.execCommand(`cat ${remoteProjectPath}/package.json | grep -E '"next"|"react-scripts"|"express"' || echo "node"`);
          const packageContent = packageCheck.stdout;
          
          if (packageContent.includes('"next"')) {
            // Next.js
            dockerfileContent = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
ENV PORT=\${PORT:-3000}
RUN npm run build
EXPOSE \${PORT}
CMD ["npm", "start"]`;
          } else if (packageContent.includes('"react-scripts"')) {
            // Create React App
            dockerfileContent = `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/build /usr/share/nginx/html
RUN echo 'server { listen \${PORT:-80}; location / { root /usr/share/nginx/html; try_files \\$uri /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE \${PORT:-80}
CMD ["nginx", "-g", "daemon off;"]`;
          } else {
            // Node.js genérico
            dockerfileContent = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
ENV PORT=\${PORT:-3000}
EXPOSE \${PORT}
CMD ["npm", "start"]`;
          }
        } else {
          // Projeto genérico
          dockerfileContent = `FROM node:20-alpine
WORKDIR /app
COPY . .
ENV PORT=\${PORT:-3000}
EXPOSE \${PORT}
CMD ["node", "index.js"]`;
        }
        
        // Criar Dockerfile no servidor remoto
        await ssh.execCommand(`cat > ${remoteProjectPath}/Dockerfile << 'DOCKERFILE_EOF'
${dockerfileContent}
DOCKERFILE_EOF`);
        
        this.emitLog(project._id.toString(), `✅ Dockerfile criado para projeto ${projectType}`);
        logs += `✅ Dockerfile criado para projeto ${projectType}\n`;
      } else {
        this.emitLog(project._id.toString(), '✅ Dockerfile encontrado');
        logs += '✅ Dockerfile encontrado\n';
      }
      
      // 4. Build da imagem Docker
      this.emitLog(project._id.toString(), '🔨 Construindo imagem Docker no servidor remoto...');
      logs += '🔨 Construindo imagem Docker no servidor remoto...\n';
      
      const buildResult = await ssh.execCommand(`
        cd ${remoteProjectPath} && docker build -t ${project.name}:${commit.substring(0, 8)} .
      `, {
        onStdout: (chunk) => {
          const output = chunk.toString('utf8');
          this.emitLog(project._id.toString(), output.trim());
          logs += output;
        }
      });
      
      if (buildResult.code !== 0) {
        throw new Error(`Erro no build: ${buildResult.stderr}`);
      }
      
      // 5. Parar container antigo (se existir)
      if (project.containerId) {
        this.emitLog(project._id.toString(), '⏸️ Parando container anterior...');
        logs += '⏸️ Parando container anterior...\n';
        await ssh.execCommand(`docker stop ${project.containerId} || true`);
      }
      
      // 6. Iniciar novo container com Traefik
      this.emitLog(project._id.toString(), '🚀 Iniciando novo container...');
      logs += '🚀 Iniciando novo container...\n';
      
      const containerName = `${project.name}-${Date.now()}`;
      // Usar a porta configurada pelo usuário (project.port)
      const internalPort = project.port || 3000;
      
      // Adicionar variáveis de ambiente
      let envVars = '';
      if (project.envVars && typeof project.envVars === 'object') {
        // Converter Map do MongoDB para objeto
        const envVarsObj = project.envVars instanceof Map 
          ? Object.fromEntries(project.envVars) 
          : project.envVars;
        
        const envEntries = Object.entries(envVarsObj);
        if (envEntries.length > 0) {
          envVars = envEntries
            .map(([key, value]) => `-e ${key}="${value}"`)
            .join(' ');
        }
      }
      
      // Configurar proxy reverso (Traefik ou Nginx)
      let traefikLabels = '';
      let useNginxFallback = false;
      
      if (project.domain) {
        this.emitLog(project._id.toString(), '🔧 Configurando proxy reverso...');
        logs += '🔧 Configurando proxy reverso...\n';
        
        const { TraefikService } = await import('./TraefikService');
        
        // Verificar se Traefik está rodando
        const traefikRunning = await TraefikService.isTraefikRunning(ssh);
        
        if (traefikRunning) {
          // Opção 1: Usar Traefik
          this.emitLog(project._id.toString(), '✅ Traefik detectado - usando Traefik');
          logs += '✅ Traefik detectado - usando Traefik\n';
          
          // Detectar e garantir que rede existe
          const networkName = await TraefikService.detectNetwork(ssh);
          await TraefikService.ensureNetwork(networkName, ssh);
          
          // Gerar labels do Traefik
          const labels = await TraefikService.generateLabels(
            project.domain,
            internalPort,
            project.name,
            false // SSL desabilitado por padrão
          );
          
          // Converter labels para formato docker run
          const labelArgs = TraefikService.labelsToDockerArgs(labels);
          traefikLabels = labelArgs.join(' ');
          
          this.emitLog(project._id.toString(), `📡 Configurando domínio: ${project.domain} → porta ${internalPort}`);
          logs += `📡 Configurando domínio: ${project.domain} → porta ${internalPort}\n`;
        } else {
          // Traefik não encontrado - instalar automaticamente
          this.emitLog(project._id.toString(), '📦 Traefik não encontrado - instalando automaticamente...');
          logs += '📦 Traefik não encontrado - instalando automaticamente...\n';
          
          try {
            // Instalar Traefik (passando conexão SSH)
            await TraefikService.setupTraefik(ssh);
            
            this.emitLog(project._id.toString(), '✅ Traefik instalado com sucesso!');
            logs += '✅ Traefik instalado com sucesso!\n';
            
            // Detectar e garantir que rede existe
            const networkName = await TraefikService.detectNetwork(ssh);
            await TraefikService.ensureNetwork(networkName, ssh);
            
            // Gerar labels do Traefik
            const labels = await TraefikService.generateLabels(
              project.domain,
              internalPort,
              project.name,
              false
            );
            
            // Converter labels para formato docker run
            const labelArgs = TraefikService.labelsToDockerArgs(labels);
            traefikLabels = labelArgs.join(' ');
            
            this.emitLog(project._id.toString(), `📡 Configurando domínio: ${project.domain} → porta ${internalPort}`);
            logs += `📡 Configurando domínio: ${project.domain} → porta ${internalPort}\n`;
          } catch (error: any) {
            // Se falhar, usar Nginx como fallback
            this.emitLog(project._id.toString(), `⚠️  Erro ao instalar Traefik: ${error.message}`);
            logs += `⚠️  Erro ao instalar Traefik: ${error.message}\n`;
            this.emitLog(project._id.toString(), '🔄 Usando Nginx como fallback...');
            logs += '🔄 Usando Nginx como fallback...\n';
            useNginxFallback = true;
          }
        }
      }
      
      // Detectar rede do Traefik
      const { TraefikService } = await import('./TraefikService');
      const networkName = await TraefikService.detectNetwork(ssh);
      await TraefikService.ensureNetwork(networkName, ssh);
      
      // Criar container com labels do Traefik e PORT configurada
      const runResult = await ssh.execCommand(`
        docker run -d \
          --name ${containerName} \
          --network ${networkName} \
          -e PORT=${project.port || 3000} \
          ${envVars} \
          ${traefikLabels} \
          --restart unless-stopped \
          ${project.name}:${commit.substring(0, 8)}
      `);
      
      if (runResult.code !== 0) {
        throw new Error(`Erro ao iniciar container: ${runResult.stderr}`);
      }
      
      const newContainerId = runResult.stdout.trim();
      
      // Verificar se container está rodando
      this.emitLog(project._id.toString(), '🔍 Verificando container...');
      logs += '🔍 Verificando container...\n';
      
      const checkResult = await ssh.execCommand(`docker ps --filter "id=${newContainerId}" --format "{{.Status}}"`);
      if (!checkResult.stdout.includes('Up')) {
        // Container não está rodando - verificar logs
        const logsResult = await ssh.execCommand(`docker logs ${newContainerId}`);
        throw new Error(`Container não iniciou corretamente:\n${logsResult.stdout}\n${logsResult.stderr}`);
      }
      
      this.emitLog(project._id.toString(), '✅ Container rodando');
      logs += '✅ Container rodando\n';
      
      // 7. Configurar proxy (Traefik ou Nginx)
      if (project.domain) {
        try {
          if (traefikLabels) {
            // Usar Traefik - verificar conectividade
            this.emitLog(project._id.toString(), '🔍 Verificando conectividade com Traefik...');
            logs += '🔍 Verificando conectividade com Traefik...\n';
            
            // Verificar se container está na rede do Traefik
            const networkCheckResult = await ssh.execCommand(`docker inspect ${newContainerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{println}}{{end}}'`);
            const containerNetworks = networkCheckResult.stdout.trim().split('\n');
            
            this.emitLog(project._id.toString(), `📡 Container nas redes: ${containerNetworks.join(', ')}`);
            logs += `📡 Container nas redes: ${containerNetworks.join(', ')}\n`;
            
            // Verificar se Traefik está na mesma rede
            const traefikNetworkResult = await ssh.execCommand(`docker inspect traefik-proxy --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}'`);
            const traefikNetwork = traefikNetworkResult.stdout.trim();
            
            this.emitLog(project._id.toString(), `🔍 Rede do Traefik: ${traefikNetwork}`);
            logs += `🔍 Rede do Traefik: ${traefikNetwork}\n`;
            
            if (!traefikNetwork) {
              // Fallback: tentar detectar rede manualmente
              this.emitLog(project._id.toString(), '⚠️  Não foi possível detectar rede do Traefik automaticamente');
              logs += '⚠️  Não foi possível detectar rede do Traefik automaticamente\n';
              
              // Verificar se existe rede coolify
              const coolifyCheck = await ssh.execCommand(`docker network ls --filter "name=coolify" --format "{{.Name}}"`);
              if (coolifyCheck.stdout.includes('coolify')) {
                const traefikNetworkFallback = 'coolify';
                this.emitLog(project._id.toString(), `🔧 Usando rede: ${traefikNetworkFallback}`);
                logs += `🔧 Usando rede: ${traefikNetworkFallback}\n`;
                
                if (!containerNetworks.includes(traefikNetworkFallback)) {
                  await ssh.execCommand(`docker network connect ${traefikNetworkFallback} ${newContainerId}`);
                  this.emitLog(project._id.toString(), '✅ Container conectado à rede coolify');
                  logs += '✅ Container conectado à rede coolify\n';
                }
              }
            } else if (!containerNetworks.includes(traefikNetwork)) {
              this.emitLog(project._id.toString(), `⚠️  Container não está na rede do Traefik (${traefikNetwork})`);
              logs += `⚠️  Container não está na rede do Traefik (${traefikNetwork})\n`;
              
              this.emitLog(project._id.toString(), `🔧 Conectando à rede: ${traefikNetwork}...`);
              logs += `🔧 Conectando à rede: ${traefikNetwork}...\n`;
              
              await ssh.execCommand(`docker network connect ${traefikNetwork} ${newContainerId}`);
              
              this.emitLog(project._id.toString(), '✅ Container conectado à rede do Traefik');
              logs += '✅ Container conectado à rede do Traefik\n';
            }
            
            this.emitLog(project._id.toString(), `✅ Traefik configurado! Acesse: http://${project.domain}`);
            logs += `✅ Traefik configurado! Acesse: http://${project.domain}\n`;
            
            // Aguardar 3 segundos para Traefik detectar
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            this.emitLog(project._id.toString(), '⏳ Aguarde alguns segundos para o Traefik detectar o serviço');
            logs += '⏳ Aguarde alguns segundos para o Traefik detectar o serviço\n';
          } else if (useNginxFallback) {
            // Usar Nginx como fallback
            this.emitLog(project._id.toString(), '📦 Instalando Nginx (fallback)...');
            logs += '📦 Instalando Nginx (fallback)...\n';
            
            const { NginxService } = await import('./NginxService');
            
            // Garantir que Nginx está instalado
            await NginxService.ensureNginxProxy(ssh);
            
            // Configurar projeto no Nginx
            await NginxService.configureProject(ssh, project.name, project.domain, project.port || 3000);
            
            this.emitLog(project._id.toString(), `✅ Nginx configurado! Acesse: http://${project.domain}`);
            logs += `✅ Nginx configurado! Acesse: http://${project.domain}\n`;
          }
        } catch (proxyError: any) {
          this.emitLog(project._id.toString(), `⚠️  Aviso: ${proxyError.message}`);
          logs += `⚠️  Aviso: ${proxyError.message}\n`;
          // Não falha o deploy se proxy der erro
        }
      }
      
      // 8. Atualizar projeto
      const previousContainerId = project.containerId;
      project.containerId = newContainerId;
      project.previousContainerId = previousContainerId;
      project.currentVersion = commit;
      project.status = 'active';
      project.latestGitCommit = commit;
      project.hasUpdate = false;
      
      console.log('💾 Salvando deployment com versão:', version || commit.substring(0, 8));
      
      project.deployments.push({
        version: version || commit.substring(0, 8), // Usar versão semântica se fornecida
        branch: project.branch,
        commit,
        deployedAt: new Date(),
        status: 'success',
        logs,
        deployedBy,
        containerId: newContainerId // Salvar ID do container criado
      });
      
      await project.save();
      
      this.emitLog(project._id.toString(), '✅ Deploy remoto concluído com sucesso!');
      
      return { success: true, containerId: newContainerId };
      
    } catch (error: any) {
      project.status = 'error';
      project.deployments.push({
        version: version || 'unknown',
        branch: project.branch,
        commit: 'error',
        deployedAt: new Date(),
        status: 'failed',
        logs: logs + '\n' + error.message,
        deployedBy,
        containerId: undefined // Deploy falhou, sem container
      });
      await project.save();
      
      this.emitLog(project._id.toString(), `❌ Erro no deploy: ${error.message}`);
      throw error;
    }
  }

  private async deployLocal(project: IProject, version?: string, deployedBy: string = 'system'): Promise<any> {
    const projectId = project._id.toString();
    project.status = 'deploying';
    await project.save();

    let logs = '';
    const oldContainerId = project.containerId;
    
    try {
      const gitService = new GitService(project.workDir, project.gitAuth);
      
      // Fetch latest changes
      this.emitLog(projectId, '📡 Buscando atualizações do repositório...');
      logs += '📡 Buscando atualizações do repositório...\n';
      await gitService.fetch();
      
      // Checkout to specific version or branch
      if (version) {
        this.emitLog(projectId, `🔄 Mudando para versão: ${version}`);
        logs += `🔄 Mudando para versão: ${version}\n`;
        await gitService.checkout(version);
      } else {
        this.emitLog(projectId, `🔄 Atualizando branch: ${project.branch}`);
        logs += `🔄 Atualizando branch: ${project.branch}\n`;
        await gitService.checkout(project.branch);
        await gitService.pull();
      }

      const commit = await gitService.getCurrentCommit();
      const branch = await gitService.getCurrentBranch();

      // Create .env file
      this.emitLog(projectId, '📝 Configurando variáveis de ambiente...');
      logs += '📝 Configurando variáveis de ambiente...\n';
      await this.createEnvFile(project);

      // Generate Dockerfile if not exists
      const dockerfilePath = path.join(project.workDir, 'Dockerfile');
      try {
        await fs.access(dockerfilePath);
        this.emitLog(projectId, '📄 Usando Dockerfile existente');
        logs += '📄 Usando Dockerfile existente\n';
      } catch {
        this.emitLog(projectId, '📄 Gerando Dockerfile automaticamente...');
        logs += '📄 Gerando Dockerfile automaticamente...\n';
        await this.dockerService.generateDockerfile(project.workDir, project.type);
      }

      // Build Docker image com tag da versão
      this.emitLog(projectId, '🔨 Construindo imagem Docker...');
      logs += '🔨 Construindo imagem Docker...\n';
      
      this.dockerService.on('build-log', (log: string) => {
        this.emitLog(projectId, log.trim());
        logs += log;
      });
      
      await this.dockerService.buildImage({
        projectPath: project.workDir,
        projectName: project.name,
        port: project.port,
        envVars: project.envVars
      });

      // Start new container (container antigo continua rodando)
      this.emitLog(projectId, '🚀 Iniciando novo container...');
      logs += '🚀 Iniciando novo container...\n';
      const newContainerId = await this.dockerService.startContainer({
        projectPath: project.workDir,
        projectName: project.name,
        port: project.port,
        envVars: project.envVars
      });

      // Aguardar container estar saudável
      this.emitLog(projectId, '⏳ Verificando saúde do novo container...');
      logs += '⏳ Verificando saúde do novo container...\n';
      await this.waitForContainerHealth(newContainerId);

      // Stop old container (mas NÃO remove - mantém para rollback)
      if (oldContainerId) {
        this.emitLog(projectId, '⏸️  Parando container anterior (mantido para rollback)...');
        logs += '⏸️  Parando container anterior (mantido para rollback)...\n';
        try {
          await this.dockerService.stopContainer(oldContainerId);
          // NÃO remove o container antigo!
        } catch (error) {
          this.emitLog(projectId, '⚠️  Container anterior não encontrado');
          logs += '⚠️  Container anterior não encontrado\n';
        }
      }

      // Save deployment info
      const deployment = {
        version: version || branch,
        branch,
        commit,
        deployedAt: new Date(),
        status: 'success' as const,
        logs,
        deployedBy,
        containerId: newContainerId // Salvar ID do container criado
      };

      project.deployments.push(deployment);
      project.currentVersion = commit;
      project.previousContainerId = oldContainerId; // Salva container antigo
      project.containerId = newContainerId; // Novo container ativo
      project.latestGitCommit = commit;
      project.hasUpdate = false;
      project.status = 'active';
      await project.save();

      this.emitLog(projectId, '✅ Deploy concluído com sucesso!');
      this.emitLog(projectId, '💾 Container anterior mantido para rollback rápido');
      logs += '✅ Deploy concluído com sucesso!\n';
      logs += '💾 Container anterior mantido para rollback rápido\n';
      
      return { success: true, logs, deployment };
    } catch (error: any) {
      this.emitLog(projectId, `❌ Erro no deploy: ${error.message}`);
      logs += `❌ Erro no deploy: ${error.message}\n`;
      
      // Se falhou, volta para o container antigo
      if (oldContainerId) {
        this.emitLog(projectId, '🔄 Reativando container anterior...');
        logs += '🔄 Reativando container anterior...\n';
        try {
          await this.dockerService.startExistingContainer(oldContainerId);
        } catch (rollbackError) {
          this.emitLog(projectId, '❌ Erro ao reativar container anterior');
          logs += '❌ Erro ao reativar container anterior\n';
        }
      }
      
      project.status = 'error';
      project.deployments.push({
        version: version || project.branch,
        branch: project.branch,
        commit: 'unknown',
        deployedAt: new Date(),
        status: 'failed',
        logs,
        deployedBy,
        containerId: undefined // Deploy falhou, sem container
      });
      await project.save();

      throw new Error(logs);
    }
  }

  private async waitForContainerHealth(containerId: string, maxWait: number = 30000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
      try {
        const { stdout } = await execAsync(`docker inspect --format='{{.State.Running}}' ${containerId}`);
        if (stdout.trim() === 'true') {
          // Aguarda mais 2 segundos para garantir que está estável
          await new Promise(resolve => setTimeout(resolve, 2000));
          return;
        }
      } catch (error) {
        // Container ainda não está pronto
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Container não ficou saudável no tempo esperado');
  }

  async rollback(projectId: string, deploymentIndex?: number, deployedBy: string = 'system'): Promise<any> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Projeto não encontrado');

    // Rollback rápido: usar container anterior se disponível
    if (!deploymentIndex && project.previousContainerId) {
      this.emitLog(projectId, '⚡ Rollback rápido: reativando container anterior...');
      
      try {
        // Para container atual
        if (project.containerId) {
          await this.dockerService.stopContainer(project.containerId);
        }

        // Inicia container anterior
        await this.dockerService.startExistingContainer(project.previousContainerId);

        // Troca os containers
        const temp = project.containerId;
        project.containerId = project.previousContainerId;
        project.previousContainerId = temp;
        project.status = 'active';
        await project.save();

        this.emitLog(projectId, '✅ Rollback rápido concluído!');
        
        return { 
          success: true, 
          message: 'Rollback rápido realizado com sucesso',
          type: 'fast'
        };
      } catch (error: any) {
        this.emitLog(projectId, `❌ Erro no rollback rápido: ${error.message}`);
        throw error;
      }
    }

    // Rollback completo: fazer novo deploy de versão específica
    if (deploymentIndex !== undefined) {
      const deployment = project.deployments[deploymentIndex];
      if (!deployment) throw new Error('Deployment não encontrado');

      this.emitLog(projectId, `🔄 Rollback completo para commit: ${deployment.commit}`);
      return this.deployProject(projectId, deployment.commit, deployedBy);
    }

    throw new Error('Nenhum container anterior disponível para rollback rápido');
  }

  async deleteProject(projectId: string): Promise<void> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Projeto não encontrado');

    // Se for projeto remoto, limpar via SSH
    if (project.serverId) {
      try {
        const server = await Server.findById(project.serverId);
        if (server) {
          const ssh = await sshService.connect(server);
          
          // Parar e remover container
          if (project.containerId) {
            console.log(`🗑️  Removendo container remoto: ${project.containerId}`);
            await ssh.execCommand(`docker stop ${project.containerId} || true`);
            await ssh.execCommand(`docker rm ${project.containerId} || true`);
          }
          
          // Remover imagem Docker
          console.log(`🗑️  Removendo imagem remota: ${project.name}`);
          await ssh.execCommand(`docker rmi ${project.name} || true`);
          
          // Remover arquivos do projeto
          const remoteProjectPath = `/opt/projects/${project.name}`;
          console.log(`🗑️  Removendo arquivos remotos: ${remoteProjectPath}`);
          await ssh.execCommand(`rm -rf ${remoteProjectPath}`);
          
          // Remover configuração do proxy (Traefik ou Nginx)
          console.log(`🗑️  Removendo configuração do proxy...`);
          
          try {
            // Tentar desconectar do Traefik
            const { TraefikService } = await import('./TraefikService');
            if (project.containerId) {
              await TraefikService.disconnectFromNetwork(ssh, project.containerId);
            }
          } catch (error) {
            // Se falhar, pode ser que esteja usando Nginx
            console.log('Traefik não disponível, tentando Nginx...');
          }
          
          try {
            // Tentar remover config do Nginx
            const { NginxService } = await import('./NginxService');
            await NginxService.removeProject(ssh, project.name);
          } catch (error) {
            // Nginx também não disponível
            console.log('Nginx não disponível');
          }
          
          console.log('✅ Projeto remoto limpo com sucesso');
        }
      } catch (error) {
        console.log('⚠️  Erro ao limpar projeto remoto:', error);
      }
    } else {
      // Projeto local
      // Stop and remove container
      if (project.containerId) {
        try {
          await this.dockerService.stopContainer(project.containerId);
          await this.dockerService.removeContainer(project.containerId);
        } catch (error) {
          console.log('Container já removido ou não existe');
        }
      }

      // Remove Docker image
      try {
        await this.dockerService.removeImage(project.name);
      } catch (error) {
        console.log('Imagem já removida ou não existe');
      }

      // Remove project files
      try {
        await fs.rm(project.workDir, { recursive: true, force: true });
      } catch (error) {
        console.log('Diretório já removido ou não existe');
      }
    }

    // Remove from database
    await Project.findByIdAndDelete(projectId);
  }

  private async createEnvFile(project: IProject): Promise<void> {
    const envPath = path.join(project.workDir, '.env');
    const envContent = Object.entries(project.envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    await fs.writeFile(envPath, envContent);
  }

  async getProjectLogs(projectId: string): Promise<string> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Projeto não encontrado');
    
    // Se for projeto remoto, buscar logs via SSH
    if (project.serverId) {
      if (!project.containerId) {
        return 'Nenhum container ativo no servidor remoto.\n\nFaça um deploy primeiro para gerar logs.';
      }

      try {
        const server = await Server.findById(project.serverId);
        if (!server) {
          return 'Servidor não encontrado.\n\nO servidor pode ter sido removido.';
        }

        const ssh = await sshService.connect(server);
        
        // Buscar últimas 100 linhas de log do container remoto
        const result = await ssh.execCommand(`docker logs --tail 100 ${project.containerId}`);
        
        if (result.code !== 0) {
          if (result.stderr.includes('No such container')) {
            return 'Container não encontrado no servidor remoto.\n\nO container pode ter sido removido. Faça um novo deploy.';
          }
          return `Erro ao buscar logs:\n${result.stderr}`;
        }
        
        return result.stdout || 'Nenhum log disponível ainda.';
      } catch (error: any) {
        return `Erro ao conectar no servidor:\n${error.message}`;
      }
    }
    
    // Projeto local
    if (!project.containerId) {
      return 'Nenhum container ativo.\n\nFaça um deploy primeiro para gerar logs.';
    }

    try {
      return new Promise((resolve, reject) => {
        let logs = '';
        this.dockerService.streamLogs(project.containerId!, (log: string) => {
          logs += log;
        }).catch((error) => {
          // Se container não existir, retornar mensagem amigável
          if (error.statusCode === 404) {
            resolve('Container não encontrado.\n\nO container pode ter sido removido. Faça um novo deploy.');
          } else {
            reject(error);
          }
        });

        // Retornar logs após 2 segundos
        setTimeout(() => resolve(logs || 'Nenhum log disponível ainda.'), 2000);
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        return 'Container não encontrado.\n\nO container pode ter sido removido. Faça um novo deploy.';
      }
      throw error;
    }
  }

  async execCommand(projectId: string, command: string): Promise<string> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Projeto não encontrado');
    
    // Se for projeto remoto, executar via SSH
    if (project.serverId) {
      if (!project.containerId) {
        throw new Error('Container não encontrado. Faça um deploy primeiro.');
      }

      try {
        const server = await Server.findById(project.serverId);
        if (!server) {
          throw new Error('Servidor não encontrado.');
        }

        const ssh = await sshService.connect(server);
        
        // Executar comando no container remoto
        const result = await ssh.execCommand(`docker exec ${project.containerId} ${command}`);
        
        if (result.code !== 0) {
          if (result.stderr.includes('No such container')) {
            throw new Error('Container não encontrado no servidor remoto. Faça um novo deploy.');
          }
          return `Erro: ${result.stderr}\n${result.stdout}`;
        }
        
        return result.stdout || result.stderr || 'Comando executado (sem output)';
      } catch (error: any) {
        throw new Error(`Erro ao executar comando: ${error.message}`);
      }
    }
    
    // Projeto local
    if (!project.containerId) {
      throw new Error('Container não encontrado. Faça um deploy primeiro.');
    }

    try {
      return this.dockerService.execCommand(project.containerId, command);
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error('Container não encontrado. O container pode ter sido removido. Faça um novo deploy.');
      }
      throw error;
    }
  }

  async startContainer(projectId: string): Promise<void> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Projeto não encontrado');
    
    // Se for projeto remoto, controlar via SSH
    if (project.serverId) {
      if (!project.containerId) {
        throw new Error('Container não encontrado. Faça um deploy primeiro.');
      }

      try {
        const server = await Server.findById(project.serverId);
        if (!server) {
          throw new Error('Servidor não encontrado.');
        }

        const ssh = await sshService.connect(server);
        
        const result = await ssh.execCommand(`docker start ${project.containerId}`);
        
        if (result.code !== 0) {
          if (result.stderr.includes('No such container')) {
            throw new Error('Container não encontrado no servidor remoto. Faça um novo deploy.');
          }
          throw new Error(`Erro ao iniciar container: ${result.stderr}`);
        }
        
        project.status = 'active';
        await project.save();
        return;
      } catch (error: any) {
        throw new Error(`Erro ao iniciar container: ${error.message}`);
      }
    }
    
    // Projeto local
    if (!project.containerId) {
      throw new Error('Container não encontrado. Faça um deploy primeiro.');
    }

    await this.dockerService.startExistingContainer(project.containerId);
    project.status = 'active';
    await project.save();
  }

  async stopContainer(projectId: string): Promise<void> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Projeto não encontrado');
    
    // Se for projeto remoto, controlar via SSH
    if (project.serverId) {
      if (!project.containerId) {
        throw new Error('Container não encontrado.');
      }

      try {
        const server = await Server.findById(project.serverId);
        if (!server) {
          throw new Error('Servidor não encontrado.');
        }

        const ssh = await sshService.connect(server);
        
        const result = await ssh.execCommand(`docker stop ${project.containerId}`);
        
        if (result.code !== 0) {
          if (result.stderr.includes('No such container')) {
            throw new Error('Container não encontrado no servidor remoto.');
          }
          throw new Error(`Erro ao parar container: ${result.stderr}`);
        }
        
        project.status = 'inactive';
        await project.save();
        return;
      } catch (error: any) {
        throw new Error(`Erro ao parar container: ${error.message}`);
      }
    }
    
    // Projeto local
    if (!project.containerId) {
      throw new Error('Container não encontrado.');
    }

    await this.dockerService.stopContainer(project.containerId);
    project.status = 'inactive';
    await project.save();
  }
}
