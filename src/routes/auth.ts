import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';

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

// Debug - verificar configuração
console.log('🔑 GitHub OAuth Config (Auth Routes):');
console.log('  CLIENT_ID:', GITHUB_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado');
console.log('  CLIENT_SECRET:', GITHUB_CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado');
console.log('  CALLBACK_URL:', GITHUB_CALLBACK_URL);

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
    const { name, email, password } = req.body;

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
    });

    // Gerar token
    const token = generateToken(user._id.toString());

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
    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

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
      .update(token)
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

export default router;
