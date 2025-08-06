import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { financialAPI, FinancialActivity, clientsAPI, Client } from '../services/api';
import projectService, { Project } from '../services/projectService';
import { StatusBadge, QuickActionButton } from '../components/DashboardComponents';
import { toast } from 'react-hot-toast';

// Icon components
const Icons = {
  Receipt: () => <span className="text-lg">🧾</span>,
  CreditCard: () => <span className="text-lg">💳</span>,
  Money: () => <span className="text-lg">💰</span>,
  Document: () => <span className="text-lg">📄</span>,
  History: () => <span className="text-lg">📝</span>,
  Filter: () => <span className="text-lg">🔍</span>,
  Plus: () => <span className="text-lg">➕</span>,
  Download: () => <span className="text-lg">⬇️</span>,
  Edit: () => <span className="text-lg">✏️</span>,
  Delete: () => <span className="text-lg">🗑️</span>,
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
  Search: () => <span className="text-lg">🔍</span>,
  Sort: () => <span className="text-lg">🔄</span>,
  FileText: () => <span className="text-lg">📋</span>,
};

// Modal Component for Activity Details
interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: FinancialActivity | null;
  onSave?: (activity: Partial<FinancialActivity>) => void;
  mode?: 'view' | 'edit' | 'create';
  clients?: Client[];
  projects?: Project[];
}

const ActivityModal: React.FC<ActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  activity, 
  onSave, 
  mode = 'view',
  clients = [],
  projects = []
}) => {
  const [formData, setFormData] = useState<Partial<FinancialActivity>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activity) {
      setFormData(activity);
    } else {
      setFormData({
        activity_type: 'receivable',
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View'} Financial Activity
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-rose-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <Icons.X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Activity Type
              </label>
              <select
                value={formData.activity_type || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, activity_type: e.target.value as 'receivable' | 'payable' | 'expense' | 'income' }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 font-medium transition-colors duration-200"
              >
                <option value="">Select Activity Type</option>
                <option value="income">Income</option>
                <option value="expense">Expense (with Project Tracking)</option>
                <option value="receivable">Receivable</option>
                <option value="payable">Payable (with Project Tracking)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 font-medium transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                Client
              </label>
              <select
                value={formData.client || ''}
                onChange={(e) => {
                  const clientId = parseInt(e.target.value);
                  const selectedClient = clients.find(c => c.id === clientId);
                  setFormData(prev => ({ 
                    ...prev, 
                    client: clientId,
                    client_name: selectedClient?.name || ''
                  }));
                }}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 font-medium transition-colors duration-200"
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project (Optional)
              </label>
              <select
                value={formData.project || ''}
                onChange={(e) => {
                  const projectId = e.target.value ? parseInt(e.target.value) : undefined;
                  const selectedProject = projects.find(p => p.id === projectId);
                  setFormData(prev => ({ 
                    ...prev, 
                    project: projectId,
                    project_name: selectedProject?.name || '',
                    project_number: selectedProject?.project_number || ''
                  }));
                }}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="">Select a project (optional)</option>
                {projects
                  .filter(project => !formData.client || project.client === formData.client)
                  .map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.project_number})
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Link this activity to a specific project for better tracking and analytics
              </p>
            </div>

            {(formData.activity_type === 'expense' || formData.activity_type === 'payable') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {formData.activity_type === 'expense' ? 'Project Quotation ID' : 'Project Invoice ID'}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  value={formData.project_quotation || formData.project_invoice || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    if (formData.activity_type === 'expense') {
                      setFormData(prev => ({ ...prev, project_quotation: value }));
                    } else {
                      setFormData(prev => ({ ...prev, project_invoice: value }));
                    }
                  }}
                  placeholder={`Enter ${formData.activity_type === 'expense' ? 'quotation' : 'invoice'} number for project tracking`}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <strong>Required:</strong> Track this {formData.activity_type} against a specific project/client {formData.activity_type === 'expense' ? 'quotation' : 'invoice'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'pending' | 'approved' | 'rejected' | 'paid' | 'overdue' | 'cancelled' }))}
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
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 disabled:from-indigo-400 disabled:to-blue-400 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
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
  const [activities, setActivities] = useState<FinancialActivity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activities');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy] = useState('transaction_date');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedActivity, setSelectedActivity] = useState<FinancialActivity | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [balanceSheetLoading, setBalanceSheetLoading] = useState(false);

  useEffect(() => {
    fetchActivities();
    fetchClients();
    fetchProjects();
  }, []);

  // Fetch balance sheet when balance sheet tab is selected
  useEffect(() => {
    if (activeTab === 'balance-sheet') {
      fetchBalanceSheet();
    }
  }, [activeTab]);

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

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to load clients');
      setClients([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects();
      setProjects(response.results || response || []);
    } catch (error) {
      console.error('Failed to load projects');
      setProjects([]);
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

  const handleDeleteActivity = async (activityId: number, activityRef: string) => {
    if (!window.confirm(`Are you sure you want to delete activity ${activityRef}? This action cannot be undone.`)) {
      return;
    }

    try {
      await financialAPI.deleteActivity(activityId);
      toast.success('Activity deleted successfully');
      fetchActivities(); // Refresh the list
    } catch (error: any) {
      toast.error(`Failed to delete activity: ${error.response?.data?.detail || error.message}`);
    }
  };

  const fetchBalanceSheet = async () => {
    try {
      setBalanceSheetLoading(true);
      const response = await financialAPI.getBalanceSheet();
      setBalanceSheet(response.data);
    } catch (error: any) {
      toast.error(`Failed to load balance sheet: ${error.response?.data?.detail || error.message}`);
      setBalanceSheet(null);
    } finally {
      setBalanceSheetLoading(false);
    }
  };

  // Computed data for specific activity types
  const receivables = useMemo(() => {
    return activities.filter(a => a.activity_type === 'receivable');
  }, [activities]);

  const payables = useMemo(() => {
    return activities.filter(a => a.activity_type === 'payable');
  }, [activities]);

  const expenses = useMemo(() => {
    return activities.filter(a => a.activity_type === 'expense');
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
        return (aValue || 0) > (bValue || 0) ? 1 : -1;
      } else {
        return (aValue || 0) < (bValue || 0) ? 1 : -1;
      }
    });
  }, [activities, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  const tabs = [
    { id: 'activities', label: 'All Activities', icon: <Icons.History /> },
    { id: 'receivables', label: 'Receivables', icon: <Icons.Money /> },
    { id: 'payables', label: 'Payables', icon: <Icons.CreditCard /> },
    { id: 'expenses', label: 'Expenses', icon: <Icons.Receipt /> },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: <Icons.Document /> },
  ];

  const renderActivitiesTab = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                        activity.activity_type === 'receivable' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
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
                          title="View activity"
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
                          title="Edit activity"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id, activity.reference_number)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete activity"
                        >
                          <Icons.Delete />
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

  const renderReceivablesTab = () => (
    <div className="space-y-6">
      {/* Receivables Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Receivables Management
          </h3>
          <QuickActionButton
            label="New Receivable"
            icon={<Icons.Plus />}
            onClick={() => {
              setSelectedActivity(null);
              setModalMode('create');
              setIsModalOpen(true);
            }}
            color="blue"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {receivables.map((receivable) => (
                <tr key={receivable.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {receivable.reference_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {receivable.client_name || receivable.account_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {receivable.formatted_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {receivable.due_date ? new Date(receivable.due_date).toLocaleDateString() : 'No due date'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={receivable.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedActivity(receivable);
                          setModalMode('view');
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                        title="View receivable"
                      >
                        <Icons.Eye />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedActivity(receivable);
                          setModalMode('edit');
                          setIsModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                        title="Edit receivable"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(receivable.id, receivable.reference_number)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                        title="Delete receivable"
                      >
                        <Icons.Delete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {receivables.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No receivables found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPayablesTab = () => (
    <div className="space-y-6">
      {/* Payables Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payables Management
          </h3>
          <QuickActionButton
            label="New Payable"
            icon={<Icons.Plus />}
            onClick={() => {
              setSelectedActivity(null);
              setModalMode('create');
              setIsModalOpen(true);
            }}
            color="blue"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vendor/Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payables.map((payable) => (
                <tr key={payable.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {payable.reference_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {payable.account_name || payable.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {payable.formatted_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {payable.due_date ? new Date(payable.due_date).toLocaleDateString() : 'No due date'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={payable.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedActivity(payable);
                          setModalMode('view');
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                        title="View payable"
                      >
                        <Icons.Eye />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedActivity(payable);
                          setModalMode('edit');
                          setIsModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                        title="Edit payable"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(payable.id, payable.reference_number)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                        title="Delete payable"
                      >
                        <Icons.Delete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {payables.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No payables found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExpensesTab = () => (
    <div className="space-y-6">
      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Expense Management
          </h3>
          <QuickActionButton
            label="New Expense"
            icon={<Icons.Plus />}
            onClick={() => {
              setSelectedActivity(null);
              setModalMode('create');
              setIsModalOpen(true);
            }}
            color="green"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {expense.description}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {expense.reference_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {expense.formatted_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(expense.transaction_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={expense.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedActivity(expense);
                          setModalMode('view');
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                        title="View expense"
                      >
                        <Icons.Eye />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedActivity(expense);
                          setModalMode('edit');
                          setIsModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                        title="Edit expense"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(expense.id, expense.reference_number)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                        title="Delete expense"
                      >
                        <Icons.Delete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No expenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBalanceSheetTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Balance Sheet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Real-time balance sheet with assets, liabilities, and equity breakdown
            </p>
          </div>
          <QuickActionButton
            label={balanceSheetLoading ? "Loading..." : "Refresh Balance Sheet"}
            icon={<Icons.Plus />}
            onClick={() => fetchBalanceSheet()}
            color="blue"
            disabled={balanceSheetLoading}
          />
        </div>

        {balanceSheetLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading balance sheet...</p>
          </div>
        ) : balanceSheet ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assets */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
                📈 Assets
              </h4>
              <div className="space-y-2">
                {balanceSheet.assets && Object.entries(balanceSheet.assets).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-green-700 dark:text-green-300 capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      {typeof value === 'number' ? `Rs ${value.toLocaleString()}` : value}
                    </span>
                  </div>
                ))}
                <div className="border-t border-green-200 dark:border-green-700 pt-2 mt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-green-800 dark:text-green-200">Total Assets</span>
                    <span className="text-green-800 dark:text-green-200">
                      Rs {balanceSheet.total_assets?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
                📉 Liabilities
              </h4>
              <div className="space-y-2">
                {balanceSheet.liabilities && Object.entries(balanceSheet.liabilities).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-red-700 dark:text-red-300 capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="font-medium text-red-800 dark:text-red-200">
                      {typeof value === 'number' ? `Rs ${value.toLocaleString()}` : value}
                    </span>
                  </div>
                ))}
                <div className="border-t border-red-200 dark:border-red-700 pt-2 mt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-red-800 dark:text-red-200">Total Liabilities</span>
                    <span className="text-red-800 dark:text-red-200">
                      Rs {balanceSheet.total_liabilities?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Equity */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                💰 Equity
              </h4>
              <div className="space-y-2">
                {balanceSheet.equity && Object.entries(balanceSheet.equity).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-blue-700 dark:text-blue-300 capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      {typeof value === 'number' ? `Rs ${value.toLocaleString()}` : value}
                    </span>
                  </div>
                ))}
                <div className="border-t border-blue-200 dark:border-blue-700 pt-2 mt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-blue-800 dark:text-blue-200">Total Equity</span>
                    <span className="text-blue-800 dark:text-blue-200">
                      Rs {balanceSheet.total_equity?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Icons.Document />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">
              No Balance Sheet Data
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Click "Refresh Balance Sheet" to generate current financial position
            </p>
          </div>
        )}

        {/* Balance Sheet Summary */}
        {balanceSheet && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📊 Balance Sheet Equation
            </h5>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="text-green-600 dark:text-green-400 font-medium">
                Assets: Rs {balanceSheet.total_assets?.toLocaleString() || '0'}
              </div>
              <span className="text-gray-500">=</span>
              <div className="text-red-600 dark:text-red-400 font-medium">
                Liabilities: Rs {balanceSheet.total_liabilities?.toLocaleString() || '0'}
              </div>
              <span className="text-gray-500">+</span>
              <div className="text-blue-600 dark:text-blue-400 font-medium">
                Equity: Rs {balanceSheet.total_equity?.toLocaleString() || '0'}
              </div>
            </div>
            
            {/* Validation */}
            <div className="mt-3 text-center">
              {Math.abs((balanceSheet.total_assets || 0) - ((balanceSheet.total_liabilities || 0) + (balanceSheet.total_equity || 0))) < 0.01 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  ✅ Balance Sheet is Balanced
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  ⚠️ Balance Sheet is Out of Balance
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:text-white">
              Financial Activities
            </h1>
            <p className="text-slate-600 dark:text-gray-400 mt-1 font-medium">
              Manage and track all financial transactions and activities
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:bg-blue-900/20 border border-indigo-200 dark:border-blue-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="text-sm font-semibold text-indigo-800 dark:text-blue-200">
                    Looking for performance insights?
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-blue-400">
                    Visit <Link to="/analytics" className="underline hover:no-underline font-bold text-blue-600">Analytics</Link> for charts and business performance metrics.
                  </p>
                </div>
              </div>
            </div>
            
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
        {activeTab === 'activities' && renderActivitiesTab()}
        {activeTab === 'receivables' && renderReceivablesTab()}
        {activeTab === 'payables' && renderPayablesTab()}
        {activeTab === 'expenses' && renderExpensesTab()}
        {activeTab === 'balance-sheet' && renderBalanceSheetTab()}
      </div>

      {/* Activity Modal */}
      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activity={selectedActivity}
        onSave={handleSaveActivity}
        mode={modalMode}
        clients={clients}
        projects={projects}
      />
    </div>
  );
};

export default FinancialActivities;
