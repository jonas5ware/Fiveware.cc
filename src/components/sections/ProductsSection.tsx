import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Crown, 
  Cpu, 
  ArrowUpRight, 
  Check,
  ShieldCheck,
  X,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { NavTabId } from '../layout/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../common/Toast';

const DiscordIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

interface ProductsSectionProps {
  onNavigateTab?: (tab: NavTabId) => void;
  user?: { name: string; email: string; role?: string } | null;
  discordUser?: { username: string } | null;
  onRequireAuth?: () => void;
  onPurchaseCompleted?: (productId: string, productName: string, price: string) => void;
}

interface ProductItem {
  id: string;
  name: string;
  tag: string;
  desc: string;
  price: string;
  priceUsd?: string;
  stock?: string;
  isPopular?: boolean;
  buttonText?: string;
  icon: React.ElementType;
  features: string[];
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({ 
  onNavigateTab,
  user,
  discordUser,
  onRequireAuth,
  onPurchaseCompleted
}) => {
  const { toast } = useToast();
  const [activeBalloonProductId, setActiveBalloonProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'crypto' | 'card'>('pix');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Close balloon when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveBalloonProductId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isUserAuthenticated = Boolean(user && user.email);

  const products: ProductItem[] = [
    {
      id: 'advanced-slot',
      name: 'Advanced Slot',
      tag: 'Advanced',
      desc: 'High-performance slot engineered with direct UEFI OS architecture.',
      price: '€85.00',
      buttonText: 'Buy now',
      icon: Cpu,
      features: [
        'Lifetime software access',
        'Standard updates',
        'Instant delivery'
      ]
    },
    {
      id: 'exclusive-slot',
      name: 'Exclusive Slot',
      tag: 'Exclusive',
      desc: 'Exclusive priority slot engineered with direct UEFI OS architecture.',
      price: '€125.00',
      buttonText: 'Buy now',
      icon: Crown,
      features: [
        'Lifetime software access',
        'Priority updates',
        'Connected to another device'
      ]
    },
    {
      id: 'private-solo-uefi-os',
      name: 'Private Solo Uefi, OS',
      tag: 'Solo UEFI',
      desc: 'Dedicated private solo remote slot engineered with direct UEFI OS architecture.',
      price: '€185.00',
      buttonText: 'Buy now',
      icon: ShieldCheck,
      features: [
        'Lifetime software access',
        'Priority updates',
        'Connected to another device'
      ]
    }
  ];

  const handleInitiatePurchase = (product: ProductItem) => {
    if (!isUserAuthenticated) {
      toast({
        type: 'warning',
        title: 'Autenticação Obrigatória',
        description: 'Você precisa entrar ou criar uma conta para adquirir produtos na loja.'
      });
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    setSelectedProduct(product);
    setPurchaseSuccess(false);
  };

  const handleConfirmCheckout = () => {
    if (!selectedProduct) return;
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setPurchaseSuccess(true);

      if (onPurchaseCompleted) {
        onPurchaseCompleted(selectedProduct.id, selectedProduct.name, selectedProduct.price);
      }

      toast({
        type: 'success',
        title: 'Compra Concluída com Sucesso',
        description: `Cargo [CUSTOMER] atribuído automaticamente à sua conta! Slot ${selectedProduct.name} ativado.`
      });
    }, 900);
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20 text-left">
      {/* Top Header - Ultra-clean & Minimalist */}
      <div className="flex flex-col items-center text-center space-y-2 mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display tracking-tight text-white">
          Fiveware Products
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg leading-relaxed">
          High-performance software engineered with direct UEFI OS architecture and zero detection footprint.
        </p>
      </div>

      {/* Grid of Products matching exactly IMG_2641 and IMG_2642 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {products.map((item) => {
          return (
            <div
              key={item.id}
              className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-[24px] bg-[#090a0f] border border-zinc-800/80 transition-all hover:border-zinc-700/80 shadow-2xl ${
                activeBalloonProductId === item.id ? 'z-30' : 'z-10'
              }`}
            >
              <div>
                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {item.name}
                </h3>

                {/* Price and Lifetime label */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
                    {item.price}
                  </span>
                  <span className="text-sm text-zinc-400 font-normal">
                    Lifetime
                  </span>
                </div>

                {/* Features list */}
                <ul className="mt-6 mb-8 space-y-3.5">
                  {item.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[#38bdf8] stroke-[2.5] shrink-0" />
                      <span className="text-sm sm:text-base text-zinc-300 font-normal">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button & Mini Balão Minimalista */}
              <div className="relative w-full">
                <AnimatePresence>
                  {activeBalloonProductId === item.id && (
                    <>
                      {/* Invisible backdrop to dismiss on click outside */}
                      <div
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setActiveBalloonProductId(null)}
                      />

                      {/* Mini Balão Minimalista: Somente o balão e as 2 caixinhas */}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 z-50 w-[240px] bg-[#0c0d12] border border-zinc-800 rounded-xl p-2 shadow-2xl flex flex-col gap-1.5 text-left"
                      >
                        {/* Caixinha 1: Ticket Discord */}
                        <a
                          href="https://discord.com/channels/1513871610908770374/1530508179174195200"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveBalloonProductId(null)}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/25 text-white transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] shrink-0">
                            <DiscordIcon className="w-4 h-4 fill-current" />
                          </div>
                          <span className="font-semibold text-xs text-zinc-100">
                            Ticket Discord
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-zinc-400" />
                        </a>

                        {/* Caixinha 2: Webticket */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBalloonProductId(null);
                            if (onNavigateTab) {
                              onNavigateTab('support');
                            }
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white transition-colors cursor-pointer text-left"
                        >
                          <div className="w-7 h-7 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-xs text-zinc-100">
                            Webticket
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-zinc-400" />
                        </button>

                        {/* Ponteiro discreto */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0c0d12] border-r border-b border-zinc-800 rotate-45 pointer-events-none" />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => setActiveBalloonProductId(activeBalloonProductId === item.id ? null : item.id)}
                  className="w-full py-3 px-4 rounded-xl bg-[#0d0e15] hover:bg-[#161722] active:bg-[#1c1e2b] text-white border border-zinc-800/90 font-medium text-sm transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center"
                >
                  {item.buttonText || 'Buy now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal with Automatic Customer Role Allocation */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md bg-[#111217] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 text-white"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {purchaseSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pagamento Aprovado</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Seu slot <strong>{selectedProduct.name}</strong> está garantido.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-left text-xs font-mono space-y-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span>Status:</span>
                      <span className="text-emerald-400 font-bold">Ativado · Concluído</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Novo Cargo Atribuído:</span>
                      <span className="text-sky-400 font-bold">⭐ CUSTOMER</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Discord Vinculado:</span>
                      <span className="text-white">{discordUser?.username}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedProduct(null);
                        if (onNavigateTab) onNavigateTab('support');
                      }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#1d6ee5] hover:bg-[#1a5ec4] text-white transition-colors cursor-pointer shadow-md"
                    >
                      Abrir Ticket de Suporte
                    </button>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Finalizar Aquisição de Slot</h3>
                      <p className="text-xs text-zinc-400">{selectedProduct.name}</p>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Valor em Reais:</span>
                      <span className="font-bold text-white">{selectedProduct.price}</span>
                    </div>
                    {selectedProduct.priceUsd && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Valor em Dollar:</span>
                        <span className="text-sky-400 font-semibold">{selectedProduct.priceUsd}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-zinc-800/80">
                      <span className="text-zinc-400">Conta Registrada:</span>
                      <span className="text-zinc-200">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Discord Conectado:</span>
                      <span className="text-[#5865F2] font-semibold">{discordUser?.username}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-zinc-800/80">
                      <span>Cargo pós-compra:</span>
                      <span>⭐ Customer (Automático)</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Método de Pagamento:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                          paymentMethod === 'pix'
                            ? 'bg-zinc-800 border-sky-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        ⚡ Pix Instantâneo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('crypto')}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                          paymentMethod === 'crypto'
                            ? 'bg-zinc-800 border-sky-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        🪙 Criptomoedas
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-zinc-800 border-sky-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        💳 Cartão Global
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmCheckout}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>Validando Transação...</span>
                    ) : (
                      <span>Confirmar Pagamento ({selectedProduct.price})</span>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
