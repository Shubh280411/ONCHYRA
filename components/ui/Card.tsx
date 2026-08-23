import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export default function Card({ children, className = '', hover = false, padding = 'md', style }: CardProps) {
  const paddings = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div style={style} className={`bg-white/[0.03] border border-white/[0.06] rounded-2xl backdrop-blur-xl ${paddings[padding]} ${hover ? 'hover:bg-white/[0.06] transition-all duration-200 cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  );
}
