import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { financialAPI } from '../services/api';
import { formatSmartCurrency, DEFAULT_CURRENCY } from '../utils/currency';

interface ActivityLog {
  id: number;
  activity_type: string;
  description: string;
  amount: number;
  created_at: string;
  user: string;
  client_name?: string;
  reference_number?: string;
  status: string;
}

const Settings: React.FC = () => {
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getDashboardInsights();
      setRecentActivities(response.data.recent_activities || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      toast.error('Failed to fetch recent activities');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account settings and view system activity
        </p>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activities
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track all recent financial activities and system changes
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No recent activities found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.activity_type === 'receivable' ? 'bg-green-500' :
                      activity.activity_type === 'payable' ? 'bg-red-500' :
                      activity.activity_type === 'expense' ? 'bg-orange-500' :
                      activity.activity_type === 'income' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.reference_number}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Client: {activity.client_name || 'N/A'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          activity.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {activity.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatSmartCurrency(activity.amount || 0, activity, DEFAULT_CURRENCY)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {recentActivities.length >= 10 && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => window.location.href = '/financial-activities'}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View all activities →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* System Settings Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure system preferences and account settings
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receive email alerts for financial activities</p>
              </div>
              <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:bg-gray-700">
                <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Auto-approve Small Expenses</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Automatically approve expenses under Rs5,000</p>
              </div>
              <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:bg-gray-700">
                <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Dashboard Refresh</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Auto-refresh dashboard data every 5 minutes</p>
              </div>
              <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Account Information
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View and manage your account details
          </p>
        </div>

        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Account management features coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
