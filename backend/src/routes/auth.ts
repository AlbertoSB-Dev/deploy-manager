import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';
import EmailService from '../services/EmailService';

const router = express.Router();

// Função para validar senha forte
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Senha deve ter no mínimo 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos uma letra maiúscula' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos uma letra minúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos um número' };
  }
  return { valid: true };
}

// Configuração OAuth GitHub
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';

// Configuração OAuth Google
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8001/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8000';

// Debug - verificar configuração
console.log('🔑 GitHub OAuth Config (Auth Routes):');
console.log('  CLIENT_ID:', GITHUB_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado');
console.log('  CLIENT_SECRET:', GITHUB_CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado');
console.log('  CALLBACK_URL:', GITHUB_CALLBACK_URL);

console.log('🔑 Google OAuth Config:');
console.log('  CLIENT_ID:', GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado');
console.log('  CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado');
console.log('  CALLBACK_URL:', GOOGLE_CALLBACK_URL);

// Gerar JWT Token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Registrar novo usuário
// @access  Public
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, cpfCnpj } = req.body;

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, preencha todos os campos.',
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.error,
      });
    }

    // Verificar se usuário já existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Email já cadastrado.',
      });
    }

    // Criar usuário
    const user = await User.create({
      name,
      email,
      password,
      cpfCnpj,
      subscription: {
        status: 'trial',
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
        trialServersUsed: 0,
      },
    });

    // Gerar token
    const token = generateToken(user._id.toString());

    // Enviar email de boas-vindas (não bloquear resposta)
    EmailService.sendTrialWelcome(user).catch(err => 
      console.error('Erro ao enviar email de boas-vindas:', err)
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar usuário.',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login de usuário
// @access  Public
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, preencha email e senha.',
      });
    }

    // Buscar usuário (incluindo senha)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos.',
      });
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Usuário inativo. Entre em contato com o suporte.',
      });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos.',
      });
    }

    // Gerar token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer login.',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obter usuário logado
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).populate('subscription.planId');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

    const isTrialActive = user.isTrialActive?.();
    const isSubscriptionActive = user.isSubscriptionActive?.();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        cpfCnpj: user.cpfCnpj,
        role: user.role,
        avatar: user.avatar,
        subscription: user.subscription ? {
          planId: user.subscription.planId,
          status: user.subscription.status,
          startDate: user.subscription.startDate,
          endDate: user.subscription.endDate,
          serversCount: user.subscription.serversCount || 1,
          trialServersUsed: user.subscription.trialServersUsed || 0,
          assasCustomerId: user.subscription.assasCustomerId,
          assasSubscriptionId: user.subscription.assasSubscriptionId,
          isTrialActive,
          isSubscriptionActive,
          daysRemaining: isTrialActive || isSubscriptionActive
            ? Math.ceil((user.subscription.endDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 0,
        } : undefined,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuário.',
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Solicitar recuperação de senha
// @access  Public
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe o email.',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Por segurança, não informar se email existe ou não
      return res.json({
        success: true,
        message: 'Se o email existir, você receberá instruções para recuperação.',
      });
    }

    // Gerar token de recuperação
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    await user.save();

    // TODO: Enviar email com link de recuperação
    // const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    // await sendEmail({ to: user.email, subject: 'Recuperação de senha', html: ... });

    console.log('Token de recuperação:', resetToken);
    console.log('Link de recuperação:', `http://localhost:3000/reset-password/${resetToken}`);

    res.json({
      success: true,
      message: 'Se o email existir, você receberá instruções para recuperação.',
    });
  } catch (error: any) {
    console.error('Erro ao solicitar recuperação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar solicitação.',
    });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Resetar senha
// @access  Public
router.post('/reset-password/:token', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe a nova senha.',
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.error,
      });
    }

    // Hash do token
    const hashedToken = crypto
      .createHash('sha256')
      .update(String(token))
      .digest('hex');

    // Buscar usuário com token válido
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido ou expirado.',
      });
    }

    // Atualizar senha
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Gerar novo token de autenticação
    const authToken = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Senha alterada com sucesso.',
      data: {
        token: authToken,
      },
    });
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao resetar senha.',
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Atualizar perfil do usuário
// @access  Private
router.put('/update-profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

    // Verificar se email já está em uso
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Email já está em uso.',
        });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar perfil.',
    });
  }
});

// @route   GET /api/auth/github/connect
// @desc    Iniciar OAuth GitHub para CONECTAR CONTA (listar repos)
// @access  Private
router.get('/github/connect', protect, (req: AuthRequest, res: Response) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({
      success: false,
      error: 'GitHub OAuth não configurado. Configure GITHUB_CLIENT_ID no .env',
    });
  }

  const scope = 'repo read:user user:email';
  const state = `connect_${req.user?._id}`; // Identificador para conectar + userId
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=${scope}&state=${state}`;
  
  console.log('🔗 GitHub Connect URL gerada (REPOS):', githubAuthUrl);
  console.log('  Redirect URI:', GITHUB_CALLBACK_URL);
  
  res.json({ 
    authUrl: githubAuthUrl,
  });
});

// @route   POST /api/auth/github/connect/callback
// @desc    Callback OAuth GitHub para CONECTAR CONTA
// @access  Private
router.post('/github/connect/callback', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { code, state } = req.body;

    console.log('📥 GitHub Connect Callback recebido');
    console.log('  Code:', code ? `${code.substring(0, 10)}...` : 'VAZIO');
    console.log('  State:', state);

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código de autorização não fornecido.',
      });
    }

    // Verificar se o state corresponde ao usuário
    if (!state || !state.startsWith('connect_')) {
      return res.status(400).json({
        success: false,
        error: 'State inválido.',
      });
    }

    const userId = state.replace('connect_', '');
    if (userId !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'State não corresponde ao usuário.',
      });
    }

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      console.error('❌ Credenciais do GitHub não configuradas!');
      return res.status(500).json({
        success: false,
        error: 'GitHub OAuth não configurado no servidor.',
      });
    }

    console.log('🔄 Trocando código por access token...');
    console.log('  Usando redirect_uri:', GITHUB_CALLBACK_URL);

    // Trocar código por access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    console.log('📦 Resposta do GitHub:', tokenResponse.data);

    const { access_token, error, error_description } = tokenResponse.data;

    if (error) {
      console.error('❌ Erro do GitHub:', error, error_description);
      return res.status(400).json({
        success: false,
        error: `GitHub OAuth Error: ${error_description || error}`,
      });
    }

    if (!access_token) {
      console.error('❌ Access token não recebido');
      return res.status(400).json({
        success: false,
        error: 'Falha ao obter access token do GitHub.',
      });
    }

    console.log('✅ Access token obtido para listar repos');

    // Retornar o token para o frontend salvar
    res.json({
      success: true,
      data: {
        githubToken: access_token,
        message: 'GitHub conectado com sucesso!',
      },
    });
  } catch (error: any) {
    console.error('❌ Erro no callback GitHub Connect:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erro ao conectar com GitHub.',
      details: error.response?.data || error.message,
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Alterar senha
// @access  Private
router.put('/change-password', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe a senha atual e a nova senha.',
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.error,
      });
    }

    const user = await User.findById(req.user?._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

    // Verificar senha atual
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Senha atual incorreta.',
      });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Senha alterada com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao alterar senha.',
    });
  }
});

// @route   POST /api/auth/delete-account
// @desc    Deletar conta do usuário
// @access  Private
router.post('/delete-account', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Senha é obrigatória para deletar a conta.',
      });
    }

    const user = await User.findById(req.user?._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Senha incorreta.',
      });
    }

    // Deletar todos os recursos do usuário
    const Server = (await import('../models/Server')).Server;
    const Project = (await import('../models/Project')).default;
    const Database = (await import('../models/Database')).default;
    const { WordPress } = await import('../models/WordPress');

    await Promise.all([
      Server.deleteMany({ userId: user._id }),
      Project.deleteMany({ userId: user._id }),
      Database.deleteMany({ userId: user._id }),
      WordPress.deleteMany({ userId: user._id }),
    ]);

    // Deletar usuário
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'Conta deletada com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar conta.',
    });
  }
});

// @route   POST /api/auth/verify-password
// @desc    Verificar senha do usuário (para confirmações críticas)
// @access  Private
router.post('/verify-password', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Senha é obrigatória',
      });
    }

    const user = await User.findById(req.user?._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Senha incorreta',
      });
    }

    res.json({
      success: true,
      message: 'Senha verificada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao verificar senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar senha',
    });
  }
});

// @route   GET /api/auth/google
// @desc    Iniciar OAuth Google para LOGIN
// @access  Public
router.get('/google', (req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      success: false,
      error: 'Google OAuth não configurado. Configure GOOGLE_CLIENT_ID no .env',
    });
  }

  const scope = 'openid profile email';
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_CALLBACK_URL)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
  
  console.log('🔗 Google Auth URL gerada:', googleAuthUrl);
  
  res.redirect(googleAuthUrl);
});

// @route   GET /api/auth/google/callback
// @desc    Callback OAuth Google
// @access  Public
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    console.log('📥 Google Callback recebido');
    console.log('  Code:', code ? `${String(code).substring(0, 10)}...` : 'VAZIO');
    console.log('  Error:', error);

    if (error) {
      console.error('❌ Erro do Google:', error);
      return res.redirect(`${FRONTEND_URL}/login?error=${error}`);
    }

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('❌ Credenciais do Google não configuradas!');
      return res.redirect(`${FRONTEND_URL}/login?error=not_configured`);
    }

    console.log('🔄 Trocando código por access token...');

    // Trocar código por access token
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, id_token } = tokenResponse.data;

    if (!access_token) {
      console.error('❌ Access token não recebido');
      return res.redirect(`${FRONTEND_URL}/login?error=no_token`);
    }

    console.log('✅ Access token obtido');

    // Obter informações do usuário
    const userInfoResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { email, name, picture } = userInfoResponse.data;

    console.log('👤 Informações do usuário:', { email, name });

    // Verificar se usuário já existe
    let user = await User.findOne({ email });

    if (!user) {
      // Criar novo usuário
      console.log('📝 Criando novo usuário...');
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(32).toString('hex'), // Senha aleatória (não será usada)
        avatar: picture,
        googleId: userInfoResponse.data.id,
        subscription: {
          status: 'trial',
          startDate: new Date(),
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
          trialServersUsed: 0,
        },
      });
      console.log('✅ Usuário criado');
    } else {
      // Atualizar avatar se mudou
      if (picture && user.avatar !== picture) {
        user.avatar = picture;
        await user.save();
      }
      console.log('✅ Usuário existente encontrado');
    }

    // Gerar token JWT
    const token = generateToken(user._id.toString());

    // Redirecionar para o frontend com o token
    res.redirect(`${FRONTEND_URL}/auth/google/callback?token=${token}`);
  } catch (error: any) {
    console.error('❌ Erro no callback Google:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
    res.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
  }
});

export default router;
