import React from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';

interface HeroSectionProps {
  onVerPlanos?: () => void;
  title?: string;
  subtitle?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onVerPlanos,
  title,
  subtitle
}) => {
  return (
    <section className="relative w-full py-16 sm:py-24 flex flex-col items-center justify-center text-center">
      {/* Background animado da Home (Wallpaper de Código com movimento suave tipo GIF) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
        {/* Imagem de código com leve zoom, pan e pulso de luz imitando um gif vivo */}
        <motion.div
          className="absolute inset-[-6%] w-[112%] h-[112%]"
          style={{
            backgroundImage: `url('/home-code-bg.jpg')`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          }}
          animate={{
            scale: [1, 1.05, 1.02, 1.06, 1],
            x: ['0%', '-1.5%', '1%', '-1%', '0%'],
            y: ['0%', '-1.2%', '1.5%', '-0.6%', '0%'],
            filter: [
              'brightness(0.50) contrast(1.18)',
              'brightness(0.62) contrast(1.24)',
              'brightness(0.46) contrast(1.14)',
              'brightness(0.58) contrast(1.20)',
              'brightness(0.50) contrast(1.18)'
            ]
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Scanline suave passando continuamente de cima para baixo como tela de terminal */}
        <motion.div
          className="absolute inset-0 w-full pointer-events-none bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent h-40"
          animate={{
            y: ['-100%', '800%']
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'linear'
          }}
        />

        {/* Vinheta radial e gradiente escuro para garantir nitidez e legibilidade absoluta */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/75 to-black pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black pointer-events-none" />
      </div>

      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center space-y-6 sm:space-y-7 relative z-10">
        
        {/* Destacado: Devcore Oficial - Limpo e Elegante */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/60 text-white shadow-md backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
          </span>
          <span className="text-base sm:text-lg font-bold font-display tracking-tight text-white">
            Fiveware.cc <span className="text-sky-400">Official</span>
          </span>
        </motion.div>

        {/* Main Headline & Subtitle */}
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="space-y-3"
          >
            {title && (
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-display tracking-tight text-white leading-[1.08] text-balance">
                {title}
              </h1>
            )}

            {subtitle && (
              <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed font-normal text-balance">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* CTA Buttons - Clean & Direct */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-1"
        >
          <button
            onClick={onVerPlanos}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 active:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm focus-visible:outline-none"
          >
            <span>View Features</span>
            <ArrowDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </motion.div>

        {/* Clean Statistics (Unboxed Minimal) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-center text-xs text-zinc-400 font-normal select-none"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white font-mono text-sm tabular-nums">420+</span>
            <span>Clients</span>
          </div>

          <span aria-hidden="true" className="text-zinc-700">·</span>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white font-mono text-sm tabular-nums">160+</span>
            <span>5★ Reviews</span>
          </div>

          <span aria-hidden="true" className="text-zinc-700">·</span>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white font-mono text-sm tabular-nums">2+</span>
            <span>Years in Operation</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
