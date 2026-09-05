import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = false,
  interactive = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl border border-purple-900/50 bg-[#160d2b]/80 backdrop-blur-md transition-all duration-300 ${
        interactive
          ? 'hover:border-pink-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/60'
          : ''
      } ${glow ? 'border-pink-500/40 shadow-lg shadow-purple-950/60' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
