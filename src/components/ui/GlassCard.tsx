import { cn } from '@/lib/utils';
import { ReactNode, HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'primary' | 'accent' | 'secondary' | 'none';
}

const GlassCard = ({ 
  children, 
  className, 
  hover = true, 
  glow = 'primary',
  ...props 
}: GlassCardProps) => {
  const glowColors = {
    primary: 'hover:shadow-glow-primary hover:border-primary/50',
    accent: 'hover:shadow-glow-accent hover:border-accent/50',
    secondary: 'hover:shadow-glow-secondary hover:border-secondary/50',
    none: '',
  };

  return (
    <div
      className={cn(
        'glass-card p-6 transition-all duration-300',
        hover && 'hover:translate-y-[-4px] hover:scale-[1.02]',
        glow !== 'none' && glowColors[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
