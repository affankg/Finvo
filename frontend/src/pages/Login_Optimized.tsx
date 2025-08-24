import React, { useState, useCallback } from 'react';
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

  // Optimize input handlers with useCallback to prevent unnecessary re-renders
  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
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
      {/* Optimized Background - Minimal Performance Impact */}
      <div className="absolute inset-0">
        {/* Simple pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Minimal ambient lighting - only 2 optimized orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-pulse" 
          style={{ animationDuration: '4s' }} 
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl animate-pulse" 
          style={{ animationDelay: '2s', animationDuration: '4s' }} 
        />
        
        {/* Optimized world map - static SVG without heavy animations */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
            {/* Simplified continental outlines */}
            <path
              d="M300 200L800 180L1200 220L1600 200"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M200 400L600 380L1000 420L1400 400L1700 380"
              stroke="rgba(75, 85, 99, 0.3)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M100 600L500 580L900 620L1300 600L1600 580"
              stroke="rgba(55, 65, 81, 0.3)"
              strokeWidth="2"
              fill="none"
            />
            
            {/* Key city markers - simplified */}
            <circle cx="400" cy="300" r="2" fill="rgba(59, 130, 246, 0.6)" />
            <circle cx="800" cy="250" r="2" fill="rgba(59, 130, 246, 0.6)" />
            <circle cx="1200" cy="350" r="2" fill="rgba(59, 130, 246, 0.6)" />
            <circle cx="1500" cy="300" r="2" fill="rgba(59, 130, 246, 0.6)" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-lg mx-auto">
        
        {/* Logo Section - Simplified Animation */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo 
              className="h-16 w-auto transition-transform duration-300 hover:scale-105"
              style={{
                filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.8)) brightness(1.1)',
                maxWidth: '200px'
              }}
            />
          </div>
        </div>

        {/* Login Form - Optimized */}
        <div className="w-full max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username Field - Optimized */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2 pl-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/15 transition-all duration-200 text-base"
                placeholder="Enter your username"
                value={username}
                onChange={handleUsernameChange}
                autoComplete="username"
              />
            </div>

            {/* Password Field - Optimized */}
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
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/15 transition-all duration-200 text-base"
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button - Optimized */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg"
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

          {/* Footer Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Quotation & Invoicing System
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Secure • Professional • Reliable
            </p>
          </div>
        </div>
      </div>

      {/* Minimal CSS animations - Performance optimized */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Only essential animations for better performance */
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: .8;
            }
          }
          
          /* Optimized input focus effects */
          input:focus {
            transition: all 0.2s ease;
          }
          
          /* Optimized button hover effects */
          button:hover {
            transition: all 0.2s ease;
          }
          
          /* Remove expensive filters and complex animations */
          .transition-all {
            transition-property: all;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          /* Optimized scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(75, 85, 99, 0.3);
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
