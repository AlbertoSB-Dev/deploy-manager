import axios from 'axios';

interface DockerTag {
  name: string;
  last_updated: string;
}

interface DockerHubResponse {
  results: DockerTag[];
}

export class DockerVersionService {
  private cache: Map<string, { versions: string[]; timestamp: number }> = new Map();
  private CACHE_DURATION = 86400000; // 24 horas (1 dia) em ms

  /**
   * Buscar versões disponíveis no Docker Hub
   */
  private async fetchDockerHubVersions(image: string): Promise<string[]> {
    try {
      const response = await axios.get<DockerHubResponse>(
        `https://registry.hub.docker.com/v2/repositories/library/${image}/tags?page_size=100`
      );

      const tags = response.data.results
        .map(tag => tag.name)
        .filter(tag => {
          // Filtrar apenas versões numéricas (ex: 7.0, 8.0, 16)
          return /^\d+(\.\d+)?$/.test(tag);
        })
        .sort((a, b) => {
          // Ordenar por versão (maior primeiro)
          const [aMajor, aMinor = 0] = a.split('.').map(Number);
          const [bMajor, bMinor = 0] = b.split('.').map(Number);
          
          if (aMajor !== bMajor) return bMajor - aMajor;
          return bMinor - aMinor;
        });

      return tags.slice(0, 10); // Retornar apenas as 10 versões mais recentes
    } catch (error) {
      console.error(`Erro ao buscar versões do ${image}:`, error);
      return [];
    }
  }

  /**
   * Obter versões com cache
   */
  private async getVersionsWithCache(image: string): Promise<string[]> {
    const cached = this.cache.get(image);
    const now = Date.now();

    // Se tem cache válido, retornar
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.versions;
    }

    // Buscar novas versões
    const versions = await this.fetchDockerHubVersions(image);
    
    // Salvar no cache
    this.cache.set(image, {
      versions,
      timestamp: now
    });

    return versions;
  }

  /**
   * Obter versões do MongoDB
   */
  async getMongoDBVersions(): Promise<string[]> {
    const versions = await this.getVersionsWithCache('mongo');
    
    // Fallback se API falhar
    if (versions.length === 0) {
      return ['7.0', '6.0', '5.0', '4.4'];
    }
    
    return versions;
  }

  /**
   * Obter versões do MySQL
   */
  async getMySQLVersions(): Promise<string[]> {
    const versions = await this.getVersionsWithCache('mysql');
    
    if (versions.length === 0) {
      return ['8.0', '5.7'];
    }
    
    return versions;
  }

  /**
   * Obter versões do MariaDB
   */
  async getMariaDBVersions(): Promise<string[]> {
    const versions = await this.getVersionsWithCache('mariadb');
    
    if (versions.length === 0) {
      return ['11.0', '10.11', '10.6'];
    }
    
    return versions;
  }

  /**
   * Obter versões do PostgreSQL
   */
  async getPostgreSQLVersions(): Promise<string[]> {
    const versions = await this.getVersionsWithCache('postgres');
    
    if (versions.length === 0) {
      return ['16', '15', '14', '13'];
    }
    
    return versions;
  }

  /**
   * Obter versões do Redis
   */
  async getRedisVersions(): Promise<string[]> {
    const versions = await this.getVersionsWithCache('redis');
    
    if (versions.length === 0) {
      return ['7.2', '7.0', '6.2'];
    }
    
    return versions;
  }

  /**
   * Obter versões do MinIO
   */
  async getMinIOVersions(): Promise<string[]> {
    try {
      const response = await axios.get<DockerHubResponse>(
        `https://hub.docker.com/v2/repositories/minio/minio/tags?page_size=100`
      );

      const tags = response.data.results
        .map(tag => tag.name)
        .filter(tag => {
          // Filtrar tags RELEASE (ex: RELEASE.2024-01-01T00-00-00Z)
          return /^RELEASE\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/.test(tag);
        })
        .sort((a, b) => {
          // Ordenar por data (mais recente primeiro)
          return b.localeCompare(a);
        });

      // Retornar apenas as 10 versões mais recentes
      const recentVersions = tags.slice(0, 10);
      
      if (recentVersions.length === 0) {
        return ['latest', 'RELEASE.2024-01-01T00-00-00Z'];
      }
      
      return recentVersions;
    } catch (error) {
      console.error('Erro ao buscar versões do MinIO:', error);
      return ['latest', 'RELEASE.2024-01-01T00-00-00Z'];
    }
  }

  /**
   * Obter todas as versões de uma vez
   */
  async getAllVersions(): Promise<{
    mongodb: string[];
    mysql: string[];
    mariadb: string[];
    postgresql: string[];
    redis: string[];
    minio: string[];
  }> {
    const [mongodb, mysql, mariadb, postgresql, redis, minio] = await Promise.all([
      this.getMongoDBVersions(),
      this.getMySQLVersions(),
      this.getMariaDBVersions(),
      this.getPostgreSQLVersions(),
      this.getRedisVersions(),
      this.getMinIOVersions()
    ]);

    return {
      mongodb,
      mysql,
      mariadb,
      postgresql,
      redis,
      minio
    };
  }

  /**
   * Limpar cache (útil para forçar atualização)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const dockerVersionService = new DockerVersionService();
