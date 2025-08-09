import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';

// Navigation icons using SVG
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
    </svg>
  ),
  Analytics: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Clients: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Quotations: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Invoices: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  ),
  Services: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  FinancialActivities: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ProjectManagement: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Reports: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType;
  roles?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = React.useState(false); // Start expanded by default
  const [isHovered, setIsHovered] = React.useState(false);
  const [deviceType, setDeviceType] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop'); // Default to desktop

  // Advanced device detection with proper responsive behavior
  React.useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setDeviceType('mobile');
        setIsCollapsed(true); // Always collapsed on mobile
      } else if (width < 1024) {
        setDeviceType('tablet');
        setIsCollapsed(false); // Expanded by default on tablet
      } else {
        setDeviceType('desktop');
        // On desktop, keep current state or default to expanded
        if (isCollapsed === true && width >= 1024) {
          setIsCollapsed(false); // Default to expanded on desktop
        }
      }
    };
    
    detectDevice();
    window.addEventListener('resize', detectDevice);
    
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: Icons.Dashboard },
    { name: 'Analytics', href: '/analytics', icon: Icons.Analytics },
    ...(user?.role !== 'viewer' ? [
      { name: 'Clients', href: '/clients', icon: Icons.Clients },
      { name: 'Project Management', href: '/projects', icon: Icons.ProjectManagement },
      { name: 'Quotations', href: '/quotations', icon: Icons.Quotations },
      { name: 'Invoices', href: '/invoices', icon: Icons.Invoices },
      { name: 'Services', href: '/services', icon: Icons.Services },
      ...(user?.role === 'admin' || user?.role === 'accountant' ? [
        { name: 'Financial Activities', href: '/financial-activities', icon: Icons.FinancialActivities }
      ] : [])
    ] : []),
    ...(user?.role === 'admin' ? [
      { name: 'Users', href: '/users', icon: Icons.Users },
      { name: 'Reports', href: '/reports', icon: Icons.Reports },
      { name: 'Settings', href: '/settings', icon: Icons.Settings }
    ] : [])
  ];

  const isCurrentPath = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  // Determine if sidebar should show expanded content based on device type
  const shouldShowExpanded = React.useMemo(() => {
    if (deviceType === 'mobile') {
      return true; // Mobile always shows full width when open
    } else if (deviceType === 'tablet') {
      return !isCollapsed; // Tablet respects collapsed state only
    } else {
      return !isCollapsed || isHovered; // Desktop supports hover + pin
    }
  }, [deviceType, isCollapsed, isHovered]);

  // Handle hover behavior based on device type
  const handleMouseEnter = React.useCallback(() => {
    if (deviceType === 'desktop' && window.innerWidth >= 1024) {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (!isTouchDevice) {
        setIsHovered(true);
      }
    }
  }, [deviceType]);

  const handleMouseLeave = React.useCallback(() => {
    if (deviceType === 'desktop' && window.innerWidth >= 1024) {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (!isTouchDevice) {
        setIsHovered(false);
      }
    }
  }, [deviceType]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-white dark:bg-gray-800 shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${shouldShowExpanded ? 'w-64' : 'w-20'} lg:block border-r border-gray-200 dark:border-gray-700`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Ultra Enhanced Glass Morphism Logo */}
          <div className={`flex items-center ${shouldShowExpanded ? 'justify-center' : 'justify-center'} ${shouldShowExpanded ? 'p-4' : 'p-2'} border-b border-gray-200/30 dark:border-gray-700/30 relative backdrop-blur-sm min-h-[80px]`}>
            {shouldShowExpanded ? (
              <>
                <Link 
                  to="/" 
                  className="group relative overflow-hidden transition-all duration-700 ease-out hover:scale-110 focus:outline-none mx-auto"
                  onClick={() => setIsOpen(false)}
                >
                  {/* Ultra Enhanced Glass Morphism Container - Expanded */}
                  <div className="relative h-20 w-20 flex items-center justify-center overflow-hidden 
                                  bg-gradient-to-br from-white/40 via-white/20 to-white/10 
                                  dark:from-gray-800/60 dark:via-gray-900/40 dark:to-gray-800/20 
                                  backdrop-blur-xl rounded-2xl shadow-xl 
                                  border border-white/40 dark:border-gray-700/50
                                  group-hover:shadow-2xl group-hover:border-white/60 dark:group-hover:border-gray-600/70
                                  transition-all duration-700 ease-out
                                  group-hover:bg-gradient-to-br group-hover:from-white/60 group-hover:via-white/40 group-hover:to-white/20
                                  dark:group-hover:from-gray-800/80 dark:group-hover:via-gray-900/60 dark:group-hover:to-gray-800/40">
                    
                    {/* Multiple glass morphism background layers */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-white/10 
                                    dark:from-gray-800/70 dark:via-gray-900/50 dark:to-gray-800/30 
                                    rounded-2xl backdrop-blur-xl border border-white/50 dark:border-gray-700/60 
                                    opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    
                    {/* Ultra dynamic glow effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 
                                    rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl scale-125"></div>
                    
                    {/* Animated border overlay */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent 
                                    bg-gradient-to-br from-blue-500/40 via-indigo-500/40 to-purple-500/40 
                                    opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
                    
                    {/* Enhanced shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                                    dark:via-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700 
                                    transform -skew-x-12 group-hover:animate-shimmer rounded-2xl"></div>
                    
                    {/* Multiple background glow layers */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-60 transition-all duration-700 ease-out blur-xl 
                                    bg-gradient-to-br from-indigo-500/30 via-blue-500/30 to-purple-500/30"></div>
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-40 transition-all duration-500 ease-out blur-lg 
                                    bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 delay-100"></div>
                    
                    {/* Logo with enhanced effects */}
                    <div className="relative z-30 transition-all duration-700 group-hover:scale-110 group-hover:drop-shadow-lg flex items-center justify-center w-full h-full">
                      <Logo variant="navbar" className="h-14 w-14 object-contain object-center filter group-hover:brightness-110 transition-all duration-700" />
                    </div>
                    
                    {/* Floating pulse indicators */}
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-gradient-to-br from-indigo-500 to-blue-500 
                                    rounded-full opacity-0 group-hover:opacity-80 group-hover:animate-pulse 
                                    transition-all duration-700 shadow-lg"></div>
                    <div className="absolute top-2 left-2 w-2 h-2 bg-gradient-to-br from-purple-500 to-indigo-500 
                                    rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-ping 
                                    transition-all duration-900 delay-200 shadow-md"></div>
                    <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-gradient-to-br from-cyan-500 to-blue-500 
                                    rounded-full opacity-0 group-hover:opacity-50 group-hover:animate-bounce 
                                    transition-all duration-800 delay-300"></div>
                    
                    {/* Enhanced side accent bars */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1.5 h-0 
                                    bg-gradient-to-b from-indigo-500 via-blue-500 to-purple-500 
                                    group-hover:h-10 transition-all duration-700 ease-out rounded-r-full 
                                    shadow-lg backdrop-blur-sm border-r border-white/20"></div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1.5 h-0 
                                    bg-gradient-to-b from-purple-500 via-indigo-500 to-blue-500 
                                    group-hover:h-10 transition-all duration-700 ease-out delay-200 rounded-l-full 
                                    shadow-lg backdrop-blur-sm border-l border-white/20"></div>
                    
                    {/* Focus ring enhancement */}
                    <div className="absolute inset-0 rounded-2xl border-3 border-blue-500/50 
                                    opacity-0 group-focus:opacity-100 transition-opacity duration-500 
                                    animate-pulse shadow-xl shadow-blue-500/40"></div>
                  </div>
                </Link>
                
                {/* Desktop toggle button with glass morphism */}
                {deviceType !== 'mobile' && (
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-xl 
                               bg-gradient-to-br from-white/30 via-white/15 to-white/10 
                               dark:from-gray-800/40 dark:via-gray-900/25 dark:to-gray-800/15 
                               backdrop-blur-sm border border-white/30 dark:border-gray-700/40 
                               shadow-lg hover:shadow-xl
                               hover:bg-gradient-to-br hover:from-white/50 hover:via-white/30 hover:to-white/20
                               dark:hover:from-gray-800/60 dark:hover:via-gray-900/40 dark:hover:to-gray-800/30
                               hover:border-white/50 dark:hover:border-gray-600/60
                               transition-all duration-500 ease-out hover:scale-110 z-50"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300 transition-colors duration-300 
                                    hover:text-indigo-600 dark:hover:text-indigo-400" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                    </svg>
                  </button>
                )}
                
                {/* Mobile close button with glass morphism */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="lg:hidden absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-xl 
                             bg-gradient-to-br from-white/30 via-white/15 to-white/10 
                             dark:from-gray-800/40 dark:via-gray-900/25 dark:to-gray-800/15 
                             backdrop-blur-sm border border-white/30 dark:border-gray-700/40 
                             shadow-lg hover:shadow-xl
                             hover:bg-gradient-to-br hover:from-white/50 hover:via-white/30 hover:to-white/20
                             dark:hover:from-gray-800/60 dark:hover:via-gray-900/40 dark:hover:to-gray-800/30
                             text-gray-400 hover:text-gray-500 dark:hover:text-gray-300
                             transition-all duration-500 ease-out hover:scale-110 z-50"
                  aria-label="Close sidebar"
                >
                  <Icons.Close />
                </button>
              </>
            ) : (
              <Link 
                to="/" 
                className="group relative overflow-hidden transition-all duration-700 ease-out hover:scale-110 focus:outline-none"
                onClick={() => setIsOpen(false)}
                title="BS Engineering - Dashboard"
              >
                {/* Ultra Enhanced Glass Morphism Container - Collapsed */}
                <div className="relative h-14 w-14 flex items-center justify-center overflow-hidden 
                                bg-gradient-to-br from-white/40 via-white/20 to-white/10 
                                dark:from-gray-800/60 dark:via-gray-900/40 dark:to-gray-800/20 
                                backdrop-blur-xl rounded-2xl shadow-xl 
                                border border-white/40 dark:border-gray-700/50
                                group-hover:shadow-2xl group-hover:border-white/60 dark:group-hover:border-gray-600/70
                                transition-all duration-700 ease-out
                                group-hover:bg-gradient-to-br group-hover:from-white/60 group-hover:via-white/40 group-hover:to-white/20
                                dark:group-hover:from-gray-800/80 dark:group-hover:via-gray-900/60 dark:group-hover:to-gray-800/40">
                  
                  {/* Glass morphism background layers for collapsed */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-white/10 
                                  dark:from-gray-800/70 dark:via-gray-900/50 dark:to-gray-800/30 
                                  rounded-2xl backdrop-blur-xl border border-white/50 dark:border-gray-700/60 
                                  opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  
                  {/* Collapsed glow effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 
                                  rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-lg scale-125"></div>
                  
                  {/* Collapsed shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                                  dark:via-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700 
                                  transform -skew-x-12 group-hover:animate-shimmer rounded-2xl"></div>
                  
                  {/* Logo with enhanced effects for collapsed - properly sized */}
                  <div className="relative z-30 transition-all duration-700 group-hover:scale-110 group-hover:drop-shadow-lg flex items-center justify-center w-full h-full">
                    <Logo variant="navbar" className="h-10 w-10 object-contain object-center filter group-hover:brightness-110 transition-all duration-700" />
                  </div>
                  
                  {/* Collapsed floating indicators */}
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-br from-indigo-500 to-blue-500 
                                  rounded-full opacity-0 group-hover:opacity-80 group-hover:animate-pulse 
                                  transition-all duration-700 shadow-md"></div>
                  <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 
                                  rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-ping 
                                  transition-all duration-900 delay-200 shadow-sm"></div>
                  
                  {/* Focus ring for collapsed */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/50 
                                  opacity-0 group-focus:opacity-100 transition-opacity duration-500 
                                  animate-pulse shadow-lg shadow-blue-500/30"></div>
                </div>
                
                {/* Enhanced tooltip with glass morphism */}
                <div className="absolute left-full ml-3 px-3 py-2 
                                bg-gradient-to-br from-gray-900/90 via-gray-800/85 to-gray-900/90 
                                dark:from-gray-700/90 dark:via-gray-600/85 dark:to-gray-700/90 
                                backdrop-blur-sm border border-gray-700/50 dark:border-gray-500/50
                                text-white text-xs rounded-xl shadow-xl
                                opacity-0 group-hover:opacity-100 transition-all duration-300 
                                pointer-events-none z-50 whitespace-nowrap 
                                top-1/2 transform -translate-y-1/2">
                  <span className="font-medium">BS Engineering</span>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 
                                  w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 border-l border-t 
                                  border-gray-700/50 dark:border-gray-500/50"></div>
                </div>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${shouldShowExpanded ? 'px-2 sidebar-nav' : 'px-1 sidebar-nav-collapsed'}`}>
            {navigation.map((item) => {
              const isActive = isCurrentPath(item.href);
              const IconComponent = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center ${shouldShowExpanded ? 'px-3' : 'px-2'} py-2 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? `bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg transform scale-105 border border-indigo-400/50
                         before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:opacity-100
                         after:absolute after:top-0 after:left-0 after:w-1 after:h-full after:bg-indigo-300 after:shadow-lg after:shadow-indigo-500/50`
                      : `text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 
                         dark:hover:from-gray-700 dark:hover:to-gray-600 hover:text-gray-900 dark:hover:text-white
                         hover:shadow-md hover:border hover:border-gray-200/50 dark:hover:border-gray-600/50
                         hover:transform hover:scale-102 hover:-translate-y-0.5
                         before:absolute before:inset-0 before:bg-gradient-to-r before:from-indigo-500/5 before:to-blue-500/5 
                         before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`
                  } ${!shouldShowExpanded ? 'justify-center mx-1' : ''} ${
                    deviceType === 'mobile' ? 'py-3' : 'py-2'
                  } ${!shouldShowExpanded ? 'hover:scale-110' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  title={!shouldShowExpanded ? item.name : ''}
                >
                  {/* Shimmer effect for hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
                  
                  {/* Enhanced icon with color-coded themes */}
                  <div className={`flex items-center justify-center ${!shouldShowExpanded ? 'w-8 h-8' : 'w-6 h-6'} relative z-10 transition-all duration-300 ${
                    isActive 
                      ? 'text-white group-hover:scale-110' 
                      : `group-hover:scale-110 ${
                          item.name === 'Dashboard' ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400' :
                          item.name === 'Analytics' ? 'group-hover:text-purple-600 dark:group-hover:text-purple-400' :
                          item.name === 'Clients' ? 'group-hover:text-green-600 dark:group-hover:text-green-400' :
                          item.name === 'Project Management' ? 'group-hover:text-orange-600 dark:group-hover:text-orange-400' :
                          item.name === 'Quotations' ? 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400' :
                          item.name === 'Invoices' ? 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400' :
                          item.name === 'Services' ? 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400' :
                          item.name === 'Financial Activities' ? 'group-hover:text-green-600 dark:group-hover:text-green-400' :
                          item.name === 'Users' ? 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400' :
                          item.name === 'Reports' ? 'group-hover:text-red-600 dark:group-hover:text-red-400' :
                          item.name === 'Settings' ? 'group-hover:text-gray-600 dark:group-hover:text-gray-400' :
                          'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`
                  }`}>
                    <IconComponent />
                  </div>
                  
                  {/* Enhanced text with color coordination */}
                  {shouldShowExpanded && (
                    <span className={`ml-3 relative z-10 transition-all duration-300 ${
                      isActive 
                        ? 'text-white font-semibold' 
                        : `group-hover:font-medium ${
                            item.name === 'Dashboard' ? 'group-hover:text-blue-700 dark:group-hover:text-blue-300' :
                            item.name === 'Analytics' ? 'group-hover:text-purple-700 dark:group-hover:text-purple-300' :
                            item.name === 'Clients' ? 'group-hover:text-green-700 dark:group-hover:text-green-300' :
                            item.name === 'Project Management' ? 'group-hover:text-orange-700 dark:group-hover:text-orange-300' :
                            item.name === 'Quotations' ? 'group-hover:text-cyan-700 dark:group-hover:text-cyan-300' :
                            item.name === 'Invoices' ? 'group-hover:text-emerald-700 dark:group-hover:text-emerald-300' :
                            item.name === 'Services' ? 'group-hover:text-yellow-700 dark:group-hover:text-yellow-300' :
                            item.name === 'Financial Activities' ? 'group-hover:text-green-700 dark:group-hover:text-green-300' :
                            item.name === 'Users' ? 'group-hover:text-indigo-700 dark:group-hover:text-indigo-300' :
                            item.name === 'Reports' ? 'group-hover:text-red-700 dark:group-hover:text-red-300' :
                            item.name === 'Settings' ? 'group-hover:text-gray-700 dark:group-hover:text-gray-300' :
                            'group-hover:text-indigo-700 dark:group-hover:text-indigo-300'
                          }`
                    }`}>
                      {item.name}
                    </span>
                  )}
                  
                  {/* Enhanced status indicator for active items */}
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-white rounded-full opacity-80 animate-pulse"></div>
                  )}
                  
                  {/* Color-coded hover indicator */}
                  {!isActive && (
                    <div className={`absolute right-2 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-60 transition-all duration-300 ${
                      item.name === 'Dashboard' ? 'bg-blue-500' :
                      item.name === 'Analytics' ? 'bg-purple-500' :
                      item.name === 'Clients' ? 'bg-green-500' :
                      item.name === 'Project Management' ? 'bg-orange-500' :
                      item.name === 'Quotations' ? 'bg-cyan-500' :
                      item.name === 'Invoices' ? 'bg-emerald-500' :
                      item.name === 'Services' ? 'bg-yellow-500' :
                      item.name === 'Financial Activities' ? 'bg-green-500' :
                      item.name === 'Users' ? 'bg-indigo-500' :
                      item.name === 'Reports' ? 'bg-red-500' :
                      item.name === 'Settings' ? 'bg-gray-500' :
                      'bg-indigo-500'
                    } group-hover:animate-pulse`}></div>
                  )}
                  
                  {/* Enhanced tooltip for collapsed state */}
                  {!shouldShowExpanded && (
                    <div className={`absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-lg border border-gray-700 dark:border-gray-600 ${
                      item.name === 'Dashboard' ? 'bg-blue-900 border-blue-700' :
                      item.name === 'Analytics' ? 'bg-purple-900 border-purple-700' :
                      item.name === 'Clients' ? 'bg-green-900 border-green-700' :
                      item.name === 'Project Management' ? 'bg-orange-900 border-orange-700' :
                      item.name === 'Quotations' ? 'bg-cyan-900 border-cyan-700' :
                      item.name === 'Invoices' ? 'bg-emerald-900 border-emerald-700' :
                      item.name === 'Services' ? 'bg-yellow-900 border-yellow-700' :
                      item.name === 'Financial Activities' ? 'bg-green-900 border-green-700' :
                      item.name === 'Users' ? 'bg-indigo-900 border-indigo-700' :
                      item.name === 'Reports' ? 'bg-red-900 border-red-700' :
                      item.name === 'Settings' ? 'bg-gray-800 border-gray-600' :
                      'bg-gray-900 border-gray-700'
                    }`}>
                      {item.name}
                      <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 ${
                        item.name === 'Dashboard' ? 'bg-blue-900' :
                        item.name === 'Analytics' ? 'bg-purple-900' :
                        item.name === 'Clients' ? 'bg-green-900' :
                        item.name === 'Project Management' ? 'bg-orange-900' :
                        item.name === 'Quotations' ? 'bg-cyan-900' :
                        item.name === 'Invoices' ? 'bg-emerald-900' :
                        item.name === 'Services' ? 'bg-yellow-900' :
                        item.name === 'Financial Activities' ? 'bg-green-900' :
                        item.name === 'Users' ? 'bg-indigo-900' :
                        item.name === 'Reports' ? 'bg-red-900' :
                        item.name === 'Settings' ? 'bg-gray-800' :
                        'bg-gray-900'
                      }`}></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile and controls */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-2">
            {/* Enhanced Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden mb-2 ${
                !shouldShowExpanded ? 'justify-center' : ''
              } text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-100 hover:to-orange-50 
              dark:hover:from-amber-900/30 dark:hover:to-orange-900/20 hover:text-amber-800 dark:hover:text-amber-200
              hover:shadow-md hover:border hover:border-amber-200/50 dark:hover:border-amber-700/50
              hover:transform hover:scale-102 hover:-translate-y-0.5
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-500/5 before:to-orange-500/5 
              before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={!shouldShowExpanded ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : ''}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
              
              <div className={`flex items-center justify-center ${!shouldShowExpanded ? 'w-8 h-8' : 'w-6 h-6'} relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:text-amber-600 dark:group-hover:text-amber-400`}>
                {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
              </div>
              {shouldShowExpanded && (
                <span className="ml-3 relative z-10 transition-all duration-300 group-hover:font-medium group-hover:text-amber-700 dark:group-hover:text-amber-300">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
              
              {/* Animated indicator */}
              <div className="absolute right-2 w-1.5 h-1.5 bg-amber-500 rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-pulse transition-all duration-300"></div>
              
              {/* Enhanced tooltip for collapsed state */}
              {!shouldShowExpanded && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-amber-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-lg border border-amber-700">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-amber-900 rotate-45"></div>
                </div>
              )}
            </button>

            {/* Enhanced User profile */}
            {shouldShowExpanded ? (
              <div className="relative group overflow-hidden flex items-center px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/30 dark:hover:to-blue-900/20 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-md hover:scale-102">
                {/* Subtle shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
                
                <div className="flex-shrink-0 relative z-10">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-indigo-100 dark:ring-indigo-800 group-hover:ring-indigo-200 dark:group-hover:ring-indigo-700 transition-all duration-300 group-hover:scale-110 shadow-lg">
                    <span className="text-white text-sm font-bold">
                      {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                    </span>
                  </div>
                  {/* Status indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-700 group-hover:scale-110 transition-transform duration-300"></div>
                </div>
                <div className="ml-3 flex-1 min-w-0 relative z-10">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-300">
                    {user?.first_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                    {user?.role || 'User'}
                  </p>
                </div>
                {/* Role badge */}
                <div className="absolute top-1 right-1 px-1.5 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {user?.role?.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <div 
                className="group flex items-center justify-center px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/30 dark:hover:to-blue-900/20 border border-gray-200 dark:border-gray-600 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 relative overflow-hidden hover:shadow-md hover:scale-105"
                title={`${user?.first_name || user?.username} (${user?.role})`}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
                
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-indigo-100 dark:ring-indigo-800 group-hover:ring-indigo-200 dark:group-hover:ring-indigo-700 transition-all duration-300 group-hover:scale-110 shadow-lg relative z-10">
                  <span className="text-white text-sm font-bold">
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                  </span>
                  {/* Status indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-700 group-hover:scale-110 transition-transform duration-300"></div>
                </div>
                
                {/* Enhanced tooltip for collapsed user profile */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-indigo-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-lg border border-indigo-700">
                  <div className="font-medium">{user?.first_name || user?.username}</div>
                  <div className="text-indigo-200 capitalize">({user?.role})</div>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-indigo-900 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ultra Enhanced Glass Morphism CSS animations for sidebar logo and navigation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Ultra enhanced shimmer animation for logo and nav */
          @keyframes shimmer {
            0% {
              transform: translateX(-150%) skewX(-20deg);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateX(250%) skewX(-20deg);
              opacity: 0;
            }
          }
          
          .animate-shimmer {
            animation: shimmer 1.5s ease-in-out;
          }
          
          /* Ultra enhanced pulse animation for floating indicators */
          @keyframes logo-pulse {
            0%, 100% {
              opacity: 0;
              transform: scale(0.8);
            }
            50% {
              opacity: 1;
              transform: scale(1.3);
            }
          }
          
          /* Enhanced ping animation for logo accents */
          @keyframes logo-ping {
            0% {
              opacity: 1;
              transform: scale(1);
            }
            75%, 100% {
              opacity: 0;
              transform: scale(2);
            }
          }
          
          /* Enhanced bounce animation for logo elements */
          @keyframes logo-bounce {
            0%, 100% {
              transform: translateY(0);
              opacity: 0.5;
            }
            50% {
              transform: translateY(-4px);
              opacity: 1;
            }
          }
          
          /* Glass morphism floating glow effect */
          @keyframes float-glow {
            0%, 100% {
              transform: translateY(0) scale(1);
              opacity: 0.6;
            }
            33% {
              transform: translateY(-2px) scale(1.05);
              opacity: 0.8;
            }
            66% {
              transform: translateY(2px) scale(0.95);
              opacity: 0.7;
            }
          }
          
          /* Enhanced hover scale animation */
          .hover\\:scale-102:hover {
            transform: scale(1.02);
          }
          
          .hover\\:scale-110:hover {
            transform: scale(1.1);
          }
          
          /* Smooth hover translate */
          .hover\\:-translate-y-0\\.5:hover {
            transform: translateY(-2px);
          }
          
          /* Ultra enhanced navigation hover effects */
          .sidebar-nav a:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transform: translateY(-2px) scale(1.02);
          }
          
          .sidebar-nav-collapsed a:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transform: translateY(-2px) scale(1.1);
          }
          
          /* Smooth transitions for all nav elements */
          .sidebar-nav a,
          .sidebar-nav-collapsed a {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          /* Color-specific glow effects for navigation */
          .sidebar-nav a[aria-current="page"] {
            animation: active-glow 2s ease-in-out infinite alternate;
          }
          
          @keyframes active-glow {
            0% {
              box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3), 0 2px 4px -1px rgba(99, 102, 241, 0.2);
            }
            100% {
              box-shadow: 0 8px 25px -5px rgba(99, 102, 241, 0.5), 0 10px 10px -5px rgba(99, 102, 241, 0.3);
            }
          }
          
          /* Subtle backdrop blur for enhanced modern feel */
          .sidebar-nav a::before,
          .sidebar-nav-collapsed a::before {
            backdrop-filter: blur(10px);
          }
          
          /* Enhanced tooltip animations */
          .group:hover .group-hover\\:opacity-100 {
            animation: fadeInScale 0.3s ease-out;
          }
          
          @keyframes fadeInScale {
            0% {
              opacity: 0;
              transform: scale(0.9) translateY(4px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          /* Enhanced user profile hover effects */
          .user-profile:hover {
            backdrop-filter: blur(20px);
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          }
          
          /* Enhanced theme toggle effects */
          .theme-toggle:hover {
            backdrop-filter: blur(15px);
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          }
          
          /* Accessibility improvements */
          @media (prefers-reduced-motion: reduce) {
            .sidebar-nav a,
            .sidebar-nav-collapsed a {
              transition: none;
              animation: none;
            }
          }
          
          /* Dark mode specific logo enhancements */
          .dark .sidebar-nav a:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
          }
          
          .dark .sidebar-nav a[aria-current="page"] {
            box-shadow: 0 0 25px rgba(99, 102, 241, 0.4);
          }
          
          /* Progressive enhancement for modern browsers */
          @supports (backdrop-filter: blur(10px)) {
            .sidebar-nav a:hover,
            .sidebar-nav-collapsed a:hover {
              backdrop-filter: blur(10px);
            }
          }
          
          /* Enhanced glass morphism border effects */
          .glass-border {
            position: relative;
          }
          
          .glass-border::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1px;
            background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: xor;
            -webkit-mask-composite: xor;
          }
          
          /* Ultra enhanced logo container effects */
          .logo-container {
            position: relative;
            overflow: hidden;
          }
          
          .logo-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(from 0deg, transparent, rgba(99, 102, 241, 0.1), transparent);
            animation: logo-spin 8s linear infinite;
            opacity: 0;
            transition: opacity 0.5s ease;
          }
          
          .logo-container:hover::before {
            opacity: 1;
          }
          
          @keyframes logo-spin {
            to {
              transform: rotate(360deg);
            }
          }
          
          /* Color-specific active state enhancements */
          .sidebar-nav a[aria-current="page"]::after {
            content: '';
            position: absolute;
            top: 50%;
            right: -4px;
            width: 4px;
            height: 60%;
            background: linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.4));
            border-radius: 2px;
            transform: translateY(-50%);
            animation: activeGlow 2s ease-in-out infinite alternate;
          }
          
          @keyframes activeGlow {
            0% {
              opacity: 0.6;
              box-shadow: 0 0 5px rgba(255,255,255,0.5);
            }
            100% {
              opacity: 1;
              box-shadow: 0 0 15px rgba(255,255,255,0.8);
            }
          }
          
          /* Enhanced logo containment for collapsed sidebar */
          .sidebar-logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 2px;
          }
          
          .sidebar-logo-container img {
            max-width: 100% !important;
            max-height: 100% !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain;
            object-position: center;
          }
          
          /* Prevent any potential overflow issues */
          .collapsed-logo-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }
        `
      }} />
    </>
  );
};

export default Sidebar;
