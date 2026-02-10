import React from 'react';
import Image from 'next/image';

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
      <Image
        src="/logo.png"
        alt="Ark Deploy Logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
      
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
