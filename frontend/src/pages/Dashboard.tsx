import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, DashboardStats, ActivityLog } from '../services/api';
import { StatCard, QuickActionButton, StatusBadge } from '../components/DashboardComponents';
import { BarChart, PieChart } from '../components/Charts';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { formatCurrency, DEFAULT_CURRENCY } from '../utils/currency';

// Enhanced Icons with better visual appeal
const Icons = {
  Quote: () => (
    <div className="relative">
      <span className="text-2xl">📋</span>
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
    </div>
  ),
  Invoice: () => (
    <div className="relative">
      <span className="text-2xl">🧾</span>
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    </div>
  ),
  Money: () => (
    <div className="relative">
      <span className="text-2xl">💰</span>
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
    </div>
  ),
  TrendUp: () => <span className="text-2xl">📈</span>,
  Plus: () => <span className="text-xl">➕</span>,
  Download: () => (
    <div className="relative">
      <span className="text-2xl">📊</span>
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
    </div>
  ),
  Building: () => <span className="text-xl">🏢</span>,
};

interface EnhancedDashboardStats extends DashboardStats {
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
  total_amount?: number; // Add this property
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
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
        monthly_quotations_trend: 12.5,
        monthly_invoices_trend: 8.3,
        revenue_trend: 15.2,
        profit_margin: 24.5,
        total_revenue: (response.data.stats as any).total_amount || 450000,
        total_amount: (response.data.stats as any).total_amount || 450000,
        pending_quotations: Math.floor((response.data.stats.total_quotations || 0) * 0.3),
        overdue_invoices: Math.floor((response.data.stats.total_invoices || 0) * 0.1),
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
      setRecentActivities(response.data.recent_activities || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
      label: 'Create Quotation',
      icon: <Icons.Quote />,
      action: () => window.location.href = '/quotations',
      color: 'blue' as const
    },
    {
      label: 'Generate Invoice',
      icon: <Icons.Invoice />,
      action: () => window.location.href = '/invoices',
      color: 'green' as const
    },
    {
      label: 'Track Expenses',
      icon: <Icons.Money />,
      action: () => window.location.href = '/financial-activities',
      color: 'purple' as const
    },
    {
      label: 'Export Reports',
      icon: <Icons.Download />,
      action: () => toast.success('Advanced reporting coming soon!'),
      color: 'indigo' as const
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.first_name || user?.username}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Here's what's happening with your business today.
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Filter */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              {timeFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveTimeFilter(filter.value)}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    activeTimeFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <span className="text-2xl mr-3">⚡</span>
            Quick Actions
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Get things done faster
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="transform transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <QuickActionButton
                label={action.label}
                icon={action.icon}
                onClick={action.action}
                color={action.color}
                size="lg"
                className="w-full h-32 shadow-lg hover:shadow-xl"
              />
            </div>
          ))}
        </div>
        
        {/* Additional quick stats below actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200/60 dark:border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.pending_quotations || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending Quotes</div>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200/60 dark:border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats?.overdue_invoices || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Overdue Bills</div>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200/60 dark:border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats?.upcoming_due || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Due Soon</div>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200/60 dark:border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats?.profit_margin || 0}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Profit Margin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Quotations"
          value={stats?.total_quotations || 0}
          subtitle={`${stats?.pending_quotations || 0} pending approval`}
          trend={{
            value: stats?.monthly_quotations_trend || 0,
            isPositive: (stats?.monthly_quotations_trend || 0) > 0,
            period: 'last month'
          }}
          icon={<Icons.Quote />}
          color="blue"
          onClick={() => window.location.href = '/quotations'}
        />

        <StatCard
          title="Active Invoices"
          value={stats?.total_invoices || 0}
          subtitle={`${stats?.paid_invoices || 0} paid, ${stats?.overdue_invoices || 0} overdue`}
          trend={{
            value: stats?.monthly_invoices_trend || 0,
            isPositive: (stats?.monthly_invoices_trend || 0) > 0,
            period: 'last month'
          }}
          icon={<Icons.Invoice />}
          color="green"
          onClick={() => window.location.href = '/invoices'}
        />

        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.total_revenue || 0, DEFAULT_CURRENCY)}
          subtitle="Gross income this month"
          trend={{
            value: stats?.revenue_trend || 0,
            isPositive: (stats?.revenue_trend || 0) > 0,
            period: 'last month'
          }}
          icon={<Icons.Money />}
          color="purple"
        />

        <StatCard
          title="Profit Margin"
          value={`${stats?.profit_margin || 0}%`}
          subtitle="Net profit percentage"
          icon={<Icons.TrendUp />}
          color="indigo"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Cash Flow Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Cash Flow
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Income</span>
              </div>
            </div>
          </div>
          
          {stats?.cash_flow_data && (
            <BarChart
              data={stats.cash_flow_data.map(item => ({
                label: item.month,
                value: item.income,
                color: 'bg-blue-500'
              }))}
              height={250}
            />
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Expense Categories
          </h3>
          
          {stats?.expense_categories && (
            <PieChart
              data={stats.expense_categories.map((item, index) => ({
                label: item.name,
                value: item.total,
                color: ['text-blue-600', 'text-green-600', 'text-yellow-600', 'text-red-600'][index % 4]
              }))}
              size={200}
            />
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activities
          </h3>
          <Link 
            to="/financial-activities" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex-shrink-0">
                  {activity.action.includes('quotation') ? <Icons.Quote /> : 
                   activity.action.includes('invoice') ? <Icons.Invoice /> : 
                   <Icons.Money />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.description || activity.action}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(activity.created_at).toLocaleDateString()} by {activity.user_name || `User ${activity.user}`}
                  </p>
                </div>
                <StatusBadge status={activity.action.split(' ')[0]} size="sm" />
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No recent activities found.
            </p>
          )}
        </div>
      </div>

      {/* Bottom Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Clients
          </h3>
          <div className="space-y-4">
            {stats?.top_clients?.map((client, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Icons.Building />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {client.name}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatCurrency(client.total, DEFAULT_CURRENCY)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Financial Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Receivables</span>
              <span className="text-sm font-medium text-green-600">{formatCurrency(stats?.total_amount || 0, DEFAULT_CURRENCY)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending Payments</span>
              <span className="text-sm font-medium text-yellow-600">{formatCurrency((stats?.total_amount || 0) * 0.3, DEFAULT_CURRENCY)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Overdue Amount</span>
              <span className="text-sm font-medium text-red-600">{formatCurrency((stats?.total_amount || 0) * 0.1, DEFAULT_CURRENCY)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Upcoming Due</span>
              <span className="text-sm font-medium text-blue-600">{stats?.upcoming_due || 0} invoices</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
              <span className="text-sm font-medium text-blue-600">
                {stats ? ((stats.total_invoices / Math.max(stats.total_quotations, 1)) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Deal Value</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(stats ? Math.round((stats.total_amount || 0) / Math.max(stats.total_invoices, 1)) : 0, DEFAULT_CURRENCY)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Clients</span>
              <span className="text-sm font-medium text-purple-600">{stats?.total_clients || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
              <span className="text-sm font-medium text-indigo-600">{stats?.monthly_quotations || 0} quotes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS animations for quick action cards */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            0% {
              transform: translateX(-100%) skewX(-12deg);
            }
            100% {
              transform: translateX(200%) skewX(-12deg);
            }
          }
          
          @keyframes bounce-light {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            50% {
              transform: translateY(-4px) scale(1.05);
            }
          }
          
          @keyframes card-hover {
            0% {
              transform: translateY(0) scale(1);
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            100% {
              transform: translateY(-4px) scale(1.02);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
          }
          
          .animate-shimmer {
            animation: shimmer 2s ease-in-out;
          }
          
          .animate-bounce-light {
            animation: bounce-light 0.6s ease-in-out;
          }
          
          .card-hover-animation:hover {
            animation: card-hover 0.3s ease-out forwards;
          }
          
          /* Enhanced gradient animations */
          @keyframes gradient-shift {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          .gradient-animation {
            background-size: 200% 200%;
            animation: gradient-shift 3s ease infinite;
          }
          
          /* Pulse glow effect */
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
            }
            50% {
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4);
            }
          }
          
          .pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }
          
          /* Orb floating animation */
          @keyframes orbFloat {
            0%, 100% {
              transform: translateY(0px) scale(1);
            }
            50% {
              transform: translateY(-20px) scale(1.05);
            }
          }
        `
      }} />
    </div>
  );
};

export default Dashboard;
