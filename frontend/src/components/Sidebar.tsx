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
  const [isCollapsed, setIsCollapsed] = React.useState(true);
  const [isHovered, setIsHovered] = React.useState(false);
  const [deviceType, setDeviceType] = React.useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  // Advanced device detection with proper responsive behavior
  React.useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (width < 768) {
        setDeviceType('mobile');
        setIsCollapsed(true); // Always collapsed on mobile
      } else if (width < 1024) {
        setDeviceType('tablet');
        setIsCollapsed(true); // Collapsed by default on tablet
      } else {
        setDeviceType('desktop');
        // On desktop, check if it's a touch device (like Surface Pro)
        if (isTouchDevice) {
          setIsCollapsed(true); // Touch-enabled desktop/laptop
        } else {
          setIsCollapsed(true); // Regular desktop with mouse
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
        } ${shouldShowExpanded ? 'w-64' : 'w-16'} lg:block border-r border-gray-200 dark:border-gray-700`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo and toggle button */}
          <div className={`flex items-center ${shouldShowExpanded ? 'justify-center' : 'justify-center'} p-4 border-b border-gray-200 dark:border-gray-700 relative`}>
            {shouldShowExpanded ? (
              <>
                <Link 
                  to="/" 
                  className="flex items-center justify-center"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="h-20 w-20 flex items-center justify-center overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-indigo-100 dark:border-indigo-800">
                    <Logo variant="navbar" className="h-16 w-16 object-contain" />
                  </div>
                </Link>
                {/* Desktop toggle button - positioned absolute to not affect logo centering */}
                {deviceType !== 'mobile' && (
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {/* Mobile close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close sidebar"
                >
                  <Icons.Close />
                </button>
              </>
            ) : (
              <Link 
                to="/" 
                className="group relative"
                onClick={() => setIsOpen(false)}
                title="BS Engineering - Dashboard"
              >
                <div className="h-18 w-18 flex items-center justify-center overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-md border border-indigo-200 dark:border-indigo-700">
                  <Logo variant="navbar" className="h-16 w-16 object-contain" />
                </div>
                
                {/* Tooltip for collapsed logo */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap top-1/2 transform -translate-y-1/2">
                  BS Engineering
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
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
                  className={`group flex items-center ${shouldShowExpanded ? 'px-3' : 'px-2'} py-2 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 border-r-4 border-indigo-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  } ${!shouldShowExpanded ? 'justify-center mx-1' : ''} ${
                    deviceType === 'mobile' ? 'py-3' : 'py-2'
                  } ${!shouldShowExpanded ? 'hover:scale-105' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  title={!shouldShowExpanded ? item.name : ''}
                >
                  <div className={`flex items-center justify-center ${!shouldShowExpanded ? 'w-8 h-8' : 'w-6 h-6'}`}>
                    <IconComponent />
                  </div>
                  {shouldShowExpanded && <span className="ml-3">{item.name}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {!shouldShowExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                      {item.name}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile and controls */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all duration-200 mb-2 relative ${
                !shouldShowExpanded ? 'justify-center' : ''
              }`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={!shouldShowExpanded ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : ''}
            >
              <div className={`flex items-center justify-center ${!shouldShowExpanded ? 'w-8 h-8' : 'w-6 h-6'}`}>
                {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
              </div>
              {shouldShowExpanded && (
                <span className="ml-3">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
              
              {/* Tooltip for collapsed state */}
              {!shouldShowExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              )}
            </button>

            {/* User profile */}
            {shouldShowExpanded ? (
              <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.first_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role || 'User'}
                  </p>
                </div>
              </div>
            ) : (
              <div 
                className="group flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 relative"
                title={`${user?.first_name || user?.username} (${user?.role})`}
              >
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center ring-2 ring-indigo-100 dark:ring-indigo-800">
                  <span className="text-white text-sm font-medium">
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                  </span>
                </div>
                
                {/* Tooltip for collapsed user profile */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                  {user?.first_name || user?.username} ({user?.role})
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
