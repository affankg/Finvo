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
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 relative overflow-hidden px-6 py-4">
      {/* Enhanced Background with Aesthetic Appeal */}
      <div className="absolute inset-0">
        {/* Sophisticated dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-25" 
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.08) 2px, transparent 2px),
              radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px, 40px 40px'
          }}
        />
        
        {/* Enhanced ambient lighting with brand colors */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/12 rounded-full blur-3xl animate-pulse" 
          style={{ animationDuration: '4s' }} 
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
          style={{ animationDelay: '2s', animationDuration: '4s' }} 
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl animate-pulse" 
          style={{ animationDelay: '1s', animationDuration: '5s' }} 
        />
      </div>

      {/* Main Content Container - Clean Layout */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        
        {/* Logo Section - Close to Fields */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="relative">
              {/* Enhanced Logo Glow Background */}
              <div className="absolute inset-0 -m-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/25 to-purple-500/20 rounded-full blur-xl animate-pulse opacity-60"></div>
              <div className="absolute inset-0 -m-2 bg-gradient-to-r from-cyan-400/15 via-blue-500/20 to-indigo-600/15 rounded-full blur-lg animate-pulse opacity-80" style={{ animationDelay: '1s' }}></div>
              
              <Logo 
                variant="login"
                className="relative z-10 transition-all duration-300 hover:scale-105 drop-shadow-2xl"
                style={{
                  filter: 'brightness(1.2) contrast(1.1) saturate(1.1)',
                  maxHeight: '100px',
                  width: 'auto'
                }}
              />
            </div>
          </div>
        </div>

        {/* Clean Credential Fields - NO BACKGROUND CONTAINER */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Cool Slim Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white/90 mb-3">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/10 transition-all duration-300 hover:bg-white/8 hover:border-white/30"
                placeholder="Enter your username"
                value={username}
                onChange={handleUsernameChange}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Cool Slim Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-3">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/10 transition-all duration-300 hover:bg-white/8 hover:border-white/30"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
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

          {/* Cool Aesthetic Sign In Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              <div className="relative z-10">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </div>
            </button>
          </div>
        </form>
        
        {/* Enhanced Footer Info */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Secure</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <span>Professional</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <span>Reliable</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Quotation & Invoicing System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
