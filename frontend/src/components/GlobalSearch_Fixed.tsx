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
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Enhanced Search Input with Modern Design */}
      <div className="relative group">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
        
        {/* Search icon with enhanced styling */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <div className="relative">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-all duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {/* Pulse effect */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-30"></div>
          </div>
        </div>
        
        {/* Enhanced input field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder="Search clients, services, invoices..."
          className="relative z-10 w-full pl-12 pr-12 py-3.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500/60 dark:focus:ring-blue-400/30 dark:focus:border-blue-400/60 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-gray-300/80 dark:hover:border-gray-600/80 hover:shadow-lg"
        />

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center z-10">
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Keyboard shortcut indicator */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 group-hover:opacity-80 transition-opacity duration-300">
          <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-gray-700/80 px-2 py-1 rounded-lg backdrop-blur-sm">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Enhanced Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-2xl z-50 max-h-96 overflow-hidden animate-slideIn">
          {/* Glass morphism effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent dark:from-gray-800/20 dark:via-gray-800/10 rounded-2xl"></div>
          
          <div className="relative z-10 p-3">
            {/* Enhanced header */}
            <div className="flex items-center justify-between px-3 py-2 mb-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/30 dark:border-blue-700/30">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </span>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                ↑↓ navigate • ↵ select
              </div>
            </div>
            
            {/* Enhanced results */}
            <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="group relative flex items-center p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 transform -skew-x-12 group-hover:animate-shimmer rounded-xl"></div>
                  
                  {/* Enhanced icon */}
                  <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md group-hover:shadow-lg">
                    <span className="text-lg group-hover:scale-110 transition-transform duration-300">{result.icon}</span>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm"></div>
                  </div>
                  
                  {/* Enhanced content */}
                  <div className="ml-3 flex-1 min-w-0 relative z-10">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-300">
                        {result.title}
                      </p>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-300 group-hover:scale-110 ${getTypeColor(result.type)}`}>
                        {result.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                      {result.subtitle}
                    </p>
                  </div>
                  
                  {/* Enhanced arrow */}
                  <div className="flex-shrink-0 ml-2 relative z-10">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-2xl z-50 animate-slideIn">
          {/* Glass morphism effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent dark:from-gray-800/20 dark:via-gray-800/10 rounded-2xl"></div>
          
          <div className="relative z-10 p-6 text-center">
            {/* Enhanced empty state icon */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl animate-pulse"></div>
              <svg className="relative z-10 w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            {/* Enhanced text */}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              No results found for <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">"{query}"</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Try searching for clients, services, invoices, or expenses
            </p>
            
            {/* Suggested actions */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                👤 Clients
              </span>
              <span className="inline-flex items-center px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                ⚙️ Services
              </span>
              <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full">
                📄 Quotations
              </span>
              <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium rounded-full">
                🧾 Invoices
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes shimmer {
            0% {
              transform: translateX(-100%) skewX(-12deg);
            }
            100% {
              transform: translateX(200%) skewX(-12deg);
            }
          }
          
          .animate-slideIn {
            animation: slideIn 0.2s ease-out;
          }
          
          .animate-shimmer {
            animation: shimmer 1s ease-in-out;
          }
          
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: rgb(209 213 219);
            border-radius: 0.5rem;
          }
          
          .dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
            background-color: rgb(75 85 99);
            border-radius: 0.5rem;
          }
        `
      }} />
    </div>
  );
};

export default GlobalSearch;
