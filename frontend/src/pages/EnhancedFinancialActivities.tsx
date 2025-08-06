import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { financialAPI, FinancialActivity } from '../services/api';
import { StatCard, StatusBadge, QuickActionButton } from '../components/DashboardComponents';
import { BarChart, LineChart, PieChart } from '../components/Charts';
import { toast } from 'react-hot-toast';

// Icon components
const Icons = {
  Dashboard: () => <span className="text-lg">📊</span>,
  Receipt: () => <span className="text-lg">🧾</span>,
  CreditCard: () => <span className="text-lg">💳</span>,
  Money: () => <span className="text-lg">💰</span>,
  Document: () => <span className="text-lg">📄</span>,
  History: () => <span className="text-lg">📝</span>,
  Filter: () => <span className="text-lg">🔍</span>,
  Plus: () => <span className="text-lg">➕</span>,
  Download: () => <span className="text-lg">⬇️</span>,
  Edit: () => <span className="text-lg">✏️</span>,
  Check: () => <span className="text-lg">✅</span>,
  X: () => <span className="text-lg">❌</span>,
  Eye: () => <span className="text-lg">👁️</span>,
  Upload: () => <span className="text-lg">📤</span>,
  Calendar: () => <span className="text-lg">📅</span>,
  User: () => <span className="text-lg">👤</span>,
  Building: () => <span className="text-lg">🏢</span>,
  Tag: () => <span className="text-lg">🏷️</span>,
  Clock: () => <span className="text-lg">⏰</span>,
  Warning: () => <span className="text-lg">⚠️</span>,
  Info: () => <span className="text-lg">ℹ️</span>,
  TrendUp: () => <span className="text-lg">📈</span>,
  TrendDown: () => <span className="text-lg">📉</span>,
  Search: () => <span className="text-lg">🔍</span>,
  Sort: () => <span className="text-lg">🔄</span>,
  FileText: () => <span className="text-lg">📋</span>,
  ArrowRight: () => <span className="text-lg">→</span>,
};

// Modal Component for Activity Details
interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: FinancialActivity | null;
  onSave?: (activity: Partial<FinancialActivity>) => void;
  mode?: 'view' | 'edit' | 'create';
}

const ActivityModal: React.FC<ActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  activity, 
  onSave, 
  mode = 'view' 
}) => {
  const [formData, setFormData] = useState<Partial<FinancialActivity>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activity) {
      setFormData(activity);
    } else {
      setFormData({
        activity_type: 'invoice',
        status: 'pending',
        currency: 'USD',
        transaction_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast.error('Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View'} Financial Activity
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Activity Type
              </label>
              <select
                value={formData.activity_type || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, activity_type: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="invoice">Invoice</option>
                <option value="quotation">Quotation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client/Account
              </label>
              <input
                type="text"
                value={formData.client_name || formData.account_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Date
              </label>
              <input
                type="date"
                value={formData.transaction_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={mode === 'view'}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          {mode !== 'view' && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const FinancialActivities: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activities, setActivities] = useState<FinancialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedActivity, setSelectedActivity] = useState<FinancialActivity | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getActivities();
      setActivities(response.data.results || response.data || []);
    } catch (error) {
      toast.error('Failed to load financial activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActivity = async (activityData: Partial<FinancialActivity>) => {
    try {
      if (modalMode === 'create') {
        await financialAPI.createActivity(activityData);
        toast.success('Activity created successfully');
      } else if (modalMode === 'edit' && selectedActivity) {
        await financialAPI.updateActivity(selectedActivity.id, activityData);
        toast.success('Activity updated successfully');
      }
      await fetchActivities();
    } catch (error) {
      throw error;
    }
  };

  // Computed values for analytics
  const analytics = useMemo(() => {
    const totalIncome = activities
      .filter(a => ['income', 'invoice'].includes(a.activity_type) && a.status === 'paid')
      .reduce((sum, a) => sum + a.amount, 0);

    const totalExpenses = activities
      .filter(a => a.activity_type === 'expense')
      .reduce((sum, a) => sum + a.amount, 0);

    const pendingAmount = activities
      .filter(a => a.status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0);

    const overdueAmount = activities
      .filter(a => a.is_overdue)
      .reduce((sum, a) => sum + a.amount, 0);

    const monthlyData = activities.reduce((acc, activity) => {
      const month = new Date(activity.transaction_date).toLocaleDateString('en-US', { month: 'short' });
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      if (['income', 'invoice'].includes(activity.activity_type) && activity.status === 'paid') {
        acc[month].income += activity.amount;
      } else if (activity.activity_type === 'expense') {
        acc[month].expenses += activity.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    const typeDistribution = activities.reduce((acc, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + activity.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      pendingAmount,
      overdueAmount,
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data
      })),
      typeDistribution: Object.entries(typeDistribution).map(([type, amount]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: amount
      }))
    };
  }, [activities]);

  // Filtered and sorted activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(activity => activity.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof FinancialActivity];
      const bValue = b[sortBy as keyof FinancialActivity];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [activities, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Icons.Dashboard /> },
    { id: 'activities', label: 'All Activities', icon: <Icons.History /> },
    { id: 'analytics', label: 'Analytics', icon: <Icons.TrendUp /> },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Income"
          value={`$${analytics.totalIncome.toLocaleString()}`}
          subtitle="Paid invoices & income"
          icon={<Icons.TrendUp />}
          color="green"
        />
        <StatCard
          title="Total Expenses"
          value={`$${analytics.totalExpenses.toLocaleString()}`}
          subtitle="All recorded expenses"
          icon={<Icons.TrendDown />}
          color="red"
        />
        <StatCard
          title="Net Profit"
          value={`$${analytics.netProfit.toLocaleString()}`}
          subtitle="Income minus expenses"
          icon={<Icons.Money />}
          color={analytics.netProfit >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Pending Amount"
          value={`$${analytics.pendingAmount.toLocaleString()}`}
          subtitle="Awaiting approval/payment"
          icon={<Icons.Clock />}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Monthly Cash Flow
          </h3>
          <BarChart
            data={analytics.monthlyData.map(item => ({
              label: item.month,
              value: item.income - item.expenses,
              color: item.income >= item.expenses ? 'bg-green-500' : 'bg-red-500'
            }))}
            height={250}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Activity Distribution
          </h3>
          <PieChart
            data={analytics.typeDistribution.map((item, index) => ({
              label: item.name,
              value: item.value,
              color: ['text-blue-600', 'text-green-600', 'text-yellow-600', 'text-red-600'][index % 4]
            }))}
            size={200}
          />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activities
          </h3>
          <button
            onClick={() => setActiveTab('activities')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            View All <Icons.ArrowRight />
          </button>
        </div>
        
        <div className="space-y-4">
          {filteredActivities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedActivity(activity);
                setModalMode('view');
                setIsModalOpen(true);
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {activity.activity_type === 'income' ? <Icons.TrendUp /> :
                   activity.activity_type === 'expense' ? <Icons.TrendDown /> :
                   activity.activity_type === 'invoice' ? <Icons.Receipt /> :
                   <Icons.Document />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.reference_number} - {activity.client_name || activity.account_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.formatted_amount}
                </p>
                <StatusBadge status={activity.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActivitiesTab = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 dark:text-white text-sm placeholder-gray-400 transition-all duration-200"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 dark:text-white text-sm transition-all duration-200"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="invoice">Invoice</option>
              <option value="quotation">Quotation</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 dark:text-white text-sm transition-all duration-200"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <QuickActionButton
            label="Add Activity"
            icon={<Icons.Plus />}
            onClick={() => {
              setSelectedActivity(null);
              setModalMode('create');
              setIsModalOpen(true);
            }}
            color="blue"
          />
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client/Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading activities...
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No activities found
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {activity.reference_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.activity_type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        activity.activity_type === 'expense' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        activity.activity_type === 'invoice' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {activity.client_name || activity.account_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {activity.formatted_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={activity.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(activity.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setModalMode('view');
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Icons.Eye />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setModalMode('edit');
                            setIsModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <Icons.Edit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-8">
      {/* Advanced Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Profit Margin"
          value={`${analytics.totalIncome > 0 ? ((analytics.netProfit / analytics.totalIncome) * 100).toFixed(1) : 0}%`}
          subtitle="Net profit percentage"
          icon={<Icons.TrendUp />}
          color="blue"
        />
        <StatCard
          title="Average Deal Size"
          value={`$${activities.length > 0 ? (analytics.totalIncome / activities.filter(a => ['income', 'invoice'].includes(a.activity_type)).length).toFixed(0) : 0}`}
          subtitle="Per transaction"
          icon={<Icons.Money />}
          color="green"
        />
        <StatCard
          title="Overdue Amount"
          value={`$${analytics.overdueAmount.toLocaleString()}`}
          subtitle="Requires attention"
          icon={<Icons.Warning />}
          color="red"
        />
        <StatCard
          title="Active Clients"
          value={new Set(activities.map(a => a.client_name)).size}
          subtitle="Unique clients"
          icon={<Icons.Building />}
          color="purple"
        />
      </div>

      {/* Advanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Income vs Expenses Trend
          </h3>
          <LineChart
            data={analytics.monthlyData.map(item => ({
              label: item.month,
              value: item.income,
              color: 'stroke-green-500'
            }))}
            height={250}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Financial Health Score
          </h3>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-4">
                {Math.min(100, Math.max(0, Math.round((analytics.netProfit / Math.max(analytics.totalIncome, 1)) * 100 + 50)))}
              </div>
              <p className="text-gray-600 dark:text-gray-400">Financial Health Score</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Based on profit margin and cash flow
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Financial Activities
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive financial management and insights
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <QuickActionButton
              label="Export Report"
              icon={<Icons.Download />}
              onClick={() => toast.success('Export feature coming soon!')}
              color="indigo"
            />
            <QuickActionButton
              label="Import Data"
              icon={<Icons.Upload />}
              onClick={() => toast.success('Import feature coming soon!')}
              color="purple"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-8 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'activities' && renderActivitiesTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>

      {/* Activity Modal */}
      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activity={selectedActivity}
        onSave={handleSaveActivity}
        mode={modalMode}
      />
    </div>
  );
};

export default FinancialActivities;
