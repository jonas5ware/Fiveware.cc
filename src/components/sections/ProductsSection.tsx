import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { NavTabId } from '../layout/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../common/Toast';

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
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'crypto' | 'card'>('pix');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

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
        'Remote setup included'
      ]
    },
    {
      id: 'private-solo-uefi-os',
      name: 'Private Solo Uefi, OS',
      tag: 'Solo UEFI',
      desc: 'Dedicated private solo remote slot engineered with direct UEFI OS architecture.',
      price: '$185.00',
      buttonText: 'Buy now',
      icon: ShieldCheck,
      features: [
        'Lifetime software access',
        'Priority updates',
        'Remote setup included'
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
      {/* Top Header */}
      <div className="flex flex-col items-center text-center space-y-2 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono uppercase tracking-wider text-sky-400">
          <Sparkles className="w-3 h-3" />
          <span>Software & Optimisation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display tracking-tight text-white">
          Fiveware.cc Products
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg leading-relaxed">
          Software and utilities engineered for peak performance, rock-solid stability and genuine system responsiveness.
        </p>

        {/* User Status Bar */}
        {isUserAuthenticated ? (
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-600/30 text-xs text-emerald-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Conectado como <strong>{user?.name}</strong> ({discordUser?.username}) · Cargo: [{user?.role ? user.role.toUpperCase() : 'MEMBER'}]</span>
            </span>
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={onRequireAuth}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-600/40 text-xs text-amber-300 font-medium hover:bg-amber-900/50 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Registro obrigatório com Discord para comprar</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid of Products matching exactly IMG_2641 and IMG_2642 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {products.map((item) => {
          return (
            <div
              key={item.id}
              className="relative flex flex-col justify-between p-6 sm:p-7 rounded-[24px] bg-[#090a0f] border border-zinc-800/80 transition-all hover:border-zinc-700/80 shadow-2xl"
            >
              <div>
                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {item.name}
                </h3>

                {/* Price and one-time label */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
                    {item.price}
                  </span>
                  <span className="text-sm text-zinc-400 font-normal">
                    one-time
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

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleInitiatePurchase(item)}
                className="w-full py-3 px-4 rounded-xl bg-[#0d0e15] hover:bg-[#161722] active:bg-[#1c1e2b] text-white border border-zinc-800/90 font-medium text-sm transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center"
              >
                {item.buttonText || 'Buy now'}
              </button>
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
