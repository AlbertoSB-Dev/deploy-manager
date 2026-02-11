import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import User from '../models/User';

/**
 * Middleware para verificar se o usuário tem acesso ativo (trial ou assinatura paga)
 */
export const checkSubscriptionActive = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

    // Verificar se é admin (admins sempre têm acesso)
    if (user.role === 'admin') {
      return next();
    }

    // Verificar se trial está ativo
    if (user.isTrialActive?.()) {
      return next();
    }

    // Verificar se assinatura está ativa
    if (user.isSubscriptionActive?.()) {
      return next();
    }

    // Acesso negado
    const trialEndDate = user.subscription?.endDate;
    return res.status(403).json({
      success: false,
      error: 'Sua assinatura expirou. Por favor, renove sua assinatura para continuar.',
      data: {
        trialEndDate,
        subscriptionStatus: user.subscription?.status,
      },
    });
  } catch (error: any) {
    console.error('Erro ao verificar assinatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar assinatura.',
    });
  }
};

/**
 * Middleware para verificar se o usuário pode criar novos servidores (apenas 1 no trial)
 */
export const checkServerLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

    // Admins não têm limite
    if (user.role === 'admin') {
      return next();
    }

    // Se está em trial, verificar limite de 1 servidor
    if (user.isTrialActive?.()) {
      const Server = require('../models/Server').default;
      const serverCount = await Server.countDocuments({ userId: user._id });

      if (serverCount >= 1) {
        return res.status(403).json({
          success: false,
          error: 'Você atingiu o limite de 1 servidor no período de trial. Faça upgrade para continuar.',
          data: {
            limit: 1,
            current: serverCount,
            trialEndDate: user.subscription?.endDate,
          },
        });
      }
    }

    next();
  } catch (error: any) {
    console.error('Erro ao verificar limite de servidores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar limite de servidores.',
    });
  }
};

/**
 * Middleware para bloquear edição/exclusão quando trial expirou
 */
export const checkCanModify = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

    // Admins podem modificar
    if (user.role === 'admin') {
      return next();
    }

    // Se trial está ativo, pode modificar
    if (user.isTrialActive?.()) {
      return next();
    }

    // Se assinatura está ativa, pode modificar
    if (user.isSubscriptionActive?.()) {
      return next();
    }

    // Acesso negado - trial expirou
    return res.status(403).json({
      success: false,
      error: 'Sua assinatura expirou. Você pode visualizar seus projetos, mas não pode fazer modificações. Renove sua assinatura para continuar.',
      data: {
        trialEndDate: user.subscription?.endDate,
        subscriptionStatus: user.subscription?.status,
      },
    });
  } catch (error: any) {
    console.error('Erro ao verificar permissão de modificação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar permissão.',
    });
  }
};
