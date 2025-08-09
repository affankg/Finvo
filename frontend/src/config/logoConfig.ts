// Company Logo Configuration
// This file contains the logo paths and configurations for the BS Engineering application

// Logo file paths
export const LOGO_PATHS = {
  // Main company logo (new uploaded logo)
  MAIN_LOGO: '/src/assets/images/Businessosllution-01.svg',
  
  // Alternative formats if needed
  LOGO_SVG: '/src/assets/images/Businessosllution-01.svg',
  LOGO_WHITE: '/src/assets/images/company-logo-white.png',
  LOGO_DARK: '/src/assets/images/company-logo-dark.png',
  
  // For PDF documents
  LOGO_PDF: '/src/assets/images/Businessosllution-01.svg',
};

// Logo configurations for different contexts
export const LOGO_CONFIG = {
  // Login page - larger and more prominent
  LOGIN: {
    height: 'h-28 sm:h-32 md:h-36 lg:h-40',
    width: 'w-auto',
    className: 'object-contain max-w-xs sm:max-w-sm md:max-w-md mx-auto',
    alt: 'BS Engineering Logo'
  },
  
  // Navigation bar - clean and compact
  NAVBAR: {
    height: 'h-12 sm:h-14',
    width: 'w-auto',
    className: 'object-contain',
    alt: 'BS Engineering'
  },
  
  // Dashboard - medium size for headers
  DASHBOARD: {
    height: 'h-20 sm:h-24',
    width: 'w-auto',
    className: 'object-contain',
    alt: 'BS Engineering'
  },
  
  // PDF Documents - high quality for print
  PDF: {
    maxWidth: 280,
    maxHeight: 140,
    quality: 1.0
  }
};

// Company information
export const COMPANY_INFO = {
  name: 'Business Solution Engineering',
  fullName: 'Business Solution Engineering',
  tagline: 'Professional Engineering Solutions',
  website: 'www.bsconsults.com',
  email: 'bs@bsconsults.com',
  phone: 'P: 92.21.34982786 | C: +92.3063216344 | C: +92.3443311303'
};
