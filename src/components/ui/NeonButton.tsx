import { cn } from '@/lib/utils';
import { ReactNode, ButtonHTMLAttributes } from 'react';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'multi' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const NeonButton = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  ...props
}: NeonButtonProps) => {
  const variants = {
    primary: 'neon-button-blue',
    blue: 'neon-button-blue',
    multi: 'neon-button-multi',
    secondary: 'neon-button-secondary',
    accent: 'bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-glow-accent',
    ghost: 'bg-transparent border border-border hover:bg-muted/50 hover:border-primary/50',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default NeonButton;
