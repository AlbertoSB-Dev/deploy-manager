import Docker from 'dockerode';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

const docker = new Docker();

export interface DockerBuildOptions {
  projectPath: string;
  projectName: string;
  port?: number;
  envVars?: Record<string, string>;
  buildCommand?: string;
  startCommand?: string;
}

export class DockerService extends EventEmitter {
  /**
   * Gera Dockerfile automaticamente baseado no tipo de projeto
   */
  async generateDockerfile(projectPath: string, type: string): Promise<void> {
    let dockerfile = '';

    if (type === 'frontend' || type === 'fullstack') {
      // Dockerfile para Next.js/React
      dockerfile = `
FROM node:18-alpine AS base

# Instalar dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Produção
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
`;
    } else {
      // Dockerfile para Backend Node.js
      dockerfile = `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build || true
EXPOSE 3000
CMD ["npm", "start"]
`;
    }

    await fs.writeFile(path.join(projectPath, 'Dockerfile'), dockerfile.trim());
    
    // Criar .dockerignore para otimizar build
    const dockerignore = `
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
.vscode
.idea
`;
    
    await fs.writeFile(path.join(projectPath, '.dockerignore'), dockerignore.trim());
    console.log('✅ Dockerfile e .dockerignore gerados');
  }

  /**
   * Build da imagem Docker
   */
  async buildImage(options: DockerBuildOptions): Promise<void> {
    const { projectPath, projectName } = options;
    const imageName = `deploy-manager-${projectName.toLowerCase()}:latest`;

    console.log(`🔨 Building imagem Docker: ${imageName}`);

    return new Promise((resolve, reject) => {
      docker.buildImage(
        {
          context: projectPath,
          src: ['.']
        },
        {
          t: imageName,
          dockerfile: 'Dockerfile',
          // Adicionar opções para melhorar estabilidade
          buildargs: {
            NODE_ENV: 'production'
          }
        },
        (err: any, stream: any) => {
          if (err) {
            console.error('❌ Erro ao iniciar build:', err.message);
            reject(err);
            return;
          }

          let buildError = '';

          docker.modem.followProgress(
            stream!,
            (err: any) => {
              if (err) {
                console.error('❌ Erro durante build:', err.message);
                reject(new Error(`Build falhou: ${buildError || err.message}`));
              } else {
                console.log('✅ Build concluído');
                resolve();
              }
            },
            (event: any) => {
              if (event.stream) {
                const log = event.stream.trim();
                this.emit('build-log', event.stream);
                console.log(log);
                
                // Capturar erros do build
                if (log.includes('ERROR') || log.includes('npm ERR!')) {
                  buildError += log + '\n';
                }
              }
              if (event.error) {
                buildError += event.error + '\n';
              }
            }
          );
        }
      );
    });
  }

  /**
   * Criar e iniciar container
   */
  async startContainer(options: DockerBuildOptions): Promise<string> {
    const { projectName, port, envVars } = options;
    const imageName = `deploy-manager-${projectName.toLowerCase()}:latest`;
    const containerName = `deploy-manager-${projectName.toLowerCase()}`;

    // Remover container existente se houver
    try {
      const oldContainer = docker.getContainer(containerName);
      await oldContainer.stop();
      await oldContainer.remove();
      console.log('🗑️  Container antigo removido');
    } catch {
      // Container não existe, tudo bem
    }

    // Preparar variáveis de ambiente
    const env = Object.entries(envVars || {}).map(([key, value]) => `${key}=${value}`);

    // Criar container
    const container = await docker.createContainer({
      name: containerName,
      Image: imageName,
      Env: env,
      ExposedPorts: port ? { [`${port}/tcp`]: {} } : undefined,
      HostConfig: {
        PortBindings: port
          ? {
              [`${port}/tcp`]: [{ HostPort: port.toString() }]
            }
          : undefined,
        RestartPolicy: {
          Name: 'unless-stopped'
        }
      }
    });

    // Iniciar container
    await container.start();
    console.log(`✅ Container iniciado: ${containerName}`);

    return container.id;
  }

  /**
   * Obter logs do container em tempo real
   */
  async streamLogs(containerId: string, callback: (log: string) => void): Promise<void> {
    const container = docker.getContainer(containerId);

    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true
    });

    stream.on('data', (chunk: any) => {
      // Docker adiciona 8 bytes de header, remover
      const log = chunk.toString('utf8').substring(8);
      callback(log);
    });
  }

  /**
   * Executar comando no container (terminal)
   */
  async execCommand(containerId: string, command: string): Promise<string> {
    const container = docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: ['sh', '-c', command],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start({ Detach: false });

    return new Promise((resolve, reject) => {
      let output = '';

      stream.on('data', (chunk: any) => {
        output += chunk.toString('utf8').substring(8);
      });

      stream.on('end', () => {
        resolve(output);
      });

      stream.on('error', reject);
    });
  }

  /**
   * Parar container
   */
  async stopContainer(containerId: string): Promise<void> {
    try {
      const container = docker.getContainer(containerId);
      await container.stop();
      console.log('⏹️  Container parado');
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log('⚠️  Container não encontrado (já foi removido)');
      } else if (error.statusCode === 304) {
        console.log('⚠️  Container já está parado');
      } else {
        throw error;
      }
    }
  }

  /**
   * Iniciar container existente
   */
  async startExistingContainer(containerId: string): Promise<void> {
    try {
      const container = docker.getContainer(containerId);
      await container.start();
      console.log('▶️  Container iniciado');
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error('Container não encontrado. Faça um novo deploy.');
      } else if (error.statusCode === 304) {
        console.log('⚠️  Container já está rodando');
      } else {
        throw error;
      }
    }
  }

  /**
   * Remover container
   */
  async removeContainer(containerId: string): Promise<void> {
    try {
      const container = docker.getContainer(containerId);
      await container.remove({ force: true });
      console.log('🗑️  Container removido');
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log('⚠️  Container não encontrado (já foi removido)');
      } else {
        throw error;
      }
    }
  }

  /**
   * Remover imagem
   */
  async removeImage(projectName: string): Promise<void> {
    const imageName = `deploy-manager-${projectName.toLowerCase()}:latest`;
    try {
      const image = docker.getImage(imageName);
      await image.remove({ force: true });
      console.log('🗑️  Imagem removida');
    } catch {
      // Imagem não existe
    }
  }

  /**
   * Obter status do container
   */
  async getContainerStatus(containerId: string): Promise<string> {
    try {
      const container = docker.getContainer(containerId);
      const info = await container.inspect();
      return info.State.Status;
    } catch {
      return 'not-found';
    }
  }

  /**
   * Listar containers do projeto
   */
  async listProjectContainers(): Promise<any[]> {
    const containers = await docker.listContainers({ all: true });
    return containers.filter((c: any) => c.Names.some((name: string) => name.includes('deploy-manager-')));
  }
}
