import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modifyTime: Date;
  accessTime: Date;
  rights: {
    user: string;
    group: string;
    other: string;
  };
  owner: number;
  group: number;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
}

export interface DiskUsage {
  total: number;
  used: number;
  available: number;
  percentage: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const sftpService = {
  // Listar diretório
  async listDirectory(serverId: string, path: string = '/'): Promise<FileItem[]> {
    const response = await axios.get(`${API_URL}/sftp/${serverId}/list`, {
      params: { path },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Obter informações de arquivo
  async getFileInfo(serverId: string, path: string): Promise<FileItem> {
    const response = await axios.get(`${API_URL}/sftp/${serverId}/info`, {
      params: { path },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Ler arquivo
  async readFile(serverId: string, path: string): Promise<string> {
    const response = await axios.get(`${API_URL}/sftp/${serverId}/read`, {
      params: { path },
      headers: getAuthHeaders(),
      responseType: 'text',
    });
    return response.data;
  },

  // Escrever arquivo
  async writeFile(serverId: string, path: string, content: string): Promise<void> {
    await axios.post(
      `${API_URL}/sftp/${serverId}/write`,
      { path, content },
      { headers: getAuthHeaders() }
    );
  },

  // Criar diretório
  async createDirectory(serverId: string, path: string, recursive: boolean = true): Promise<void> {
    await axios.post(
      `${API_URL}/sftp/${serverId}/mkdir`,
      { path, recursive },
      { headers: getAuthHeaders() }
    );
  },

  // Excluir
  async delete(serverId: string, path: string, recursive: boolean = false): Promise<void> {
    await axios.delete(`${API_URL}/sftp/${serverId}/delete`, {
      data: { path, recursive },
      headers: getAuthHeaders(),
    });
  },

  // Renomear
  async rename(serverId: string, oldPath: string, newPath: string): Promise<void> {
    await axios.put(
      `${API_URL}/sftp/${serverId}/rename`,
      { oldPath, newPath },
      { headers: getAuthHeaders() }
    );
  },

  // Mover
  async move(serverId: string, sourcePath: string, destPath: string): Promise<void> {
    await axios.put(
      `${API_URL}/sftp/${serverId}/move`,
      { sourcePath, destPath },
      { headers: getAuthHeaders() }
    );
  },

  // Copiar
  async copy(serverId: string, sourcePath: string, destPath: string): Promise<void> {
    await axios.post(
      `${API_URL}/sftp/${serverId}/copy`,
      { sourcePath, destPath },
      { headers: getAuthHeaders() }
    );
  },

  // Upload
  async uploadFile(serverId: string, file: File, remotePath: string, onProgress?: (progress: number) => void): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', remotePath);

    await axios.post(`${API_URL}/sftp/${serverId}/upload`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  // Download
  async downloadFile(serverId: string, remotePath: string): Promise<Blob> {
    const response = await axios.get(`${API_URL}/sftp/${serverId}/download`, {
      params: { path: remotePath },
      headers: getAuthHeaders(),
      responseType: 'blob',
    });
    return response.data;
  },

  // Comprimir
  async compress(serverId: string, paths: string[], outputPath: string): Promise<void> {
    await axios.post(
      `${API_URL}/sftp/${serverId}/compress`,
      { paths, outputPath },
      { headers: getAuthHeaders() }
    );
  },

  // Extrair
  async extract(serverId: string, archivePath: string, destination: string): Promise<void> {
    await axios.post(
      `${API_URL}/sftp/${serverId}/extract`,
      { archivePath, destination },
      { headers: getAuthHeaders() }
    );
  },

  // Alterar permissões
  async chmod(serverId: string, path: string, mode: string, recursive: boolean = false): Promise<void> {
    await axios.put(
      `${API_URL}/sftp/${serverId}/chmod`,
      { path, mode, recursive },
      { headers: getAuthHeaders() }
    );
  },

  // Alterar proprietário
  async chown(serverId: string, path: string, owner: string, group: string, recursive: boolean = false): Promise<void> {
    await axios.put(
      `${API_URL}/sftp/${serverId}/chown`,
      { path, owner, group, recursive },
      { headers: getAuthHeaders() }
    );
  },

  // Tamanho de diretório
  async getDirectorySize(serverId: string, path: string): Promise<number> {
    const response = await axios.get(`${API_URL}/sftp/${serverId}/size`, {
      params: { path },
      headers: getAuthHeaders(),
    });
    return response.data.size;
  },

  // Uso de disco
  async getDiskUsage(serverId: string, path: string = '/'): Promise<DiskUsage> {
    const response = await axios.get(`${API_URL}/sftp/${serverId}/disk-usage`, {
      params: { path },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Buscar arquivos
  async searchFiles(serverId: string, path: string, query: string): Promise<FileItem[]> {
    const response = await axios.get(`${API_URL}/sftp/${serverId}/search`, {
      params: { path, query },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Tail de arquivo
  async tailFile(serverId: string, path: string, lines: number = 100): Promise<string> {
    const response = await axios.get(`${API_URL}/sftp/${serverId}/tail`, {
      params: { path, lines },
      headers: getAuthHeaders(),
    });
    return response.data.content;
  },
};
