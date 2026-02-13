import * as cron from 'node-cron';
import User from '../models/User';
import Plan from '../models/Plan';
import PaymentHistory from '../models/PaymentHistory';
import EmailService from './EmailService';
import AssasService from './AssasService';

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
      await this.generateRenewalInvoices(); // Nova função
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
   * Gerar cobranças de renovação para assinaturas que vencem em 7 dias
   * Para PIX e Boleto, cria a cobrança no Assas e notifica o usuário
   */
  private async generateRenewalInvoices() {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      sevenDaysFromNow.setHours(23, 59, 59, 999);

      const sixDaysFromNow = new Date();
      sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);
      sixDaysFromNow.setHours(0, 0, 0, 0);

      // Buscar assinaturas ativas que vencem em 7 dias e têm renovação automática ativada
      const renewingUsers = await User.find({
        'subscription.status': 'active',
        'subscription.autoRenew': true,
        'subscription.endDate': {
          $gte: sixDaysFromNow,
          $lte: sevenDaysFromNow,
        },
      }).populate('subscription.planId');

      console.log(`💳 Encontradas ${renewingUsers.length} assinaturas para renovar em 7 dias`);

      for (const user of renewingUsers) {
        if (!user.subscription?.planId || !user.subscription?.assasCustomerId) {
          console.log(`⏭️ Pulando ${user.email} - dados incompletos`);
          continue;
        }

        // Verificar se já existe cobrança pendente para este período
        const existingInvoice = await PaymentHistory.findOne({
          userId: user._id,
          status: 'pending',
          dueDate: { $gte: sixDaysFromNow, $lte: sevenDaysFromNow },
          'metadata.changeType': 'renewal',
        });

        if (existingInvoice) {
          console.log(`⏭️ Cobrança já existe para ${user.email}`);
          continue;
        }

        const plan = user.subscription.planId as any;
        const amount = plan.calculatePrice(user.subscription.serversCount || 1);
        const dueDate = new Date(user.subscription.endDate!);

        try {
          // Buscar último pagamento para saber o método preferido
          const lastPayment = await PaymentHistory.findOne({ 
            userId: user._id,
            status: { $in: ['confirmed', 'received'] }
          }).sort({ createdAt: -1 });

          const paymentMethod = lastPayment?.paymentMethod || 'BOLETO';

          // Se for cartão de crédito, o Assas renova automaticamente
          if (paymentMethod === 'CREDIT_CARD') {
            console.log(`💳 ${user.email} usa cartão - renovação automática pelo Assas`);
            continue;
          }

          // Para PIX e Boleto, criar cobrança manual
          console.log(`📄 Gerando cobrança ${paymentMethod} para ${user.email}`);
          
          const invoice = await AssasService.createInvoice(
            user.subscription.assasCustomerId,
            amount,
            `Renovação ${plan.name} - ${user.subscription.serversCount || 1} servidor(es)`,
            dueDate.toISOString().split('T')[0],
            paymentMethod as 'BOLETO' | 'PIX'
          );

          // Criar registro no histórico
          const payment = await PaymentHistory.create({
            userId: user._id,
            planId: plan._id,
            amount: amount,
            status: 'pending',
            paymentMethod: paymentMethod,
            description: `Renovação ${plan.name} - ${user.subscription.serversCount || 1} servidor(es)`,
            assasPaymentId: invoice.id,
            assasInvoiceUrl: invoice.invoiceUrl || invoice.bankSlipUrl,
            dueDate: dueDate,
            serversCount: user.subscription.serversCount || 1,
            metadata: {
              changeType: 'renewal',
            },
          });

          // Enviar email com link de pagamento
          await EmailService.sendRenewalInvoice(user, plan.name, amount, payment.assasInvoiceUrl!, dueDate);
          
          console.log(`✅ Cobrança gerada para ${user.email} - ${paymentMethod}`);
        } catch (error: any) {
          console.error(`❌ Erro ao gerar cobrança para ${user.email}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao gerar cobranças de renovação:', error);
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
