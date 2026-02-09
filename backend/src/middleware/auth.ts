import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;

    console.log('🔍 Headers recebidos:', req.headers);
    console.log('🔍 Authorization header:', req.headers.authorization);

    // Verificar se token existe no header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token extraído:', token.substring(0, 20) + '...');
    }

    if (!token) {
      console.log('❌ Token não encontrado no header');
      return res.status(401).json({
        success: false,
        error: 'Não autorizado. Token não fornecido.',
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { id: string };

      // Buscar usuário
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não encontrado.',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Usuário inativo.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro no servidor.',
    });
  }
};

// Middleware para verificar se é admin
export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas administradores.',
    });
  }
};
