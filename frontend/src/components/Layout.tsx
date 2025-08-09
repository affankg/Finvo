import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';

// Mobile menu toggle icon
const MenuIcon: React.FC = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// Logout icon
const LogoutIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target as Node)) &&
        (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node))
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop header */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Ultra Enhanced Glass Morphism Company Logo - Desktop */}
              <div className="flex-1">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="group relative overflow-hidden transition-all duration-700 ease-out hover:scale-110 focus:outline-none rounded-3xl px-6 py-4 bg-gradient-to-r from-white/20 via-white/10 to-white/20 dark:from-gray-800/40 dark:via-gray-900/20 dark:to-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/40 shadow-lg hover:shadow-2xl"
                  title="Go to Dashboard"
                >
                  {/* Multiple glass morphism background layers */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/60 to-white/80 dark:from-gray-800/90 dark:via-gray-900/70 dark:to-gray-800/90 rounded-3xl backdrop-blur-xl border border-white/40 dark:border-gray-700/60 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  
                  {/* Ultra dynamic focus glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-purple-500/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl scale-125"></div>
                  
                  {/* Prominent animated border on hover */}
                  <div className="absolute inset-0 rounded-3xl border-4 border-transparent bg-gradient-to-r from-blue-500/50 via-indigo-500/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md"></div>
                  
                  {/* Enhanced shimmer effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-x-12 group-hover:animate-shimmer rounded-3xl"></div>
                  
                  {/* Multiple background glow layers */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-80 transition-all duration-700 ease-out blur-2xl bg-gradient-to-r from-indigo-500/40 via-blue-500/40 to-purple-500/40"></div>
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-60 transition-all duration-500 ease-out blur-xl bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-indigo-500/30 delay-100"></div>
                  
                  {/* Main text with ultra enhanced gradient and glass effect */}
                  <span className="relative z-30 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent group-hover:from-indigo-800 group-hover:via-blue-800 group-hover:to-purple-800 dark:group-hover:from-indigo-200 dark:group-hover:via-blue-200 dark:group-hover:to-purple-200 transition-all duration-700 font-black tracking-wider text-xl drop-shadow-lg">
                    BS ENGINEERING
                  </span>
                  
                  {/* Ultra enhanced animated underline with gradient */}
                  <div className="absolute bottom-3 left-6 right-6 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 ease-out rounded-full shadow-xl shadow-blue-500/50"></div>
                  
                  {/* Multiple floating pulse indicators */}
                  <div className="absolute top-3 right-3 w-3 h-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-90 group-hover:animate-pulse transition-all duration-700 shadow-lg"></div>
                  <div className="absolute top-3 left-3 w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-70 group-hover:animate-ping transition-all duration-900 delay-200 shadow-lg"></div>
                  <div className="absolute bottom-3 right-3 w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-bounce transition-all duration-800 delay-300"></div>
                  
                  {/* Ultra enhanced side accent bars with glass effect */}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-0 bg-gradient-to-b from-indigo-500 via-blue-500 to-purple-500 group-hover:h-12 transition-all duration-700 ease-out rounded-r-full shadow-xl backdrop-blur-sm border-r border-white/20"></div>
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-0 bg-gradient-to-b from-purple-500 via-indigo-500 to-blue-500 group-hover:h-12 transition-all duration-700 ease-out delay-200 rounded-l-full shadow-xl backdrop-blur-sm border-l border-white/20"></div>
                  
                  {/* Prominent focus ring enhancement */}
                  <div className="absolute inset-0 rounded-3xl border-4 border-blue-500/50 opacity-0 group-focus:opacity-100 transition-opacity duration-500 animate-pulse shadow-2xl shadow-blue-500/40"></div>
                  
                  {/* Additional floating particles */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/60 rounded-full opacity-0 group-hover:opacity-80 group-hover:animate-ping transition-all duration-1000 delay-500"></div>
                </button>
              </div>
              
              {/* Centered Search Bar */}
              <div className="flex-1 max-w-md mx-auto">
                <GlobalSearch />
              </div>
              
              {/* User menu dropdown */}
              <div className="flex-1 flex justify-end">
                <div className="relative" ref={desktopMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.first_name || user?.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user?.role || 'User'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogoutIcon />
                      <span className="ml-3">Logout</span>
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile header */}
          <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Open sidebar"
              >
                <MenuIcon />
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="group relative overflow-hidden transition-all duration-700 ease-out hover:scale-110 focus:outline-none rounded-3xl px-5 py-4 bg-gradient-to-r from-white/20 via-white/10 to-white/20 dark:from-gray-800/40 dark:via-gray-900/20 dark:to-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/40 shadow-lg hover:shadow-xl"
                title="Go to Dashboard"
              >
                {/* Ultra enhanced glass morphism background layers for mobile */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/60 to-white/80 dark:from-gray-800/90 dark:via-gray-900/70 dark:to-gray-800/90 rounded-3xl backdrop-blur-xl border border-white/40 dark:border-gray-700/60 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                {/* Ultra dynamic focus glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/25 via-indigo-500/25 to-purple-500/25 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl scale-125"></div>
                
                {/* Prominent animated border on hover */}
                <div className="absolute inset-0 rounded-3xl border-3 border-transparent bg-gradient-to-r from-blue-500/40 via-indigo-500/40 to-purple-500/40 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md"></div>
                
                {/* Mobile shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-x-12 group-hover:animate-shimmer rounded-3xl"></div>
                
                {/* Mobile background glow */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-70 transition-all duration-700 ease-out blur-xl bg-gradient-to-r from-indigo-500/30 via-blue-500/30 to-purple-500/30"></div>
                
                {/* Mobile enhanced text with glass effect */}
                <span className="relative z-30 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent group-hover:from-indigo-800 group-hover:via-blue-800 group-hover:to-purple-800 dark:group-hover:from-indigo-200 dark:group-hover:via-blue-200 dark:group-hover:to-purple-200 transition-all duration-700 font-black tracking-wider text-lg drop-shadow-lg">
                  BS ENGINEERING
                </span>
                
                {/* Mobile animated underline with gradient */}
                <div className="absolute bottom-2 left-5 right-5 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 ease-out rounded-full shadow-lg shadow-blue-500/40"></div>
                
                {/* Mobile floating pulse indicators */}
                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-80 group-hover:animate-pulse transition-all duration-700 shadow-md"></div>
                <div className="absolute top-2.5 left-2.5 w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-ping transition-all duration-900 delay-200 shadow-md"></div>
                
                {/* Mobile enhanced side accent bars */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1.5 h-0 bg-gradient-to-b from-indigo-500 via-blue-500 to-purple-500 group-hover:h-10 transition-all duration-700 ease-out rounded-r-full shadow-lg backdrop-blur-sm border-r border-white/20"></div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1.5 h-0 bg-gradient-to-b from-purple-500 via-indigo-500 to-blue-500 group-hover:h-10 transition-all duration-700 ease-out delay-200 rounded-l-full shadow-lg backdrop-blur-sm border-l border-white/20"></div>
                
                {/* Mobile focus ring enhancement */}
                <div className="absolute inset-0 rounded-3xl border-3 border-blue-500/40 opacity-0 group-focus:opacity-100 transition-opacity duration-500 animate-pulse shadow-xl shadow-blue-500/30"></div>
              </button>
              {/* Mobile user menu */}
              <div className="relative" ref={mobileMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-sm font-medium">
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                  </span>
                </button>

                {/* Mobile dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.first_name || user?.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user?.role || 'User'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogoutIcon />
                      <span className="ml-3">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile Search Bar */}
            <div className="w-full">
              <GlobalSearch />
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto focus:outline-none">
            <div className="relative">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Ultra Enhanced Glass Morphism CSS animations for company logo */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Ultra enhanced shimmer animation */
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
          
          /* Ultra enhanced pulse animation */
          @keyframes enhanced-pulse {
            0%, 100% {
              opacity: 0;
              transform: scale(0.8);
            }
            50% {
              opacity: 1;
              transform: scale(1.4);
            }
          }
          
          /* Ultra floating glow effect */
          @keyframes float-glow {
            0%, 100% {
              transform: translateY(0) scale(1);
              opacity: 0.6;
            }
            33% {
              transform: translateY(-5px) scale(1.1);
              opacity: 0.9;
            }
            66% {
              transform: translateY(3px) scale(0.95);
              opacity: 0.8;
            }
          }
          
          /* Ultra gradient flow animation */
          @keyframes gradient-flow {
            0%, 100% {
              background-position: 0% 50%;
            }
            25% {
              background-position: 100% 25%;
            }
            50% {
              background-position: 200% 50%;
            }
            75% {
              background-position: 100% 75%;
            }
          }
          
          /* Ultra enhanced ping with multiple layers */
          @keyframes enhanced-ping {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.8);
              opacity: 0.5;
            }
            100% {
              transform: scale(2.5);
              opacity: 0;
            }
          }
          
          /* Ultra bounce with glow */
          @keyframes enhanced-bounce {
            0%, 100% {
              transform: translateY(0) scale(1);
              opacity: 0.6;
            }
            25% {
              transform: translateY(-8px) scale(1.1);
              opacity: 0.8;
            }
            50% {
              transform: translateY(-4px) scale(1.05);
              opacity: 1;
            }
            75% {
              transform: translateY(-2px) scale(1.02);
              opacity: 0.9;
            }
          }
          
          /* Side accent ultra growth animation */
          @keyframes accent-ultra-grow {
            0% {
              height: 0;
              opacity: 0;
              transform: translateY(-50%) scaleY(0);
              box-shadow: none;
            }
            50% {
              opacity: 0.8;
              transform: translateY(-50%) scaleY(0.8);
              box-shadow: 0 0 10px currentColor;
            }
            100% {
              height: 3rem;
              opacity: 1;
              transform: translateY(-50%) scaleY(1);
              box-shadow: 0 0 20px currentColor;
            }
          }
          
          /* Ultra border glow animation */
          @keyframes border-ultra-glow {
            0%, 100% {
              opacity: 0;
              transform: scale(1);
              box-shadow: none;
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
              box-shadow: 0 0 30px currentColor, inset 0 0 15px currentColor;
            }
          }
          
          /* Ultra glass effect animation */
          @keyframes glass-ultra-effect {
            0% {
              backdrop-filter: blur(5px);
              background: rgba(255, 255, 255, 0.1);
            }
            50% {
              backdrop-filter: blur(25px);
              background: rgba(255, 255, 255, 0.3);
            }
            100% {
              backdrop-filter: blur(20px);
              background: rgba(255, 255, 255, 0.25);
            }
          }
          
          .animate-shimmer {
            animation: shimmer 2.5s ease-in-out;
          }
          
          .animate-enhanced-pulse {
            animation: enhanced-pulse 2.5s ease-in-out infinite;
          }
          
          .animate-float-glow {
            animation: float-glow 4s ease-in-out infinite;
          }
          
          .animate-gradient-flow {
            background-size: 300% 300%;
            animation: gradient-flow 5s ease infinite;
          }
          
          .animate-enhanced-ping {
            animation: enhanced-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          
          .animate-enhanced-bounce {
            animation: enhanced-bounce 1s ease-in-out infinite;
          }
          
          .animate-accent-ultra-grow {
            animation: accent-ultra-grow 0.7s ease-out forwards;
          }
          
          .animate-border-ultra-glow {
            animation: border-ultra-glow 3s ease-in-out infinite;
          }
          
          .animate-glass-ultra-effect {
            animation: glass-ultra-effect 2s ease-in-out infinite;
          }
          
          /* Ultra enhanced glass morphism effects */
          .ultra-glass-effect {
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 
              0 8px 32px rgba(31, 38, 135, 0.37),
              inset 0 0 0 1px rgba(255, 255, 255, 0.1);
          }
          
          .dark .ultra-glass-effect {
            background: rgba(17, 24, 39, 0.9);
            border: 2px solid rgba(75, 85, 99, 0.4);
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.5),
              inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          }
          
          /* Company logo ultra enhanced hover effects */
          .company-logo-ultra-hover:hover {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.2) 25%, rgba(147, 51, 234, 0.2) 50%, rgba(99, 102, 241, 0.2) 75%, rgba(59, 130, 246, 0.2) 100%);
            backdrop-filter: blur(30px);
            box-shadow: 
              0 20px 40px -10px rgba(59, 130, 246, 0.4),
              0 10px 20px -5px rgba(59, 130, 246, 0.2),
              0 0 0 2px rgba(59, 130, 246, 0.2),
              inset 0 0 20px rgba(255, 255, 255, 0.1);
            transform: translateY(-5px) scale(1.1) rotateX(5deg) rotateY(2deg);
          }
          
          .dark .company-logo-ultra-hover:hover {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(59, 130, 246, 0.25) 25%, rgba(147, 51, 234, 0.25) 50%, rgba(99, 102, 241, 0.25) 75%, rgba(59, 130, 246, 0.25) 100%);
            box-shadow: 
              0 20px 40px -10px rgba(99, 102, 241, 0.6),
              0 10px 20px -5px rgba(59, 130, 246, 0.4),
              0 0 0 2px rgba(99, 102, 241, 0.3),
              inset 0 0 20px rgba(255, 255, 255, 0.05);
          }
          
          /* Ultra enhanced focus states */
          .company-logo-ultra-button:focus {
            box-shadow: 
              0 0 0 4px rgba(99, 102, 241, 0.6),
              0 0 40px rgba(99, 102, 241, 0.4),
              0 15px 30px -5px rgba(0, 0, 0, 0.2),
              inset 0 0 20px rgba(255, 255, 255, 0.1);
            transform: translateY(-3px) scale(1.05);
            backdrop-filter: blur(25px);
          }
          
          /* Ultra gradient text animation */
          @keyframes text-ultra-gradient-shift {
            0%, 100% {
              background-position: 0% 50%;
            }
            25% {
              background-position: 100% 25%;
            }
            50% {
              background-position: 200% 50%;
            }
            75% {
              background-position: 100% 75%;
            }
          }
          
          .ultra-gradient-text {
            background-size: 300% 300%;
            animation: text-ultra-gradient-shift 5s ease-in-out infinite;
          }
          
          /* Ultra enhanced pulse glow effect */
          @keyframes pulse-ultra-glow {
            0%, 100% {
              box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
            }
            33% {
              box-shadow: 
                0 0 40px rgba(99, 102, 241, 0.8), 
                0 0 50px rgba(59, 130, 246, 0.6),
                0 0 60px rgba(147, 51, 234, 0.4);
            }
            66% {
              box-shadow: 
                0 0 50px rgba(147, 51, 234, 0.8), 
                0 0 60px rgba(99, 102, 241, 0.6),
                0 0 70px rgba(59, 130, 246, 0.4);
            }
          }
          
          .company-logo-ultra-button:hover {
            animation: pulse-ultra-glow 4s ease-in-out infinite;
          }
          
          /* Ultra enhanced underline animation */
          @keyframes underline-ultra-expand {
            0% {
              transform: scaleX(0);
              transform-origin: left;
              box-shadow: none;
            }
            25% {
              transform: scaleX(0.3);
              transform-origin: left;
              box-shadow: 0 0 10px currentColor;
            }
            50% {
              transform: scaleX(1);
              transform-origin: left;
              box-shadow: 0 0 20px currentColor;
            }
            51% {
              transform: scaleX(1);
              transform-origin: right;
              box-shadow: 0 0 20px currentColor;
            }
            75% {
              transform: scaleX(0.7);
              transform-origin: right;
              box-shadow: 0 0 15px currentColor;
            }
            100% {
              transform: scaleX(0);
              transform-origin: right;
              box-shadow: none;
            }
          }
          
          /* Ultra 3D transform effects */
          .company-logo-ultra-button:hover {
            transform: translateY(-5px) translateZ(20px) rotateX(8deg) rotateY(4deg) scale(1.1);
            transform-style: preserve-3d;
            perspective: 1000px;
          }
          
          /* Mobile ultra responsive enhancements */
          @media (max-width: 768px) {
            .company-logo-ultra-button:hover {
              transform: translateY(-3px) scale(1.05) rotateX(3deg);
            }
            
            .animate-shimmer {
              animation-duration: 2s;
            }
            
            .company-logo-ultra-button:focus {
              box-shadow: 
                0 0 0 3px rgba(99, 102, 241, 0.5),
                0 0 30px rgba(99, 102, 241, 0.3);
            }
          }
          
          /* Ultra performance optimizations */
          .company-logo-ultra-button {
            will-change: transform, box-shadow, backdrop-filter, opacity;
            transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000px;
          }
          
          /* Ultra progressive enhancement for modern browsers */
          @supports (backdrop-filter: blur(30px)) {
            .ultra-glass-effect {
              backdrop-filter: blur(30px);
            }
          }
          
          @supports not (backdrop-filter: blur(30px)) {
            .ultra-glass-effect {
              background: rgba(255, 255, 255, 0.98);
            }
            
            .dark .ultra-glass-effect {
              background: rgba(17, 24, 39, 0.98);
            }
          }
          
          /* Ultra accessibility enhancements */
          @media (prefers-reduced-motion: reduce) {
            .company-logo-ultra-button {
              transition-duration: 0.2s;
            }
            
            .animate-shimmer,
            .animate-enhanced-pulse,
            .animate-float-glow,
            .animate-gradient-flow,
            .animate-enhanced-ping,
            .animate-enhanced-bounce,
            .ultra-gradient-text {
              animation: none;
            }
            
            .company-logo-ultra-button:hover {
              animation: none;
              transform: translateY(-2px) scale(1.02);
            }
          }
          
          /* Ultra high contrast mode support */
          @media (prefers-contrast: high) {
            .company-logo-ultra-button {
              border: 3px solid currentColor;
              background: rgba(255, 255, 255, 1);
            }
            
            .dark .company-logo-ultra-button {
              background: rgba(0, 0, 0, 1);
              border: 3px solid rgba(255, 255, 255, 0.8);
            }
            
            .ultra-glass-effect {
              background: rgba(255, 255, 255, 1);
              border: 3px solid rgba(0, 0, 0, 0.3);
            }
            
            .dark .ultra-glass-effect {
              background: rgba(0, 0, 0, 1);
              border: 3px solid rgba(255, 255, 255, 0.3);
            }
          }
          
          /* Ultra dark mode specific enhancements */
          .dark .company-logo-ultra-button:hover {
            box-shadow: 
              0 0 50px rgba(99, 102, 241, 0.6), 
              0 0 60px rgba(59, 130, 246, 0.5),
              0 15px 40px -10px rgba(0, 0, 0, 0.5),
              inset 0 0 25px rgba(255, 255, 255, 0.05);
          }
          
          /* Ultra glow particles effect */
          @keyframes ultra-particles {
            0% {
              opacity: 0;
              transform: translate(0, 0) scale(0);
            }
            50% {
              opacity: 1;
              transform: translate(var(--x, 0), var(--y, 0)) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(calc(var(--x, 0) * 2), calc(var(--y, 0) * 2)) scale(0);
            }
          }
          
          .animate-ultra-particles {
            animation: ultra-particles 3s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
};

export default Layout;
