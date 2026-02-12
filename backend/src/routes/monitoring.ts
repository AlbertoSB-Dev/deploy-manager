import { Router } from 'express';
import { protect, admin, AuthRequest } from '../middleware/auth';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

// Aplicar middleware de autenticação e admin
router.use(protect, admin);

// Obter métricas do sistema
router.get('/metrics', async (req: AuthRequest, res) => {
  try {
    const metrics = {
      cpu: getCPUMetrics(),
      memory: getMemoryMetrics(),
      disk: await getDiskMetrics(),
      network: getNetworkMetrics(),
      system: getSystemInfo(),
      uptime: getUptimeInfo(),
      processes: await getProcessInfo(),
      docker: await getDockerInfo(),
    };

    res.json(metrics);
  } catch (error: any) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter histórico de CPU (últimos 60 segundos)
router.get('/cpu-history', async (req: AuthRequest, res) => {
  try {
    const history = await getCPUHistory();
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter logs do sistema
router.get('/logs', async (req: AuthRequest, res) => {
  try {
    const { lines = 100 } = req.query;
    const logs = await getSystemLogs(Number(lines));
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== FUNÇÕES AUXILIARES =====

function getCPUMetrics() {
  const cpus = os.cpus();
  const cpuCount = cpus.length;
  
  // Calcular uso médio de CPU
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpuCount;
  const total = totalTick / cpuCount;
  const usage = 100 - ~~(100 * idle / total);
  
  return {
    count: cpuCount,
    model: cpus[0].model,
    speed: cpus[0].speed,
    usage: Math.round(usage * 100) / 100,
    cores: cpus.map((cpu, i) => ({
      core: i,
      model: cpu.model,
      speed: cpu.speed,
    })),
  };
}

function getMemoryMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const usagePercent = (usedMem / totalMem) * 100;
  
  return {
    total: totalMem,
    free: freeMem,
    used: usedMem,
    usagePercent: Math.round(usagePercent * 100) / 100,
    totalGB: Math.round((totalMem / 1024 / 1024 / 1024) * 100) / 100,
    freeGB: Math.round((freeMem / 1024 / 1024 / 1024) * 100) / 100,
    usedGB: Math.round((usedMem / 1024 / 1024 / 1024) * 100) / 100,
  };
}

async function getDiskMetrics() {
  try {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: usar wmic
      const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
      const lines = stdout.trim().split('\n').slice(1);
      
      const disks = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const caption = parts[0];
          const free = parseInt(parts[1]) || 0;
          const total = parseInt(parts[2]) || 0;
          const used = total - free;
          const usagePercent = total > 0 ? (used / total) * 100 : 0;
          
          return {
            filesystem: caption,
            total,
            used,
            free,
            usagePercent: Math.round(usagePercent * 100) / 100,
            totalGB: Math.round((total / 1024 / 1024 / 1024) * 100) / 100,
            usedGB: Math.round((used / 1024 / 1024 / 1024) * 100) / 100,
            freeGB: Math.round((free / 1024 / 1024 / 1024) * 100) / 100,
          };
        }
        return null;
      }).filter(Boolean);
      
      return disks;
    } else {
      // Linux/Mac: usar df
      const { stdout } = await execAsync('df -B1 / 2>/dev/null || df -k / | awk \'NR==2 {print $2*1024, $3*1024, $4*1024}\'');
      const lines = stdout.trim().split('\n');
      
      const disks = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const total = parseInt(parts[1]) || 0;
          const used = parseInt(parts[2]) || 0;
          const free = parseInt(parts[3]) || 0;
          const usagePercent = total > 0 ? (used / total) * 100 : 0;
          
          return {
            filesystem: parts[0],
            total,
            used,
            free,
            usagePercent: Math.round(usagePercent * 100) / 100,
            totalGB: Math.round((total / 1024 / 1024 / 1024) * 100) / 100,
            usedGB: Math.round((used / 1024 / 1024 / 1024) * 100) / 100,
            freeGB: Math.round((free / 1024 / 1024 / 1024) * 100) / 100,
          };
        }
        return null;
      }).filter(Boolean);
      
      return disks.length > 0 ? disks : [{
        filesystem: '/',
        total: 0,
        used: 0,
        free: 0,
        usagePercent: 0,
        totalGB: 0,
        usedGB: 0,
        freeGB: 0,
      }];
    }
  } catch (error) {
    console.error('Erro ao obter métricas de disco:', error);
    return [{
      filesystem: '/',
      total: 0,
      used: 0,
      free: 0,
      usagePercent: 0,
      totalGB: 0,
      usedGB: 0,
      freeGB: 0,
    }];
  }
}

function getNetworkMetrics() {
  const interfaces = os.networkInterfaces();
  const networks: any[] = [];
  
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (addrs) {
      addrs.forEach(addr => {
        if (addr.family === 'IPv4' && !addr.internal) {
          networks.push({
            interface: name,
            address: addr.address,
            netmask: addr.netmask,
            mac: addr.mac,
          });
        }
      });
    }
  }
  
  return networks;
}

function getSystemInfo() {
  return {
    platform: os.platform(),
    type: os.type(),
    release: os.release(),
    arch: os.arch(),
    hostname: os.hostname(),
    nodeVersion: process.version,
  };
}

function getUptimeInfo() {
  const systemUptime = os.uptime();
  const processUptime = process.uptime();
  
  return {
    system: systemUptime,
    process: processUptime,
    systemFormatted: formatUptime(systemUptime),
    processFormatted: formatUptime(processUptime),
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

async function getProcessInfo() {
  try {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: usar tasklist
      const { stdout } = await execAsync('tasklist /FO CSV /NH');
      const lines = stdout.trim().split('\n').slice(0, 10);
      
      return lines.map(line => {
        const parts = line.split(',').map(p => p.replace(/"/g, ''));
        return {
          name: parts[0] || 'Unknown',
          pid: parts[1] || '0',
          memory: parts[4] || '0 K',
        };
      });
    } else {
      // Linux/Mac: usar ps
      const { stdout } = await execAsync('ps aux --sort=-%mem | head -11 | tail -10 2>/dev/null || ps aux | head -11 | tail -10');
      const lines = stdout.trim().split('\n');
      
      return lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          user: parts[0],
          pid: parts[1],
          cpu: parts[2] + '%',
          memory: parts[3] + '%',
          command: parts.slice(10).join(' ').substring(0, 50),
        };
      });
    }
  } catch (error) {
    console.error('Erro ao obter processos:', error);
    return [];
  }
}

async function getDockerInfo() {
  try {
    // Verificar se Docker está disponível
    await execAsync('docker --version');
    
    // Obter containers rodando
    const { stdout: containersOutput } = await execAsync('docker ps --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}"');
    const containers = containersOutput.trim().split('\n').filter(Boolean).map(line => {
      const [id, name, status, image] = line.split('|');
      return { id, name, status, image };
    });
    
    // Obter estatísticas de uso
    const { stdout: statsOutput } = await execAsync('docker stats --no-stream --format "{{.Container}}|{{.CPUPerc}}|{{.MemUsage}}"');
    const stats = statsOutput.trim().split('\n').filter(Boolean).map(line => {
      const [container, cpu, mem] = line.split('|');
      return { container, cpu, mem };
    });
    
    return {
      available: true,
      containers,
      stats,
    };
  } catch (error) {
    return {
      available: false,
      containers: [],
      stats: [],
    };
  }
}

async function getCPUHistory() {
  // Implementação simplificada - em produção, você pode usar um cache/histórico real
  const samples = [];
  for (let i = 0; i < 60; i++) {
    samples.push({
      timestamp: Date.now() - (60 - i) * 1000,
      usage: Math.random() * 100, // Substituir por dados reais
    });
  }
  return samples;
}

async function getSystemLogs(lines: number) {
  try {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: logs do Event Viewer (simplificado)
      return ['Logs do sistema não disponíveis no Windows via esta interface'];
    } else {
      // Linux: usar journalctl ou tail
      try {
        const { stdout } = await execAsync(`journalctl -n ${lines} --no-pager 2>/dev/null || tail -n ${lines} /var/log/syslog 2>/dev/null || echo "Logs não disponíveis"`);
        return stdout.trim().split('\n');
      } catch {
        return ['Logs do sistema não disponíveis'];
      }
    }
  } catch (error) {
    return ['Erro ao obter logs do sistema'];
  }
}

export default router;
