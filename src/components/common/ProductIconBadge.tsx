import React from 'react';
import { Cpu, Server, ShieldAlert, Sparkles, Terminal, Box, CloudLightning } from 'lucide-react';

interface ProductIconBadgeProps {
  iconType: 'next' | 'boilerplate' | 'ai' | 'security' | 'infra' | 'motion';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProductIconBadge: React.FC<ProductIconBadgeProps> = ({
  iconType,
  className = '',
  size = 'md'
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'next':
        return <Terminal className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'} />;
      case 'boilerplate':
        return <Box className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'} />;
      case 'ai':
        return <Cpu className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'} />;
      case 'security':
        return <ShieldAlert className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'} />;
      case 'infra':
        return <Server className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'} />;
      case 'motion':
        return <Sparkles className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'} />;
      default:
        return <CloudLightning className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'} />;
    }
  };

  const getGlyphCode = () => {
    switch (iconType) {
      case 'next':
        return 'NXT://15.R19';
      case 'boilerplate':
        return 'SAAS://PROD.26';
      case 'ai':
        return 'LLM://REACT.AG';
      case 'security':
        return 'SEC://OWASP.0D';
      case 'infra':
        return 'K8S://SCALE.HA';
      case 'motion':
        return 'GLSL://60FPS.UI';
    }
  };

  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1C1C20] via-[#141417] to-[#0D0D0F] border border-white/10 overflow-hidden ${className}`}>
      {/* Subtle circuit grid overlay */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '16px 16px'
        }}
      />
      {/* Corner laser accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#E10600]/80" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#E10600]/80" />
      
      {/* Center glowing emblem */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 text-[#E10600] group-hover:scale-110 transition-transform duration-500">
        <div className="p-3.5 rounded-2xl bg-[#E10600]/10 border border-[#E10600]/40 shadow-[0_0_25px_rgba(225,6,0,0.35)]">
          {getIcon()}
        </div>
        <span className="font-mono text-[10px] text-white/50 tracking-wider">
          {getGlyphCode()}
        </span>
      </div>
    </div>
  );
};
