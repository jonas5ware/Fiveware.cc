import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import ghostLogo from '../../assets/fiveware-ghost.png';

export const DiscordSection: React.FC = () => {
  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center justify-center text-center">
      <div className="w-full flex items-center justify-center">
        {/* Painel: Fiveware.cc */}
        <div className="group w-full max-w-[260px] flex flex-col items-center p-5 sm:p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-md shadow-xl space-y-3.5 hover:border-zinc-700/80 transition-colors">
          {/* Logo Fantasminha */}
          <div className="w-14 h-14 rounded-full overflow-hidden border border-zinc-700/80 bg-zinc-950 shadow-md flex items-center justify-center transition-all duration-300 group-hover:border-sky-400/50 group-hover:shadow-[0_0_16px_rgba(56,189,248,0.25)]">
            <img
              src={ghostLogo}
              alt="Fiveware.cc Ghost Logo"
              onError={(e) => {
                e.currentTarget.src = '/fiveware-ghost.png';
              }}
              className="w-full h-full object-cover select-none transform-gpu transition-transform duration-700 ease-in-out group-hover:rotate-[360deg] hover:rotate-[360deg]"
            />
          </div>

          {/* Nome e "Join Group" */}
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-white group-hover:text-sky-400 transition-colors">
              Fiveware.cc
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Join Group
            </p>
          </div>

          {/* Botão "Join" Fiveware.cc */}
          <div className="pt-1.5 w-full">
            <a
              href="https://discord.gg/devcoregg"
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-xs sm:text-sm font-semibold border border-zinc-700 hover:border-white transition-all duration-200 cursor-pointer shadow-md hover:shadow-white/5 active:scale-[0.98]"
            >
              <span>Join</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover/btn:text-white transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
