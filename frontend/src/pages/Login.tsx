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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-950 to-black relative overflow-hidden">
      {/* Enhanced Aesthetic Background with Moving Animations */}
      <div className="absolute inset-0">
        {/* Dynamic Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/8 via-indigo-900/6 to-purple-900/8"></div>
        
        {/* Enhanced Animated Floating Orbs with Stronger Glow */}
        <div 
          className="absolute top-20 left-20 w-80 h-80 bg-blue-500/12 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDuration: '4s',
            animation: 'float 8s ease-in-out infinite, glowPulse 4s ease-in-out infinite',
            boxShadow: '0 0 60px rgba(59, 130, 246, 0.2), 0 0 120px rgba(59, 130, 246, 0.1)'
          }}
        ></div>
        <div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl" 
          style={{ 
            animationDelay: '2s',
            animation: 'floatReverse 10s ease-in-out infinite 2s, glowPulse 5s ease-in-out infinite 2s',
            boxShadow: '0 0 70px rgba(99, 102, 241, 0.18), 0 0 140px rgba(99, 102, 241, 0.09)'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-10 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl" 
          style={{ 
            animationDelay: '3s',
            animation: 'floatSlow 12s ease-in-out infinite 3s, glowPulse 6s ease-in-out infinite 3s',
            boxShadow: '0 0 50px rgba(147, 51, 234, 0.15), 0 0 100px rgba(147, 51, 234, 0.08)'
          }}
        ></div>
        
        {/* Additional Bright Accent Orbs */}
        <div 
          className="absolute top-1/3 right-1/3 w-48 h-48 bg-cyan-400/6 rounded-full blur-2xl" 
          style={{ 
            animationDelay: '1s',
            animation: 'floatGentle 14s ease-in-out infinite 1s, glowPulse 7s ease-in-out infinite 1s',
            boxShadow: '0 0 40px rgba(34, 211, 238, 0.15)'
          }}
        ></div>
        <div 
          className="absolute bottom-1/3 left-1/2 w-56 h-56 bg-violet-500/5 rounded-full blur-2xl" 
          style={{ 
            animationDelay: '4s',
            animation: 'floatReverse 16s ease-in-out infinite 4s, glowPulse 8s ease-in-out infinite 4s',
            boxShadow: '0 0 45px rgba(139, 92, 246, 0.13)'
          }}
        ></div>
        
        {/* Enhanced Moving Glowing Particles */}
        <div className="absolute inset-0">
          {/* Brighter Floating Sparkles */}
          <div 
            className="absolute top-1/4 left-1/3 w-3 h-3 bg-blue-400/35 rounded-full blur-sm"
            style={{ 
              animation: 'sparkle 6s ease-in-out infinite, drift 15s linear infinite',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
            }}
          ></div>
          <div 
            className="absolute top-2/3 right-1/4 w-2 h-2 bg-indigo-400/40 rounded-full blur-sm"
            style={{ 
              animationDelay: '2s',
              animation: 'sparkle 4s ease-in-out infinite 2s, driftReverse 12s linear infinite 2s',
              boxShadow: '0 0 8px rgba(99, 102, 241, 0.35)'
            }}
          ></div>
          <div 
            className="absolute bottom-1/3 left-2/3 w-2.5 h-2.5 bg-purple-400/32 rounded-full blur-sm"
            style={{ 
              animationDelay: '4s',
              animation: 'sparkle 5s ease-in-out infinite 4s, drift 18s linear infinite 4s',
              boxShadow: '0 0 9px rgba(147, 51, 234, 0.3)'
            }}
          ></div>
          <div 
            className="absolute top-1/2 right-1/3 w-2 h-2 bg-cyan-400/38 rounded-full blur-sm"
            style={{ 
              animationDelay: '1s',
              animation: 'sparkle 7s ease-in-out infinite 1s, driftSlow 20s linear infinite 1s',
              boxShadow: '0 0 8px rgba(34, 211, 238, 0.35)'
            }}
          ></div>
          
          {/* Additional Glowing Particles */}
          <div 
            className="absolute top-1/6 right-1/2 w-1.5 h-1.5 bg-pink-400/30 rounded-full blur-sm"
            style={{ 
              animationDelay: '3s',
              animation: 'sparkle 8s ease-in-out infinite 3s, drift 22s linear infinite 3s',
              boxShadow: '0 0 6px rgba(244, 114, 182, 0.25)'
            }}
          ></div>
          <div 
            className="absolute bottom-1/4 right-2/3 w-2 h-2 bg-emerald-400/28 rounded-full blur-sm"
            style={{ 
              animationDelay: '5s',
              animation: 'sparkle 6s ease-in-out infinite 5s, driftReverse 16s linear infinite 5s',
              boxShadow: '0 0 7px rgba(52, 211, 153, 0.25)'
            }}
          ></div>
          
          {/* Enhanced Moving Glow Streams */}
          <div 
            className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"
            style={{ 
              animation: 'streamFlow 8s linear infinite',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)'
            }}
          ></div>
          <div 
            className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-purple-400/18 to-transparent"
            style={{ 
              animationDelay: '4s',
              animation: 'streamFlowReverse 10s linear infinite 4s',
              boxShadow: '0 0 9px rgba(147, 51, 234, 0.2)'
            }}
          ></div>
          
          {/* Vertical Glow Streams */}
          <div 
            className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-transparent via-indigo-400/15 to-transparent"
            style={{ 
              animationDelay: '6s',
              animation: 'streamVertical 12s linear infinite 6s',
              boxShadow: '0 0 8px rgba(99, 102, 241, 0.15)'
            }}
          ></div>
          <div 
            className="absolute right-0 top-0 w-1 h-full bg-gradient-to-t from-transparent via-cyan-400/13 to-transparent"
            style={{ 
              animationDelay: '8s',
              animation: 'streamVerticalReverse 14s linear infinite 8s',
              boxShadow: '0 0 7px rgba(34, 211, 238, 0.15)'
            }}
          ></div>
        </div>
        
        {/* Enhanced Sophisticated Grid Pattern with Glow */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            filter: 'drop-shadow(0 0 1px rgba(59, 130, 246, 0.15))'
          }}
        ></div>
        
        {/* Enhanced Subtle Dot Matrix with Glow */}
        <div 
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.5) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            filter: 'drop-shadow(0 0 1px rgba(99, 102, 241, 0.4))'
          }}
        ></div>
      </div>

      {/* CSS Animations for Moving Background */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-10px) translateX(-15px); }
            75% { transform: translateY(-25px) translateX(5px); }
          }
          
          @keyframes floatReverse {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(15px) translateX(-10px); }
            50% { transform: translateY(25px) translateX(20px); }
            75% { transform: translateY(5px) translateX(-5px); }
          }
          
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-15px) translateX(10px); }
          }
          
          @keyframes floatGentle {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            33% { transform: translateY(-12px) translateX(8px); }
            66% { transform: translateY(8px) translateX(-12px); }
          }
          
          @keyframes glowPulse {
            0%, 100% { 
              opacity: 0.6; 
              transform: scale(1); 
              filter: brightness(1) blur(3xl);
            }
            50% { 
              opacity: 1; 
              transform: scale(1.05); 
              filter: brightness(1.3) blur(3xl);
            }
          }
          
          @keyframes sparkle {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.3); }
          }
          
          @keyframes drift {
            0% { transform: translateX(-20px) translateY(0px); }
            25% { transform: translateX(15px) translateY(-10px); }
            50% { transform: translateX(-10px) translateY(-5px); }
            75% { transform: translateX(20px) translateY(5px); }
            100% { transform: translateX(-20px) translateY(0px); }
          }
          
          @keyframes driftReverse {
            0% { transform: translateX(20px) translateY(0px); }
            25% { transform: translateX(-15px) translateY(10px); }
            50% { transform: translateX(10px) translateY(5px); }
            75% { transform: translateX(-20px) translateY(-5px); }
            100% { transform: translateX(20px) translateY(0px); }
          }
          
          @keyframes driftSlow {
            0% { transform: translateX(0px) translateY(-10px); }
            50% { transform: translateX(15px) translateY(10px); }
            100% { transform: translateX(0px) translateY(-10px); }
          }
          
          @keyframes streamFlow {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
          }
          
          @keyframes streamFlowReverse {
            0% { transform: translateX(100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateX(-100%); opacity: 0; }
          }
          
          @keyframes streamVertical {
            0% { transform: translateY(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
          }
          
          @keyframes streamVerticalReverse {
            0% { transform: translateY(100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(-100%); opacity: 0; }
          }
        `
      }} />

      {/* Main Content Container - Compact Single Page Layout */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        
        {/* Enhanced Compact Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="relative group">
              {/* Enhanced Multi-Layer Glow Effect */}
              <div className="absolute inset-0 -m-6 bg-gradient-to-r from-blue-400/20 via-indigo-500/23 to-purple-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
              <div className="absolute inset-0 -m-4 bg-gradient-to-r from-cyan-400/15 via-blue-500/18 to-indigo-600/15 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute inset-0 -m-2 bg-gradient-to-r from-blue-300/13 via-indigo-400/15 to-purple-400/13 rounded-full blur-lg transition-all duration-500 animate-pulse" style={{ animationDelay: '2s' }}></div>
              
              <Logo 
                variant="login"
                className="relative z-10 transition-all duration-500 group-hover:scale-110 drop-shadow-2xl"
                style={{
                  filter: 'brightness(1.1) contrast(1.1) saturate(1.1) drop-shadow(0 0 10px rgba(59, 130, 246, 0.25))',
                  maxHeight: '90px',
                  width: 'auto'
                }}
              />
            </div>
          </div>
        </div>

        {/* Slim Aesthetic Credential Fields - NO Background Container */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Slim Username Field */}
          <div className="group">
            <label htmlFor="username" className="block text-xs font-medium text-blue-300/80 mb-2 uppercase tracking-wider transition-colors duration-300 group-focus-within:text-blue-400">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-400/10 focus:bg-slate-900/80 transition-all duration-300 hover:border-slate-600/60 hover:bg-slate-900/70 backdrop-blur-sm"
                placeholder="Enter username"
                value={username}
                onChange={handleUsernameChange}
                autoComplete="username"
              />
              {/* Subtle Field Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          </div>

          {/* Slim Password Field */}
          <div className="group">
            <label htmlFor="password" className="block text-xs font-medium text-blue-300/80 mb-2 uppercase tracking-wider transition-colors duration-300 group-focus-within:text-blue-400">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-4 py-3 pr-12 bg-slate-900/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-400/10 focus:bg-slate-900/80 transition-all duration-300 hover:border-slate-600/60 hover:bg-slate-900/70 backdrop-blur-sm"
                placeholder="Enter password"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-blue-400 transition-all duration-300"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
              {/* Subtle Field Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          </div>

          {/* Compact Aesthetic Sign In Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              <div className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span className="font-medium">Sign In</span>
                )}
              </div>
            </button>
          </div>
        </form>
        
        {/* Compact Footer Info */}
        <div className="mt-6 text-center space-y-3">
          <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-pulse"></div>
              <span>Secure</span>
            </div>
            <div className="w-0.5 h-0.5 bg-slate-700 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-500/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <span>Professional</span>
            </div>
            <div className="w-0.5 h-0.5 bg-slate-700 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-purple-500/60 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <span>Reliable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
