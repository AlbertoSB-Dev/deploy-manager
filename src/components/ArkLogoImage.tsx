import React from 'react';

interface ArkLogoImageProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const ArkLogoImage: React.FC<ArkLogoImageProps> = ({ 
  size = 40, 
  className = '',
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo SVG - Arca com Deploy */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Arca/Container */}
        <rect x="15" y="35" width="70" height="50" rx="4" fill="url(#gradient1)" />
        <rect x="20" y="40" width="60" height="40" rx="2" fill="#1e293b" opacity="0.3" />
        
        {/* Linhas do container */}
        <line x1="15" y1="50" x2="85" y2="50" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
        <line x1="15" y1="65" x2="85" y2="65" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
        
        {/* Seta de Deploy */}
        <path 
          d="M50 15 L50 30 M50 30 L42 22 M50 30 L58 22" 
          stroke="url(#gradient2)" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Círculo de proteção */}
        <circle cx="50" cy="50" r="35" stroke="url(#gradient3)" strokeWidth="2" fill="none" opacity="0.3" />
        
        {/* Gradientes */}
        <defs>
          <linearGradient id="gradient1" x1="15" y1="35" x2="85" y2="85">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="gradient2" x1="50" y1="15" x2="50" y2="30">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="gradient3" x1="15" y1="15" x2="85" y2="85">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Ark Deploy
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight font-medium">
            Proteja seus deploys
          </span>
        </div>
      )}
    </div>
  );
};

// Versão apenas ícone
export const ArkIconImage: React.FC<Omit<ArkLogoImageProps, 'showText'>> = (props) => {
  return <ArkLogoImage {...props} showText={false} />;
};
