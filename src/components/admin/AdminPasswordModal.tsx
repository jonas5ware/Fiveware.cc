import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../common/Toast';
import { logSecurityEvent } from '../../lib/firebase';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated
}) => {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter the administrative authorisation key.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) {
          sessionStorage.setItem('devcore_admin_token', data.token);
          localStorage.setItem('devcore_admin_session', 'true');
        }
        setPassword('');
        setError('');
        logSecurityEvent('admin.terminal_unlocked');
        toast({
          type: 'success',
          title: 'Terminal Administrativo Desbloqueado',
          description: 'Acesso autenticado com sucesso pelo servidor.'
        });
        onAuthenticated();
        onClose();
      } else {
        logSecurityEvent('admin.unauthorised_attempt', { inputLength: password.length });
        setError(data.error || 'Chave de segurança administrativa incorreta.');
        toast({
          type: 'error',
          title: 'Acesso Negado',
          description: data.error || 'Credenciais administrativas inválidas.'
        });
      }
    } catch (err) {
      setError('Falha de conexão com o servidor de autenticação.');
      toast({
        type: 'error',
        title: 'Erro de Conexão',
        description: 'Não foi possível contatar o serviço de autenticação administrativa.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 6 }}
          transition={{ duration: 0.16 }}
          className="relative w-full max-w-[340px] bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-6 z-10 text-white"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Restricted Terminal
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Fiveware.cc Administrative Access
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Enter the master security key to access moderation oversight and global platform management.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••"
                  maxLength={12}
                  className={`w-full bg-zinc-950/90 border rounded-xl px-3 py-2.5 text-center text-lg tracking-[0.4em] font-mono text-white placeholder-zinc-600 focus:outline-none transition-colors ${
                    error
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-zinc-800 focus:border-zinc-600'
                  }`}
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-400 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer border border-zinc-700/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer border border-amber-500/40 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{loading ? 'Authorising...' : 'Authorise'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
