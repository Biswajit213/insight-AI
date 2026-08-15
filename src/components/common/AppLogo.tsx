import React, { useState } from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  customLogoUrl?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  customLogoUrl = '/logo.png',
}) => {
  const [imageError, setImageError] = useState(false);

  const containerSizes = {
    sm: 'h-8',
    md: 'h-9',
    lg: 'h-11',
  };

  const imgSizes = {
    sm: 'h-7 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto',
  };

  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const textClasses = {
    sm: 'text-sm font-bold',
    md: 'text-base font-bold',
    lg: 'text-xl font-bold',
  };

  return (
    <div className={`flex items-center gap-2.5 ${containerSizes[size]} ${className}`}>
      {/* Logo Image or Custom SVG Fallback */}
      {!imageError && customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt="InsightAI Logo"
          onError={() => setImageError(true)}
          className={`${imgSizes[size]} object-contain flex-shrink-0 transition-transform hover:scale-105`}
        />
      ) : (
        <div className={`${iconSizes[size]} rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md`}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 14 L6 8 L9 11 L12 5 L15 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="15" cy="4.5" r="2" fill="#34d399"/>
          </svg>
        </div>
      )}

      {/* Brand Text */}
      {showText && (
        <span className={`${textClasses[size]} text-white tracking-tight leading-none font-sans font-bold`}>
          Insight<span className="text-blue-400">AI</span>
        </span>
      )}
    </div>
  );
};
