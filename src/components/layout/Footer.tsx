import React from 'react';
import { Lock, ShieldCheck, Activity } from 'lucide-react';

interface FooterProps {
  onOpenAdminPrompt?: () => void;
  systemStatusText?: string;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenAdminPrompt, 
  systemStatusText = 'Status: Operacional' 
}) => {
  return (
    <footer className="relative bg-[#08080a] border-t border-zinc-800/60 py-6 sm:py-7 text-zinc-500 text-xs mt-auto select-none backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand & Rights */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold font-display text-white tracking-tight">Fiveware.cc</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="text-xs text-zinc-500">
              © {new Date().getFullYear()} Fiveware.cc. All rights reserved.
            </span>
          </div>

          {/* Simple status */}
          <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>{systemStatusText}</span>
            </span>

            {/* Ultra-discrete administrative lock (nearly invisible to normal users) */}
            <button
              onClick={onOpenAdminPrompt}
              aria-label=""
              tabIndex={-1}
              className="opacity-[0.008] hover:opacity-50 transition-opacity duration-700 p-0.5 text-zinc-900 hover:text-zinc-500 rounded cursor-default focus:outline-none select-none"
              title=""
            >
              <Lock className="w-2 h-2" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
