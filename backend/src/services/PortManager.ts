import Project from '../models/Project';

export class PortManager {
  private static MIN_PORT = 3000;
  private static MAX_PORT = 9000;

  /**
   * Verifica se uma porta está em uso
   */
  static async isPortInUse(port: number): Promise<boolean> {
    const projects = await Project.find({ port, status: { $in: ['active', 'deploying'] } });
    return projects.length > 0;
  }

  /**
   * Encontra a próxima porta disponível
   */
  static async findAvailablePort(preferredPort?: number): Promise<number> {
    // Se uma porta foi especificada, verificar se está disponível
    if (preferredPort) {
      const inUse = await this.isPortInUse(preferredPort);
      if (!inUse) {
        return preferredPort;
      }
      console.log(`⚠️  Porta ${preferredPort} já está em uso, buscando alternativa...`);
    }

    // Buscar próxima porta disponível
    for (let port = this.MIN_PORT; port <= this.MAX_PORT; port++) {
      const inUse = await this.isPortInUse(port);
      if (!inUse) {
        console.log(`✅ Porta disponível encontrada: ${port}`);
        return port;
      }
    }

    throw new Error('Nenhuma porta disponível no range 3000-9000');
  }

  /**
   * Lista todas as portas em uso
   */
  static async getUsedPorts(): Promise<number[]> {
    const projects = await Project.find(
      { port: { $exists: true }, status: { $in: ['active', 'deploying'] } },
      { port: 1 }
    );
    return projects.map(p => p.port!).filter(p => p !== undefined);
  }

  /**
   * Valida se uma porta está no range permitido
   */
  static isValidPort(port: number): boolean {
    return port >= this.MIN_PORT && port <= this.MAX_PORT;
  }

  /**
   * Sugere portas disponíveis
   */
  static async suggestPorts(count: number = 5): Promise<number[]> {
    const suggestions: number[] = [];
    let port = this.MIN_PORT;

    while (suggestions.length < count && port <= this.MAX_PORT) {
      const inUse = await this.isPortInUse(port);
      if (!inUse) {
        suggestions.push(port);
      }
      port++;
    }

    return suggestions;
  }
}
