import React from 'react';

export const BackgroundParticles: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Matte neutral clean canvas */}
      <div className="absolute inset-0 bg-[#09090b]" />

      {/* Gentle, ultra-soft neutral ambient gradient from top */}
      <div 
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] bg-gradient-to-b from-zinc-800/10 via-zinc-900/5 to-transparent pointer-events-none" 
      />
    </div>
  );
};
