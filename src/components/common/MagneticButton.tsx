import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { cn } from '../../lib/utils';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  magneticStrength?: number;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  magneticStrength = 0.2,
  ...props
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200, mass: 0.1 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = (e.clientX - centerX) * magneticStrength;
    const distanceY = (e.clientY - centerY) * magneticStrength;
    x.set(distanceX);
    y.set(distanceY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const variantStyles = {
    primary:
      'bg-[#15803d] text-white hover:bg-[#166534] active:bg-[#14532d] shadow-sm',
    secondary:
      'bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white border border-zinc-800/80 hover:border-zinc-700 shadow-sm',
    outline:
      'bg-transparent text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-white',
    ghost:
      'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-2.5 text-base rounded-xl'
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: smoothX, y: smoothY }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative inline-flex items-center justify-center font-medium cursor-pointer select-none transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...(props as any)}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
