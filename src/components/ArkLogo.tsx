import React from 'react';

interface ArkLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'gradient' | 'white';
}

export const ArkLogo: React.FC<ArkLogoProps> = ({ 
  size = 40, 
  className = '',
  showText = true,
  variant = 'default'
}) => {
  const getColors = () => {
    switch (variant) {
      case 'gradient':
        return {
          primary: 'url(#arkGradient)',
          secondary: 'url(#arkGradient)',
          text: 'text-gray-900 dark:text-white'
        };
      case 'white':
        return {
          primary: '#ffffff',
          secondary: '#ffffff',
          text: 'text-white'
        };
      default:
        return {
          primary: '#3B82F6', // blue-500
          secondary: '#8B5CF6', // purple-500
          text: 'text-gray-900 dark:text-white'
        };
    }
  };

  const colors = getColors();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="arkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Arca/Container - Base */}
        <path
          d="M20 75 L20 35 Q20 30 25 30 L75 30 Q80 30 80 35 L80 75 Q80 80 75 80 L25 80 Q20 80 20 75 Z"
          fill={colors.primary}
          opacity="0.2"
        />
        
        {/* Arca/Container - Frente */}
        <path
          d="M15 70 L15 30 Q15 25 20 25 L80 25 Q85 25 85 30 L85 70 Q85 75 80 75 L20 75 Q15 75 15 70 Z"
          fill={colors.primary}
          filter="url(#shadow)"
        />
        
        {/* Detalhe da Arca - Linhas */}
        <line x1="15" y1="40" x2="85" y2="40" stroke={colors.secondary} strokeWidth="2" opacity="0.5"/>
        <line x1="15" y1="55" x2="85" y2="55" stroke={colors.secondary} strokeWidth="2" opacity="0.5"/>
        
        {/* Símbolo de Deploy - Seta para cima */}
        <path
          d="M50 35 L50 60 M50 35 L42 43 M50 35 L58 43"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Código/Dados - Pontos */}
        <circle cx="30" cy="48" r="2" fill="white" opacity="0.7"/>
        <circle cx="38" cy="48" r="2" fill="white" opacity="0.7"/>
        <circle cx="62" cy="48" r="2" fill="white" opacity="0.7"/>
        <circle cx="70" cy="48" r="2" fill="white" opacity="0.7"/>
        
        {/* Proteção - Shield overlay */}
        <path
          d="M50 20 L65 28 L65 45 Q65 55 50 62 Q35 55 35 45 L35 28 Z"
          fill={colors.secondary}
          opacity="0.3"
          filter="url(#shadow)"
        />
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-xl ${colors.text} leading-tight`}>
            Ark Deploy
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
            Seu código protegido
          </span>
        </div>
      )}
    </div>
  );
};

// Versão simplificada apenas com ícone
export const ArkIcon: React.FC<Omit<ArkLogoProps, 'showText'>> = (props) => {
  return <ArkLogo {...props} showText={false} />;
};
