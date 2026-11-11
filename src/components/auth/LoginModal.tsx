import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  ArrowRight, 
  Shield, 
  CheckCircle2, 
  ShoppingCart, 
  Eye, 
  EyeOff, 
  AlertCircle,
  KeyRound,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { 
  signInWithGoogle, 
  triggerPasswordReset, 
  sanitizeInput, 
  logSecurityEvent, 
  logClientError,
  auth,
  isOwnerEmail
} from '../../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';
import { RegisteredUser, SiteRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: { 
    name: string; 
    email: string; 
    emailVerified?: boolean; 
    uid?: string; 
    role?: SiteRole; 
    discordUsername?: string 
  }) => void;
  promptReason?: 'purchase' | 'ticket' | 'manual' | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// Validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

// Discord Icon Component
const DiscordIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

// Designated Owners according to specification
const OWNER_CREDENTIALS: Record<string, string> = {
  'jogadorprincipal3@gmail.com': 'Tavao020507',
  'otaviocarlosm75@gmail.com': 'Tavao020507'
};

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  promptReason = null
}) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [gmail, setGmail] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [discordConnected, setDiscordConnected] = useState(false);
  const [discordId, setDiscordId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);

  // Rate limiting / brute-force lockout
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const val = localStorage.getItem('fw_auth_failed_attempts');
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    try {
      const val = localStorage.getItem('fw_auth_lockout_until');
      return val ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for Discord OAuth2 postMessage from callback popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (event.data.discord?.username) {
          const userTag = event.data.discord.username.startsWith('@') 
            ? event.data.discord.username 
            : `@${event.data.discord.username}`;
          setDiscordUsername(userTag);
          setDiscordId(event.data.discord.id || '');
          setDiscordConnected(true);
          try {
            localStorage.setItem('devcore_discord_auth', JSON.stringify({
              username: userTag,
              id: event.data.discord.id || ''
            }));
          } catch {}
          toast({
            type: 'success',
            title: 'Discord Vinculado com Sucesso',
            description: `Conta ${userTag} autorizada oficialmente via Discord OAuth2.`
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  // Load saved discord auth if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('devcore_discord_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username) {
          setDiscordUsername(parsed.username);
          setDiscordConnected(true);
          if (parsed.id) setDiscordId(parsed.id);
        }
      }
    } catch {}
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isLockedOut = lockoutUntil !== null && now < lockoutUntil;
  const remainingLockoutSec = isLockedOut ? Math.ceil((lockoutUntil - now) / 1000) : 0;

  const registerFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    try {
      localStorage.setItem('fw_auth_failed_attempts', nextAttempts.toString());
    } catch {}

    if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutUntil(until);
      try {
        localStorage.setItem('fw_auth_lockout_until', until.toString());
      } catch {}
      logSecurityEvent('auth.brute_force_lockout', { attempts: nextAttempts, email: sanitizeInput(gmail) });
      logClientError(new Error('Brute force lockout triggered'), 'auth.brute_force');
      toast({
        type: 'error',
        title: 'Bloqueio de Segurança',
        description: 'Muitas tentativas consecutivas incorretas. Acesso bloqueado por 15 minutos.'
      });
    }
  };

  const resetFailedAttempts = () => {
    setFailedAttempts(0);
    setLockoutUntil(null);
    try {
      localStorage.removeItem('fw_auth_failed_attempts');
      localStorage.removeItem('fw_auth_lockout_until');
    } catch {}
  };

  // Sync registered user to local directory and return assigned role
  const syncUserToDirectory = (userData: { name: string; email: string; uid?: string; discordUsername?: string }): SiteRole => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const isOwner = isOwnerEmail(cleanEmail);
    let usersList: RegisteredUser[] = [];
    try {
      const raw = localStorage.getItem('devcore_registered_users');
      if (raw) usersList = JSON.parse(raw);
    } catch {}

    const existingIndex = usersList.findIndex(u => u.email.toLowerCase() === cleanEmail);
    let assignedRole: SiteRole = isOwner ? 'owner' : 'member';

    const finalDiscord = userData.discordUsername || (existingIndex >= 0 ? usersList[existingIndex].discordUsername : `@${cleanEmail.split('@')[0]}`);

    if (existingIndex >= 0) {
      if (usersList[existingIndex].role === 'owner' || usersList[existingIndex].role === 'admin' || usersList[existingIndex].role === 'customer') {
        assignedRole = usersList[existingIndex].role;
      }
      usersList[existingIndex] = {
        ...usersList[existingIndex],
        name: userData.name || usersList[existingIndex].name,
        discordUsername: finalDiscord,
        role: isOwner ? 'owner' : assignedRole
      };
    } else {
      const newUser: RegisteredUser = {
        id: userData.uid || `u-${Date.now()}`,
        name: userData.name,
        email: cleanEmail,
        discordUsername: finalDiscord,
        role: isOwner ? 'owner' : 'member',
        createdAt: new Date().toISOString(),
        purchasesCount: 0,
        hasActivePlan: false
      };
      usersList.push(newUser);
      assignedRole = newUser.role;
    }

    try {
      localStorage.setItem('devcore_registered_users', JSON.stringify(usersList));
    } catch {}

    return assignedRole;
  };

  // Official Discord OAuth2 Connection Flow
  const handleConnectDiscord = async () => {
    setDiscordLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await fetch(`/api/auth/discord/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      const data = await res.json();

      if (data.configured && data.url) {
        // Direct OAuth provider authorization window
        const authWindow = window.open(
          data.url,
          'discord_oauth',
          'width=580,height=720,menubar=no,toolbar=no'
        );
        if (!authWindow) {
          toast({
            type: 'warning',
            title: 'Pop-up Bloqueado',
            description: 'Permita pop-ups no navegador para autenticar sua conta Discord.'
          });
        }
      } else {
        // Fallback with Discord account handle prompt
        const tagPrompt = window.prompt(
          'Informe sua conta oficial do Discord (Ex: @seunome ou usuario#0000):',
          discordUsername || ''
        );
        if (tagPrompt && tagPrompt.trim()) {
          const cleanTag = tagPrompt.trim().startsWith('@') ? tagPrompt.trim() : `@${tagPrompt.trim()}`;
          setDiscordUsername(cleanTag);
          setDiscordConnected(true);
          try {
            localStorage.setItem('devcore_discord_auth', JSON.stringify({ username: cleanTag }));
          } catch {}
          toast({
            type: 'success',
            title: 'Discord Vinculado',
            description: `Conta ${cleanTag} conectada com sucesso.`
          });
        }
      }
    } catch (err) {
      logClientError(err, 'discord.oauth');
      toast({
        type: 'error',
        title: 'Erro na Conexão',
        description: 'Não foi possível inicializar a vinculação com o Discord.'
      });
    } finally {
      setDiscordLoading(false);
    }
  };

  // 1-Click Google Sign-In
  const handleGoogleSignIn = async () => {
    if (isLockedOut) return;
    setGoogleLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      resetFailedAttempts();

      const userEmail = (googleUser.email || '').trim().toLowerCase();
      const userName = googleUser.displayName || userEmail.split('@')[0] || 'Membro';
      const isOwner = isOwnerEmail(userEmail);

      const role = syncUserToDirectory({
        name: userName,
        email: userEmail,
        uid: googleUser.uid,
        discordUsername: discordUsername || `@${userEmail.split('@')[0]}`
      });

      const effectiveRole: SiteRole = isOwner ? 'owner' : role;

      const userData = {
        name: userName,
        email: userEmail,
        emailVerified: googleUser.emailVerified,
        uid: googleUser.uid,
        role: effectiveRole,
        discordUsername: discordUsername || `@${userEmail.split('@')[0]}`
      };

      try {
        localStorage.setItem('devcore_user', JSON.stringify(userData));
        localStorage.setItem('devcore_discord_auth', JSON.stringify({ username: userData.discordUsername }));
        if (isOwner) {
          localStorage.setItem('devcore_admin_session', 'true');
        }
      } catch {}

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }

      toast({
        type: 'success',
        title: isOwner ? '👑 Acesso Dono (Owner) Liberado' : 'Conta Autenticada',
        description: isOwner 
          ? `Bem-vindo, Dono ${userName}! Painel administrativo habilitado.`
          : `Bem-vindo, ${userName}! Conta verificada com sucesso.`
      });
      onClose();
    } catch (err: unknown) {
      logClientError(err, 'auth.google_signin');
      const errorMsg = err instanceof Error ? err.message : '';
      if (!errorMsg.includes('popup-closed-by-user')) {
        toast({
          type: 'error',
          title: 'Falha na autenticação',
          description: 'Não foi possível autenticar com o Google no momento.'
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Password Recovery Flow
  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeInput(gmail).trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      toast({
        type: 'warning',
        title: 'E-mail Inválido',
        description: 'Informe um endereço de e-mail válido para redefinição.'
      });
      return;
    }

    setLoading(true);
    try {
      await triggerPasswordReset(cleanEmail);
      toast({
        type: 'success',
        title: 'E-mail de Recuperação Enviado',
        description: `Enviamos as instruções para ${cleanEmail}. Verifique sua caixa de entrada e spam.`
      });
      setMode('login');
    } catch (err: unknown) {
      logClientError(err, 'auth.password_recovery');
      toast({
        type: 'error',
        title: 'Falha na Recuperação',
        description: 'Não foi possível enviar o e-mail de recuperação.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Main Submit Handler (Register or Login)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut) {
      toast({
        type: 'error',
        title: 'Conta Temporariamente Bloqueada',
        description: `Aguarde ${Math.ceil(remainingLockoutSec / 60)} minuto(s) para tentar novamente.`
      });
      return;
    }

    const cleanEmail = sanitizeInput(gmail).trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check email format
    if (!cleanEmail) {
      toast({ type: 'warning', title: 'Campo Obrigatório', description: 'Por favor, informe seu e-mail.' });
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      toast({ type: 'error', title: 'E-mail Inválido', description: 'Informe um endereço de e-mail válido (ex: seuemail@gmail.com).' });
      return;
    }

    // Check if this is an Owner logging in
    const isOwnerTarget = isOwnerEmail(cleanEmail);

    if (mode === 'login') {
      // Owner login with specific credentials: jogadorprincipal3@gmail.com / otaviocarlosm75@gmail.com
      if (isOwnerTarget) {
        if (cleanPassword === OWNER_CREDENTIALS[cleanEmail]) {
          resetFailedAttempts();
          const derivedName = cleanEmail.split('@')[0];
          const userData = {
            name: derivedName,
            email: cleanEmail,
            emailVerified: true,
            uid: `owner-${derivedName}`,
            role: 'owner' as SiteRole,
            discordUsername: discordUsername || `@${derivedName}`
          };

          try {
            localStorage.setItem('devcore_user', JSON.stringify(userData));
            localStorage.setItem('devcore_discord_auth', JSON.stringify({ username: userData.discordUsername }));
            localStorage.setItem('devcore_admin_session', 'true');
          } catch {}

          syncUserToDirectory(userData);

          if (onLoginSuccess) onLoginSuccess(userData);

          toast({
            type: 'success',
            title: '👑 Dono (Owner) Autenticado',
            description: `Bem-vindo, Dono ${derivedName}! Permissões administrativas ativas.`
          });
          onClose();
          return;
        }
      }

      // Standard user login via Firebase Auth
      if (!cleanPassword) {
        toast({ type: 'warning', title: 'Senha Obrigatória', description: 'Digite sua senha para entrar.' });
        return;
      }

      setLoading(true);
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        resetFailedAttempts();

        const derivedName = cred.user.displayName || cleanEmail.split('@')[0];
        const role = syncUserToDirectory({
          name: derivedName,
          email: cleanEmail,
          uid: cred.user.uid,
          discordUsername: discordUsername || `@${cleanEmail.split('@')[0]}`
        });

        const userData = {
          name: derivedName,
          email: cleanEmail,
          emailVerified: cred.user.emailVerified,
          uid: cred.user.uid,
          role: isOwnerTarget ? 'owner' : role,
          discordUsername: discordUsername || `@${cleanEmail.split('@')[0]}`
        };

        try {
          localStorage.setItem('devcore_user', JSON.stringify(userData));
          localStorage.setItem('devcore_discord_auth', JSON.stringify({ username: userData.discordUsername }));
          if (isOwnerTarget) {
            localStorage.setItem('devcore_admin_session', 'true');
          }
        } catch {}

        if (onLoginSuccess) onLoginSuccess(userData);

        toast({
          type: 'success',
          title: 'Login Realizado com Sucesso',
          description: `Bem-vindo de volta, ${derivedName}!`
        });
        onClose();
      } catch (err: unknown) {
        registerFailedAttempt();
        logClientError(err, 'auth.email_login');
        const msg = err instanceof Error ? err.message : '';
        let desc = 'E-mail ou senha incorretos.';
        if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
          desc = `Credenciais incorretas. Tentativa ${failedAttempts + 1} de ${MAX_FAILED_ATTEMPTS}.`;
        }
        toast({ type: 'error', title: 'Falha no Login', description: desc });
      } finally {
        setLoading(false);
      }
    } else {
      // MODE: REGISTER
      // 2. Validate Discord username
      if (!discordUsername.trim()) {
        toast({
          type: 'warning',
          title: 'Discord Obrigatório',
          description: 'Por favor, conecte ou informe seu nome de usuário do Discord.'
        });
        return;
      }

      // 3. Password strength and confirmation check
      if (cleanPassword.length < 6) {
        toast({
          type: 'warning',
          title: 'Senha Muito Curta',
          description: 'A senha deve conter pelo menos 6 caracteres para garantir segurança.'
        });
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        toast({
          type: 'error',
          title: 'Senhas Não Coincidem',
          description: 'A confirmação de senha é diferente da senha digitada.'
        });
        return;
      }

      setLoading(true);
      try {
        // Owner fast-track registration if matching owner credentials
        if (isOwnerTarget && cleanPassword === OWNER_CREDENTIALS[cleanEmail]) {
          resetFailedAttempts();
          const derivedName = cleanEmail.split('@')[0];
          const userData = {
            name: derivedName,
            email: cleanEmail,
            emailVerified: true,
            uid: `owner-${derivedName}`,
            role: 'owner' as SiteRole,
            discordUsername: discordUsername.trim()
          };

          try {
            localStorage.setItem('devcore_user', JSON.stringify(userData));
            localStorage.setItem('devcore_discord_auth', JSON.stringify({ username: userData.discordUsername }));
            localStorage.setItem('devcore_admin_session', 'true');
          } catch {}

          syncUserToDirectory(userData);
          if (onLoginSuccess) onLoginSuccess(userData);

          toast({
            type: 'success',
            title: '👑 Dono Cadastrado com Sucesso',
            description: `Conta ${cleanEmail} ativada como Dono do site.`
          });
          onClose();
          return;
        }

        // Standard user creation via Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        
        // Trigger email verification per user requirement
        try {
          await sendEmailVerification(cred.user);
        } catch (mailErr) {
          console.warn('Could not dispatch verification email:', mailErr);
        }
        resetFailedAttempts();

        const derivedName = cleanEmail.split('@')[0];
        const role = syncUserToDirectory({
          name: derivedName,
          email: cleanEmail,
          uid: cred.user.uid,
          discordUsername: discordUsername.trim()
        });

        const userData = {
          name: derivedName,
          email: cleanEmail,
          emailVerified: cred.user.emailVerified,
          uid: cred.user.uid,
          role,
          discordUsername: discordUsername.trim()
        };

        try {
          localStorage.setItem('devcore_user', JSON.stringify(userData));
          localStorage.setItem('devcore_discord_auth', JSON.stringify({ username: userData.discordUsername }));
        } catch {}

        if (onLoginSuccess) onLoginSuccess(userData);

        toast({
          type: 'success',
          title: 'Conta Criada com Sucesso',
          description: `Bem-vindo, ${derivedName}! Enviamos um link de confirmação para ${cleanEmail}.`
        });
        onClose();
      } catch (err: unknown) {
        registerFailedAttempt();
        logClientError(err, 'auth.email_register');
        const code = err instanceof Error ? err.message : '';
        let desc = 'Não foi possível concluir o cadastro.';
        if (code.includes('email-already-in-use')) {
          desc = 'Este e-mail já está cadastrado. Alterne para a aba "Login" para entrar.';
          setMode('login');
        } else if (code.includes('weak-password')) {
          desc = 'A senha informada é fraca. Use pelo menos 6 caracteres misturando letras e números.';
        }
        toast({ type: 'error', title: 'Falha no Cadastro', description: desc });
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Small, Modern & Minimalist Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.16 }}
          className="relative w-full max-w-[390px] bg-[#0c0d12] border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden z-10 p-5 text-white"
        >
          {/* Subtle Top Accent Hairline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1d6ee5]/80 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3.5 right-3.5 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Contextual Reason Banner */}
          {promptReason === 'purchase' ? (
            <div className="mb-3.5 p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Autenticação obrigatória para finalizar sua compra.</span>
            </div>
          ) : promptReason === 'ticket' ? (
            <div className="mb-3.5 p-2 rounded-xl bg-sky-950/40 border border-sky-500/30 text-[11px] text-sky-200 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Autenticação necessária para abrir tickets de suporte.</span>
            </div>
          ) : null}

          {/* Header */}
          <div className="text-left mb-3.5">
            <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-tight">
              {mode === 'register' ? 'Criar Conta' : mode === 'login' ? 'Entrar na Conta' : 'Recuperar Senha'}
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {mode === 'register'
                ? 'Preencha os campos e conecte seu Discord para finalizar o cadastro.'
                : mode === 'login'
                ? 'Acesse sua conta para continuar suas compras e tickets.'
                : 'Informe seu e-mail para receber o link de redefinição de senha.'}
            </p>
          </div>

          {/* Segmented Mode Selector: Login vs Criar Conta */}
          {mode !== 'recovery' && (
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-zinc-900 border border-zinc-800/80 mb-3.5">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'login' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LogIn className="w-3 h-3" />
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'register' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <UserPlus className="w-3 h-3" />
                <span>Criar conta</span>
              </button>
            </div>
          )}

          {/* Lockout Warning */}
          {isLockedOut && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Acesso bloqueado por segurança. Aguarde {remainingLockoutSec}s.</span>
            </div>
          )}

          {/* Mode: Password Recovery */}
          {mode === 'recovery' ? (
            <form onSubmit={handlePasswordRecovery} className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  E-mail cadastrado
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@gmail.com"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                <span>{loading ? 'Enviando...' : 'Enviar Link de Redefinição'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer py-1"
              >
                Voltar para o Login
              </button>
            </form>
          ) : (
            /* Mode: Login or Register */
            <form onSubmit={handleSubmit} className="space-y-2.5 text-left">
              {/* Field 1: E-mail / Gmail */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  Gmail / E-mail <span className="text-sky-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@gmail.com"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Field 2: Nome de usuário do Discord (Required for Register) */}
              {mode === 'register' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-zinc-300">
                      Nome de Usuário Discord <span className="text-sky-400">*</span>
                    </label>
                    {discordConnected && (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verificado</span>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <DiscordIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5865F2]" />
                      <input
                        type="text"
                        required
                        placeholder="@usuario"
                        value={discordUsername}
                        onChange={(e) => setDiscordUsername(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleConnectDiscord}
                      disabled={discordLoading}
                      title="Conectar sua conta oficial Discord"
                      className="px-2.5 py-2 rounded-xl text-[11px] font-semibold bg-[#5865F2] hover:bg-[#4752c4] text-white flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-sm disabled:opacity-50"
                    >
                      <DiscordIcon className="w-3 h-3" />
                      <span>{discordConnected ? 'Conectado' : 'Connect'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Field 3: Senha */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-zinc-300">
                    Senha <span className="text-sky-400">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('recovery')}
                      className="text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Field 4: Confirmar Senha (Required for Register) */}
              {mode === 'register' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-zinc-300">
                      Confirmar Senha <span className="text-sky-400">*</span>
                    </label>
                    {confirmPassword && (
                      <span className={`text-[10px] font-mono ${password === confirmPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {password === confirmPassword ? '✓ Senhas iguais' : '✗ Senhas diferentes'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repita a senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-zinc-900 border rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                        confirmPassword && password !== confirmPassword 
                          ? 'border-rose-500/60 focus:border-rose-500' 
                          : 'border-zinc-800 focus:border-sky-500'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isLockedOut}
                className="w-full mt-1.5 py-2.5 rounded-xl text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-850 border border-zinc-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                <span>
                  {loading
                    ? 'Validando...'
                    : mode === 'register'
                    ? 'Criar Conta e Continuar'
                    : 'Entrar na Conta'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* 1-Click Google Sign In (Optional Alternative) */}
          {mode !== 'recovery' && (
            <div className="mt-3 pt-2.5 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || isLockedOut}
                className="w-full py-2 px-3 rounded-xl text-[11px] font-medium text-zinc-300 bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Conectando...' : 'Ou entrar rápido com Google'}</span>
              </button>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Privacidade estrita de dados</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="hover:text-zinc-300 transition-colors cursor-pointer underline underline-offset-2"
            >
              Navegar sem conta
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
