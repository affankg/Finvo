import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, DashboardStats, ActivityLog } from '../services/api';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: stats?.total_clients || 0,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'Total Quotations',
      value: stats?.total_quotations || 0,
      icon: '📋',
      color: 'bg-green-500',
    },
    {
      title: 'Total Invoices',
      value: stats?.total_invoices || 0,
      icon: '💰',
      color: 'bg-yellow-500',
    },
    {
      title: 'Pending Invoices',
      value: stats?.pending_invoices || 0,
      icon: '⏰',
      color: 'bg-red-500',
    },
    {
      title: 'Paid Invoices',
      value: stats?.paid_invoices || 0,
      icon: '✅',
      color: 'bg-green-600',
    },
    {
      title: 'This Month Quotations',
      value: stats?.monthly_quotations || 0,
      icon: '📈',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.first_name || user?.username}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3 text-white text-2xl mr-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activities
          </h2>
        </div>
        <div className="p-6">
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No recent activities
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                        {activity.action.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors">
            <div className="text-2xl mb-2">👤</div>
            <h3 className="font-medium text-gray-900 dark:text-white">Add Client</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create new client</p>
          </button>
          <button className="p-4 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-medium text-gray-900 dark:text-white">New Quotation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create quotation</p>
          </button>
          <button className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-medium text-gray-900 dark:text-white">New Invoice</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create invoice</p>
          </button>
          <button className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors">
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-medium text-gray-900 dark:text-white">Add Service</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create service</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
