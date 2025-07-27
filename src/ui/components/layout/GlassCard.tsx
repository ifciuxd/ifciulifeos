import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '',
  onClick 
}) => {
  return (
    <div 
      className={`rounded-xl backdrop-blur-lg bg-opacity-20 bg-white/10 border border-white/10 ${className}`}
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;