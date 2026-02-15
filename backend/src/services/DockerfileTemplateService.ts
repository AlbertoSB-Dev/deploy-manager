import fs from 'fs/promises';
import path from 'path';

export interface DockerfileTemplate {
  id: string;
  name: string;
  description: string;
  filename: string;
  category: 'frontend' | 'backend' | 'fullstack';
}

export class DockerfileTemplateService {
  private static templates: DockerfileTemplate[] = [
    {
      id: 'nodejs',
      name: 'Node.js',
      description: 'Node.js genérico (Express, Fastify, etc)',
      filename: 'nodejs.dockerfile',
      category: 'backend'
    },
    {
      id: 'nextjs',
      name: 'Next.js',
      description: 'Next.js com build otimizado',
      filename: 'nextjs.dockerfile',
      category: 'fullstack'
    },
    {
      id: 'react-cra',
      name: 'React (Create React App)',
      description: 'React com build estático e Nginx',
      filename: 'react-cra.dockerfile',
      category: 'frontend'
    },
    {
      id: 'python-flask',
      name: 'Python Flask',
      description: 'Flask com Gunicorn',
      filename: 'python-flask.dockerfile',
      category: 'backend'
    },
    {
      id: 'python-django',
      name: 'Python Django',
      description: 'Django com Gunicorn',
      filename: 'python-django.dockerfile',
      category: 'backend'
    }
  ];

  /**
   * Lista todos os templates disponíveis
   */
  static getTemplates(): DockerfileTemplate[] {
    return this.templates;
  }

  /**
   * Obtém um template específico
   */
  static getTemplate(id: string): DockerfileTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  /**
   * Lê o conteúdo de um template
   */
  static async getTemplateContent(id: string): Promise<string> {
    const template = this.getTemplate(id);
    if (!template) {
      throw new Error(`Template ${id} não encontrado`);
    }

    const templatePath = path.join(__dirname, '../templates/dockerfiles', template.filename);
    const content = await fs.readFile(templatePath, 'utf-8');
    return content;
  }

  /**
   * Detecta automaticamente o melhor template baseado no projeto
   */
  static async detectTemplate(projectPath: string, ssh?: any): Promise<string | null> {
    try {
      // Verificar se tem package.json
      const hasPackageJson = ssh 
        ? (await ssh.execCommand(`test -f ${projectPath}/package.json && echo "yes" || echo "no"`)).stdout.trim() === 'yes'
        : await fs.access(path.join(projectPath, 'package.json')).then(() => true).catch(() => false);

      if (hasPackageJson) {
        // Ler package.json
        const packageContent = ssh
          ? (await ssh.execCommand(`cat ${projectPath}/package.json`)).stdout
          : await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');

        const pkg = JSON.parse(packageContent);

        // Detectar framework
        if (pkg.dependencies?.next || pkg.devDependencies?.next) {
          return 'nextjs';
        }
        if (pkg.dependencies?.['react-scripts']) {
          return 'react-cra';
        }
        // Node.js genérico
        return 'nodejs';
      }

      // Verificar se tem requirements.txt (Python)
      const hasRequirements = ssh
        ? (await ssh.execCommand(`test -f ${projectPath}/requirements.txt && echo "yes" || echo "no"`)).stdout.trim() === 'yes'
        : await fs.access(path.join(projectPath, 'requirements.txt')).then(() => true).catch(() => false);

      if (hasRequirements) {
        // Verificar se é Django ou Flask
        const reqContent = ssh
          ? (await ssh.execCommand(`cat ${projectPath}/requirements.txt`)).stdout
          : await fs.readFile(path.join(projectPath, 'requirements.txt'), 'utf-8');

        if (reqContent.toLowerCase().includes('django')) {
          return 'python-django';
        }
        if (reqContent.toLowerCase().includes('flask')) {
          return 'python-flask';
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao detectar template:', error);
      return null;
    }
  }
}
