import cron from 'node-cron';
import User from '../models/User';
import EmailService from './EmailService';

export class SubscriptionRenewalService {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Iniciar serviço de renovação automática
   * Executa todo dia às 3h da manhã
   */
  start() {
    const enabled = process.env.SUBSCRIPTION_RENEWAL_ENABLED !== 'false';
    
    if (!enabled) {
      console.log('🔄 Renovação automática desabilitada');
      return;
    }

    // Executar todo dia às 3h da manhã
    this.cronJob = cron.schedule('0 3 * * *', async () => {
      console.log('🔄 Iniciando verificação de assinaturas...');
      await this.checkSubscriptions();
    });

    console.log('✅ Serviço de renovação automática iniciado (executa às 3h)');
    
    // Executar imediatamente na inicialização (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Executando verificação inicial...');
      this.checkSubscriptions();
    }
  }

  /**
   * Parar serviço
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 Serviço de renovação automática parado');
    }
  }

  /**
   * Verificar assinaturas expirando e expiradas
   */
  private async checkSubscriptions() {
    try {
      await this.checkExpiringTrials();
      await this.checkExpiredTrials();
      await this.checkExpiredSubscriptions();
    } catch (error) {
      console.error('❌ Erro ao verificar assinaturas:', error);
    }
  }

  /**
   * Verificar trials expirando em 3 dias
   */
  private async checkExpiringTrials() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(23, 59, 59, 999);

      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      twoDaysFromNow.setHours(0, 0, 0, 0);

      const expiringUsers = await User.find({
        'subscription.status': 'trial',
        'subscription.endDate': {
          $gte: twoDaysFromNow,
          $lte: threeDaysFromNow,
        },
      });

      console.log(`📧 Encontrados ${expiringUsers.length} trials expirando em 3 dias`);

      for (const user of expiringUsers) {
        // Verificar se já enviou email hoje
        const lastEmailDate = (user as any).lastExpirationWarningEmail;
        const today = new Date().toDateString();
        
        if (lastEmailDate && new Date(lastEmailDate).toDateString() === today) {
          console.log(`⏭️ Email já enviado hoje para ${user.email}`);
          continue;
        }

        console.log(`📧 Enviando aviso de expiração para ${user.email}`);
        await EmailService.sendExpirationWarning(user);
        
        // Marcar que enviou email
        (user as any).lastExpirationWarningEmail = new Date();
        await user.save();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar trials expirando:', error);
    }
  }

  /**
   * Verificar trials expirados
   */
  private async checkExpiredTrials() {
    try {
      const now = new Date();

      const expiredUsers = await User.find({
        'subscription.status': 'trial',
        'subscription.endDate': { $lte: now },
      });

      console.log(`⚠️ Encontrados ${expiredUsers.length} trials expirados`);

      for (const user of expiredUsers) {
        console.log(`⚠️ Trial expirado para ${user.email}`);
        
        // Atualizar status para inactive
        if (user.subscription) {
          user.subscription.status = 'inactive';
          await user.save();
        }

        // Verificar se já enviou email de expiração
        const lastEmailDate = (user as any).lastExpiredEmail;
        const today = new Date().toDateString();
        
        if (lastEmailDate && new Date(lastEmailDate).toDateString() === today) {
          console.log(`⏭️ Email de expiração já enviado hoje para ${user.email}`);
          continue;
        }

        // Enviar email de expiração
        console.log(`📧 Enviando notificação de expiração para ${user.email}`);
        await EmailService.sendExpiredNotification(user);
        
        // Marcar que enviou email
        (user as any).lastExpiredEmail = new Date();
        await user.save();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar trials expirados:', error);
    }
  }

  /**
   * Verificar assinaturas pagas expiradas
   */
  private async checkExpiredSubscriptions() {
    try {
      const now = new Date();

      const expiredUsers = await User.find({
        'subscription.status': 'active',
        'subscription.endDate': { $lte: now },
      });

      console.log(`⚠️ Encontradas ${expiredUsers.length} assinaturas expiradas`);

      for (const user of expiredUsers) {
        console.log(`⚠️ Assinatura expirada para ${user.email}`);
        
        // Atualizar status para inactive
        if (user.subscription) {
          user.subscription.status = 'inactive';
          await user.save();
        }

        // Enviar email de expiração
        console.log(`📧 Enviando notificação de expiração para ${user.email}`);
        await EmailService.sendExpiredNotification(user);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar assinaturas expiradas:', error);
    }
  }

  /**
   * Executar verificação manualmente (para testes)
   */
  async runManually() {
    console.log('🔄 Executando verificação manual...');
    await this.checkSubscriptions();
  }
}

export default new SubscriptionRenewalService();
