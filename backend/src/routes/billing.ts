import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import PaymentHistory from '../models/PaymentHistory';
import Plan from '../models/Plan';

const router = express.Router();

/**
 * @route   GET /api/billing/history
 * @desc    Obter histórico de pagamentos do usuário
 * @access  Private
 */
router.get('/history', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    const payments = await PaymentHistory.find({ userId })
      .populate('planId', 'name')
      .sort({ createdAt: -1 })
      .limit(50); // Últimos 50 pagamentos

    res.json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    console.error('Erro ao buscar histórico de pagamentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico de pagamentos',
    });
  }
});

/**
 * @route   GET /api/billing/subscription-details
 * @desc    Obter detalhes completos da assinatura
 * @access  Private
 */
router.get('/subscription-details', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    const user = await User.findById(userId).populate('subscription.planId');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Calcular dias restantes
    let daysRemaining = 0;
    if (user.subscription?.endDate) {
      const now = new Date();
      const endDate = new Date(user.subscription.endDate);
      daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Buscar último pagamento
    const lastPayment = await PaymentHistory.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate('planId', 'name');

    // Buscar próximo pagamento pendente
    const nextPayment = await PaymentHistory.findOne({
      userId,
      status: 'pending',
      dueDate: { $gte: new Date() },
    })
      .sort({ dueDate: 1 })
      .populate('planId', 'name');

    res.json({
      success: true,
      data: {
        subscription: user.subscription,
        daysRemaining,
        lastPayment,
        nextPayment,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar detalhes da assinatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar detalhes da assinatura',
    });
  }
});

/**
 * @route   PUT /api/billing/auto-renew
 * @desc    Ativar/desativar renovação automática
 * @access  Private
 */
router.put('/auto-renew', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { autoRenew } = req.body;

    if (typeof autoRenew !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'autoRenew deve ser true ou false',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    if (!user.subscription) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não possui assinatura',
      });
    }

    user.subscription.autoRenew = autoRenew;
    await user.save();

    res.json({
      success: true,
      message: autoRenew
        ? 'Renovação automática ativada com sucesso'
        : 'Renovação automática desativada com sucesso',
      data: {
        autoRenew: user.subscription.autoRenew,
      },
    });
  } catch (error: any) {
    console.error('Erro ao atualizar renovação automática:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar renovação automática',
    });
  }
});

/**
 * @route   GET /api/billing/invoice/:paymentId
 * @desc    Obter fatura específica
 * @access  Private
 */
router.get('/invoice/:paymentId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { paymentId } = req.params;

    const payment = await PaymentHistory.findOne({
      _id: paymentId,
      userId,
    }).populate('planId', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Fatura não encontrada',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('Erro ao buscar fatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar fatura',
    });
  }
});

export default router;
