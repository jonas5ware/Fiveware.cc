import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  MessageSquare, 
  ShieldCheck
} from 'lucide-react';
import { NavTabId } from '../layout/Navbar';

// Logos Oficiais dos Aplicativos de Pagamento
const PixLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M112.57 391.19c20.31 0 39.41-7.91 53.72-22.23l73.49-73.49c4.54-4.54 11.91-4.54 16.45 0l73.68 73.68c14.31 14.31 33.36 22.04 53.53 22.04h17.15l-87.35-87.35c-9.78-9.78-9.78-25.64 0-35.42l86.6-86.6h-16.4c-20.31 0-39.41 7.91-53.72 22.23l-73.49 73.49c-4.54 4.54-11.91 4.54-16.45 0l-73.68-73.68c-14.31-14.31-33.36-22.04-53.53-22.04h-17.15l87.35 87.35c9.78 9.78 9.78 25.64 0 35.42l-86.6 86.6h16.44zm143.43-289.44c-12.7 0-24.87 4.95-33.85 13.93l-105.7 105.7h-36.9c-21.75 0-39.45 17.7-39.45 39.45 0 10.46 4.16 20.48 11.55 27.88l130.5 130.5c9.35 9.35 21.6 14.15 33.85 14.15s24.5-4.8 33.85-14.15l130.5-130.5c7.39-7.39 11.55-17.41 11.55-27.88 0-21.75-17.7-39.45-39.45-39.45h-36.9l-105.7-105.7c-8.98-8.98-21.15-13.93-33.85-13.93z" />
  </svg>
);

const PaypalLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.79.79 0 0 1 .778-.666h6.513c3.085 0 5.253 1.34 5.034 4.516-.242 3.528-2.619 5.37-5.748 5.37H8.814a.79.79 0 0 0-.78.667l-.958 6.064v1.666zm3.327-14.802-.924 5.856a.263.263 0 0 0 .26.304h1.847c2.19 0 3.723-1.07 3.882-3.376.136-1.97-1.127-2.784-3.23-2.784H10.403zm10.748 3.593c-.22 2.94-2.128 4.792-4.992 4.792h-2.162a.641.641 0 0 0-.633.541l-1.05 6.647a.513.513 0 0 1-.507.433H8.384a.513.513 0 0 1-.506-.593l.255-1.614.958-6.065a.641.641 0 0 1 .633-.541h2.707c2.721 0 4.788-1.602 4.998-4.67.09-.982-.016-1.815-.353-2.484 2.213.626 3.87 2.14 3.708 3.554z" />
  </svg>
);

const RevolutLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14.887 13.914c2.25-.845 3.65-2.724 3.65-5.118C18.537 4.985 15.65 3 11.234 3H5.5v18h3.818v-6.427h1.49l4.184 6.427h4.48l-4.585-7.086zm-5.569-3.37V6.44h1.916c2.27 0 3.642 1.066 3.642 2.552 0 1.487-1.372 2.553-3.642 2.553H9.318z" />
  </svg>
);

const CryptoLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.5 10.15c.29-.98.05-1.95-.7-2.63-.73-.67-1.83-.97-3.15-.97V4.5h-1.5v2.01h-1.5V4.5h-1.5v2.04H5.5v1.85h1.22c.4 0 .62.2.62.53v8.16c0 .33-.22.53-.62.53H5.5V19.5h2.65v2.05h1.5v-2.02h1.5v2.02h1.5v-2.04c2.39-.08 4.2-.95 4.64-2.88.38-1.68-.42-2.73-1.67-3.23 1.06-.48 1.63-1.55 1.38-3.22zm-5.07-2.15c1.47 0 2.65.36 2.65 1.77 0 1.36-1.18 1.75-2.65 1.75H9.65V8h1.78zm.53 8.35H9.65v-3.7h2.31c1.64 0 2.87.42 2.87 1.85 0 1.45-1.23 1.85-2.87 1.85z" />
  </svg>
);

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
      question: 'What is Fiveware and how does it operate?',
      answer: 'Fiveware is a private, pre-boot UEFI OS and kernel-level architecture engineered to operate completely undetected with zero memory footprint, neutralizing telemetry and anti-cheat checks before the operating system boots.'
    },
    {
      question: 'Is Fiveware streamproof and undetectable on recordings?',
      answer: 'Yes. Fiveware is 100% streamproof on Discord screen sharing, OBS Studio, NVIDIA ShadowPlay, and Medal. No visual elements, overlays, or menus will ever appear on your streams or video recordings.'
    },
    {
      question: 'What are the system requirements for Fiveware?',
      answer: 'Fiveware supports Windows 10 and Windows 11 (all current builds). Your system must be set to UEFI boot mode with GPT partition. Comprehensive step-by-step setup documentation is provided upon activation.'
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
        <span className="text-xs text-zinc-400 font-mono">
          Fiveware Specifications
        </span>
      </div>

      {/* Minimalist Panel with Left Accent Blue Bar - Strictly Maintained */}
      <div className="w-full rounded-2xl bg-[#090a10] border border-zinc-800/80 border-l-4 border-l-[#1d6ee5] backdrop-blur-md overflow-hidden shadow-2xl">
        {/* Minimalist Header */}
        <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between bg-[#0e0f18]/60">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Everything you need to know about Fiveware architecture and licenses
            </p>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 text-sky-400 border border-zinc-800">
            Official
          </span>
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

      {/* Subtly Highlighted, Minimalist & Clean Payment Methods under FAQ */}
      <div className="mt-8 rounded-2xl bg-[#0c0d12]/90 border border-zinc-800/90 p-5 sm:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Subtle top hairline highlight */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1d6ee5]/80 to-transparent" />

        {/* Header: Clean unboxed typography */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase font-display">
              Métodos de Pagamento · Payment Methods
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span>Instantâneo</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Envio Automático 24/7</span>
          </div>
        </div>

        {/* Minimalist, clean grid of payment gateways */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Pix */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-[#32bcad]/40 transition-all group">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#32bcad]/10 border border-[#32bcad]/25 flex items-center justify-center text-[#32bcad] shrink-0 group-hover:scale-105 transition-transform">
                <PixLogo className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">Pix</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Instantâneo via QR Code e Copia &amp; Cola
            </p>
          </div>

          {/* PayPal */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-[#0079c1]/40 transition-all group">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#0079c1]/10 border border-[#0079c1]/25 flex items-center justify-center text-[#0079c1] shrink-0 group-hover:scale-105 transition-transform">
                <PaypalLogo className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">PayPal</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Cartão internacional e saldo global
            </p>
          </div>

          {/* Revolut */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-500/40 transition-all group">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-850 border border-zinc-700/80 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <RevolutLogo className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">Revolut</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Transferência direta via Revtag (EUR/USD)
            </p>
          </div>

          {/* Crypto */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-[#f7931a]/40 transition-all group">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#f7931a]/10 border border-[#f7931a]/25 flex items-center justify-center text-[#f7931a] shrink-0 group-hover:scale-105 transition-transform">
                <CryptoLogo className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">Crypto</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              USDT (TRC20), Bitcoin e Ethereum
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
