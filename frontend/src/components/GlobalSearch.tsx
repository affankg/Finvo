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
            subtitle: `${client.company} • ${client.email}`,
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
            subtitle: service.description,
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
            title: `Quote #${quotation.number}`,
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
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search clients, services, invoices..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 text-sm shadow-sm hover:shadow-md focus:shadow-lg"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 mb-2 border-b border-gray-200 dark:border-gray-700">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </div>
            {results.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600 group-hover:scale-105 transition-transform">
                  <span className="text-sm">{result.icon}</span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(result.type)}`}>
                      {result.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {result.subtitle}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4 text-center">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Try searching for clients, services, invoices, or expenses
            </p>
          </div>
        </div>
      )}

      {/* Removed search hint as requested - no more "Press Ctrl+K to search" text */}
    </div>
  );
};

export default GlobalSearch;
