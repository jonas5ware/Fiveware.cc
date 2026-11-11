import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  MessageSquare, 
  ShieldCheck
} from 'lucide-react';
import { NavTabId } from '../layout/Navbar';

// Logos Oficiais Reais dos Aplicativos de Pagamento
const PixLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 512 512" fill="none" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M112.57 391.19c20.31 0 39.41-7.91 53.72-22.23l73.49-73.49c4.54-4.54 11.91-4.54 16.45 0l73.68 73.68c14.31 14.31 33.36 22.04 53.53 22.04h17.15l-87.35-87.35c-9.78-9.78-9.78-25.64 0-35.42l86.6-86.6h-16.4c-20.31 0-39.41 7.91-53.72 22.23l-73.49 73.49c-4.54 4.54-11.91 4.54-16.45 0l-73.68-73.68c-14.31-14.31-33.36-22.04-53.53-22.04h-17.15l87.35 87.35c9.78 9.78 9.78 25.64 0 35.42l-86.6 86.6h16.44zm143.43-289.44c-12.7 0-24.87 4.95-33.85 13.93l-105.7 105.7h-36.9c-21.75 0-39.45 17.7-39.45 39.45 0 10.46 4.16 20.48 11.55 27.88l130.5 130.5c9.35 9.35 21.6 14.15 33.85 14.15s24.5-4.8 33.85-14.15l130.5-130.5c7.39-7.39 11.55-17.41 11.55-27.88 0-21.75-17.7-39.45-39.45-39.45h-36.9l-105.7-105.7c-8.98-8.98-21.15-13.93-33.85-13.93z"
      fill="#32bcad"
    />
  </svg>
);

const PaypalLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <path
      d="M24.708 9.771c-.267 3.328-2.525 5.253-5.597 5.253h-3.473a.856.856 0 0 0-.847.724l-1.391 8.815a.555.555 0 0 1-.548.469H8.625a.695.695 0 0 1-.687-.803L10.97 4.887a.856.856 0 0 1 .846-.724h6.72c3.045 0 5.485 1.34 6.172 5.608z"
      fill="#003087"
    />
    <path
      d="M20.917 14.157c-.244 3.036-2.304 4.792-5.105 4.792h-2.56a.78.78 0 0 0-.773.66l-1.127 7.143a.506.506 0 0 1-.5.428H6.924a.634.634 0 0 1-.627-.732L8.98 9.7a.78.78 0 0 1 .772-.66h6.128c2.777 0 4.908 1.222 5.037 5.117z"
      fill="#0079C1"
    />
    <path
      d="M19.111 15.024c-.16 1.488-.934 2.585-2.299 3.197a.78.78 0 0 1-.365.088h-2.56a.78.78 0 0 0-.773.66l-1.127 7.143a.506.506 0 0 1-.5.428H8.5a.634.634 0 0 1-.627-.732l1.64-10.428c.453-.134.973-.207 1.554-.207h4.757c1.378 0 2.535.297 3.287-.149z"
      fill="#00457C"
      opacity="0.35"
    />
  </svg>
);

const RevolutLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect width="32" height="32" rx="7" fill="#191C1F" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22.8 11.2C22.2 7.2 19.2 4.5 15 4.5H7.5v23h5.2v-7.5h2.1l5 7.5h6.2l-5.8-8.4c2.5-1.3 4-3.7 3.7-7.6zm-5.6 2.3c0 1.6-1.1 2.8-3.1 2.8H12.7V8.8h2.5c2 0 3.1 1.2 3.1 2.8v1.9z"
      fill="#FFFFFF"
    />
  </svg>
);

const TetherLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path
      d="M17.922 17.383v-.002c-.11.008-.677.04-1.922.04-1.041 0-1.696-.032-1.922-.04v.002c-3.844-.167-6.708-.82-6.708-1.605 0-.786 2.864-1.439 6.708-1.606v2.555c.228.014.898.045 1.936.045 1.217 0 1.796-.033 1.908-.045v-2.555c3.839.167 6.697.82 6.697 1.606 0 .785-2.858 1.438-6.697 1.605zm0-3.696v-2.316h5.811V8.225H8.267v3.146h5.811v2.316C9.697 13.882 6.5 14.819 6.5 15.932c0 1.114 3.197 2.051 7.578 2.245v6.598h3.844v-6.598c4.373-.194 7.561-1.131 7.561-2.245 0-1.113-3.188-2.05-7.561-2.245z"
      fill="#FFFFFF"
    />
  </svg>
);

const BitcoinLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <path
      d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.921-.22-1.385-.326l.696-2.783-1.727-.43-.708 2.839c-.376-.086-.745-.17-1.104-.258l.002-.007-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.827.638.806 1.006l-.807 3.238c.048.012.11.03.179.057l-.183-.045-1.132 4.536c-.086.212-.303.531-.793.41.018.025-1.256-.314-1.256-.314l-.858 1.978 2.25.561c.418.105.828.214 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.705 2.827 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.945 5.543c-.535 2.146-4.148.986-5.318.695l.949-3.803c1.17.292 4.928.872 4.369 3.108zm.535-5.572c-.488 1.954-3.495.962-4.47.719l.86-3.45c.975.242 4.117.695 3.61 2.731z"
      fill="#FFFFFF"
    />
  </svg>
);

const CryptoLogo = TetherLogo;

interface FaqSectionProps {
  onNavigateTab?: (tab: NavTabId) => void;
}

interface FaqItem {
  question: string;
  answer: string;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onNavigateTab }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  const handleGoTo = (tab: NavTabId) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const paymentMethods = [
    {
      id: 'pix',
      name: 'Pix',
      tag: 'Brazil',
      desc: 'Instant bank transfer or QR code',
      icon: PixLogo,
      iconColor: 'text-[#32bcad]'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      tag: 'Global',
      desc: 'Account balance or debit/credit card',
      icon: PaypalLogo,
      iconColor: 'text-[#0079c1]'
    },
    {
      id: 'revolut',
      name: 'Revolut',
      tag: 'EUR / GBP / USD',
      desc: 'Direct transfer via Revtag',
      icon: RevolutLogo,
      iconColor: 'text-zinc-100'
    },
    {
      id: 'cripto',
      name: 'Crypto',
      tag: 'Web3',
      desc: 'USDT, Bitcoin and primary networks',
      icon: CryptoLogo,
      iconColor: 'text-[#f7931a]'
    }
  ];

  const fivewareFaqs: FaqItem[] = [
    {
      question: 'Is Fiveware streamproof and undetectable on recordings?',
      answer: 'Yes. Fiveware is 100% streamproof on Discord screen sharing, OBS Studio, NVIDIA ShadowPlay, and Medal. No visual elements, overlays, or menus will ever appear on your streams or video recordings.'
    },
    {
      question: 'How do I acquire Fiveware licences and access?',
      answer: 'Simply open an enquiry in the Support tab. Select your preferred payment method (PayPal, Revolut, Pix, or Crypto) and receive instant licence dispatch with files and configuration guides.'
    },
    {
      question: 'Is Fiveware bound to my hardware (HWID)?',
      answer: 'Yes, each Fiveware licence is secured and linked to your machine\'s hardware profile (HWID) to safeguard against unauthorized sharing. HWID resets can be requested directly through our Support desk.'
    },
    {
      question: 'How do software updates and maintenance work on Fiveware?',
      answer: 'All active Fiveware licences include continuous periodic updates, security patches, and automated maintenance delivered directly via the platform.'
    }
  ];

  return (
    <section id="faq" className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-20 text-left">
      {/* Category header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1d6ee5] shadow-[0_0_8px_rgba(29,110,229,0.8)]" />
          <h2 className="text-base font-bold uppercase tracking-wider text-white font-display">
            FAQ
          </h2>
        </div>
      </div>

      {/* Minimalist Panel with Left Accent Blue Bar */}
      <div className="w-full rounded-2xl bg-[#090a10] border border-zinc-800/80 border-l-4 border-l-[#1d6ee5] backdrop-blur-md overflow-hidden shadow-2xl">
        {/* Minimalist Header */}
        <div className="px-5 py-4 border-b border-zinc-800/60 bg-[#0e0f18]/60">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Frequently Asked Questions
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Everything you need to know about Fiveware architecture and licenses
          </p>
        </div>

        {/* Minimalist Accordion */}
        <div className="divide-y divide-zinc-800/40">
          {fivewareFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full py-4 px-5 flex items-center justify-between text-left gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
                >
                  <span className="text-xs sm:text-sm font-medium text-zinc-200 hover:text-white transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#1d6ee5]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 leading-relaxed font-normal bg-black/10">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category header for Payment Methods */}
      <div className="mt-12 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1d6ee5] shadow-[0_0_8px_rgba(29,110,229,0.8)]" />
          <h2 className="text-base font-bold uppercase tracking-wider text-white font-display">
            PAYMENT METHODS
          </h2>
        </div>
      </div>

      {/* Painel de Métodos de Pagamento com Barra Azul Lateral Idêntica à do FAQ */}
      <div className="w-full rounded-2xl bg-[#090a10] border border-zinc-800/80 border-l-4 border-l-[#1d6ee5] backdrop-blur-md overflow-hidden shadow-2xl text-left">
        {/* Minimalist Header idêntico ao do FAQ */}
        <div className="px-5 py-4 border-b border-zinc-800/60 bg-[#0e0f18]/60">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Payment Gateways
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Instant automated clearance for slots and software access
          </p>
        </div>

        {/* Balões esticados para os lados, colocados um em cima do outro */}
        <div className="p-4 sm:p-5 flex flex-col gap-2.5">
          {/* Pix */}
          <div className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-850 hover:border-[#32bcad]/40 transition-all duration-200 group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PixLogo className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">Pix</span>
                  <span className="text-xs text-[#32bcad] font-mono">
                    · Instantâneo
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 leading-snug mt-0.5">
                  QR Code e Chave Copia &amp; Cola · Aprovação automática imediata
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center text-[11px] font-mono text-emerald-400 font-medium shrink-0">
              <span>Auto 24/7</span>
            </div>
          </div>

          {/* PayPal */}
          <div className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-850 hover:border-[#0079c1]/40 transition-all duration-200 group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PaypalLogo className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">PayPal</span>
                  <span className="text-xs text-[#38bdf8] font-mono">
                    · Global
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 leading-snug mt-0.5">
                  Saldo da conta e cartões internacionais de débito e crédito
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center text-[11px] font-mono text-zinc-400 shrink-0">
              <span>USD / EUR</span>
            </div>
          </div>

          {/* Revolut */}
          <div className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 transition-all duration-200 group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <RevolutLogo className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">Revolut</span>
                  <span className="text-xs text-zinc-400 font-mono">
                    · Revtag
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 leading-snug mt-0.5">
                  Transferência direta instantânea sem taxas entre contas Revolut
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center text-[11px] font-mono text-zinc-400 shrink-0">
              <span>EUR / GBP / USD</span>
            </div>
          </div>

          {/* Crypto */}
          <div className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-850 hover:border-[#26A17B]/40 transition-all duration-200 group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <TetherLogo className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">Crypto &amp; USDT</span>
                  <span className="text-xs text-[#26A17B] font-mono">
                    · Web3
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 leading-snug mt-0.5">
                  USDT (TRC20 / ERC20), Bitcoin (BTC), Ethereum e principais redes
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <BitcoinLogo className="w-4 h-4 opacity-90" />
              <TetherLogo className="w-4 h-4 opacity-90" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
