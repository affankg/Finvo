import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import projectService, { Project } from '../services/projectService_fixed';
import { api, Client } from '../services/api';

interface CreateProjectFormData {
  name: string;
  client: number | '';
  project_type: string;
  start_date: string;
  end_date: string;
  estimated_completion_date: string;
  description: string;
  location: string;
  status: string;
  priority: string;
  budget: string;
  currency: string;
  project_manager: number | '';
}

const Projects: React.FC = () => {
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProjectFormData>({
    name: '',
    client: '',
    project_type: 'construction',
    start_date: '',
    end_date: '',
    estimated_completion_date: '',
    description: '',
    location: '',
    status: 'planning',
    priority: 'medium',
    budget: '',
    currency: 'PKR',
    project_manager: '',
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const projectTypeOptions = [
    { value: 'construction', label: 'Construction' },
    { value: 'service', label: 'Service' },
    { value: 'rebuilding', label: 'Rebuilding' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'design', label: 'Design' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'other', label: 'Other' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const statusCreateOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' }
  ];

  const statusColors = {
    planning: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchUsers();
  }, [selectedClient, selectedStatus, searchTerm]);

  // Check for create parameter in URL and auto-open modal
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('create') === 'true') {
      setShowCreateModal(true);
      // Clean up the URL parameter to avoid reopening on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const params: any = {};
      if (selectedClient) params.client = parseInt(selectedClient);
      if (selectedStatus) params.status = selectedStatus;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      console.log('Fetching projects with params:', params);
      const data = await projectService.getProjects(params);
      console.log('Projects fetched successfully:', data);
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(data)) {
        setProjects(data);
      } else if (data.results && Array.isArray(data.results)) {
        setProjects(data.results);
      } else {
        console.warn('Unexpected data format:', data);
        setProjects([]);
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Failed to fetch projects';
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setProjects([]); // Clear projects on error
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients/');
      setClients(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectService.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      toast.success('Project deleted successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete project';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Project name is required');
        setCreateLoading(false);
        return;
      }
      
      if (!formData.client) {
        toast.error('Client selection is required');
        setCreateLoading(false);
        return;
      }
      
      if (!formData.start_date) {
        toast.error('Start date is required');
        setCreateLoading(false);
        return;
      }

      const projectData = {
        ...formData,
        client: parseInt(formData.client.toString()),
        project_manager: formData.project_manager ? parseInt(formData.project_manager.toString()) : undefined,
        budget: formData.budget || '0',
        status: formData.status as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'critical',
        // Handle optional date fields - send null instead of empty strings
        end_date: formData.end_date || null,
        estimated_completion_date: formData.estimated_completion_date || null,
      };

      console.log('Creating project with data:', projectData);
      const newProject = await projectService.createProject(projectData);
      setProjects([newProject, ...projects]);
      setShowCreateModal(false);
      resetForm();
      setError('');
      toast.success('Project created successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create project';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error creating project:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      client: '',
      project_type: 'construction',
      start_date: '',
      end_date: '',
      estimated_completion_date: '',
      description: '',
      location: '',
      status: 'planning',
      priority: 'medium',
      budget: '',
      currency: 'PKR',
      project_manager: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: string, currency: string) => {
    const currencySymbols: { [key: string]: string } = {
      'PKR': 'Rs',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return `${currencySymbols[currency] || currency} ${parseFloat(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track and manage engineering projects efficiently
            </p>
          </div>
          <div className="flex space-x-3">
            {projects.length > 0 && (
              <Link
                to={`/projects/${projects[0].id}`}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                → Next Project
              </Link>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Projects
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, code, or description..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div 
              key={project.id} 
              className="group relative bg-gradient-to-br from-white via-white to-gray-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700/30 rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ease-out overflow-hidden backdrop-blur-sm"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: 'slideInUp 0.6s ease-out forwards'
              }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Status Indicator Stripe */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                project.status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                project.status === 'planning' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                project.status === 'on_hold' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                project.status === 'completed' ? 'bg-gradient-to-r from-purple-400 to-violet-500' :
                'bg-gradient-to-r from-red-400 to-pink-500'
              }`}></div>

              <div className="relative p-8">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg font-bold">🏢</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                          {project.name}
                        </h3>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full inline-block">
                          {project.project_number}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Priority Badge */}
                  <div className="flex-shrink-0 ml-4">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border ${
                      project.priority === 'critical' ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-300 dark:border-red-700/50' :
                      project.priority === 'high' ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 dark:text-orange-300 dark:border-orange-700/50' :
                      project.priority === 'medium' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700/50' :
                      'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200 dark:from-gray-700/30 dark:to-gray-600/30 dark:text-gray-300 dark:border-gray-600/50'
                    }`}>
                      {priorityOptions.find(p => p.value === project.priority)?.label || project.priority}
                    </span>
                  </div>
                </div>

                {/* Status and Client Row */}
                <div className="flex items-center justify-between mb-6 bg-gray-50/80 dark:bg-gray-700/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${
                      project.status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      project.status === 'planning' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                      project.status === 'on_hold' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      project.status === 'completed' ? 'bg-gradient-to-r from-purple-400 to-violet-500' :
                      'bg-gradient-to-r from-red-400 to-pink-500'
                    } animate-pulse`}></div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      statusColors[project.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">👤</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {project.client_name}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                )}

                {/* Project Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">💰</span>
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">Budget</span>
                    </div>
                    <div className="text-lg font-bold text-green-800 dark:text-green-200">
                      {formatCurrency(project.budget, project.currency)}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">📅</span>
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Start Date</span>
                    </div>
                    <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                      {formatDate(project.start_date)}
                    </div>
                  </div>
                  
                  {project.end_date && (
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">🏁</span>
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">End Date</span>
                      </div>
                      <div className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                        {formatDate(project.end_date)}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-orange-200/50 dark:border-orange-700/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">👨‍💼</span>
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Manager</span>
                    </div>
                    <div className="text-sm font-semibold text-orange-800 dark:text-orange-200 truncate">
                      {project.project_manager_name || 'Not assigned'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-xl text-sm font-semibold text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                  >
                    <span className="text-base">📊</span>
                    <span>View Dashboard</span>
                  </Link>
                  <Link
                    to={`/projects/${project.id}/edit`}
                    className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 flex items-center justify-center"
                  >
                    <span className="text-base">✏️</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="px-4 py-3 border-2 border-red-300 dark:border-red-600 rounded-xl text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400 dark:hover:border-red-500 transition-all duration-300 flex items-center justify-center"
                  >
                    <span className="text-base">🗑️</span>
                  </button>
                </div>
              </div>

              {/* Hover Effect Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/10 via-transparent to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {projects.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No projects found</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {searchTerm || selectedClient || selectedStatus 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first project.'
              }
            </p>
            {!searchTerm && !selectedClient && !selectedStatus && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Project</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter project name"
                      />
                    </div>

                    {/* Client */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Client *
                      </label>
                      <select
                        name="client"
                        value={formData.client}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select a client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Project Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Type *
                      </label>
                      <select
                        name="project_type"
                        value={formData.project_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {projectTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {statusCreateOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {priorityOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Budget
                      </label>
                      <div className="flex">
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="PKR">PKR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                        <input
                          type="number"
                          name="budget"
                          value={formData.budget}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Project Manager */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Manager
                      </label>
                      <select
                        name="project_manager"
                        value={formData.project_manager}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select project manager</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Location */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Project location or address"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Detailed project description and scope"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center"
                    >
                      {createLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Create Project'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Project Tiles Animations and Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Enhanced Purple Scrollbar for entire app */
          html, body, * {
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

          /* Project tile animations */
          @keyframes slideInUp {
            0% {
              opacity: 0;
              transform: translateY(40px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%) skewX(-12deg);
            }
            100% {
              transform: translateX(200%) skewX(-12deg);
            }
          }

          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 5px rgba(139, 92, 246, 0.3);
            }
            50% {
              box-shadow: 0 0 20px rgba(139, 92, 246, 0.6), 0 0 30px rgba(139, 92, 246, 0.4);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-10px) rotate(2deg);
            }
          }

          /* Text clamp utility */
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* Enhanced gradient animation */
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

          /* Custom focus styles for accessibility */
          .focus-purple:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
            border-color: rgba(139, 92, 246, 0.5);
          }

          /* Enhanced card hover effects */
          .project-card:hover {
            animation: float 6s ease-in-out infinite;
          }

          /* Smooth transitions for all elements */
          * {
            transition: all 0.3s ease;
          }

          /* Custom backdrop blur for modern glass effect */
          .backdrop-blur-custom {
            backdrop-filter: blur(12px) saturate(150%);
            -webkit-backdrop-filter: blur(12px) saturate(150%);
          }
        `
      }} />
    </div>
  );
};

export default Projects;
