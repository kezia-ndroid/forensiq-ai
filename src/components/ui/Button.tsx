import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-purple-950 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
    }[size];

    const variantStyles = {
      primary:
        'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 shadow-lg shadow-purple-900/30 hover:shadow-pink-500/25 active:scale-[0.98]',
      secondary:
        'bg-purple-950/80 text-purple-200 hover:bg-purple-900/80 hover:text-white border border-purple-800/80 active:scale-[0.98]',
      outline:
        'bg-transparent text-pink-400 border border-purple-500/40 hover:bg-purple-500/10 hover:border-pink-400 active:scale-[0.98]',
      ghost:
        'bg-transparent text-slate-300 hover:text-white hover:bg-purple-950/60 active:scale-[0.98]',
      glass:
        'bg-purple-950/50 backdrop-blur-md text-white border border-purple-500/20 hover:border-pink-500/40 hover:bg-purple-900/50 active:scale-[0.98]',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
