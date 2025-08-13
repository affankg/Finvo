import React, { useState, useEffect } from 'react';
import QuotationActions from './QuotationActions';
import { Project } from '../services/projectService_fixed';

interface Quotation {
  id: number;
  quotation_number: string;
  client_name: string;
  project_title: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  created_at: string;
  valid_until: string;
  description?: string;
  items?: QuotationItem[];
}

interface QuotationItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'converted'>('all');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          const mockQuotations: Quotation[] = [
            {
              id: 1,
              quotation_number: 'QUO-2024-001',
              client_name: 'Tech Corp Ltd',
              project_title: 'Website Redesign Project',
              total_amount: 15000.00,
              status: 'pending',
              created_at: '2024-01-15T10:00:00Z',
              valid_until: '2024-02-15T23:59:59Z',
              description: 'Complete website redesign with modern UI/UX'
            },
            {
              id: 2,
              quotation_number: 'QUO-2024-002',
              client_name: 'StartupX Inc',
              project_title: 'Mobile App Development',
              total_amount: 25000.00,
              status: 'approved',
              created_at: '2024-01-10T14:30:00Z',
              valid_until: '2024-02-10T23:59:59Z',
              description: 'Native mobile app for iOS and Android'
            },
            {
              id: 3,
              quotation_number: 'QUO-2024-003',
              client_name: 'Enterprise Solutions',
              project_title: 'ERP System Integration',
              total_amount: 45000.00,
              status: 'converted',
              created_at: '2024-01-05T09:15:00Z',
              valid_until: '2024-02-05T23:59:59Z',
              description: 'Custom ERP integration with existing systems'
            }
          ];
          setQuotations(mockQuotations);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load quotations');
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  const handleQuotationUpdate = (updatedQuotation: any) => {
    setQuotations(prev => 
      prev.map(q => q.id === updatedQuotation.id ? { ...q, ...updatedQuotation } : q)
    );
  };

  const handleProjectCreated = (project: Project) => {
    console.log('Project created from quotation:', project);
    // Optionally show a notification or redirect
  };

  const filteredQuotations = quotations.filter(q => 
    filter === 'all' || q.status === filter
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      converted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quotation Management
        </h2>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          New Quotation
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Quotations' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'converted', label: 'Converted' },
            { key: 'rejected', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs">
                {tab.key === 'all' 
                  ? quotations.length 
                  : quotations.filter(q => q.status === tab.key).length
                }
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Quotations List */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        {filteredQuotations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No quotations found for the selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto table-container">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quotation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client & Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredQuotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {quotation.quotation_number}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(quotation.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {quotation.client_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {quotation.project_title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(quotation.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(quotation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(quotation.valid_until)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <QuotationActions
                        quotationId={quotation.id}
                        quotationNumber={quotation.quotation_number}
                        quotationStatus={quotation.status}
                        onQuotationUpdate={handleQuotationUpdate}
                        onProjectCreated={handleProjectCreated}
                        showCreateProjectOption={true}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationManagement;
