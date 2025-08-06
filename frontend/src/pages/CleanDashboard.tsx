import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, financialAPI } from '../services/api';
import { formatCurrency, DEFAULT_CURRENCY } from '../utils/currency';

// Clean Modern Icons
const Icons = {
  Quote: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Invoice: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  ),
  Money: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Client: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  TrendUp: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  CreditCard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Receipt: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Warning: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  Analytics: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

interface DashboardStats {
  total_quotations?: number;
  total_invoices?: number;
  total_amount?: number;
  total_clients?: number;
  pending_quotations?: number;
  overdue_invoices?: number;
  pending_payments?: number;
  overdue_payments?: number;
}

interface TodayUpdate {
  id: string;
  type: 'receivable' | 'payable' | 'expense' | 'invoice' | 'quotation';
  title: string;
  amount: number;
  due_date?: string;
  status: string;
  client?: string;
  priority: 'high' | 'medium' | 'low';
}

const CleanDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [todayUpdates, setTodayUpdates] = useState<TodayUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, activitiesResponse] = await Promise.all([
        dashboardAPI.getStats(),
        financialAPI.getActivities()
      ]);

      setStats(dashboardResponse.data.stats || {});
      
      // Process today's updates
      const today = new Date().toISOString().split('T')[0];
      const activities = activitiesResponse.data.results || [];
      
      const updates: TodayUpdate[] = activities
        .filter((activity: any) => {
          const activityDate = new Date(activity.due_date || activity.created_at).toISOString().split('T')[0];
          return activityDate === today || (activity.due_date && new Date(activity.due_date) <= new Date());
        })
        .slice(0, 6)
        .map((activity: any) => ({
          id: activity.id,
          type: activity.type,
          title: activity.description || `${activity.type} - ${activity.amount}`,
          amount: activity.amount,
          due_date: activity.due_date,
          status: activity.status || 'pending',
          client: activity.client_name,
          priority: activity.due_date && new Date(activity.due_date) < new Date() ? 'high' : 
                   activity.due_date && new Date(activity.due_date) <= new Date(Date.now() + 3*24*60*60*1000) ? 'medium' : 'low'
        }));

      setTodayUpdates(updates);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      label: 'New Quotation',
      icon: <Icons.Quote />,
      action: () => window.location.href = '/quotations',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Create new quote'
    },
    {
      label: 'New Invoice',
      icon: <Icons.Invoice />,
      action: () => window.location.href = '/invoices',
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Generate invoice'
    },
    {
      label: 'Add Expense',
      icon: <Icons.Money />,
      action: () => window.location.href = '/financial-activities',
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Record expense'
    },
    {
      label: 'Add Client',
      icon: <Icons.Client />,
      action: () => window.location.href = '/clients',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'New client'
    },
    {
      label: 'View Analytics',
      icon: <Icons.Analytics />,
      action: () => window.location.href = '/analytics',
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Business insights'
    },
    {
      label: 'Settings',
      icon: <Icons.Settings />,
      action: () => window.location.href = '/settings',
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'Manage settings'
    }
  ];

  const getStatusColor = (status: string, priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    if (status === 'paid' || status === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'receivable': return <Icons.CreditCard />;
      case 'payable': return <Icons.Receipt />;
      case 'expense': return <Icons.Money />;
      case 'invoice': return <Icons.Invoice />;
      case 'quotation': return <Icons.Quote />;
      default: return <Icons.Money />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse p-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.first_name || user?.username}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here's what's happening with your business today
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Icons.Calendar />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.action}
                className={`${action.color} text-white p-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md group`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {action.icon}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Updates */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Updates</h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                    <Icons.Clock />
                    <span>Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {todayUpdates.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                      <Icons.Calendar />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No updates for today. You're all caught up! 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayUpdates.map((update) => (
                      <div key={update.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300">
                            {getTypeIcon(update.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{update.title}</p>
                            {update.client && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{update.client}</p>
                            )}
                            {update.due_date && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Due: {new Date(update.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(update.amount, DEFAULT_CURRENCY)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(update.status, update.priority)}`}>
                            {update.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icons.Quote />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Quotations</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.total_quotations || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icons.Invoice />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Invoices</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.total_invoices || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icons.Client />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Clients</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.total_clients || 0}</span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2">
                    <Icons.TrendUp />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                  </div>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(stats.total_amount || 0, DEFAULT_CURRENCY)}
                  </span>
                </div>
              </div>
            </div>

            {/* Urgent Items */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requires Attention</h3>
              <div className="space-y-3">
                {stats.pending_quotations ? (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center space-x-2">
                      <Icons.Warning />
                      <span className="text-sm text-yellow-800 dark:text-yellow-200">Pending Quotations</span>
                    </div>
                    <span className="font-semibold text-yellow-800 dark:text-yellow-200">{stats.pending_quotations}</span>
                  </div>
                ) : null}
                
                {stats.overdue_invoices ? (
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center space-x-2">
                      <Icons.Warning />
                      <span className="text-sm text-red-800 dark:text-red-200">Overdue Invoices</span>
                    </div>
                    <span className="font-semibold text-red-800 dark:text-red-200">{stats.overdue_invoices}</span>
                  </div>
                ) : null}
                
                {stats.pending_payments ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2">
                      <Icons.CreditCard />
                      <span className="text-sm text-blue-800 dark:text-blue-200">Pending Payments</span>
                    </div>
                    <span className="font-semibold text-blue-800 dark:text-blue-200">{stats.pending_payments}</span>
                  </div>
                ) : null}
                
                {!stats.pending_quotations && !stats.overdue_invoices && !stats.pending_payments && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">All caught up! 🎉</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanDashboard;
