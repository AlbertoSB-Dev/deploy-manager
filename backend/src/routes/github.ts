import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Configuração OAuth GitHub
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:8000/auth/github/callback';

// Debug - verificar se as variáveis foram carregadas
console.log('🔑 GitHub OAuth Config:');
console.log('  CLIENT_ID:', GITHUB_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado');
console.log('  CLIENT_SECRET:', GITHUB_CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado');
console.log('  REDIRECT_URI:', GITHUB_REDIRECT_URI);

// Iniciar OAuth - Redireciona para GitHub
router.get('/auth/github', (req, res) => {
  const scope = 'repo,read:user,user:email';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URI}&scope=${scope}`;
  
  res.json({ 
    authUrl: githubAuthUrl,
    message: 'Redirecione o usuário para esta URL'
  });
});

// Callback OAuth - Recebe código e troca por token
router.post('/auth/github/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Código de autorização não fornecido' });
      return;
    }

    // Trocar código por access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const { access_token, scope, token_type } = tokenResponse.data;

    if (!access_token) {
      res.status(400).json({ error: 'Falha ao obter access token' });
      return;
    }

    // Buscar informações do usuário
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const user = userResponse.data;

    res.json({
      success: true,
      token: access_token,
      tokenType: token_type,
      scope,
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url
      }
    });
  } catch (error: any) {
    console.error('Erro no callback GitHub:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao autenticar com GitHub',
      details: error.response?.data || error.message
    });
  }
});

// Listar repositórios do usuário
router.get('/repos', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Token de acesso não fornecido' });
      return;
    }

    // Buscar repositórios do usuário
    const reposResponse = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: {
        sort: 'updated',
        per_page: 100,
        affiliation: 'owner,collaborator,organization_member'
      }
    });

    const repos = reposResponse.data.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      cloneUrl: repo.clone_url,
      sshUrl: repo.ssh_url,
      defaultBranch: repo.default_branch,
      language: repo.language,
      updatedAt: repo.updated_at,
      owner: {
        login: repo.owner.login,
        avatar: repo.owner.avatar_url
      }
    }));

    res.json({ repos });
  } catch (error: any) {
    console.error('Erro ao listar repositórios:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao listar repositórios',
      details: error.response?.data || error.message
    });
  }
});

// Listar branches de um repositório
router.get('/repos/:owner/:repo/branches', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { owner, repo } = req.params;

    if (!token) {
      res.status(401).json({ error: 'Token de acesso não fornecido' });
      return;
    }

    const branchesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const branches = branchesResponse.data.map((branch: any) => ({
      name: branch.name,
      protected: branch.protected,
      commit: {
        sha: branch.commit.sha,
        url: branch.commit.url
      }
    }));

    res.json({ branches });
  } catch (error: any) {
    console.error('Erro ao listar branches:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao listar branches',
      details: error.response?.data || error.message
    });
  }
});

// Verificar status da conexão
router.get('/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.json({ connected: false });
      return;
    }

    // Verificar se o token é válido
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    res.json({ 
      connected: true,
      user: {
        login: userResponse.data.login,
        name: userResponse.data.name,
        avatar: userResponse.data.avatar_url
      }
    });
  } catch (error) {
    res.json({ connected: false });
  }
});

export default router;
