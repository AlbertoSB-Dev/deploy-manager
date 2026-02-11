import React from 'react';

interface ArkLogoPNGProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const ArkLogoPNG: React.FC<ArkLogoPNGProps> = ({ 
  size = 40, 
  className = '',
  showText = true
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/logo.png" 
        alt="Ark Deploy Logo" 
        width={size} 
        height={size}
        className="object-contain"
      />
      {showText && (
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Ark Deploy
        </span>
      )}
    </div>
  );
};

// Versão apenas ícone
export const ArkIconPNG: React.FC<Omit<ArkLogoPNGProps, 'showText'>> = (props) => {
  return <ArkLogoPNG {...props} showText={false} />;
};
