import express, { Request, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Plan from '../models/Plan';
import PaymentHistory from '../models/PaymentHistory';
import AssasService from '../services/AssasService';
import EmailService from '../services/EmailService';

const router = express.Router();

/**
 * @route   POST /api/payments/subscribe
 * @desc    Criar assinatura para um plano
 * @access  Private
 */
router.post('/subscribe', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { planId, billingType, creditCard, servers } = req.body;
    const userId = req.user?._id;

    // Validações
    if (!planId || !billingType) {
      return res.status(400).json({
        success: false,
        error: 'planId e billingType são obrigatórios',
      });
    }

    if (billingType === 'CREDIT_CARD' && !creditCard) {
      return res.status(400).json({
        success: false,
        error: 'Dados do cartão são obrigatórios para pagamento com cartão',
      });
    }

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Buscar plano
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
      });
    }

    // Validar preço calculado no backend
    const expectedPrice = (plan as any).calculatePrice(servers || 1);
    
    // Se o frontend enviou um preço, validar
    if (req.body.price !== undefined) {
      const sentPrice = parseFloat(req.body.price);
      const priceDifference = Math.abs(sentPrice - expectedPrice);
      
      // Permitir diferença de até 0.01 (arredondamento)
      if (priceDifference > 0.01) {
        console.error(`❌ Preço inválido! Esperado: ${expectedPrice}, Recebido: ${sentPrice}`);
        return res.status(400).json({
          success: false,
          error: 'Preço inválido. Por favor, recarregue a página e tente novamente.',
        });
      }
    }

    console.log(`✅ Preço validado: R$ ${expectedPrice} para ${servers || 1} servidor(es)`);

    // Criar cliente no Assas se não existir
    let assasCustomerId = user.subscription?.assasCustomerId;

    if (!assasCustomerId) {
      try {
        const customer = await AssasService.createCustomer({
          name: user.name,
          email: user.email,
          cpfCnpj: '00000000000000', // TODO: Pedir CPF/CNPJ do usuário
        });
        assasCustomerId = customer.id;

        // Salvar ID do cliente Assas no usuário
        if (!user.subscription) {
          user.subscription = {
            status: 'trial',
            startDate: new Date(),
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          };
        }
        user.subscription.assasCustomerId = assasCustomerId;
        await user.save();
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    }

    // Criar plano no Assas se não existir
    let assasPlanId = plan.assasPlanId;

    if (!assasPlanId) {
      try {
        const assasPlan = await AssasService.createPlan(
          plan.name,
          Math.round(plan.pricePerServer * 100) / 100, // Converter para valor correto
          plan.interval === 'monthly' ? 'MONTHLY' : 'YEARLY',
          plan.description
        );
        assasPlanId = assasPlan.id;

        // Salvar ID do plano Assas
        plan.assasPlanId = assasPlanId;
        await plan.save();
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    }

    // Criar assinatura no Assas
    if (!assasCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'ID do cliente Assas não encontrado',
      });
    }

    try {
      const subscription = await AssasService.createSubscription({
        customerId: assasCustomerId,
        planId: assasPlanId!,
        billingType: billingType as 'CREDIT_CARD' | 'PIX' | 'BOLETO',
        creditCard: creditCard,
      });

      // Atualizar usuário com informações da assinatura
      user.subscription = {
        planId: plan._id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + (plan.interval === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
        assasSubscriptionId: subscription.id,
        assasCustomerId: assasCustomerId,
        serversCount: servers || 1,
        autoRenew: true,
      };
      await user.save();

      // Criar registro no histórico de pagamentos (pagamento inicial)
      await PaymentHistory.create({
        userId: user._id,
        planId: plan._id,
        amount: expectedPrice,
        status: 'pending',
        paymentMethod: billingType,
        description: `Assinatura ${plan.name} - ${servers || 1} servidor(es)`,
        assasPaymentId: subscription.id,
        dueDate: subscription.nextDueDate,
        serversCount: servers || 1,
        metadata: {
          newPlan: plan.name,
          changeType: 'new',
        },
      });

      // Criar registro do próximo pagamento (renovação futura)
      const nextRenewalDate = new Date(Date.now() + (plan.interval === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);
      await PaymentHistory.create({
        userId: user._id,
        planId: plan._id,
        amount: expectedPrice,
        status: 'pending',
        paymentMethod: billingType,
        description: `Renovação ${plan.name} - ${servers || 1} servidor(es)`,
        dueDate: nextRenewalDate,
        serversCount: servers || 1,
        metadata: {
          changeType: 'renewal',
        },
      });

      res.json({
        success: true,
        message: 'Assinatura criada com sucesso!',
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          nextDueDate: subscription.nextDueDate,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar assinatura',
    });
  }
});

/**
 * @route   POST /api/payments/cancel-subscription
 * @desc    Cancelar assinatura do usuário
 * @access  Private
 */
router.post('/cancel-subscription', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    const subscriptionId = user.subscription?.assasSubscriptionId;
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não possui assinatura ativa',
      });
    }

    try {
      await AssasService.cancelSubscription(subscriptionId);

      // Atualizar status do usuário
      user.subscription = {
        ...user.subscription,
        status: 'cancelled',
        endDate: new Date(),
      };
      await user.save();

      res.json({
        success: true,
        message: 'Assinatura cancelada com sucesso',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao cancelar assinatura',
    });
  }
});

/**
 * @route   GET /api/payments/subscription-status
 * @desc    Obter status da assinatura do usuário
 * @access  Private
 */
router.get('/subscription-status', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    const user = await User.findById(userId).populate('subscription.planId');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    const subscriptionId = user.subscription?.assasSubscriptionId;

    if (!subscriptionId) {
      return res.json({
        success: true,
        data: {
          status: 'no_subscription',
          message: 'Usuário não possui assinatura',
        },
      });
    }

    try {
      const subscription = await AssasService.getSubscription(subscriptionId);

      res.json({
        success: true,
        data: {
          status: subscription.status,
          nextDueDate: subscription.nextDueDate,
          endDate: subscription.endDate,
          plan: user.subscription?.planId,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  } catch (error: any) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status da assinatura',
    });
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Webhook para receber eventos do Assas
 * @access  Public
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    const signature = req.headers['asaas-access-token'] as string;
    const webhookToken = process.env.ASSAS_WEBHOOK_TOKEN;

    console.log('📨 Webhook recebido do Assas:', event.event);

    // Validar assinatura do webhook
    if (!AssasService.validateWebhookSignature(signature, webhookToken, event)) {
      console.error('❌ Assinatura do webhook inválida');
      return res.status(401).json({
        success: false,
        error: 'Assinatura inválida',
      });
    }

    console.log('✅ Assinatura do webhook validada');

    const processedEvent = AssasService.processWebhook(event);

    // Processar diferentes tipos de eventos
    switch (processedEvent.type) {
      case 'subscription_activated':
      case 'payment_received': {
        // Atualizar status do usuário para ativo
        const subscriptionId = processedEvent.data?.subscription?.id || processedEvent.data?.id;
        const paymentId = processedEvent.data?.payment?.id;
        
        if (subscriptionId) {
          const user = await User.findOne({ 'subscription.assasSubscriptionId': subscriptionId });
          
          if (user) {
            console.log(`✅ Ativando assinatura para usuário: ${user.email}`);
            
            // Buscar plano
            const plan = await Plan.findById(user.subscription?.planId);
            
            // Calcular nova data de expiração
            const endDate = new Date();
            if (plan?.interval === 'yearly') {
              endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
              endDate.setMonth(endDate.getMonth() + 1);
            }
            
            user.subscription = {
              ...user.subscription,
              status: 'active',
              startDate: user.subscription?.startDate || new Date(),
              endDate: endDate,
            };
            
            await user.save();
            console.log(`✅ Assinatura ativada até: ${endDate.toISOString()}`);
            
            // Atualizar histórico de pagamento
            if (paymentId) {
              const payment = await PaymentHistory.findOne({ 
                userId: user._id,
                assasPaymentId: paymentId 
              });
              
              if (payment) {
                payment.status = 'received';
                payment.paymentDate = new Date();
                await payment.save();
                console.log(`✅ Pagamento marcado como recebido no histórico`);
              }
            }
            
            // Criar próximo pagamento pendente se não existir
            const nextRenewalDate = new Date(endDate);
            const existingNextPayment = await PaymentHistory.findOne({
              userId: user._id,
              status: 'pending',
              dueDate: { $gte: new Date() },
            });
            
            if (!existingNextPayment && plan) {
              const amount = (plan as any).calculatePrice(user.subscription?.serversCount || 1);
              await PaymentHistory.create({
                userId: user._id,
                planId: plan._id,
                amount: amount,
                status: 'pending',
                paymentMethod: 'CREDIT_CARD',
                description: `Renovação ${plan.name} - ${user.subscription?.serversCount || 1} servidor(es)`,
                dueDate: nextRenewalDate,
                serversCount: user.subscription?.serversCount || 1,
                metadata: {
                  changeType: 'renewal',
                },
              });
              console.log(`✅ Próximo pagamento criado para: ${nextRenewalDate.toISOString()}`);
            }
            
            // Enviar email de confirmação
            const planName = plan?.name || 'Plano';
            const amount = processedEvent.data?.payment?.value || 0;
            await EmailService.sendPaymentConfirmation(user, planName, amount);
          } else {
            console.warn(`⚠️ Usuário não encontrado para subscription ID: ${subscriptionId}`);
          }
        }
        break;
      }

      case 'subscription_cancelled': {
        // Atualizar status do usuário para cancelado
        const subscriptionId = processedEvent.data?.subscription?.id || processedEvent.data?.id;
        
        if (subscriptionId) {
          const user = await User.findOne({ 'subscription.assasSubscriptionId': subscriptionId });
          
          if (user) {
            console.log(`⚠️ Cancelando assinatura para usuário: ${user.email}`);
            
            user.subscription = {
              ...user.subscription,
              status: 'cancelled',
              endDate: new Date(), // Expira imediatamente
            };
            
            await user.save();
            console.log(`✅ Assinatura cancelada`);
          }
        }
        break;
      }

      case 'payment_overdue': {
        // Atualizar status do usuário para inativo
        const subscriptionId = processedEvent.data?.subscription?.id || processedEvent.data?.id;
        
        if (subscriptionId) {
          const user = await User.findOne({ 'subscription.assasSubscriptionId': subscriptionId });
          
          if (user) {
            console.log(`⚠️ Pagamento atrasado para usuário: ${user.email}`);
            
            user.subscription = {
              ...user.subscription,
              status: 'inactive',
            };
            
            await user.save();
            console.log(`✅ Status atualizado para inativo`);
            
            // Enviar email de aviso
            await EmailService.sendPaymentOverdue(user);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Evento não processado: ${processedEvent.type}`);
    }

    res.json({
      success: true,
      message: 'Webhook processado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar webhook',
    });
  }
});

/**
 * @route   POST /api/payments/change-servers
 * @desc    Aumentar ou diminuir quantidade de servidores
 * @access  Private
 */
router.post('/change-servers', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { newServersCount } = req.body;
    const userId = req.user?._id;

    // Validações
    if (!newServersCount || newServersCount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade de servidores inválida',
      });
    }

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user || !user.subscription) {
      return res.status(404).json({
        success: false,
        error: 'Usuário ou assinatura não encontrada',
      });
    }

    // Verificar se tem assinatura ativa
    if (user.subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Você precisa ter uma assinatura ativa para fazer upgrade/downgrade',
      });
    }

    const currentServers = user.subscription.serversCount || 1;
    
    // Verificar se é realmente uma mudança
    if (currentServers === newServersCount) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade de servidores já é essa',
      });
    }

    // Buscar plano
    const plan = await Plan.findById(user.subscription.planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
      });
    }

    // Calcular valores
    const currentPrice = (plan as any).calculatePrice(currentServers);
    const newPrice = (plan as any).calculatePrice(newServersCount);
    const priceDifference = newPrice - currentPrice;

    // Calcular valor proporcional (dias restantes)
    const now = new Date();
    const endDate = new Date(user.subscription.endDate!);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysInMonth = 30;
    const proportionalValue = (priceDifference * daysRemaining) / daysInMonth;

    console.log(`📊 Mudança de ${currentServers} para ${newServersCount} servidores`);
    console.log(`💰 Preço atual: R$ ${currentPrice.toFixed(2)}`);
    console.log(`💰 Novo preço: R$ ${newPrice.toFixed(2)}`);
    console.log(`💰 Diferença: R$ ${priceDifference.toFixed(2)}`);
    console.log(`📅 Dias restantes: ${daysRemaining}`);
    console.log(`💰 Valor proporcional: R$ ${proportionalValue.toFixed(2)}`);

    // Se for upgrade (aumentar servidores)
    if (newServersCount > currentServers) {
      // Criar cobrança proporcional no Assas
      if (proportionalValue > 0 && user.subscription.assasCustomerId) {
        try {
          await AssasService.createInvoice(
            user.subscription.assasCustomerId,
            proportionalValue,
            `Upgrade para ${newServersCount} servidores (proporcional)`,
            new Date().toISOString().split('T')[0] // Hoje
          );
          console.log('✅ Cobrança proporcional criada no Assas');
        } catch (error: any) {
          console.error('❌ Erro ao criar cobrança:', error);
          return res.status(400).json({
            success: false,
            error: 'Erro ao criar cobrança no Assas: ' + error.message,
          });
        }
      }
    }

    // Se for downgrade (diminuir servidores)
    if (newServersCount < currentServers) {
      // Verificar se tem servidores criados além do novo limite
      const { Server } = await import('../models/Server');
      const serverCount = await Server.countDocuments({ userId: user._id });
      
      if (serverCount > newServersCount) {
        return res.status(400).json({
          success: false,
          error: `Você tem ${serverCount} servidores criados. Delete ${serverCount - newServersCount} servidor(es) antes de fazer downgrade.`,
        });
      }

      // Crédito será aplicado na próxima renovação
      console.log(`💳 Crédito de R$ ${Math.abs(proportionalValue).toFixed(2)} será aplicado na próxima renovação`);
    }

    // Atualizar MongoDB
    user.subscription.serversCount = newServersCount;
    await user.save();

    console.log('✅ Quantidade de servidores atualizada no MongoDB');

    // Criar registro no histórico de pagamentos
    if (proportionalValue > 0 && newServersCount > currentServers) {
      // Upgrade - cobrança imediata
      await PaymentHistory.create({
        userId: user._id,
        planId: plan._id,
        amount: proportionalValue,
        status: 'pending',
        paymentMethod: 'CREDIT_CARD',
        description: `Upgrade para ${newServersCount} servidores (cobrança proporcional)`,
        dueDate: new Date(),
        serversCount: newServersCount,
        metadata: {
          previousPlan: `${currentServers} servidor(es)`,
          newPlan: `${newServersCount} servidor(es)`,
          changeType: 'upgrade',
        },
      });
    } else if (newServersCount < currentServers) {
      // Downgrade - crédito futuro
      await PaymentHistory.create({
        userId: user._id,
        planId: plan._id,
        amount: Math.abs(proportionalValue),
        status: 'confirmed',
        paymentMethod: 'CREDIT_CARD',
        description: `Downgrade para ${newServersCount} servidores (crédito aplicado)`,
        paymentDate: new Date(),
        serversCount: newServersCount,
        metadata: {
          previousPlan: `${currentServers} servidor(es)`,
          newPlan: `${newServersCount} servidor(es)`,
          changeType: 'downgrade',
        },
      });
    }

    res.json({
      success: true,
      message: newServersCount > currentServers 
        ? `Upgrade realizado! Você agora pode ter ${newServersCount} servidores.`
        : `Downgrade realizado! Seu limite agora é ${newServersCount} servidores.`,
      data: {
        oldServersCount: currentServers,
        newServersCount: newServersCount,
        oldPrice: currentPrice,
        newPrice: newPrice,
        priceDifference: priceDifference,
        proportionalCharge: newServersCount > currentServers ? proportionalValue : 0,
        proportionalCredit: newServersCount < currentServers ? Math.abs(proportionalValue) : 0,
        daysRemaining: daysRemaining,
      },
    });
  } catch (error: any) {
    console.error('Erro ao mudar quantidade de servidores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar mudança',
    });
  }
});

export default router;
