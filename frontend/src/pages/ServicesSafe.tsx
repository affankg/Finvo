import { useState, useEffect } from 'react';
import { servicesAPI, Service } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ServicesSafe = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
  });

  // Safe auth hook usage
  let user = null;
  let canEdit = false;
  
  try {
    const authContext = useAuth();
    user = authContext.user;
    canEdit = user?.role === 'admin' || user?.role === 'sales';
  } catch (error) {
    console.error('Auth context error:', error);
    setError('Authentication error');
  }

  useEffect(() => {
    fetchServices();
  }, [searchTerm]);

  const fetchServices = async () => {
    try {
      setError(null);
      console.log('Fetching services...');
      const response = await servicesAPI.getAll(searchTerm || undefined);
      console.log('Services fetched:', response.data);
      setServices(response.data);
    } catch (error) {
      console.error('Services fetch error:', error);
      setError('Failed to fetch services');
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong>{error}
          <button 
            onClick={() => window.location.reload()} 
            className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-4 text-gray-600 dark:text-gray-300">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Services (Safe Mode)</h1>
        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <span>+</span>
            <span>Add Service</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Services List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {services.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No services found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  {canEdit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {service.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${parseFloat(service.price).toFixed(2)}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          onClick={() => console.log('Edit service:', service.id)}
                        >
                          Edit
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => console.log('Delete service:', service.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Debug info */}
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
        <div>User: {user ? `${user.username} (${user.role})` : 'Not logged in'}</div>
        <div>Can Edit: {canEdit ? 'Yes' : 'No'}</div>
        <div>Services Count: {services.length}</div>
      </div>
    </div>
  );
};

export default ServicesSafe;
