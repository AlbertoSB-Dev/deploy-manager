export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return d.toLocaleDateString('pt-BR');
  } else if (days > 0) {
    return `Há ${days} dia${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `Há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  } else {
    return 'Agora mesmo';
  }
}
