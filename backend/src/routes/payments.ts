import express, { Request, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Plan from '../models/Plan';
import AssasService from '../services/AssasService';

const router = express.Router();

/**
 * @route   POST /api/payments/subscribe
 * @desc    Criar assinatura para um plano
 * @access  Private
 */
router.post('/subscribe', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { planId, billingType, creditCard } = req.body;
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
        user.subscription = user.subscription || {};
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
    try {
      const subscription = await AssasService.createSubscription({
        customerId: assasCustomerId,
        planId: assasPlanId,
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
      };
      await user.save();

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

    console.log('📨 Webhook recebido do Assas:', event.event);

    const processedEvent = AssasService.processWebhook(event);

    // Processar diferentes tipos de eventos
    switch (processedEvent.type) {
      case 'subscription_activated':
      case 'payment_received':
        // Atualizar status do usuário para ativo
        // TODO: Implementar lógica de atualização
        break;

      case 'subscription_cancelled':
      case 'payment_overdue':
        // Atualizar status do usuário para inativo
        // TODO: Implementar lógica de atualização
        break;
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

export default router;
