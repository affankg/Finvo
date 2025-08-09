import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  ChartBarIcon, 
  CogIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Only admin can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const adminLinks = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/users',
      icon: UsersIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'System Analytics',
      description: 'View system performance and usage statistics',
      href: '/financial-activities',
      icon: ChartBarIcon,
      color: 'bg-green-500'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      href: '/settings',
      icon: CogIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Audit Logs',
      description: 'View system audit and activity logs',
      href: '/audit-logs',
      icon: DocumentDuplicateIcon,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome, {user?.first_name} {user?.last_name}. Manage your system from here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start">
              <div className={`${link.color} p-3 rounded-lg`}>
                <link.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {link.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {link.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <ShieldCheckIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              Admin Notice
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              You have admin privileges. Please use these tools responsibly and ensure data security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
