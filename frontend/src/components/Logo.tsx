import React from 'react';
import { LOGO_CONFIG, LOGO_PATHS } from '../config/logoConfig';
import newLogo from '../assets/images/Businessosllution-01.svg';
import fallbackLogoSvg from '../assets/images/bs-engineering-logo.svg';

interface LogoProps {
  variant?: 'login' | 'navbar' | 'dashboard';
  src?: string;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'navbar', 
  src, 
  className,
  alt,
  style 
}) => {
  // Use custom src if provided, otherwise use the new BS logo
  const logoSrc = src || newLogo;
  
  // Get configuration for the variant
  const configKey = variant.toUpperCase() as 'LOGIN' | 'NAVBAR' | 'DASHBOARD';
  const config = LOGO_CONFIG[configKey];
  
  // Skip PDF config as it's not for display
  if ('maxWidth' in config) {
    return null;
  }
  
  // Combine default and custom classes
  const logoClassName = className 
    ? `${config.height} ${config.width} ${config.className} ${className}` 
    : `${config.height} ${config.width} ${config.className}`;

  return (
    <img
      src={logoSrc}
      alt={alt || config.alt}
      className={logoClassName}
      style={{
        ...style,
        imageRendering: 'crisp-edges',
        msInterpolationMode: 'bicubic' as any
      }}
      onError={(e) => {
        // Fallback to SVG logo if new PNG fails
        const target = e.target as HTMLImageElement;
        if (target.src !== fallbackLogoSvg) {
          target.src = fallbackLogoSvg;
        }
      }}
    />
  );
};

export default Logo;
