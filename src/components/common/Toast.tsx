import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (options: { type?: 'success' | 'error' | 'info' | 'warning'; title: string; description?: string }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(
    ({ type = 'success', title, description }: { type?: 'success' | 'error' | 'info' | 'warning'; title: string; description?: string }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 15, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto bg-[#141417]/95 backdrop-blur-md border border-zinc-800 rounded-xl p-3.5 shadow-xl flex items-start gap-3 text-white"
            >
              <div className="mt-0.5 shrink-0">
                {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                {t.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {t.type === 'info' && <Info className="w-4 h-4 text-zinc-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white tracking-wide">{t.title}</p>
                {t.description && <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{t.description}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
