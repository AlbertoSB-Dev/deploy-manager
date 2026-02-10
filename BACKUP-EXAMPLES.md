# 📚 Sistema de Backup - Exemplos de Uso

## 🎯 Exemplos Práticos de Integração

### 1. Backup Automático Antes de Deploy

```typescript
// frontend/src/components/DeployVersionModal.tsx

const handleDeploy = async () => {
  try {
    // 1. Criar backup antes do deploy
    toast.loading('Criando backup de segurança...', { id: 'backup' });
    
    await api.post(`/backups/project/${projectId}`, {
      storageType: 'local'
    });
    
    toast.success('Backup criado!', { id: 'backup' });
    
    // 2. Fazer deploy
    toast.loading('Fazendo deploy...', { id: 'deploy' });
    
    await api.post(`/projects/${projectId}/deploy`, {
      version: selectedVersion,
      deployedBy: 'user'
    });
    
    toast.success('Deploy concluído!', { id: 'deploy' });
    
  } catch (error) {
    toast.error('Erro no processo', { id: 'deploy' });
  }
};
```

---

### 2. Backup Agendado (Cron Job - Backend)

```typescript
// backend/src/services/ScheduledBackupService.ts

import cron from 'node-cron';
import { backupService } from './BackupService';
import Database from '../models/Database';

export class ScheduledBackupService {
  
  // Executar todo dia às 2h da manhã
  startDailyBackups() {
    cron.schedule('0 2 * * *', async () => {
      console.log('🕐 Iniciando backups agendados...');
      
      try {
        // Buscar todos os bancos com backup habilitado
        const databases = await Database.find({
          'schedule.enabled': true,
          'schedule.frequency': 'daily'
        });
        
        for (const db of databases) {
          try {
            await backupService.createBackup({
              resourceId: db._id.toString(),
              type: 'database',
              storageType: 'local',
              userId: db.userId
            });
            
            console.log(`✅ Backup criado: ${db.displayName}`);
          } catch (error) {
            console.error(`❌ Erro no backup de ${db.displayName}:`, error);
          }
        }
        
        console.log('✅ Backups agendados concluídos!');
      } catch (error) {
        console.error('❌ Erro nos backups agendados:', error);
      }
    });
  }
  
  // Executar toda semana (domingo às 3h)
  startWeeklyBackups() {
    cron.schedule('0 3 * * 0', async () => {
      console.log('🕐 Iniciando backups semanais...');
      // Lógica similar ao daily
    });
  }
}

// Iniciar no index.ts
const scheduledBackup = new ScheduledBackupService();
scheduledBackup.startDailyBackups();
scheduledBackup.startWeeklyBackups();
```

---

### 3. Restore de Emergência com Rollback

```typescript
// frontend/src/components/EmergencyRestore.tsx

const emergencyRestore = async (resourceId: string, resourceType: string) => {
  try {
    // 1. Listar backups do recurso
    const response = await api.get(`/backups?resourceId=${resourceId}&status=completed`);
    const backups = response.data;
    
    if (backups.length === 0) {
      toast.error('Nenhum backup disponível');
      return;
    }
    
    // 2. Ordenar por data (mais recente primeiro)
    backups.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 3. Pegar último backup
    const lastBackup = backups[0];
    
    // 4. Confirmar com usuário
    const confirmed = confirm(
      `Restaurar backup de ${formatDistanceToNow(new Date(lastBackup.createdAt), { addSuffix: true, locale: ptBR })}?\n\n` +
      `Tamanho: ${formatBytes(lastBackup.size)}\n` +
      `Status: ${lastBackup.status}\n\n` +
      `ATENÇÃO: Dados atuais serão sobrescritos!`
    );
    
    if (!confirmed) return;
    
    // 5. Restaurar
    toast.loading('Restaurando backup...', { id: 'restore' });
    
    await api.post(`/backups/${lastBackup._id}/restore`);
    
    toast.success('Backup restaurado com sucesso!', { id: 'restore' });
    
    // 6. Recarregar dados
    window.location.reload();
    
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Erro ao restaurar', { id: 'restore' });
  }
};
```

---

### 4. Backup com Upload para MinIO

```typescript
// frontend/src/components/BackupWithMinio.tsx

const createBackupWithMinio = async (resourceId: string, resourceType: string) => {
  try {
    // Buscar configuração do MinIO do usuário
    const minioConfig = {
      endpoint: 'minio.example.com',
      port: 9000,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
      bucket: 'backups'
    };
    
    toast.loading('Criando backup e enviando para MinIO...', { id: 'backup' });
    
    const response = await api.post(`/backups/${resourceType}/${resourceId}`, {
      storageType: 'minio',
      minioConfig
    });
    
    toast.success(
      `Backup criado e enviado para MinIO!\n` +
      `Bucket: ${response.data.bucket}\n` +
      `Path: ${response.data.remotePath}`,
      { id: 'backup', duration: 5000 }
    );
    
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Erro ao criar backup', { id: 'backup' });
  }
};
```

---

### 5. Limpeza Automática de Backups Antigos

```typescript
// backend/src/services/BackupCleanupService.ts

import cron from 'node-cron';
import Backup from '../models/Backup';
import { backupService } from './BackupService';

export class BackupCleanupService {
  
  // Executar todo dia às 4h da manhã
  startCleanup() {
    cron.schedule('0 4 * * *', async () => {
      console.log('🧹 Iniciando limpeza de backups antigos...');
      
      try {
        // Buscar backups com retenção configurada
        const backups = await Backup.find({
          status: 'completed',
          'schedule.enabled': true
        });
        
        for (const backup of backups) {
          const retentionDays = backup.schedule?.retention || 7;
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() - retentionDays);
          
          // Se backup é mais antigo que retenção, deletar
          if (new Date(backup.createdAt) < expirationDate) {
            try {
              await backupService.deleteBackup(backup._id.toString(), backup.userId);
              console.log(`🗑️  Backup deletado: ${backup.name} (${retentionDays} dias)`);
            } catch (error) {
              console.error(`❌ Erro ao deletar backup ${backup.name}:`, error);
            }
          }
        }
        
        console.log('✅ Limpeza de backups concluída!');
      } catch (error) {
        console.error('❌ Erro na limpeza de backups:', error);
      }
    });
  }
}

// Iniciar no index.ts
const backupCleanup = new BackupCleanupService();
backupCleanup.startCleanup();
```

---

### 6. Notificação por Email Quando Backup Completa

```typescript
// backend/src/services/BackupNotificationService.ts

import nodemailer from 'nodemailer';
import User from '../models/User';

export class BackupNotificationService {
  
  private transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  async notifyBackupComplete(backup: any) {
    try {
      const user = await User.findById(backup.userId);
      if (!user || !user.email) return;
      
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: `✅ Backup Concluído: ${backup.resourceName}`,
        html: `
          <h2>Backup Concluído com Sucesso!</h2>
          <p><strong>Recurso:</strong> ${backup.resourceName}</p>
          <p><strong>Tipo:</strong> ${backup.type}</p>
          <p><strong>Tamanho:</strong> ${this.formatBytes(backup.size)}</p>
          <p><strong>Data:</strong> ${new Date(backup.createdAt).toLocaleString('pt-BR')}</p>
          <p><strong>Armazenamento:</strong> ${backup.storageType}</p>
          <br>
          <p>Acesse o painel para gerenciar seus backups.</p>
        `
      });
      
      console.log(`📧 Email enviado para ${user.email}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
    }
  }
  
  async notifyBackupFailed(backup: any) {
    try {
      const user = await User.findById(backup.userId);
      if (!user || !user.email) return;
      
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: `❌ Backup Falhou: ${backup.resourceName}`,
        html: `
          <h2>Backup Falhou!</h2>
          <p><strong>Recurso:</strong> ${backup.resourceName}</p>
          <p><strong>Tipo:</strong> ${backup.type}</p>
          <p><strong>Erro:</strong> ${backup.error}</p>
          <p><strong>Data:</strong> ${new Date(backup.createdAt).toLocaleString('pt-BR')}</p>
          <br>
          <p>Por favor, verifique o erro e tente novamente.</p>
        `
      });
      
      console.log(`📧 Email de erro enviado para ${user.email}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
    }
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Usar no BackupService.ts
const notificationService = new BackupNotificationService();

// Após criar backup
if (backup.status === 'completed') {
  await notificationService.notifyBackupComplete(backup);
} else if (backup.status === 'failed') {
  await notificationService.notifyBackupFailed(backup);
}
```

---

### 7. Dashboard de Estatísticas de Backup

```typescript
// frontend/src/components/BackupStats.tsx

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { HardDrive, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function BackupStats() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    totalSize: 0,
    lastBackup: null as any
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/backups');
      const backups = response.data;

      const completed = backups.filter(b => b.status === 'completed');
      const failed = backups.filter(b => b.status === 'failed');
      const totalSize = completed.reduce((sum, b) => sum + b.size, 0);
      const lastBackup = completed.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      setStats({
        total: backups.length,
        completed: completed.length,
        failed: failed.length,
        totalSize,
        lastBackup
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Total de Backups */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <HardDrive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Backups</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Backups Completos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Backups Falhados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Falhados</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
          </div>
        </div>
      </div>

      {/* Tamanho Total */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tamanho Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatBytes(stats.totalSize)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 8. Teste de Integridade de Backup

```typescript
// backend/src/services/BackupIntegrityService.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export class BackupIntegrityService {
  
  /**
   * Calcular checksum (MD5) do backup
   */
  async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }
  
  /**
   * Verificar integridade do backup
   */
  async verifyIntegrity(backup: any): Promise<boolean> {
    try {
      if (!backup.localPath) {
        throw new Error('Caminho do backup não encontrado');
      }
      
      // Verificar se arquivo existe
      await fs.access(backup.localPath);
      
      // Verificar se arquivo não está corrompido (tentar descomprimir)
      if (backup.metadata.compressed) {
        await execAsync(`gzip -t ${backup.localPath}`);
      }
      
      // Calcular checksum
      const checksum = await this.calculateChecksum(backup.localPath);
      
      console.log(`✅ Backup íntegro: ${backup.name} (${checksum})`);
      return true;
      
    } catch (error: any) {
      console.error(`❌ Backup corrompido: ${backup.name}`, error.message);
      return false;
    }
  }
  
  /**
   * Verificar todos os backups
   */
  async verifyAllBackups(): Promise<void> {
    const backups = await Backup.find({ status: 'completed' });
    
    console.log(`🔍 Verificando ${backups.length} backups...`);
    
    let valid = 0;
    let invalid = 0;
    
    for (const backup of backups) {
      const isValid = await this.verifyIntegrity(backup);
      if (isValid) {
        valid++;
      } else {
        invalid++;
        // Marcar backup como corrompido
        backup.status = 'failed';
        backup.error = 'Arquivo corrompido ou não encontrado';
        await backup.save();
      }
    }
    
    console.log(`✅ Verificação concluída: ${valid} válidos, ${invalid} inválidos`);
  }
}
```

---

## 🎯 Resumo dos Exemplos

1. ✅ **Backup antes de deploy** - Segurança automática
2. ✅ **Backups agendados** - Automação com cron
3. ✅ **Restore de emergência** - Recuperação rápida
4. ✅ **Upload para MinIO** - Armazenamento remoto
5. ✅ **Limpeza automática** - Gerenciamento de espaço
6. ✅ **Notificações por email** - Alertas automáticos
7. ✅ **Dashboard de estatísticas** - Visualização de dados
8. ✅ **Teste de integridade** - Validação de backups

Todos os exemplos são **prontos para uso** e podem ser adaptados conforme necessário!
