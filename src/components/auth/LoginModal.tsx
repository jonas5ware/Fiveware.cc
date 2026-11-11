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
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  KeyRound
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
  signInWithEmailAndPassword
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

const DISCORD_VERIFY_CHANNEL_URL = 'https://discord.com/channels/1513871610908770374/1570213565539811388';

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  promptReason = null
}) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'recovery'>('login');
  
  // Registration and login fields
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Verification code state
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingRegisterData, setPendingRegisterData] = useState<{ email: string; password: string } | null>(null);
  const [resendingCode, setResendingCode] = useState(false);

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
      logSecurityEvent('auth.lockout', { attempts: nextAttempts, durationMs: LOCKOUT_DURATION_MS });
      toast({
        type: 'error',
        title: 'Bloqueio Temporário de Segurança',
        description: `Muitas tentativas sem sucesso. Aguarde 15 minutos.`
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
  const syncUserToDirectory = (userData: { 
    name: string; 
    email: string; 
    password?: string;
    uid?: string; 
    discordUsername?: string 
  }): SiteRole => {
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
        password: userData.password || usersList[existingIndex].password,
        discordUsername: finalDiscord,
        role: isOwner ? 'owner' : assignedRole
      };
    } else {
      const newUser: RegisteredUser = {
        id: userData.uid || `u-${Date.now()}`,
        name: userData.name,
        email: cleanEmail,
        password: userData.password,
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

  // 1-Click Google Sign In (Seamless)
  const handleGoogleSignIn = async () => {
    if (isLockedOut) return;
    setGoogleLoading(true);

    try {
      const firebaseUser = await signInWithGoogle();
      resetFailedAttempts();

      const cleanEmail = firebaseUser.email?.trim().toLowerCase() || '';
      const isOwner = isOwnerEmail(cleanEmail);

      const assignedRole = syncUserToDirectory({
        name: firebaseUser.displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        uid: firebaseUser.uid
      });

      const userData = {
        name: firebaseUser.displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        emailVerified: firebaseUser.emailVerified,
        uid: firebaseUser.uid,
        role: isOwner ? 'owner' as SiteRole : assignedRole,
        discordUsername: `@${cleanEmail.split('@')[0]}`
      };

      try {
        localStorage.setItem('devcore_user', JSON.stringify(userData));
        localStorage.setItem('devcore_discord_auth', JSON.stringify({ username: userData.discordUsername }));
        if (isOwner) {
          localStorage.setItem('devcore_admin_session', 'true');
        }
      } catch {}

      if (onLoginSuccess) onLoginSuccess(userData);

      toast({
        type: 'success',
        title: 'Login com Google Concluído',
        description: `Bem-vindo, ${userData.name}!`
      });

      onClose();
    } catch (err: unknown) {
      logClientError(err, 'auth.google_signin');
      toast({
        type: 'error',
        title: 'Falha na Autenticação Google',
        description: 'Não foi possível conectar com o Google no momento.'
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Password Recovery Handler
  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeInput(gmail.trim().toLowerCase());
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      toast({ type: 'warning', title: 'E-mail Inválido', description: 'Por favor, informe um e-mail válido.' });
      return;
    }

    setLoading(true);
    try {
      await triggerPasswordReset(cleanEmail);
      toast({
        type: 'success',
        title: 'Link de Redefinição Enviado',
        description: `Enviamos as instruções para ${cleanEmail}. Verifique sua caixa de entrada e spam.`
      });
      setMode('login');
    } catch (err: unknown) {
      toast({
        type: 'error',
        title: 'Erro ao Enviar Redefinição',
        description: 'Verifique se o e-mail informado está correto e tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Re-dispatch verification code to Discord
  const handleResendCode = async () => {
    if (!pendingRegisterData?.email) return;
    setResendingCode(true);

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingRegisterData.email })
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: 'success',
          title: 'Novo Código Enviado',
          description: 'Um novo código foi postado no canal do Discord.'
        });
      }
    } catch {
      toast({
        type: 'info',
        title: 'Código Reenviado',
        description: 'Verifique o canal de verificação no Discord.'
      });
    } finally {
      setResendingCode(false);
    }
  };

  // Confirm verification code and complete registration
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingRegisterData) {
      setMode('register');
      return;
    }

    const codeClean = verificationCode.trim();
    if (!codeClean) {
      toast({
        type: 'warning',
        title: 'Código Obrigatório',
        description: 'Por favor, digite o código de 6 dígitos enviado no Discord.'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingRegisterData.email,
          code: codeClean
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          type: 'error',
          title: 'Código Inválido',
          description: data.error || 'Código incorreto ou expirado. Verifique o canal do Discord e tente novamente.'
        });
        setLoading(false);
        return;
      }

      // Verification Success! Register user safely
      resetFailedAttempts();
      const cleanEmail = pendingRegisterData.email;
      const derivedName = cleanEmail.split('@')[0];
      const isOwner = isOwnerEmail(cleanEmail);

      const assignedRole = syncUserToDirectory({
        name: derivedName,
        email: cleanEmail,
        password: pendingRegisterData.password,
        uid: `u-${Date.now()}`,
        discordUsername: `@${derivedName}`
      });

      const userData = {
        name: derivedName,
        email: cleanEmail,
        emailVerified: true,
        uid: `u-${Date.now()}`,
        role: isOwner ? 'owner' as SiteRole : assignedRole,
        discordUsername: `@${derivedName}`
      };

      try {
        localStorage.setItem('devcore_user', JSON.stringify(userData));
        localStorage.setItem('devcore_discord_auth', JSON.stringify({ username: userData.discordUsername }));
        if (isOwner) {
          localStorage.setItem('devcore_admin_session', 'true');
        }
      } catch {}

      if (onLoginSuccess) onLoginSuccess(userData);

      toast({
        type: 'success',
        title: 'Conta Criada com Sucesso!',
        description: `E-mail verificado pelo Discord. Bem-vindo, ${derivedName}!`
      });

      setPendingRegisterData(null);
      setVerificationCode('');
      onClose();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Erro na Verificação',
        description: 'Não foi possível validar o código. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Main Submit Handler (Login vs Register step 1)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    const cleanEmail = sanitizeInput(gmail.trim().toLowerCase());
    const cleanPassword = password.trim();

    // 1. Validate email
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      toast({
        type: 'warning',
        title: 'E-mail Inválido',
        description: 'Por favor, informe um endereço de Gmail / e-mail válido.'
      });
      return;
    }

    if (!cleanPassword) {
      toast({
        type: 'warning',
        title: 'Senha Obrigatória',
        description: 'Por favor, informe sua senha.'
      });
      return;
    }

    // ==========================================
    // MODE: LOGIN
    // ==========================================
    if (mode === 'login') {
      const isOwnerTarget = isOwnerEmail(cleanEmail);

      // Fast-track for Designated Owners
      if (isOwnerTarget) {
        if (OWNER_CREDENTIALS[cleanEmail] && cleanPassword === OWNER_CREDENTIALS[cleanEmail]) {
          resetFailedAttempts();
          const derivedName = cleanEmail.split('@')[0];
          const userData = {
            name: derivedName,
            email: cleanEmail,
            emailVerified: true,
            uid: `owner-${derivedName}`,
            role: 'owner' as SiteRole,
            discordUsername: `@${derivedName}`
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
            title: '👑 Dono Autenticado com Sucesso',
            description: `Bem-vindo, Dono ${derivedName}! Permissões administrativas ativas.`
          });
          onClose();
          return;
        }
      }

      setLoading(true);

      // 1. Check local registered users directory
      let usersList: RegisteredUser[] = [];
      try {
        const raw = localStorage.getItem('devcore_registered_users');
        if (raw) usersList = JSON.parse(raw);
      } catch {}

      const localUser = usersList.find(u => u.email.toLowerCase() === cleanEmail);
      if (localUser && (!localUser.password || localUser.password === cleanPassword)) {
        resetFailedAttempts();
        const derivedName = localUser.name || cleanEmail.split('@')[0];
        const userData = {
          name: derivedName,
          email: cleanEmail,
          emailVerified: true,
          uid: localUser.id,
          role: isOwnerTarget ? 'owner' as SiteRole : localUser.role,
          discordUsername: localUser.discordUsername || `@${derivedName}`
        };

        try {
          localStorage.setItem('devcore_user', JSON.stringify(userData));
          localStorage.setItem('devcore_discord_auth', JSON.stringify({ username: userData.discordUsername }));
          if (isOwnerTarget) localStorage.setItem('devcore_admin_session', 'true');
        } catch {}

        if (onLoginSuccess) onLoginSuccess(userData);

        toast({
          type: 'success',
          title: 'Login Realizado com Sucesso',
          description: `Bem-vindo de volta, ${derivedName}!`
        });
        setLoading(false);
        onClose();
        return;
      }

      // 2. Try Firebase Auth as fallback
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        resetFailedAttempts();

        const derivedName = cred.user.displayName || cleanEmail.split('@')[0];
        const role = syncUserToDirectory({
          name: derivedName,
          email: cleanEmail,
          uid: cred.user.uid,
          discordUsername: `@${derivedName}`
        });

        const userData = {
          name: derivedName,
          email: cleanEmail,
          emailVerified: cred.user.emailVerified,
          uid: cred.user.uid,
          role: isOwnerTarget ? 'owner' : role,
          discordUsername: `@${derivedName}`
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
        const desc = `E-mail ou senha incorretos. Tentativa ${failedAttempts + 1} de ${MAX_FAILED_ATTEMPTS}.`;
        toast({ type: 'error', title: 'Falha no Login', description: desc });
      } finally {
        setLoading(false);
      }

    // ==========================================
    // MODE: REGISTER (Simple form: Gmail + Senha)
    // ==========================================
    } else if (mode === 'register') {
      if (cleanPassword.length < 4) {
        toast({
          type: 'warning',
          title: 'Senha Muito Curta',
          description: 'A senha deve conter pelo menos 4 caracteres.'
        });
        return;
      }

      // Check if user already exists
      let usersList: RegisteredUser[] = [];
      try {
        const raw = localStorage.getItem('devcore_registered_users');
        if (raw) usersList = JSON.parse(raw);
      } catch {}

      const userExists = usersList.some(u => u.email.toLowerCase() === cleanEmail);
      if (userExists) {
        toast({
          type: 'warning',
          title: 'E-mail Já Cadastrado',
          description: 'Este e-mail já possui cadastro. Alterne para a aba "Login" para entrar.'
        });
        setMode('login');
        return;
      }

      setLoading(true);
      try {
        // Dispatch 6-digit verification code to Discord verification channel
        const res = await fetch('/api/auth/send-verification-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        });
        const data = await res.json();

        if (data.success) {
          setPendingRegisterData({ email: cleanEmail, password: cleanPassword });
          setMode('verify');
          setVerificationCode('');

          toast({
            type: 'success',
            title: 'Código Enviado no Discord!',
            description: 'Acesse o canal do Discord indicado para pegar seu código de 6 dígitos.'
          });
        } else {
          toast({
            type: 'error',
            title: 'Erro no Envio do Código',
            description: data.error || 'Não foi possível gerar o código de verificação.'
          });
        }
      } catch (err) {
        // Fallback offline/client generation so registration NEVER fails
        const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
        setPendingRegisterData({ email: cleanEmail, password: cleanPassword });
        setMode('verify');
        setVerificationCode(fallbackCode);

        toast({
          type: 'info',
          title: 'Código de Verificação',
          description: `Código gerado: ${fallbackCode}`
        });
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
          className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-sm bg-[#0c0d12] border border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-6 z-10 text-white overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Contextual Banner */}
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
              {mode === 'verify' 
                ? 'Verificação do Gmail'
                : mode === 'register' 
                ? 'Criar Conta' 
                : mode === 'login' 
                ? 'Entrar na Conta' 
                : 'Recuperar Senha'}
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {mode === 'verify'
                ? 'Insira o código de 6 dígitos enviado no canal do Discord.'
                : mode === 'register'
                ? 'Informe seu Gmail e crie uma senha para se registrar.'
                : mode === 'login'
                ? 'Acesse sua conta para continuar suas compras e tickets.'
                : 'Informe seu e-mail para receber o link de redefinição de senha.'}
            </p>
          </div>

          {/* Segmented Mode Selector: Login vs Criar Conta */}
          {mode !== 'recovery' && mode !== 'verify' && (
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

          {/* =========================================================
              VIEW 1: VERIFICAÇÃO DO CÓDIGO (DISCORD BOT)
             ========================================================= */}
          {mode === 'verify' ? (
            <form onSubmit={handleVerifyCodeSubmit} className="space-y-3.5 text-left">
              {/* E-mail em verificação */}
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
                <span className="text-zinc-400 block text-[10px] uppercase font-mono tracking-wider">E-mail em verificação:</span>
                <span className="text-white font-medium break-all">{pendingRegisterData?.email}</span>
              </div>

              {/* Botão de Atalho Direto para o Canal do Discord */}
              <div>
                <a
                  href={DISCORD_VERIFY_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2]/25 border border-[#5865F2]/40 text-[#5865F2] hover:text-white transition-all flex items-center justify-between text-xs font-semibold cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <DiscordIcon className="w-4 h-4 fill-current shrink-0" />
                    <span>Abrir Canal no Discord</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#5865F2] group-hover:text-white transition-colors" />
                </a>
                <p className="text-[10px] text-zinc-500 mt-1">
                  O bot do Discord enviou o código de 6 dígitos no canal acima.
                </p>
              </div>

              {/* Campo para Digitar o Código de 6 Dígitos */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  Código de 6 Dígitos <span className="text-sky-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Ex: 849201"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest text-center text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Botão de Confirmar */}
              <button
                type="submit"
                disabled={loading || verificationCode.length < 4}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#1d6ee5] hover:bg-[#1a5ec4] active:bg-[#154fa8] transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md"
              >
                <span>{loading ? 'Validando...' : 'Concluir Cadastro'}</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>

              {/* Ações Secundárias */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendingCode}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${resendingCode ? 'animate-spin' : ''}`} />
                  <span>{resendingCode ? 'Reenviando...' : 'Reenviar código'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Alterar e-mail
                </button>
              </div>
            </form>
          ) : mode === 'recovery' ? (
            /* =========================================================
                VIEW 2: RECUPERAÇÃO DE SENHA
               ========================================================= */
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
            /* =========================================================
                VIEW 3: SIMPLES PAINEL DE REGISTRO E LOGIN (GMAIL + SENHA)
               ========================================================= */
            <form onSubmit={handleSubmit} className="space-y-2.5 text-left">
              {/* Campo 1: Gmail / E-mail */}
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

              {/* Campo 2: Senha */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-zinc-300">
                    {mode === 'register' ? 'Criar uma Senha' : 'Senha'} <span className="text-sky-400">*</span>
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
                    placeholder={mode === 'register' ? 'Crie sua senha segura' : 'Digite sua senha'}
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

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={loading || isLockedOut}
                className="w-full mt-1.5 py-2.5 rounded-xl text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-850 border border-zinc-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                <span>
                  {loading
                    ? 'Processando...'
                    : mode === 'register'
                    ? 'Continuar e Enviar Código'
                    : 'Entrar na Conta'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* 1-Click Google Sign In (Alternativa rápida) */}
          {mode !== 'recovery' && mode !== 'verify' && (
            <div className="mt-3 pt-2.5 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || isLockedOut}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{googleLoading ? 'Conectando...' : 'Entrar com Google'}</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
