import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, financialAPI } from '../services/api';
import projectService from '../services/projectService_fixed';
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
  Project: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Target: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  Team: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

interface ProjectDashboard {
  id: number;
  name: string;
  project_number: string;
  client_name: string;
  project_manager_name: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  currency: string;
  total_budget: number;
  total_spent: number;
  total_billed: number;
  remaining_budget: number;
  profit_margin: number;
  progress_percentage: number;
  milestones_completed: number;
  milestones_total: number;
  days_remaining: number;
  is_overdue: boolean;
  team_size: number;
}

const CleanDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [todayUpdates, setTodayUpdates] = useState<TodayUpdate[]>([]);
  const [projects, setProjects] = useState<ProjectDashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, activitiesResponse, projectsResponse] = await Promise.all([
        dashboardAPI.getStats(),
        financialAPI.getActivities(),
        projectService.getDashboardProjects()
      ]);

      setStats(dashboardResponse.data.stats || {});
      setProjects(projectsResponse.data || []);
      
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

  const getProjectStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getProjectPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 30) return 'bg-orange-500';
    return 'bg-red-500';
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
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={action.label}
                className="transform transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <button
                  onClick={action.action}
                  className={`
                    relative group overflow-hidden w-full
                    flex flex-col items-center justify-center space-y-2 
                    rounded-xl font-semibold border
                    backdrop-blur-sm p-4
                    transition-all duration-300 ease-out
                    hover:scale-105 hover:shadow-xl hover:-translate-y-2
                    active:scale-95 active:translate-y-0
                    card-hover-animation
                    ${action.label === 'New Quotation' ? 'bg-gradient-to-br from-green-50/80 via-green-100/60 to-green-200/40 border-green-200/60 dark:from-green-900/30 dark:via-green-800/20 dark:to-green-700/10 dark:border-green-700/50 text-green-700 dark:text-green-300 hover:from-green-500/30 hover:via-green-600/25 hover:to-green-700/20 hover:shadow-green-500/30 hover:border-green-300/80 dark:hover:from-green-500/40 dark:hover:via-green-600/30 dark:hover:to-green-700/20' : 
                      action.label === 'New Invoice' ? 'bg-gradient-to-br from-green-50/80 via-green-100/60 to-green-200/40 border-green-200/60 dark:from-green-900/30 dark:via-green-800/20 dark:to-green-700/10 dark:border-green-700/50 text-green-700 dark:text-green-300 hover:from-green-500/30 hover:via-green-600/25 hover:to-green-700/20 hover:shadow-green-500/30 hover:border-green-300/80 dark:hover:from-green-500/40 dark:hover:via-green-600/30 dark:hover:to-green-700/20' :
                      action.label === 'Add Expense' ? 'bg-gradient-to-br from-purple-50/80 via-purple-100/60 to-purple-200/40 border-purple-200/60 dark:from-purple-900/30 dark:via-purple-800/20 dark:to-purple-700/10 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 hover:from-purple-500/30 hover:via-purple-600/25 hover:to-purple-700/20 hover:shadow-purple-500/30 hover:border-purple-300/80 dark:hover:from-purple-500/40 dark:hover:via-purple-600/30 dark:hover:to-purple-700/20' :
                      action.label === 'Add Client' ? 'bg-gradient-to-br from-indigo-50/80 via-indigo-100/60 to-indigo-200/40 border-indigo-200/60 dark:from-indigo-900/30 dark:via-indigo-800/20 dark:to-indigo-700/10 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 hover:from-indigo-500/30 hover:via-indigo-600/25 hover:to-indigo-700/20 hover:shadow-indigo-500/30 hover:border-indigo-300/80 dark:hover:from-indigo-500/40 dark:hover:via-indigo-600/30 dark:hover:to-indigo-700/20' :
                      action.label === 'View Analytics' ? 'bg-gradient-to-br from-orange-50/80 via-orange-100/60 to-orange-200/40 border-orange-200/60 dark:from-orange-900/30 dark:via-orange-800/20 dark:to-orange-700/10 dark:border-orange-700/50 text-orange-700 dark:text-orange-300 hover:from-orange-500/30 hover:via-orange-600/25 hover:to-orange-700/20 hover:shadow-orange-500/30 hover:border-orange-300/80 dark:hover:from-orange-500/40 dark:hover:via-orange-600/30 dark:hover:to-orange-700/20' :
                      'bg-gradient-to-br from-gray-50/80 via-gray-100/60 to-gray-200/40 border-gray-200/60 dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-700/10 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:from-gray-500/30 hover:via-gray-600/25 hover:to-gray-700/20 hover:shadow-gray-500/30 hover:border-gray-300/80 dark:hover:from-gray-500/40 dark:hover:via-gray-600/30 dark:hover:to-gray-700/20'}
                  `}
                  style={{
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  {/* Enhanced animated background overlay with color-specific glow */}
                  <div className={`
                    absolute inset-0 opacity-0 group-hover:opacity-100 
                    transition-all duration-500 ease-out
                    transform -skew-x-12 group-hover:animate-shimmer
                    ${action.label === 'New Quotation' ? 'bg-gradient-to-r from-transparent via-green-400/20 to-transparent' :
                      action.label === 'New Invoice' ? 'bg-gradient-to-r from-transparent via-green-400/20 to-transparent' :
                      action.label === 'Add Expense' ? 'bg-gradient-to-r from-transparent via-purple-400/20 to-transparent' :
                      action.label === 'Add Client' ? 'bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent' :
                      action.label === 'View Analytics' ? 'bg-gradient-to-r from-transparent via-orange-400/20 to-transparent' :
                      'bg-gradient-to-r from-transparent via-gray-400/20 to-transparent'}
                  `}></div>
                  
                  {/* Color-specific background glow effect */}
                  <div className={`
                    absolute inset-0 rounded-xl opacity-0 group-hover:opacity-60 
                    transition-all duration-500 ease-out blur-xl
                    ${action.label === 'New Quotation' ? 'bg-green-500/20' :
                      action.label === 'New Invoice' ? 'bg-green-500/20' :
                      action.label === 'Add Expense' ? 'bg-purple-500/20' :
                      action.label === 'Add Client' ? 'bg-indigo-500/20' :
                      action.label === 'View Analytics' ? 'bg-orange-500/20' :
                      'bg-gray-500/20'}
                  `}></div>
                  
                  {/* Enhanced icon with bounce animation */}
                  <div className={`transform transition-transform duration-300 group-hover:scale-110 group-hover:animate-bounce-light ${
                    action.label === 'New Quotation' ? 'text-green-600 dark:text-green-400' :
                    action.label === 'New Invoice' ? 'text-green-600 dark:text-green-400' :
                    action.label === 'Add Expense' ? 'text-purple-600 dark:text-purple-400' :
                    action.label === 'Add Client' ? 'text-indigo-600 dark:text-indigo-400' :
                    action.label === 'View Analytics' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {action.icon}
                  </div>
                  
                  <div className="text-center relative z-20">
                    <div className={`font-semibold text-sm group-hover:font-bold transition-all duration-300 ${
                      action.label === 'New Quotation' ? 'text-green-800 dark:text-green-200 group-hover:text-green-900 dark:group-hover:text-green-100' :
                      action.label === 'New Invoice' ? 'text-green-800 dark:text-green-200 group-hover:text-green-900 dark:group-hover:text-green-100' :
                      action.label === 'Add Expense' ? 'text-purple-800 dark:text-purple-200 group-hover:text-purple-900 dark:group-hover:text-purple-100' :
                      action.label === 'Add Client' ? 'text-indigo-800 dark:text-indigo-200 group-hover:text-indigo-900 dark:group-hover:text-indigo-100' :
                      action.label === 'View Analytics' ? 'text-orange-800 dark:text-orange-200 group-hover:text-orange-900 dark:group-hover:text-orange-100' :
                      'text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                    }`}>
                      {action.label}
                    </div>
                    <div className={`text-xs opacity-80 group-hover:opacity-100 transition-all duration-300 ${
                      action.label === 'New Quotation' ? 'text-green-600 dark:text-green-300 group-hover:text-green-700 dark:group-hover:text-green-200' :
                      action.label === 'New Invoice' ? 'text-green-600 dark:text-green-300 group-hover:text-green-700 dark:group-hover:text-green-200' :
                      action.label === 'Add Expense' ? 'text-purple-600 dark:text-purple-300 group-hover:text-purple-700 dark:group-hover:text-purple-200' :
                      action.label === 'Add Client' ? 'text-indigo-600 dark:text-indigo-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-200' :
                      action.label === 'View Analytics' ? 'text-orange-600 dark:text-orange-300 group-hover:text-orange-700 dark:group-hover:text-orange-200' :
                      'text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                    }`}>
                      {action.description}
                    </div>
                  </div>
                  
                  {/* Color-coordinated pulse effect indicator */}
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full opacity-30 group-hover:opacity-60 animate-pulse ${
                    action.label === 'New Quotation' ? 'bg-green-600 dark:bg-green-400' :
                    action.label === 'New Invoice' ? 'bg-green-600 dark:bg-green-400' :
                    action.label === 'Add Expense' ? 'bg-purple-600 dark:bg-purple-400' :
                    action.label === 'Add Client' ? 'bg-indigo-600 dark:bg-indigo-400' :
                    action.label === 'View Analytics' ? 'bg-orange-600 dark:bg-orange-400' :
                    'bg-gray-600 dark:bg-gray-400'
                  }`}></div>
                </button>
              </div>
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

          {/* Enhanced Overview Stats */}
          <div className="space-y-6">
            {/* Quick Stats with Enhanced Colors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-xl mr-2">📊</span>
                Quick Overview
              </h3>
              <div className="space-y-4">
                {/* Total Quotations - Blue Theme */}
                <div className="relative group overflow-hidden p-4 rounded-xl border transition-all duration-300 hover:scale-102 hover:shadow-lg hover:-translate-y-1 cursor-pointer
                                bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-blue-700/10 
                                border-blue-200/60 dark:border-blue-700/50 
                                hover:from-blue-500/20 hover:via-blue-600/15 hover:to-blue-700/20
                                hover:shadow-blue-500/25"
                     style={{
                       backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                     }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                        <Icons.Quote />
                      </div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Quotations</span>
                    </div>
                    <span className="font-bold text-xl text-blue-800 dark:text-blue-200 group-hover:scale-110 transition-transform duration-300">
                      {stats.total_quotations || 0}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full opacity-30 group-hover:opacity-60 animate-pulse"></div>
                </div>
                
                {/* Total Invoices - Green Theme */}
                <div className="relative group overflow-hidden p-4 rounded-xl border transition-all duration-300 hover:scale-102 hover:shadow-lg hover:-translate-y-1 cursor-pointer
                                bg-gradient-to-br from-green-500/10 via-green-600/5 to-green-700/10 
                                border-green-200/60 dark:border-green-700/50 
                                hover:from-green-500/20 hover:via-green-600/15 hover:to-green-700/20
                                hover:shadow-green-500/25"
                     style={{
                       backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                     }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                        <Icons.Invoice />
                      </div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Invoices</span>
                    </div>
                    <span className="font-bold text-xl text-green-800 dark:text-green-200 group-hover:scale-110 transition-transform duration-300">
                      {stats.total_invoices || 0}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full opacity-30 group-hover:opacity-60 animate-pulse"></div>
                </div>
                
                {/* Active Clients - Purple Theme */}
                <div className="relative group overflow-hidden p-4 rounded-xl border transition-all duration-300 hover:scale-102 hover:shadow-lg hover:-translate-y-1 cursor-pointer
                                bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-purple-700/10 
                                border-purple-200/60 dark:border-purple-700/50 
                                hover:from-purple-500/20 hover:via-purple-600/15 hover:to-purple-700/20
                                hover:shadow-purple-500/25"
                     style={{
                       backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                     }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                        <Icons.Client />
                      </div>
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Clients</span>
                    </div>
                    <span className="font-bold text-xl text-purple-800 dark:text-purple-200 group-hover:scale-110 transition-transform duration-300">
                      {stats.total_clients || 0}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full opacity-30 group-hover:opacity-60 animate-pulse"></div>
                </div>
                
                {/* Total Revenue - Gold/Orange Theme */}
                <div className="relative group overflow-hidden p-4 rounded-xl border transition-all duration-300 hover:scale-102 hover:shadow-lg hover:-translate-y-1 cursor-pointer
                                bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-orange-600/10 
                                border-orange-200/60 dark:border-orange-700/50 
                                hover:from-orange-500/20 hover:via-yellow-500/15 hover:to-orange-600/20
                                hover:shadow-orange-500/25"
                     style={{
                       backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                     }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                        <Icons.TrendUp />
                      </div>
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Revenue</span>
                    </div>
                    <span className="font-bold text-xl text-orange-800 dark:text-orange-200 group-hover:scale-110 transition-transform duration-300">
                      {formatCurrency(stats.total_amount || 0, DEFAULT_CURRENCY)}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full opacity-30 group-hover:opacity-60 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Project Insights Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-xl mr-2">🚀</span>
                Project Insights
              </h3>
              
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <Icons.Project />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No active projects found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Project Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Active Projects</span>
                        <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                          {projects.filter(p => p.status?.toLowerCase() === 'active').length}
                        </span>
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">On Track</span>
                        <span className="text-lg font-bold text-green-800 dark:text-green-200">
                          {projects.filter(p => !p.is_overdue).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Projects List */}
                  <div className="space-y-3">
                    {projects
                      .filter(p => p.status?.toLowerCase() === 'active')
                      .slice(0, 3)
                      .map((project) => (
                        <div key={project.id} className="group relative overflow-hidden p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {project.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {project.client_name}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProjectPriorityColor(project.priority)}`}>
                                {project.priority}
                              </span>
                              {project.is_overdue && (
                                <span className="text-red-500 text-xs">⚠️</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>{Math.round(project.progress_percentage)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress_percentage)}`}
                                style={{ width: `${Math.min(project.progress_percentage, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Project Metrics */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(project.remaining_budget, project.currency)}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">Budget Left</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {project.team_size}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">Team Size</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {project.days_remaining}d
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">Remaining</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* View All Projects Button */}
                  {projects.length > 0 && (
                    <button
                      onClick={() => window.location.href = '/expense-management'}
                      className="w-full mt-4 px-4 py-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg border border-cyan-200 dark:border-cyan-700 transition-colors duration-200"
                    >
                      View All Projects →
                    </button>
                  )}
                </div>
              )}
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
              transform: translateY(-8px) scale(1.05);
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
            }
          }
          
          @keyframes glow-pulse {
            0%, 100% {
              opacity: 0.4;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.1);
            }
          }
          
          .animate-shimmer {
            animation: shimmer 1.5s ease-in-out;
          }
          
          .animate-bounce-light {
            animation: bounce-light 0.6s ease-in-out;
          }
          
          .card-hover-animation:hover {
            animation: card-hover 0.3s ease-out forwards;
          }
          
          /* Enhanced background color transitions */
          .card-hover-animation {
            position: relative;
            overflow: hidden;
          }
          
          .card-hover-animation::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: inherit;
            border-radius: inherit;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: -1;
          }
          
          .card-hover-animation:hover::before {
            opacity: 1;
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
          
          /* Enhanced pulse glow effect */
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
          
          /* Color-specific hover effects */
          .card-hover-animation:hover {
            transform: translateY(-8px) scale(1.05);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          /* Improved shadow transitions */
          .card-hover-animation {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .card-hover-animation:hover {
            box-shadow: 
              0 20px 25px -5px rgba(0, 0, 0, 0.1), 
              0 10px 10px -5px rgba(0, 0, 0, 0.04),
              0 0 0 1px rgba(255, 255, 255, 0.05);
          }
          
          /* Enhanced background overlay animation */
          @keyframes background-pulse {
            0% {
              background-size: 100% 100%;
              opacity: 0.8;
            }
            50% {
              background-size: 110% 110%;
              opacity: 1;
            }
            100% {
              background-size: 100% 100%;
              opacity: 0.8;
            }
          }
          
          .card-hover-animation:hover {
            animation: background-pulse 2s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
};

export default CleanDashboard;
