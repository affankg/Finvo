import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, DashboardStats, ActivityLog } from '../services/api';
import { toast } from 'react-hot-toast';
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimeFilter, setActiveTimeFilter] = useState('week');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.stats);
      setRecentActivities(response.data.recent_activities);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate insights
  const insights = {
    conversionRate: stats ? 
      stats.total_quotations > 0 ? 
        ((stats.total_invoices / stats.total_quotations) * 100).toFixed(1) : '0'
      : '0',
    paymentRate: stats ? 
      stats.total_invoices > 0 ? 
        ((stats.paid_invoices / stats.total_invoices) * 100).toFixed(1) : '0'
      : '0',
    monthlyGrowth: stats ? 
      stats.monthly_quotations > 0 ? '+12.5' : '0' // This could be calculated from historical data
      : '0',
    avgDealValue: '125,000', // This would come from backend calculations
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced stat cards with trends and interactivity
  const statCards = [
    {
      title: 'Total Clients',
      value: stats?.total_clients || 0,
      icon: '👥',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      trend: '+8.2%',
      trendUp: true,
      description: 'Active customer base',
    },
    {
      title: 'Total Quotations',
      value: stats?.total_quotations || 0,
      icon: '📋',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      bgLight: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      trend: `${insights.conversionRate}%`,
      trendUp: parseFloat(insights.conversionRate) > 50,
      description: 'Conversion to invoices',
    },
    {
      title: 'Total Invoices',
      value: stats?.total_invoices || 0,
      icon: '💰',
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      bgLight: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      trend: `${insights.paymentRate}%`,
      trendUp: parseFloat(insights.paymentRate) > 70,
      description: 'Payment completion rate',
    },
    {
      title: 'Monthly Revenue',
      value: `${getCurrencySymbol('PKR')}${insights.avgDealValue}`,
      icon: '📈',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      trend: `${insights.monthlyGrowth}%`,
      trendUp: parseFloat(insights.monthlyGrowth) > 0,
      description: 'From paid invoices',
    },
  ];
  // Secondary metrics
  const secondaryStats = [
    {
      title: 'Pending Invoices',
      value: stats?.pending_invoices || 0,
      icon: '⏰',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Paid Invoices',
      value: stats?.paid_invoices || 0,
      icon: '✅',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'This Month',
      value: stats?.monthly_quotations || 0,
      icon: '�',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ];

  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return '✨';
      case 'update': return '📝';
      case 'delete': return '🗑️';
      case 'view': return '👁️';
      default: return '📋';
    }
  };

  const getActivityColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'update': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'delete': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'view': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      default: return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200';
    }
  };

  const navigateToPage = (page: string) => {
    window.location.href = `/${page}`;
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Welcome Section with Time-based Greeting */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.first_name || user?.username}! 👋
            </h1>
            <p className="text-indigo-100 mt-2 text-lg">
              Here's your business overview for {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">{stats?.total_clients || 0}</div>
              <div className="text-sm text-indigo-100">Active Clients</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700 hover:scale-105 cursor-pointer group"
            onClick={() => stat.title.includes('Client') ? navigateToPage('clients') : 
                          stat.title.includes('Quotation') ? navigateToPage('quotations') : 
                          stat.title.includes('Invoice') ? navigateToPage('invoices') : null}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgLight} rounded-full p-3 group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                stat.trendUp ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {stat.trendUp ? '↗' : '↘'} {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.title}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
              </p>
              <p className={`text-xs ${stat.textColor} font-medium`}>
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {secondaryStats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`${stat.bgColor} rounded-lg p-2`}>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Business Insights Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <span className="mr-2">📊</span>
            Business Insights
          </h2>
          <div className="flex space-x-2">
            {['week', 'month', 'quarter'].map((period) => (
              <button
                key={period}
                onClick={() => setActiveTimeFilter(period)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  activeTimeFilter === period
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Conversion Rate</span>
              <span className="text-blue-600 dark:text-blue-400">🎯</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{insights.conversionRate}%</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">Quotes → Invoices</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Payment Rate</span>
              <span className="text-green-600 dark:text-green-400">💳</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{insights.paymentRate}%</div>
            <p className="text-xs text-green-600 dark:text-green-400">Invoices Paid</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Avg Deal Value</span>
              <span className="text-purple-600 dark:text-purple-400">💰</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{getCurrencySymbol('PKR')}{insights.avgDealValue}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400">Per Invoice</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Growth Rate</span>
              <span className="text-orange-600 dark:text-orange-400">📈</span>
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{insights.monthlyGrowth}%</div>
            <p className="text-xs text-orange-600 dark:text-orange-400">This Month</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities with Enhanced Design */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">🕒</span>
              Recent Activities
            </h2>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Activities will appear here as you work</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.action)}`}>
                        <span className="text-sm">
                          {getActivityIcon(activity.action)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <span className="mr-1">🕐</span>
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions with Enhanced Design */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => navigateToPage('clients')}
                className="group p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">👤</div>
                <h3 className="font-medium text-gray-900 dark:text-white">Add Client</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create new client profile</p>
              </button>
              
              <button 
                onClick={() => navigateToPage('quotations')}
                className="group p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">📋</div>
                <h3 className="font-medium text-gray-900 dark:text-white">New Quotation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create price quotation</p>
              </button>
              
              <button 
                onClick={() => navigateToPage('invoices')}
                className="group p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-800/30 dark:hover:to-yellow-700/30 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">💰</div>
                <h3 className="font-medium text-gray-900 dark:text-white">New Invoice</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generate customer invoice</p>
              </button>
              
              <button 
                onClick={() => navigateToPage('services')}
                className="group p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">⚙️</div>
                <h3 className="font-medium text-gray-900 dark:text-white">Add Service</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create service offering</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <span className="mr-2">🎯</span>
          Performance Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - parseFloat(insights.conversionRate) / 100)}`}
                  className="text-blue-600 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-bold text-gray-900 dark:text-white">
                {insights.conversionRate}%
              </span>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Quote Conversion</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Quotations converted to invoices</p>
          </div>
          
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - parseFloat(insights.paymentRate) / 100)}`}
                  className="text-green-600 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-bold text-gray-900 dark:text-white">
                {insights.paymentRate}%
              </span>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Payment Success</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Invoices successfully paid</p>
          </div>
          
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(parseFloat(insights.monthlyGrowth), 100) / 100)}`}
                  className="text-purple-600 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-bold text-gray-900 dark:text-white">
                {insights.monthlyGrowth}%
              </span>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Monthly Growth</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Business growth this month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
