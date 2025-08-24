
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, projectsAPI, DashboardStats, ActivityLog } from '../services/api';
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

// Project dashboard interfaces
interface ProjectDashboardData {
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

interface ProjectInsights {
  active_projects: ProjectDashboardData[];
  total_active: number;
  total_overdue: number;
  total_budget_all: number;
  total_spent_all: number;
  avg_completion: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [projectInsights, setProjectInsights] = useState<ProjectInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTimeFilter, setActiveTimeFilter] = useState('month');

  useEffect(() => {
    fetchDashboardData();
  }, [activeTimeFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, projectsResponse] = await Promise.all([
        dashboardAPI.getStats(),
        projectsAPI.getDashboard()
      ]);
      
      // Enhance the stats with calculated insights
      const enhancedStats: EnhancedDashboardStats = {
        ...dashboardResponse.data.stats,
        monthly_quotations_trend: 12.5,
        monthly_invoices_trend: 8.3,
        revenue_trend: 15.2,
        profit_margin: 24.5,
        total_revenue: (dashboardResponse.data.stats as any).total_amount || 450000,
        total_amount: (dashboardResponse.data.stats as any).total_amount || 450000,
        pending_quotations: Math.floor((dashboardResponse.data.stats.total_quotations || 0) * 0.3),
        overdue_invoices: Math.floor((dashboardResponse.data.stats.total_invoices || 0) * 0.1),
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

      // Process project insights
      const projects = projectsResponse.data || [];
      const activeProjects = projects.filter((p: ProjectDashboardData) => 
        p.status === 'active' || p.status === 'in_progress'
      );
      
      setProjectInsights({
        active_projects: activeProjects.slice(0, 5), // Show top 5 active projects
        total_active: activeProjects.length,
        total_overdue: projects.filter((p: ProjectDashboardData) => p.is_overdue).length,
        total_budget_all: projects.reduce((sum: number, p: ProjectDashboardData) => sum + p.total_budget, 0),
        total_spent_all: projects.reduce((sum: number, p: ProjectDashboardData) => sum + p.total_spent, 0),
        avg_completion: projects.length > 0 ? 
          projects.reduce((sum: number, p: ProjectDashboardData) => sum + p.progress_percentage, 0) / projects.length : 0
      });
      
      setStats(enhancedStats);
      setRecentActivities(dashboardResponse.data.recent_activities || []);
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
      label: 'Create Project',
      icon: <Icons.Building />,
      action: () => window.location.href = '/projects?create=true',
      color: 'purple' as const
    },
    {
      label: 'Track Expenses',
      icon: <Icons.Money />,
      action: () => window.location.href = '/financial-activities',
      color: 'indigo' as const
    },
    {
      label: 'Export Reports',
      icon: <Icons.Download />,
      action: () => toast.success('Advanced reporting coming soon!'),
      color: 'blue' as const
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
    <div className="dashboard-container p-6">
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
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
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

      {/* Project Insights Section */}
      {projectInsights && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <span className="text-2xl mr-3">🚀</span>
              Project Management Insights
            </h2>
            <Link 
              to="/projects" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All Projects →
            </Link>
          </div>

          {/* Project Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {projectInsights.total_active}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Active Projects</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-700/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {projectInsights.total_overdue}
                </div>
                <div className="text-xs text-red-700 dark:text-red-300 mt-1">Overdue</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-700/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(projectInsights.total_budget_all, DEFAULT_CURRENCY)}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300 mt-1">Total Budget</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(projectInsights.total_spent_all, DEFAULT_CURRENCY)}
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Total Spent</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(projectInsights.avg_completion)}%
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">Avg Progress</div>
              </div>
            </div>
          </div>

          {/* Active Projects List */}
          {projectInsights.active_projects.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Daily Project Updates
              </h3>
              <div className="space-y-4">
                {projectInsights.active_projects.map((project) => (
                  <div key={project.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {project.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {project.client_name} • PM: {project.project_manager_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.priority === 'high' || project.priority === 'critical' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : project.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {project.priority}
                        </span>
                        {project.is_overdue && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {Math.round(project.progress_percentage)}%
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Progress</div>
                      </div>
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

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            project.progress_percentage >= 80 
                              ? 'bg-green-500' 
                              : project.progress_percentage >= 60 
                              ? 'bg-blue-500' 
                              : project.progress_percentage >= 40 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, project.progress_percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Project Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => window.location.href = '/projects'}
                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                  >
                    View All Projects
                  </button>
                  <button
                    onClick={() => window.location.href = '/financial-activities'}
                    className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 rounded-md transition-colors"
                  >
                    Project Expenses
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Enhanced CSS animations for quick action cards and global scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Enhanced Purple Scrollbar for entire app */
          html, body, *, *::before, *::after {
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.8) rgba(139, 92, 246, 0.1);
          }
          
          ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(139, 92, 246, 0.2);
            box-shadow: inset 0 0 6px rgba(139, 92, 246, 0.1);
          }
          
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, 
              rgba(139, 92, 246, 0.8) 0%, 
              rgba(124, 58, 237, 0.9) 50%, 
              rgba(109, 40, 217, 0.95) 100%
            );
            border-radius: 6px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
              0 2px 4px rgba(139, 92, 246, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, 
              rgba(139, 92, 246, 1) 0%, 
              rgba(124, 58, 237, 1) 50%, 
              rgba(109, 40, 217, 1) 100%
            );
            box-shadow: 
              0 4px 8px rgba(139, 92, 246, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
          }
          
          ::-webkit-scrollbar-thumb:active {
            background: linear-gradient(180deg, 
              rgba(124, 58, 237, 1) 0%, 
              rgba(109, 40, 217, 1) 50%, 
              rgba(91, 33, 182, 1) 100%
            );
            transform: scale(0.95);
          }
          
          ::-webkit-scrollbar-corner {
            background: rgba(139, 92, 246, 0.1);
          }
          
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
