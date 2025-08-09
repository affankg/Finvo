import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { clientsAPI, servicesAPI, quotationsAPI, invoicesAPI, financialAPI } from '../services/api';

// Search result types
interface SearchResult {
  id: number;
  title: string;
  subtitle: string;
  type: 'client' | 'service' | 'quotation' | 'invoice' | 'expense';
  route: string;
  icon: string;
}

interface GlobalSearchProps {
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      
      // Escape to close
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search function
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) return;

    setLoading(true);
    setIsOpen(true);
    
    try {
      const searchResults: SearchResult[] = [];

      // Search in parallel for better performance
      const [clientsRes, servicesRes, quotationsRes, invoicesRes, financialRes] = await Promise.allSettled([
        clientsAPI.getAll(searchQuery),
        servicesAPI.getAll(searchQuery),
        quotationsAPI.getAll(searchQuery),
        invoicesAPI.getAll(searchQuery),
        financialAPI.getActivities({ search: searchQuery })
      ]);

      // Process clients
      if (clientsRes.status === 'fulfilled' && clientsRes.value.data.results) {
        clientsRes.value.data.results.slice(0, 5).forEach((client: any) => {
          searchResults.push({
            id: client.id,
            title: client.name,
            subtitle: `${client.email || 'No email'} • ${client.phone || 'No phone'}`,
            type: 'client',
            route: `/clients/${client.id}`,
            icon: '👤'
          });
        });
      }

      // Process services
      if (servicesRes.status === 'fulfilled' && servicesRes.value.data.results) {
        servicesRes.value.data.results.slice(0, 5).forEach((service: any) => {
          searchResults.push({
            id: service.id,
            title: service.name,
            subtitle: `${service.description || 'No description'} • $${service.price || 0}`,
            type: 'service',
            route: `/services/${service.id}`,
            icon: '⚙️'
          });
        });
      }

      // Process quotations
      if (quotationsRes.status === 'fulfilled' && quotationsRes.value.data.results) {
        quotationsRes.value.data.results.slice(0, 5).forEach((quotation: any) => {
          searchResults.push({
            id: quotation.id,
            title: `Quotation #${quotation.number}`,
            subtitle: `${quotation.client_name} • ${quotation.formatted_total || quotation.total_amount}`,
            type: 'quotation',
            route: `/quotations/${quotation.id}`,
            icon: '📄'
          });
        });
      }

      // Process invoices
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data.results) {
        invoicesRes.value.data.results.slice(0, 5).forEach((invoice: any) => {
          searchResults.push({
            id: invoice.id,
            title: `Invoice #${invoice.number}`,
            subtitle: `${invoice.client_name} • ${invoice.formatted_total || invoice.total_amount}`,
            type: 'invoice',
            route: `/invoices/${invoice.id}`,
            icon: '🧾'
          });
        });
      }

      // Process financial activities (expenses)
      if (financialRes.status === 'fulfilled' && financialRes.value.data.results) {
        financialRes.value.data.results.slice(0, 5).forEach((activity: any) => {
          searchResults.push({
            id: activity.id,
            title: activity.description || 'Financial Activity',
            subtitle: `${activity.type} • ${activity.amount}`,
            type: 'expense',
            route: `/financial/activities/${activity.id}`,
            icon: '💰'
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.route);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client': return 'text-blue-600 bg-blue-100';
      case 'service': return 'text-green-600 bg-green-100';
      case 'quotation': return 'text-purple-600 bg-purple-100';
      case 'invoice': return 'text-orange-600 bg-orange-100';
      case 'expense': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`} key="global-search-v3">
      {/* Enhanced Modern Search Input */}
      <div className="relative group">
        {/* Enhanced glass morphism background with multiple layers */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/40 to-white/60 dark:from-gray-800/80 dark:via-gray-900/60 dark:to-gray-800/80 rounded-2xl backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-lg"></div>
        
        {/* Dynamic focus glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500 blur-xl scale-110"></div>
        
        {/* Enhanced animated border on focus */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-purple-500/30 opacity-0 group-focus-within:opacity-100 transition-all duration-300 blur-sm"></div>
        
        {/* Search icon with enhanced animations */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
          <div className="relative">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-all duration-300 group-focus-within:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {/* Animated pulse ring on focus */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 opacity-0 group-focus-within:opacity-100 group-focus-within:animate-ping"></div>
          </div>
        </div>
        
        {/* Enhanced input field with better visibility */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder="Search clients, invoices, quotations..."
          className="relative z-20 w-full pl-14 pr-6 py-3.5 bg-transparent border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm font-medium focus:outline-none transition-all duration-300 hover:placeholder-gray-600 dark:hover:placeholder-gray-300"
        />

        {/* Enhanced loading indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center z-20">
            <div className="relative">
              <div className="w-4 h-4 border-2 border-gray-300/30 border-t-blue-600 dark:border-gray-600/30 dark:border-t-blue-400 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-4 h-4 border-2 border-transparent border-t-indigo-500/50 rounded-full animate-spin animate-reverse"></div>
            </div>
          </div>
        )}

        {/* Enhanced shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer rounded-2xl"></div>
        
        {/* Enhanced focus indicator with gradient animation */}
        <div className="absolute bottom-0 left-1/2 w-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 group-focus-within:w-full group-focus-within:left-0 transition-all duration-500 rounded-full shadow-lg shadow-blue-500/30"></div>
      </div>

      {/* Enhanced Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 glass-effect rounded-2xl shadow-2xl z-50 max-h-80 overflow-hidden enhanced-focus animate-float-glow">
          {/* Enhanced glass morphism layers */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/40 dark:from-gray-900/60 dark:via-gray-900/40 dark:to-gray-900/60 rounded-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl"></div>
          
          <div className="relative z-10 p-3">
            {/* Enhanced header with gradient */}
            <div className="flex items-center justify-between px-4 py-2.5 mb-2 bg-gradient-to-r from-gray-50/80 to-gray-100/60 dark:from-gray-800/60 dark:to-gray-700/40 rounded-xl border border-gray-200/30 dark:border-gray-600/30">
              <span className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </span>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <kbd className="px-2 py-1 bg-white/60 dark:bg-gray-800/60 rounded border border-gray-300/30 dark:border-gray-600/30 font-mono">↵</kbd>
                <span>to select</span>
              </div>
            </div>
            
            {/* Enhanced results list with better styling */}
            <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="group result-item flex items-center p-3.5 rounded-xl hover:shadow-md cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Enhanced icon with glow effect */}
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-white/80 to-gray-100/60 dark:from-gray-800/80 dark:to-gray-700/60 group-hover:from-blue-50 dark:group-hover:from-blue-900/30 group-hover:to-blue-100/60 dark:group-hover:to-blue-800/30 transition-all duration-200 border border-gray-200/40 dark:border-gray-600/40 group-hover:border-blue-300/50 dark:group-hover:border-blue-600/50 group-hover:shadow-lg group-hover:scale-105">
                    <span className="text-base group-hover:scale-110 transition-transform duration-200">{result.icon}</span>
                  </div>
                  
                  {/* Enhanced content */}
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-200">
                        {result.title}
                      </p>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all duration-200 ${getTypeColor(result.type)} group-hover:scale-105 group-hover:shadow-sm`}>
                        {result.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200">
                      {result.subtitle}
                    </p>
                  </div>
                  
                  {/* Enhanced arrow with animation */}
                  <div className="flex-shrink-0 ml-3 p-2 rounded-lg bg-gray-100/60 dark:bg-gray-700/60 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-all duration-200 group-hover:scale-110">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced No Results State */}
      {isOpen && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 glass-effect rounded-2xl shadow-2xl z-50 enhanced-focus">
          {/* Enhanced glass morphism layers */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/40 dark:from-gray-900/60 dark:via-gray-900/40 dark:to-gray-900/60 rounded-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-red-500/5 rounded-2xl"></div>
          
          <div className="relative z-10 p-8 text-center">
            {/* Enhanced empty state icon with glow */}
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100/80 to-red-100/60 dark:from-orange-900/40 dark:to-red-900/30 border border-orange-200/50 dark:border-orange-700/30 shadow-lg animate-float-glow">
              <svg className="w-7 h-7 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            {/* Enhanced text with gradient */}
            <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent mb-2">
              No results found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              No matches for "<span className="font-semibold text-gray-800 dark:text-gray-200">{query}</span>"
            </p>
            
            {/* Enhanced suggestions */}
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/15 rounded-xl p-4 border border-blue-200/30 dark:border-blue-700/20">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">
                💡 Try searching for:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Clients', 'Invoices', 'Quotations', 'Services', 'Expenses'].map((item) => (
                  <span key={item} className="px-2.5 py-1 bg-blue-100/60 dark:bg-blue-800/30 text-xs font-medium text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200/40 dark:border-blue-600/30">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced CSS animations and styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Enhanced shimmer animation */
          @keyframes shimmer {
            0% {
              transform: translateX(-100%) skewX(-15deg);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateX(200%) skewX(-15deg);
              opacity: 0;
            }
          }
          
          /* Reverse spin animation for loading */
          @keyframes reverse-spin {
            from {
              transform: rotate(360deg);
            }
            to {
              transform: rotate(0deg);
            }
          }
          
          /* Enhanced pulse animation */
          @keyframes enhanced-pulse {
            0%, 100% {
              opacity: 0;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
          }
          
          /* Floating glow effect */
          @keyframes float-glow {
            0%, 100% {
              transform: translateY(0) scale(1);
              opacity: 0.6;
            }
            50% {
              transform: translateY(-2px) scale(1.05);
              opacity: 1;
            }
          }
          
          /* Gradient flow animation */
          @keyframes gradient-flow {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          .animate-shimmer {
            animation: shimmer 2s ease-in-out;
          }
          
          .animate-reverse {
            animation: reverse-spin 1.5s linear infinite;
          }
          
          .animate-enhanced-pulse {
            animation: enhanced-pulse 2s ease-in-out infinite;
          }
          
          .animate-float-glow {
            animation: float-glow 3s ease-in-out infinite;
          }
          
          .animate-gradient-flow {
            background-size: 200% 200%;
            animation: gradient-flow 4s ease infinite;
          }
          
          /* Custom scrollbar for search results */
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            border-radius: 3px;
            transition: background 0.3s ease;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #2563eb, #4f46e5);
          }
          
          .dark .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #60a5fa, #818cf8);
          }
          
          .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #3b82f6, #6366f1);
          }
          
          /* Enhanced glass morphism */
          .glass-effect {
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .dark .glass-effect {
            background: rgba(17, 24, 39, 0.8);
            border: 1px solid rgba(75, 85, 99, 0.3);
          }
          
          /* Enhanced focus states */
          .enhanced-focus:focus-within {
            transform: translateY(-1px);
            box-shadow: 
              0 10px 25px -5px rgba(59, 130, 246, 0.2),
              0 4px 6px -2px rgba(59, 130, 246, 0.1),
              0 0 0 1px rgba(59, 130, 246, 0.1);
          }
          
          /* Result item hover enhancement */
          .result-item:hover {
            transform: translateX(4px);
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(99, 102, 241, 0.05));
          }
          
          .dark .result-item:hover {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1));
          }
        `
      }} />
    </div>
  );
};

export default GlobalSearch;
