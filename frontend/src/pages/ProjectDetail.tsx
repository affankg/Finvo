import React, { useState, useEffect, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import projectService, { ProjectDashboard } from '../services/projectService_fixed';
import ExpenseManagement from '../components/ExpenseManagement';

const ProjectDetail: React.FC = memo(() => {
  const { id } = useParams<{ id: string }>();
  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'team' | 'milestones' | 'notes' | 'expenses'>('overview');

  useEffect(() => {
    if (id) {
      fetchDashboard();
    }
  }, [id]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjectDashboard(parseInt(id!));
      setDashboard(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch project dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    if (!amount || amount === 'undefined' || amount === 'null') {
      return `${currency} 0`;
    }
    const currencySymbols: { [key: string]: string } = {
      'PKR': 'Rs',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return `${currencySymbols[currency] || currency} 0`;
    }
    return `${currencySymbols[currency] || currency} ${parsedAmount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
            Error: {error}
          </div>
          <Link
            to="/projects"
            className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded-lg">
            Loading project dashboard...
          </div>
        </div>
      </div>
    );
  }

  const { project, analytics, recent_activities, team_members, milestones } = dashboard;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <Link
                to="/projects"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Projects
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {project.project_number} • {project.client_name}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priority)}`}>
              {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)} Priority
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <Link
              to={`/projects/${project.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Edit Project
            </Link>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Expenses</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(analytics.total_expenses, project.currency)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Payments Received</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(analytics.total_payments, project.currency)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Outstanding Balance</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(analytics.outstanding_balance, project.currency)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Profitability</h3>
            <p className={`text-2xl font-bold ${
              parseFloat(analytics.profitability) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(analytics.profitability, project.currency)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'analytics', label: 'Analytics' },
                { key: 'team', label: 'Team' },
                { key: 'milestones', label: 'Milestones' },
                { key: 'expenses', label: 'Expenses' },
                { key: 'notes', label: 'Notes' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Project Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.description || 'No description provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatCurrency(project.budget, project.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(project.start_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {project.end_date ? formatDate(project.end_date) : 'Not set'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Manager</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.project_manager_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatDate(project.created_at)} by {project.created_by_name}
                      </dd>
                    </div>
                  </div>
                </div>

                {/* Recent Activities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h3>
                  <div className="space-y-3">
                    {recent_activities.length > 0 ? (
                      recent_activities.map((activity) => (
                        <div key={activity.id} className="flex justify-between items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.activity_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(activity.date)}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(activity.amount, project.currency)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No recent activities found
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Expense Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expense Breakdown</h3>
                  <div className="space-y-3">
                    {analytics.expense_breakdown.map((expense, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{expense.category}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{expense.count} transactions</p>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount, project.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Timeline</h3>
                  <div className="space-y-3">
                    {analytics.payment_timeline.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{payment.type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(payment.date)}</p>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount, project.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Members</h3>
                <div className="space-y-3">
                  {team_members.map((member) => (
                    <div key={member.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{member.user_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Since {formatDate(member.assigned_date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'milestones' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Milestones</h3>
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{milestone.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                          milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          milestone.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Due: {formatDate(milestone.due_date)}
                        </p>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {milestone.completion_percentage}% Complete
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Expenses</h3>
                <ExpenseManagement 
                  projectId={project.id} 
                  projectCurrency={project.currency}
                />
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Notes</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Notes functionality will be implemented here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProjectDetail;
