import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import { BarChart, PieChart } from '../components/Charts';
import { formatCurrency, DEFAULT_CURRENCY } from '../utils/currency';

// Modern SVG Icons for better aesthetics
const ModernIcons = {
  Quote: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Invoice: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  ),
  Money: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  TrendUp: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  TrendDown: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Filter: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Building: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Wallet: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Receipt: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  CreditCard: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Warning: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Star: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Lightning: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M13 2L4.09 12.97 9 14l-1 6 8.91-10.97L12 8l1-6z" />
    </svg>
  ),
};

interface EnhancedDashboardStats {
  monthly_quotations_trend?: number;
  monthly_invoices_trend?: number;
  revenue_trend?: number;
  profit_margin?: number;
  top_clients?: Array<{ name: string; total: number }>;
  expense_categories?: Array<{ name: string; total: number }>;
  upcoming_due?: number;
  cash_flow_data?: Array<{ month: string; income: number; expenses: number }>;
  pending_quotations?: number;
  overdue_invoices?: number;
  total_revenue?: number;
  total_amount?: number;
  total_clients?: number;
  total_expenses?: number;
  total_profit?: number;
  pending_payments?: number;
  overdue_payments?: number;
  total_quotations?: number;
  total_invoices?: number;
  paid_invoices?: number;
  monthly_quotations?: number;
}

const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTimeFilter, setActiveTimeFilter] = useState('month');

  useEffect(() => {
    fetchDashboardData();
  }, [activeTimeFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      
      // Enhance the stats with calculated insights
      const enhancedStats: EnhancedDashboardStats = {
        ...response.data.stats,
        monthly_quotations_trend: 12.5, // Mock data - would come from backend
        monthly_invoices_trend: 8.3,
        revenue_trend: 15.2,
        profit_margin: 24.5,
        top_clients: [
          { name: 'Acme Corp', total: 125000 },
          { name: 'Tech Solutions', total: 98000 },
          { name: 'Global Industries', total: 67000 }
        ],
        expense_categories: [
          { name: 'Materials', total: 45000 },
          { name: 'Labor', total: 32000 },
          { name: 'Equipment', total: 18000 },
          { name: 'Transport', total: 12000 }
        ],
        upcoming_due: 3,
        cash_flow_data: [
          { month: 'Jan', income: 150000, expenses: 120000 },
          { month: 'Feb', income: 180000, expenses: 135000 },
          { month: 'Mar', income: 165000, expenses: 128000 },
          { month: 'Apr', income: 195000, expenses: 142000 },
          { month: 'May', income: 210000, expenses: 155000 },
          { month: 'Jun', income: 225000, expenses: 168000 }
        ]
      };
      
      setStats(enhancedStats);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeFilters = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' }
  ];

  const quickActions = [
    {
      label: 'New Quotation',
      icon: <ModernIcons.Quote />,
      action: () => window.location.href = '/quotations',
      color: 'blue' as const,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'New Invoice',
      icon: <ModernIcons.Invoice />,
      action: () => window.location.href = '/invoices',
      color: 'green' as const,
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      label: 'Add Expense',
      icon: <ModernIcons.Money />,
      action: () => window.location.href = '/financial-activities',
      color: 'purple' as const,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Export Report',
      icon: <ModernIcons.Download />,
      action: () => toast.success('Export feature coming soon!'),
      color: 'indigo' as const,
      gradient: 'from-indigo-500 to-blue-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
        <div className="animate-pulse">
          {/* Modern Loading Header */}
          <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border-b border-white/20 dark:border-gray-700/50 p-6 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-1/3 mb-3"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-1/2"></div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Quick Actions Loading */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-800/60 dark:to-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl"></div>
              ))}
            </div>
            
            {/* Stats Cards Loading */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-800/60 dark:to-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl"></div>
              ))}
            </div>
            
            {/* Charts Loading */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-80 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-800/60 dark:to-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400/10 to-violet-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Glassmorphic Header */}
      <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 shadow-xl border-b border-white/20 dark:border-gray-700/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                  Welcome back, {user?.first_name || user?.username}!
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                Here's your business insights for today ✨
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <ModernIcons.Calendar />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ModernIcons.Clock />
                  <span>Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Modern Time Filter */}
              <div className="flex rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 overflow-hidden shadow-lg">
                {timeFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveTimeFilter(filter.value)}
                    className={`px-6 py-3 text-sm font-semibold transition-all duration-300 relative ${
                      activeTimeFilter === filter.value
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {activeTimeFilter === filter.value && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl transform transition-all duration-300"></div>
                    )}
                    <span className="relative z-10 flex items-center space-x-2">
                      <ModernIcons.Filter />
                      <span>{filter.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Enhanced Quick Actions with Glassmorphism */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Quick Actions ⚡
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <ModernIcons.Lightning />
              <span>Get things done faster</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={action.action}
                className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative p-6 text-center">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                    {action.label}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modern Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Quotations */}
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                  <ModernIcons.Quote />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.total_quotations || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Quotations</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{stats?.pending_quotations || 0} pending approval</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs">
                  <ModernIcons.TrendUp />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    +{stats?.monthly_quotations_trend || 0}%
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                  <ModernIcons.Invoice />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.total_invoices || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Active Invoices</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{stats?.paid_invoices || 0} paid, {stats?.overdue_invoices || 0} overdue</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs">
                  <ModernIcons.TrendUp />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    +{stats?.monthly_invoices_trend || 0}%
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                  <ModernIcons.Money />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats?.total_revenue || 0, DEFAULT_CURRENCY)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Monthly</div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monthly Revenue</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Gross income this month</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs">
                  <ModernIcons.TrendUp />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    +{stats?.revenue_trend || 0}%
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
              </div>
            </div>
          </div>

          {/* Profit Margin */}
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                  <ModernIcons.TrendUp />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.profit_margin || 0}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Margin</div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Profit Margin</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Net profit percentage</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs">
                  <ModernIcons.Star />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Excellent</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">performance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Cash Flow Chart */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Cash Flow Trend 📊
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Income vs Expenses over time
                  </p>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg"></div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Income</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg"></div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Expenses</span>
                  </div>
                </div>
              </div>
              
              {stats?.cash_flow_data && (
                <div className="relative">
                  <BarChart
                    data={stats.cash_flow_data.map(item => ({
                      label: item.month,
                      value: item.income,
                      color: 'bg-gradient-to-t from-blue-500 to-cyan-400'
                    }))}
                    height={300}
                    className="rounded-xl overflow-hidden"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 dark:border-gray-700/50">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Peak Month</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">June</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            <div className="relative p-8">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Expense Categories 🎯
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Breakdown of your spending
                </p>
              </div>
              
              {stats?.expense_categories && (
                <div className="relative flex items-center justify-center">
                  <PieChart
                    data={stats.expense_categories.map((item, index) => ({
                      label: item.name,
                      value: item.total,
                      color: [
                        'text-blue-600 dark:text-blue-400', 
                        'text-emerald-600 dark:text-emerald-400', 
                        'text-amber-600 dark:text-amber-400', 
                        'text-red-600 dark:text-red-400'
                      ][index % 4]
                    }))}
                    size={220}
                  />
                  <div className="absolute top-4 left-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.expense_categories.reduce((sum, cat) => sum + cat.total, 0), DEFAULT_CURRENCY)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Bottom Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Top Clients */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Top Clients 🏆
                </h3>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                  <ModernIcons.Building />
                </div>
              </div>
              <div className="space-y-4">
                {stats?.top_clients?.map((client, index) => (
                  <div key={index} className="group flex items-center justify-between p-4 rounded-xl bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-lg font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white block">
                          {client.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Premium Client
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(client.total, DEFAULT_CURRENCY)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Revenue
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Financial Overview 💰
                </h3>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                  <ModernIcons.Wallet />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-xl bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <ModernIcons.TrendUp />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Receivables</span>
                  </div>
                  <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(stats?.total_amount || 0, DEFAULT_CURRENCY)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 rounded-xl bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                      <ModernIcons.Clock />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Payments</span>
                  </div>
                  <span className="font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency((stats?.total_amount || 0) * 0.3, DEFAULT_CURRENCY)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 rounded-xl bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                      <ModernIcons.Warning />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overdue Amount</span>
                  </div>
                  <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency((stats?.total_amount || 0) * 0.1, DEFAULT_CURRENCY)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 rounded-xl bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <ModernIcons.Calendar />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upcoming Due</span>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{stats?.upcoming_due || 0} invoices</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Performance Metrics 📈
                </h3>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                  <ModernIcons.Star />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-xl bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <ModernIcons.TrendUp />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversion Rate</span>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {stats ? (((stats.total_invoices || 0) / Math.max((stats.total_quotations || 1), 1)) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-4 rounded-xl bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <ModernIcons.Money />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg. Deal Value</span>
                  </div>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(stats ? Math.round((stats.total_amount || 0) / Math.max((stats.total_invoices || 1), 1)) : 0, DEFAULT_CURRENCY)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-4 rounded-xl bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                      <ModernIcons.User />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Clients</span>
                  </div>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{stats?.total_clients || 0}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 rounded-xl bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                      <ModernIcons.Quote />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">This Month</span>
                  </div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats?.monthly_quotations || 0} quotes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
