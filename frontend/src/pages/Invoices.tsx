import { useState, useEffect } from 'react';
import { invoicesAPI, clientsAPI, servicesAPI, currencyAPI, Invoice, Client, Service, Currency, CurrencyResponse } from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import EnhancedCreateInvoiceModal from '../components/EnhancedCreateInvoiceModal';
import BulkDeleteToolbar from '../components/BulkDeleteToolbar';
import BulkDeleteConfirmation from '../components/BulkDeleteConfirmation';

interface InvoiceItem {
  service_id: number;
  quantity: number;
  price: number;
  description: string;
  tax_type: 'none' | 'gst_18' | 'gst_17' | 'srb_15';
}

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState('PKR');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    po_number: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    currency: 'PKR',
    notes: '',
    items: [] as InvoiceItem[],
  });

  const canEdit = user?.role === 'admin' || user?.role === 'sales' || user?.role === 'accountant';

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchServices();
    fetchCurrencies();
  }, [searchTerm, statusFilter]);

  const fetchInvoices = async () => {
    try {
      const response = await invoicesAPI.getAll(searchTerm || undefined, statusFilter || undefined);
      // Handle paginated response
      if (response && response.data && response.data.results && Array.isArray(response.data.results)) {
        setInvoices(response.data.results);
      } else if (response && response.data && Array.isArray(response.data)) {
        setInvoices(response.data);
      } else {
        setInvoices([]);
        toast.error('Invalid data format received');
      }
    } catch (error) {
      setInvoices([]);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data.results || []);
    } catch (error) {
      setClients([]);
      toast.error('Failed to fetch clients');
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await currencyAPI.getChoices();
      const currencyData = response.data as CurrencyResponse;
      setCurrencies(currencyData.currencies);
      setDefaultCurrency(currencyData.default);
      setFormData(prev => ({ ...prev, currency: currencyData.default }));
    } catch (error) {
      // Use fallback currency data
      const fallbackCurrencies: Currency[] = [
        { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' }
      ];
      setCurrencies(fallbackCurrencies);
      setDefaultCurrency('PKR');
      setFormData(prev => ({ ...prev, currency: 'PKR' }));
    }
  };

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data.results || []);
    } catch (error) {
      setServices([]);
      toast.error('Failed to fetch services');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      if (newStatus === 'approved') {
        await invoicesAPI.approve(id);
        toast.success('Invoice approved successfully');
      } else if (newStatus === 'rejected') {
        const reason = window.prompt('Please provide a reason for rejection (optional):');
        await invoicesAPI.reject(id, reason || '');
        toast.success('Invoice rejected');
      } else if (newStatus === 'paid') {
        await invoicesAPI.markAsPaid(id);
        toast.success('Invoice marked as paid');
      } else {
        // For other status changes, use the update method
        await invoicesAPI.update(id, { status: newStatus as any });
        toast.success(`Invoice status updated to ${newStatus}`);
      }
      fetchInvoices();
    } catch (error) {
      toast.error(`Failed to update invoice status to ${newStatus}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'paid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    let invoiceData: any = null; // Declare outside try block for error handling

    try {
      // Validate required fields
      if (!formData.client_id || formData.client_id === '') {
        toast.error('Please select a client');
        return;
      }

      if (!formData.date) {
        toast.error('Please select an invoice date');
        return;
      }

      if (!formData.due_date) {
        toast.error('Please select a due date');
        return;
      }

      const clientId = parseInt(formData.client_id);
      if (isNaN(clientId)) {
        toast.error('Invalid client selected');
        return;
      }

      invoiceData = {
        client: clientId,
        po_number: formData.po_number || '', // Ensure it's not null
        date: formData.date,
        due_date: formData.due_date,
        status: formData.status as 'draft' | 'sent' | 'pending' | 'approved' | 'rejected' | 'paid' | 'overdue' | 'cancelled',
        currency: formData.currency,
        notes: formData.notes || '', // Ensure it's not null
        items: formData.items.map(item => {
          const serviceId = parseInt(item.service_id.toString());
          if (isNaN(serviceId)) {
            throw new Error(`Invalid service selected for item: ${item.description}`);
          }
          
          return {
            service: serviceId,
            quantity: parseInt(item.quantity.toString()) || 1,
            price: parseFloat(item.price.toString()).toFixed(2), // Ensure proper decimal format
            description: item.description || '',
            tax_type: item.tax_type || 'none', // Default tax type
          };
        }),
      };

      // Additional validation
      console.log('Invoice data being sent:', invoiceData);

      if (editingInvoice) {
        await invoicesAPI.update(editingInvoice.id, invoiceData);
        toast.success('Invoice updated successfully');
      } else {
        await invoicesAPI.create(invoiceData);
        toast.success('Invoice created successfully');
      }
      setIsModalOpen(false);
      setEditingInvoice(null);
      resetForm();
      fetchInvoices();
    } catch (error: any) {
      console.error('Invoice save error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Invoice data that was sent:', invoiceData);
      
      // Extract detailed error messages
      let errorMessage = 'Failed to save invoice';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors
        if (typeof errorData === 'object') {
          const errorMessages = [];
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('; ');
          }
        } else if (errorData.error || errorData.detail) {
          errorMessage = errorData.error || errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      po_number: '',
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      currency: defaultCurrency,
      notes: '',
      items: [],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { service_id: 0, quantity: 1, price: 0, description: '', tax_type: 'none' }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-populate price when service is selected
    if (field === 'service_id') {
      const service = services.find(s => s.id === parseInt(value));
      if (service) {
        updatedItems[index].price = parseFloat(service.price); // Convert string to number for form
      }
    }
    
    setFormData({ ...formData, items: updatedItems });
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      client_id: invoice.client.toString(), // client is already a number (ID)
      po_number: invoice.po_number || '',
      date: invoice.date,
      due_date: invoice.due_date,
      status: invoice.status,
      currency: invoice.currency || defaultCurrency,
      notes: invoice.notes,
      items: invoice.items?.map(item => ({
        service_id: item.service, // service is already a number (ID)
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        description: item.description,
        tax_type: (item.tax_type as 'none' | 'gst_18' | 'gst_17' | 'srb_15') || 'none',
      })) || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoicesAPI.delete(id);
        toast.success('Invoice deleted successfully');
        fetchInvoices();
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const handleSelectInvoice = (invoiceId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleSelectAllInvoices = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setBulkDeleteLoading(true);
      await invoicesAPI.bulkDelete(selectedInvoices);
      toast.success(`Successfully deleted ${selectedInvoices.length} invoices`);
      setSelectedInvoices([]);
      setShowBulkDeleteConfirm(false);
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to delete selected invoices');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedInvoices([]);
  };

  const generatePDF = async (id: number) => {
    try {
      const response = await invoicesAPI.generatePDF(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const openModal = () => {
    setEditingInvoice(null);
    resetForm();
    setIsModalOpen(true);
  };

  const getSubtotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const getTotalTaxAmount = () => {
    return formData.items.reduce((sum, item) => {
      const subtotal = item.quantity * item.price;
      const taxRate = item.tax_type === 'gst_18' ? 0.18 : item.tax_type === 'gst_17' ? 0.17 : item.tax_type === 'srb_15' ? 0.15 : 0;
      return sum + (subtotal * taxRate);
    }, 0);
  };

  const getTotalAmount = () => {
    return getSubtotalAmount() + getTotalTaxAmount();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
        {canEdit && (
          <div className="flex space-x-3">
            <button
              onClick={openModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <span>+</span>
              <span>Create Invoice</span>
            </button>
            <button
              onClick={() => setIsQuotationModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <span>📄</span>
              <span>From Quotation</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Centered Search Bar */}
        <div className="flex justify-center">
          <div className="w-full max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-800 dark:text-white text-sm placeholder-gray-400 transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Status Filter */}
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-800 dark:text-white text-sm transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Delete Toolbar */}
      <BulkDeleteToolbar
        selectedCount={selectedInvoices.length}
        onDeleteSelected={handleBulkDelete}
        onClearSelection={clearSelection}
        loading={bulkDeleteLoading}
        entityType="invoices"
      />

      {/* Invoices Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
                  onChange={(e) => handleSelectAllInvoices(e.target.checked)}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                PO Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {invoice.client_name || 'Unknown Client'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {invoice.po_number || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(invoice.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {invoice.formatted_total || `${invoice.currency_symbol || 'Rs'}${invoice.total_amount ? parseFloat(invoice.total_amount).toFixed(2) : '0.00'}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      onClick={() => generatePDF(invoice.id)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors"
                      title="Download PDF"
                    >
                      PDF
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded transition-colors"
                          title="Edit Invoice"
                        >
                          Edit
                        </button>
                        
                        {/* Quick Status Change Dropdown */}
                        {(invoice.status !== 'paid' && invoice.status !== 'cancelled') && (
                          <div className="relative">
                            <select
                              value={invoice.status}
                              onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              title="Change Status"
                            >
                              <option value="draft">Draft</option>
                              <option value="sent">Sent</option>
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors"
                          title="Delete Invoice"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No invoices found.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl m-4 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client
                  </label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PO Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter PO Number (optional)"
                    value={formData.po_number}
                    onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Add Item
                  </button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-300 dark:border-gray-600 rounded p-4 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Service</label>
                        <select
                          value={item.service_id}
                          onChange={(e) => updateItem(index, 'service_id', parseInt(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value={0}>Select service</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price === 0 ? '' : item.price}
                          onChange={(e) => updateItem(index, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Item description"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tax</label>
                      <select
                        value={item.tax_type}
                        onChange={(e) => updateItem(index, 'tax_type', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="none">No Tax</option>
                        <option value="gst_18">GST 18%</option>
                        <option value="gst_17">GST 17%</option>
                        <option value="srb_15">SRB 15%</option>
                      </select>
                    </div>
                    <div className="text-right mt-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Subtotal: {currencies.find(c => c.code === formData.currency)?.symbol || 'Rs'}{(item.quantity * item.price).toFixed(2)}
                        {item.tax_type !== 'none' && (
                          <>
                            <br />Tax ({item.tax_type === 'gst_18' ? 'GST 18%' : item.tax_type === 'gst_17' ? 'GST 17%' : 'SRB 15%'}): {currencies.find(c => c.code === formData.currency)?.symbol || 'Rs'}{((item.quantity * item.price) * (item.tax_type === 'gst_18' ? 0.18 : item.tax_type === 'gst_17' ? 0.17 : 0.15)).toFixed(2)}
                          </>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        Total: {currencies.find(c => c.code === formData.currency)?.symbol || 'Rs'}
                        {(() => {
                          const subtotal = item.quantity * item.price;
                          const taxRate = item.tax_type === 'gst_18' ? 0.18 : item.tax_type === 'gst_17' ? 0.17 : item.tax_type === 'srb_15' ? 0.15 : 0;
                          return (subtotal + (subtotal * taxRate)).toFixed(2);
                        })()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {formData.items.length > 0 && (
                  <div className="space-y-2 text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Subtotal: {currencies.find(c => c.code === formData.currency)?.symbol || 'Rs'}{getSubtotalAmount().toFixed(2)}
                    </div>
                    {getTotalTaxAmount() > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Tax: {currencies.find(c => c.code === formData.currency)?.symbol || 'Rs'}{getTotalTaxAmount().toFixed(2)}
                      </div>
                    )}
                    <div className="text-lg font-bold text-gray-900 dark:text-white border-t pt-2">
                      Grand Total: {currencies.find(c => c.code === formData.currency)?.symbol || 'Rs'}{getTotalAmount().toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingInvoice ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Create Invoice from Quotation Modal */}
      <EnhancedCreateInvoiceModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        onSuccess={() => {
          fetchInvoices();
        }}
      />

      {/* Bulk Delete Confirmation Modal */}
      <BulkDeleteConfirmation
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        selectedCount={selectedInvoices.length}
        entityType="invoices"
        loading={bulkDeleteLoading}
      />
    </div>
  );
};

export default Invoices;
