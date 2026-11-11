import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Server-side secure credentials storage path
const AUTH_STORE_PATH = path.resolve(process.cwd(), '.admin-credentials.json');

interface AuthStore {
  salt: string;
  hash: string;
  updatedAt: string;
}

// Generate PBKDF2 hash
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// Initialize or load server-side admin credentials
function getAdminCredentials(): AuthStore {
  try {
    if (fs.existsSync(AUTH_STORE_PATH)) {
      const data = fs.readFileSync(AUTH_STORE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading auth store, reinitializing:', err);
  }

  // Initial required password is 1989
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword('1989', salt);
  const store: AuthStore = {
    salt,
    hash,
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(AUTH_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing auth store:', err);
  }

  return store;
}

// In-memory active administrative sessions with expiry (24 hours)
interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, AdminSession>();

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt <= now) {
      activeSessions.delete(token);
    }
  }
}

// Admin Authentication: verify password strictly on the server
app.post('/api/admin/verify', (req, res) => {
  cleanExpiredSessions();
  const { password } = req.body;

  if (typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ success: false, error: 'A senha administrativa é obrigatória.' });
  }

  const credentials = getAdminCredentials();
  const inputHash = hashPassword(password.trim(), credentials.salt);

  // Constant-time comparison to prevent timing attacks
  const match = crypto.timingSafeEqual(
    Buffer.from(inputHash, 'hex'),
    Buffer.from(credentials.hash, 'hex')
  );

  if (!match) {
    return res.status(401).json({
      success: false,
      error: 'Chave de segurança incorreta. Acesso administrativo estritamente negado.'
    });
  }

  // Generate cryptographic session token
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  activeSessions.set(token, {
    token,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000 // 24 hours
  });

  return res.json({
    success: true,
    token,
    role: 'admin',
    message: 'Acesso administrativo autorizado com sucesso.'
  });
});

// Admin Authentication: check active session
app.get('/api/admin/check-session', (req, res) => {
  cleanExpiredSessions();
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.query.token as string || '');

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ authenticated: false, error: 'Sessão inválida ou expirada.' });
  }

  return res.json({ authenticated: true, role: 'admin' });
});

// Admin Authentication: change password
app.post('/api/admin/change-password', (req, res) => {
  cleanExpiredSessions();
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ success: false, error: 'Apenas administradores autenticados podem alterar a senha.' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 4) {
    return res.status(400).json({ success: false, error: 'Nova senha deve possuir pelo menos 4 caracteres.' });
  }

  const credentials = getAdminCredentials();
  const inputHash = hashPassword(currentPassword.trim(), credentials.salt);
  const match = crypto.timingSafeEqual(
    Buffer.from(inputHash, 'hex'),
    Buffer.from(credentials.hash, 'hex')
  );

  if (!match) {
    return res.status(401).json({ success: false, error: 'Senha atual incorreta.' });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword.trim(), newSalt);
  const updatedStore: AuthStore = {
    salt: newSalt,
    hash: newHash,
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(AUTH_STORE_PATH, JSON.stringify(updatedStore, null, 2), 'utf-8');
    return res.json({ success: true, message: 'Senha administrativa atualizada com sucesso.' });
  } catch (err) {
    console.error('Error saving updated credentials:', err);
    return res.status(500).json({ success: false, error: 'Erro ao persistir nova senha no servidor.' });
  }
});

// Admin Authentication: logout
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (token && activeSessions.has(token)) {
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
});

// --- OWNER AUTHENTICATION (Real Server-Side Credentials for Owner accounts) ---
const OWNER_ACCOUNTS: Record<string, string> = {
  'jogadorprincipal3@gmail.com': 'Tavao020507',
  'otaviocarlosm75@gmail.com': 'Tavao020507'
};

app.post('/api/auth/verify-owner', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPass = String(password).trim();

  if (OWNER_ACCOUNTS[cleanEmail] && OWNER_ACCOUNTS[cleanEmail] === cleanPass) {
    // Generate an admin/owner session token
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    activeSessions.set(token, {
      token,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      isOwner: true,
      role: 'owner',
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      token,
      message: 'Autenticado com sucesso como Dono (Owner).'
    });
  }

  return res.status(401).json({
    success: false,
    isOwner: false,
    error: 'Credenciais de dono inválidas.'
  });
});

// --- DISCORD OAUTH2 INTEGRATION (Follows OAuth Skill) ---
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || '1570077567933751459';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || process.env.CLIENT_SECRET || 'ZFV-lnxMviSB0CfYkh11VLYF5p5wTJ2H';

app.get('/api/auth/discord/url', (req, res) => {
  const clientId = DISCORD_CLIENT_ID;
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const defaultAppUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = (req.query.redirect_uri as string) || `${defaultAppUrl}/auth/callback`;

  if (!clientId) {
    return res.json({
      configured: false,
      url: null,
      redirectUri,
      message: 'Discord Client ID não configurado no servidor.'
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email'
  });

  const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  return res.json({ configured: true, url, redirectUri });
});

// Discord OAuth Callback Route (with postMessage to opener popup)
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="background:#090a0f;color:#fff;font-family:sans-serif;padding:30px;text-align:center;">
          <h2 style="color:#ef4444;">Falha na Autorização do Discord</h2>
          <p>${String(error)}</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }

  const clientId = DISCORD_CLIENT_ID;
  const clientSecret = DISCORD_CLIENT_SECRET;
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const defaultAppUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${defaultAppUrl}/auth/callback`;

  if (code && clientId && clientSecret) {
    try {
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code: String(code),
          redirect_uri: redirectUri
        }).toString()
      });

      const tokenData = await tokenResponse.json() as any;
      if (tokenData.access_token) {
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const discordUser = await userResponse.json() as any;

        const displayName = discordUser.global_name || discordUser.username || 'DiscordUser';
        const userHandle = discordUser.username 
          ? `@${discordUser.username}` 
          : `@${displayName}`;

        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Discord Autenticado</title>
              <style>
                body {
                  background: #090a0f;
                  color: #fff;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  text-align: center;
                }
                .badge {
                  background: #5865F2;
                  color: #fff;
                  padding: 8px 18px;
                  border-radius: 9999px;
                  font-weight: bold;
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 12px;
                }
              </style>
            </head>
            <body>
              <div class="badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord Vinculado!
              </div>
              <p style="font-size: 14px; color: #d4d4d8;">Conta autorizada: <strong>${displayName}</strong> (${userHandle})</p>
              <p style="font-size: 12px; color: #71717a;">Fechando janela e retornando ao site...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_SUCCESS',
                    discord: {
                      id: ${JSON.stringify(discordUser.id)},
                      username: ${JSON.stringify(userHandle)},
                      displayName: ${JSON.stringify(displayName)},
                      tag: ${JSON.stringify(userHandle)},
                      avatar: ${JSON.stringify(discordUser.avatar)}
                    }
                  }, '*');
                  setTimeout(() => window.close(), 500);
                } else {
                  window.location.href = '/';
                }
              </script>
            </body>
          </html>
        `);
      } else {
        console.error('Failed to get Discord access token:', tokenData);
      }
    } catch (err) {
      console.error('Error exchanging Discord OAuth token:', err);
    }
  }

  // Fallback for popup
  return res.send(`
    <!DOCTYPE html>
    <html>
      <body style="background:#090a0f;color:#fff;font-family:sans-serif;padding:30px;text-align:center;">
        <h3 style="color:#5865F2;">Discord Conectado</h3>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
            setTimeout(() => window.close(), 600);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// --- CENTRALIZED ERROR LOGGING ENDPOINT ---
app.post('/api/logs/error', (req, res) => {
  const { error, context, userEmail } = req.body;
  const timestamp = new Date().toISOString();
  console.error(`[APPLICATION ERROR ${timestamp}]:`, {
    error: typeof error === 'object' ? JSON.stringify(error) : error,
    context,
    userEmail: userEmail ? '[USER_LOGGED]' : '[ANONYMOUS]'
  });
  return res.json({ logged: true, timestamp });
});

// Full-stack Vite dev/prod server integration
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Fallback for SPA routing in dev mode
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        if (e instanceof Error) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
