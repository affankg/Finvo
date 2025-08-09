import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Logo from '../components/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 relative overflow-hidden px-6">
      {/* Enhanced Dark Background */}
      <div className="absolute inset-0">
        {/* Subtle Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        ></div>
        
        {/* Additional glowing orbs for ambient lighting */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse orb-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse orb-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 right-40 w-60 h-60 bg-green-500/6 rounded-full blur-3xl animate-pulse orb-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-40 left-40 w-72 h-72 bg-yellow-500/8 rounded-full blur-3xl animate-pulse orb-float" style={{ animationDelay: '6s' }}></div>
        
        {/* World Map Background - Enhanced Visibility */}
        <div className="absolute inset-0 opacity-35 sm:opacity-45 lg:opacity-55">
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 1920 1080"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#374151" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#6B7280" stopOpacity="1"/>
                <stop offset="100%" stopColor="#374151" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="mapGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1F2937" stopOpacity="0.8"/>
                <stop offset="50%" stopColor="#4B5563" stopOpacity="1"/>
                <stop offset="100%" stopColor="#1F2937" stopOpacity="0.8"/>
              </linearGradient>
              <linearGradient id="blueGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="1"/>
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            
            {/* Enhanced Map paths with better visibility */}
            <path
              d="M50 400L500 300L700 350L900 300L1100 400L1300 350L1500 400L1850 380"
              stroke="url(#mapGradient1)"
              strokeWidth="4"
              fill="none"
              opacity="0.8"
              className="drop-shadow-lg"
            />
            <path
              d="M20 500L400 450L600 500L800 450L1000 500L1200 450L1400 500L1600 450L1880 480"
              stroke="url(#blueGradient1)"
              strokeWidth="5"
              fill="none"
              opacity="0.9"
              className="drop-shadow-lg"
            />
            <path
              d="M0 300L350 250L550 300L750 250L950 300L1150 250L1350 300L1550 250L1920 280"
              stroke="#1E3A8A"
              strokeWidth="3.5"
              fill="none"
              opacity="0.7"
              className="animate-pulse"
            />
            <path
              d="M30 600L300 550L500 600L700 550L900 600L1100 550L1300 600L1500 550L1700 600L1890 580"
              stroke="#1F2937"
              strokeWidth="3.5"
              fill="none"
              opacity="0.6"
              className="animate-pulse"
              style={{ animationDelay: '1s' }}
            />
            <path
              d="M0 700L450 650L650 700L850 650L1050 700L1250 650L1450 700L1920 680"
              stroke="#374151"
              strokeWidth="3"
              fill="none"
              opacity="0.5"
              className="animate-pulse"
              style={{ animationDelay: '2s' }}
            />
            
            {/* Enhanced City lights with glow effect */}
            <circle cx="300" cy="400" r="3" fill="#3B82F6" opacity="0.9" className="animate-pulse drop-shadow-lg" />
            <circle cx="500" cy="300" r="2.5" fill="#60A5FA" opacity="0.7" className="animate-pulse drop-shadow-lg" />
            <circle cx="700" cy="350" r="3" fill="#1E40AF" opacity="0.9" className="animate-pulse drop-shadow-lg" />
            <circle cx="900" cy="300" r="2.5" fill="#3B82F6" opacity="0.7" className="animate-pulse drop-shadow-lg" />
            <circle cx="1100" cy="400" r="3" fill="#60A5FA" opacity="0.9" className="animate-pulse drop-shadow-lg" />
            <circle cx="1300" cy="350" r="2.5" fill="#1E3A8A" opacity="0.8" className="animate-pulse drop-shadow-lg" />
            <circle cx="400" cy="450" r="2" fill="#4B5563" opacity="0.7" className="animate-pulse drop-shadow-lg" />
            <circle cx="600" cy="500" r="2.5" fill="#6B7280" opacity="0.6" className="animate-pulse drop-shadow-lg" />
            <circle cx="800" cy="450" r="2" fill="#374151" opacity="0.8" className="animate-pulse drop-shadow-lg" />
            
            {/* Additional connection nodes */}
            <circle cx="200" cy="500" r="1.5" fill="#1E40AF" opacity="0.6" className="animate-pulse" />
            <circle cx="1000" cy="500" r="1.5" fill="#3B82F6" opacity="0.6" className="animate-pulse" />
            <circle cx="1400" cy="500" r="1.5" fill="#60A5FA" opacity="0.6" className="animate-pulse" />
          </svg>
        </div>

        {/* Enhanced Animated Connection Lines */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 1920 1080">
            <defs>
              <linearGradient id="animatedGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="animatedGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1F2937" stopOpacity="0" />
                <stop offset="50%" stopColor="#4B5563" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1F2937" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="animatedGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#374151" stopOpacity="0" />
                <stop offset="50%" stopColor="#6B7280" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#374151" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="animatedGradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E40AF" stopOpacity="0" />
                <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="animatedGradient5" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#111827" stopOpacity="0" />
                <stop offset="50%" stopColor="#374151" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#111827" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Primary animated lines - Stretched wider with enhanced glow */}
            <path
              d="M0 400L1920 350"
              stroke="url(#animatedGradient1)"
              strokeWidth="6"
              fill="none"
              className="animate-pulse drop-shadow-lg animate-super-glow"
              style={{ filter: 'blur(2px) drop-shadow(0 0 20px rgba(30, 58, 138, 0.8))' }}
            />
            <path
              d="M0 300L1920 380"
              stroke="url(#animatedGradient2)"
              strokeWidth="5"
              fill="none"
              className="animate-pulse drop-shadow-lg animate-line-glow"
              style={{ 
                filter: 'blur(1.5px) drop-shadow(0 0 16px rgba(31, 41, 55, 0.7))', 
                animationDelay: '1s' 
              }}
            />
            <path
              d="M0 500L1920 450"
              stroke="url(#animatedGradient3)"
              strokeWidth="5"
              fill="none"
              className="animate-pulse drop-shadow-lg animate-line-glow"
              style={{ 
                filter: 'blur(1.5px) drop-shadow(0 0 16px rgba(55, 65, 81, 0.6))', 
                animationDelay: '2s' 
              }}
            />
            <path
              d="M0 200L1920 250"
              stroke="url(#animatedGradient4)"
              strokeWidth="4"
              fill="none"
              className="animate-pulse drop-shadow-lg glow-pulse"
              style={{ 
                filter: 'blur(1.5px) drop-shadow(0 0 14px rgba(30, 58, 138, 0.5))', 
                animationDelay: '3s' 
              }}
            />
            <path
              d="M0 600L1920 550"
              stroke="url(#animatedGradient5)"
              strokeWidth="4"
              fill="none"
              className="animate-pulse drop-shadow-lg glow-pulse"
              style={{ 
                filter: 'blur(1.5px) drop-shadow(0 0 14px rgba(31, 41, 55, 0.4))', 
                animationDelay: '4s' 
              }}
            />
            
            {/* Diagonal crossing lines - Full width with enhanced glow */}
            <path
              d="M0 150L1920 750"
              stroke="url(#animatedGradient1)"
              strokeWidth="3"
              fill="none"
              className="animate-pulse"
              style={{ 
                filter: 'blur(2px) drop-shadow(0 0 12px rgba(30, 58, 138, 0.5))', 
                animationDelay: '2.5s',
                opacity: 0.4
              }}
            />
            <path
              d="M1920 150L0 750"
              stroke="url(#animatedGradient2)"
              strokeWidth="3"
              fill="none"
              className="animate-pulse"
              style={{ 
                filter: 'blur(2px) drop-shadow(0 0 12px rgba(31, 41, 55, 0.4))', 
                animationDelay: '3.5s',
                opacity: 0.3
              }}
            />
            <path
              d="M0 0L1920 540"
              stroke="url(#animatedGradient3)"
              strokeWidth="2.5"
              fill="none"
              className="animate-pulse"
              style={{ 
                filter: 'blur(1.5px) drop-shadow(0 0 10px rgba(55, 65, 81, 0.3))', 
                animationDelay: '4.5s',
                opacity: 0.25
              }}
            />
            <path
              d="M1920 0L0 540"
              stroke="url(#animatedGradient4)"
              strokeWidth="2.5"
              fill="none"
              className="animate-pulse"
              style={{ 
                filter: 'blur(1.5px) drop-shadow(0 0 10px rgba(30, 58, 138, 0.3))', 
                animationDelay: '5.5s',
                opacity: 0.25
              }}
            />
          </svg>
        </div>
      </div>

      {/* Main Content - Optimized Layout */}
      <div className="relative z-10 w-full max-w-lg mx-auto">
        
        {/* LOGO SECTION - Close to Credentials */}
        <div className="text-center mb-4" style={{ animation: 'logoFadeIn 1.2s ease-out' }}>
          <div className="flex justify-center relative">
            {/* Dark backdrop/glow behind logo */}
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-72 h-72 bg-gray-900/80 rounded-full blur-3xl opacity-90"></div>
              <div className="absolute w-60 h-60 bg-slate-800/70 rounded-full blur-2xl opacity-85"></div>
              <div className="absolute w-48 h-48 bg-gray-800/60 rounded-full blur-xl opacity-80"></div>
            </div>
            {/* Logo with enhanced visibility */}
            <Logo 
              variant="login" 
              className="h-48 sm:h-52 md:h-56 lg:h-60 w-auto object-contain drop-shadow-2xl filter brightness-125 contrast-110 relative z-10"
              style={{
                filter: 'drop-shadow(0 12px 40px rgba(0, 0, 0, 0.8)) drop-shadow(0 4px 16px rgba(59, 130, 246, 0.3)) drop-shadow(0 0 30px rgba(0, 0, 0, 0.9)) brightness(1.25) contrast(1.1)',
                maxWidth: '500px'
              }}
            />
          </div>
        </div>

        {/* CREDENTIALS SECTION - Close to Logo */}
        <div className="w-full max-w-md mx-auto" style={{ animation: 'formFadeIn 1.2s ease-out 0.4s both' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Field - Compact */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2 pl-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/80 focus:border-blue-400/80 focus:bg-white/15 transition-all duration-300 text-base"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Password Field - Compact */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 pl-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-6 py-2.5 pr-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/80 focus:border-blue-400/80 focus:bg-white/15 transition-all duration-300 text-base"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors duration-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button - Compact */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Footer Info - Compact */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400/80">
              Quotation & Invoicing System
            </p>
            <p className="text-xs text-gray-500/80 mt-1">
              Secure • Professional • Reliable
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes logoFadeIn {
            0% {
              opacity: 0;
              transform: translateY(-30px) scale(0.8);
            }
            60% {
              opacity: 0.8;
              transform: translateY(-10px) scale(1.05);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes formFadeIn {
            0% {
              opacity: 0;
              transform: translateY(30px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes shadowPulse {
            0%, 100% {
              box-shadow: 
                0 25px 50px -12px rgba(0, 0, 0, 0.8),
                0 10px 20px -5px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            }
            50% {
              box-shadow: 
                0 35px 60px -12px rgba(0, 0, 0, 0.9),
                0 15px 25px -5px rgba(0, 0, 0, 0.7),
                0 0 0 1px rgba(255, 255, 255, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
            }
          }
          
          @keyframes glowPulse {
            0%, 100% {
              filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.3));
            }
            50% {
              filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 25px rgba(59, 130, 246, 0.4));
            }
          }
          /* Enhanced Map Line Animations */
          @keyframes lineGlow {
            0%, 100% {
              filter: blur(2px) drop-shadow(0 0 8px currentColor);
            }
            50% {
              filter: blur(1px) drop-shadow(0 0 25px currentColor) drop-shadow(0 0 35px currentColor);
            }
          }
          
          @keyframes superGlow {
            0%, 100% {
              filter: blur(2px) drop-shadow(0 0 15px rgba(30, 58, 138, 0.6));
            }
            50% {
              filter: blur(1px) drop-shadow(0 0 30px rgba(30, 58, 138, 0.9)) drop-shadow(0 0 45px rgba(59, 130, 246, 0.7));
            }
          }
          
          .animate-line-glow {
            animation: lineGlow 4s ease-in-out infinite;
          }
          
          .animate-super-glow {
            animation: superGlow 3s ease-in-out infinite;
          }shadow-3xl {
            animation: shadowPulse 4s ease-in-out infinite;
          }
          
          .glow-pulse {
            animation: glowPulse 3s ease-in-out infinite;
          }
          
          .orb-float {
            animation: orbFloat 6s ease-in-out infinite;
          }
          
          /* Enhanced Map Line Animations */
          @keyframes lineGlow {
            0%, 100% {
              filter: blur(1px) drop-shadow(0 0 3px currentColor);
            }
            50% {
              filter: blur(0.5px) drop-shadow(0 0 8px currentColor) drop-shadow(0 0 12px currentColor);
            }
          }
          
          .animate-line-glow {
            animation: lineGlow 4s ease-in-out infinite;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(75, 85, 99, 0.3);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.5);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.7);
          }
        `
      }} />
    </div>
  );
};

export default Login;
