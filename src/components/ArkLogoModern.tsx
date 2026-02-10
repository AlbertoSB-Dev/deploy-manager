import React from 'react';

interface ArkLogoModernProps {
  size?: number;
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

export const ArkLogoModern: React.FC<ArkLogoModernProps> = ({ 
  size = 40, 
  className = '',
  showText = true,
  animated = false
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={animated ? 'animate-pulse' : ''}
        >
          <defs>
            {/* Gradiente principal */}
            <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            
            {/* Gradiente secundário */}
            <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            
            {/* Sombra suave */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Círculo de fundo */}
          <circle 
            cx="60" 
            cy="60" 
            r="55" 
            fill="url(#mainGradient)"
            opacity="0.1"
          />
          
          {/* Forma da Arca - Estilo moderno */}
          <path
            d="M 30 70 L 30 45 Q 30 35 40 35 L 80 35 Q 90 35 90 45 L 90 70 Q 90 80 80 80 L 40 80 Q 30 80 30 70 Z"
            fill="url(#mainGradient)"
            filter="url(#glow)"
          />
          
          {/* Linha de destaque superior */}
          <path
            d="M 35 40 L 85 40"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          
          {/* Seta de Deploy - Moderna */}
          <g transform="translate(60, 50)">
            {/* Seta principal */}
            <path
              d="M 0 -15 L 0 15 M -8 -7 L 0 -15 L 8 -7"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Base da seta */}
            <rect
              x="-10"
              y="12"
              width="20"
              height="3"
              rx="1.5"
              fill="white"
            />
          </g>
          
          {/* Partículas decorativas */}
          <circle cx="40" cy="55" r="2" fill="white" opacity="0.5">
            {animated && (
              <animate
                attributeName="opacity"
                values="0.5;1;0.5"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle cx="48" cy="58" r="1.5" fill="white" opacity="0.4">
            {animated && (
              <animate
                attributeName="opacity"
                values="0.4;0.9;0.4"
                dur="2.5s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle cx="72" cy="58" r="1.5" fill="white" opacity="0.4">
            {animated && (
              <animate
                attributeName="opacity"
                values="0.4;0.9;0.4"
                dur="2.2s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle cx="80" cy="55" r="2" fill="white" opacity="0.5">
            {animated && (
              <animate
                attributeName="opacity"
                values="0.5;1;0.5"
                dur="1.8s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          
          {/* Brilho superior */}
          <ellipse
            cx="60"
            cy="38"
            rx="20"
            ry="3"
            fill="white"
            opacity="0.3"
          />
        </svg>
      </div>
      
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
export const ArkIconModern: React.FC<Omit<ArkLogoModernProps, 'showText'>> = (props) => {
  return <ArkLogoModern {...props} showText={false} />;
};
