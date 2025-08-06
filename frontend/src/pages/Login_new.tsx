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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 relative overflow-hidden">
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
        
        {/* World Map Background */}
        <div className="absolute inset-0 opacity-20 sm:opacity-30 lg:opacity-40">
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 1920 1080"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#374151" stopOpacity="0.3"/>
                <stop offset="50%" stopColor="#6B7280" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#374151" stopOpacity="0.3"/>
              </linearGradient>
            </defs>
            
            {/* Map paths */}
            <path
              d="M300 400L500 300L700 350L900 300L1100 400L1300 350L1500 400"
              stroke="#6B7280"
              strokeWidth="1.5"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M200 500L400 450L600 500L800 450L1000 500L1200 450L1400 500L1600 450"
              stroke="#60A5FA"
              strokeWidth="2"
              fill="none"
              opacity="0.8"
            />
            
            {/* City lights */}
            <circle cx="300" cy="400" r="2" fill="#FCD34D" opacity="0.8" className="animate-pulse" />
            <circle cx="500" cy="300" r="1.5" fill="#FCD34D" opacity="0.6" className="animate-pulse" />
            <circle cx="700" cy="350" r="2" fill="#FCD34D" opacity="0.8" className="animate-pulse" />
            <circle cx="900" cy="300" r="1.5" fill="#FCD34D" opacity="0.6" className="animate-pulse" />
            <circle cx="1100" cy="400" r="2" fill="#FCD34D" opacity="0.8" className="animate-pulse" />
          </svg>
        </div>

        {/* Animated Connection Lines */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 1920 1080">
            <defs>
              <linearGradient id="animatedGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
                <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path
              d="M300 400L1300 350"
              stroke="url(#animatedGradient1)"
              strokeWidth="2"
              fill="none"
              className="animate-pulse"
              style={{ filter: 'blur(1px)' }}
            />
          </svg>
        </div>
      </div>

      {/* Main Login Container */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 sm:px-8">
        {/* Premium Login Card */}
        <div className="bg-gray-800/40 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 sm:p-10 shadow-3xl">
          
          {/* Logo Section - Enhanced */}
          <div className="text-center mb-8" style={{ animation: 'fadeIn 1s ease-out' }}>
            <div className="flex justify-center mb-6">
              <Logo 
                variant="login" 
                className="h-24 sm:h-28 md:h-32 w-auto object-contain drop-shadow-2xl filter brightness-110"
                style={{
                  filter: 'drop-shadow(0 8px 32px rgba(0, 0, 0, 0.3)) brightness(1.1)',
                  maxWidth: '280px'
                }}
              />
            </div>
            
            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome Back
              </h1>
              <p className="text-gray-300/80 text-sm sm:text-base">
                Sign in to your BS Engineering account
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className="flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-6" style={{ animation: 'fadeIn 1s ease-out 0.3s both' }}>
              
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600/60 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 focus:bg-gray-800/95 transition-all duration-300 backdrop-blur-xl"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-3 pr-12 bg-gray-800/80 border border-gray-600/60 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 focus:bg-gray-800/95 transition-all duration-300 backdrop-blur-xl"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-200 transition-colors duration-300"
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

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Additional Info */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                BS Engineering - Quotation & Invoicing System
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Secure Business Management Platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
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
          
          .shadow-3xl {
            animation: shadowPulse 4s ease-in-out infinite;
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
