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

  const handleStatusChange = async (id: number, newStatus: 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled') => {
    try {
      // Use the general update method for all status changes
      await invoicesAPI.update(id, { status: newStatus });
      toast.success(`Invoice status updated to ${newStatus}`);
      fetchInvoices(); // Refresh the list
    } catch (error: any) {
      console.error('Status update error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.response?.data?.error ||
                          error.message || 
                          'Unknown error';
      toast.error(`Failed to update invoice status: ${errorMessage}`);
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
        status: formData.status as 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled',
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
              className="relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl flex items-center space-x-3 transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:-translate-y-1 font-semibold"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">+</span>
              <span className="relative z-10 group-hover:text-indigo-100 transition-colors duration-300">Create Invoice</span>
              <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-300 rounded-full opacity-50 group-hover:opacity-80 animate-pulse"></div>
            </button>
            <button
              onClick={() => setIsQuotationModalOpen(true)}
              className="relative group overflow-hidden bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl flex items-center space-x-3 transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:-translate-y-1 font-semibold"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">📄</span>
              <span className="relative z-10 group-hover:text-green-100 transition-colors duration-300">From Quotation</span>
              <div className="absolute top-1 right-1 w-2 h-2 bg-green-300 rounded-full opacity-50 group-hover:opacity-80 animate-pulse"></div>
            </button>
          </div>
        )}
      </div>

      {/* Quick Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        {[
          { status: '', label: 'Total', color: 'from-slate-600 to-slate-700', textColor: 'text-white', borderColor: 'border-slate-500/50' },
          { status: 'draft', label: 'Draft', color: 'from-gray-500 to-gray-600', textColor: 'text-white', borderColor: 'border-gray-400/50' },
          { status: 'sent', label: 'Sent', color: 'from-blue-500 to-blue-600', textColor: 'text-white', borderColor: 'border-blue-400/50' },
          { status: 'approved', label: 'Approved', color: 'from-green-500 to-green-600', textColor: 'text-white', borderColor: 'border-green-400/50' },
          { status: 'paid', label: 'Paid', color: 'from-emerald-500 to-emerald-600', textColor: 'text-white', borderColor: 'border-emerald-400/50' },
          { status: 'overdue', label: 'Overdue', color: 'from-red-500 to-red-600', textColor: 'text-white', borderColor: 'border-red-400/50' },
          { status: 'cancelled', label: 'Cancelled', color: 'from-orange-500 to-orange-600', textColor: 'text-white', borderColor: 'border-orange-400/50' },
        ].map(({ status, label, color, textColor, borderColor }) => {
          const count = status === '' 
            ? invoices.length 
            : invoices.filter(i => i.status === status).length;
          const isActive = statusFilter === status;
          
          return (
            <div 
              key={status || 'all'} 
              className={`
                status-card relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                bg-gradient-to-br ${color} 
                rounded-xl p-4 border ${borderColor}
                ${isActive ? 'active ring-2 ring-offset-2 ring-indigo-500 shadow-lg scale-105' : 'hover:shadow-lg'}
                backdrop-blur-sm group
              `}
              onClick={() => setStatusFilter(status)}
              title={`Click to filter by ${label} (${count} invoices)`}
            >
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Glowing border effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              
              <div className="relative z-10 text-center">
                {/* Status badge with icon */}
                <div className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-full ${textColor} bg-white/30 backdrop-blur-sm mb-3 group-hover:bg-white/40 transition-all duration-300`}>
                  {/* Status icon based on type */}
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    status === '' ? 'bg-white' :
                    status === 'draft' ? 'bg-gray-300' :
                    status === 'sent' ? 'bg-blue-300' :
                    status === 'approved' ? 'bg-green-300' :
                    status === 'paid' ? 'bg-emerald-300' :
                    status === 'overdue' ? 'bg-red-300' :
                    status === 'cancelled' ? 'bg-orange-300' :
                    'bg-white'
                  } group-hover:animate-pulse`}></div>
                  {label}
                </div>
                
                {/* Count with animation */}
                <div className={`text-3xl font-bold ${textColor} drop-shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {count}
                </div>
                
                {/* Subtitle */}
                <div className={`text-xs ${textColor} opacity-80 mt-1 group-hover:opacity-100 transition-opacity duration-300`}>
                  {count === 1 ? 'invoice' : 'invoices'}
                </div>
                
                {/* Active indicator with pulse */}
                {isActive && (
                  <div className="absolute -top-2 -right-2 flex items-center justify-center">
                    <div className="w-4 h-4 bg-indigo-400 rounded-full animate-pulse shadow-lg"></div>
                    <div className="absolute w-4 h-4 bg-indigo-400 rounded-full animate-ping"></div>
                  </div>
                )}
                
                {/* Hover arrow indicator */}
                <div className={`absolute bottom-2 right-2 ${textColor} opacity-0 group-hover:opacity-70 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-0 h-1 bg-white/50 rounded-b-xl transition-all duration-300 ${
                isActive ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></div>
            </div>
          );
        })}
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
              placeholder="Search invoices by number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-800 dark:text-white text-sm placeholder-gray-400 transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Active Filter Display */}
        {statusFilter && (
          <div className="flex justify-center items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing: <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{statusFilter}</span> invoices
            </div>
            <button
              onClick={() => setStatusFilter('')}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors duration-200"
              title="Clear filter"
            >
              Clear Filter
            </button>
          </div>
        )}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                PO Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {invoices.map((invoice) => (
              <tr 
                key={invoice.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  invoice.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-900/10' :
                  invoice.status === 'approved' ? 'bg-green-50 dark:bg-green-900/10' :
                  invoice.status === 'overdue' ? 'bg-red-50 dark:bg-red-900/10' :
                  invoice.status === 'cancelled' ? 'bg-orange-50 dark:bg-orange-900/10' :
                  ''
                }`}
              >
                <td className="px-6 py-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                  />
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {invoice.client_name || 'Unknown Client'}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.number}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {invoice.po_number || '-'}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(invoice.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {invoice.formatted_total || `${invoice.currency_symbol || 'Rs'}${invoice.total_amount ? parseFloat(invoice.total_amount).toFixed(2) : '0.00'}`}
                </td>
                
                {/* Enhanced Status Column with Advanced Hover Effects */}
                <td className="px-6 py-2 whitespace-nowrap">
                  <div className="relative group">
                    {(invoice.status !== 'paid' && invoice.status !== 'cancelled') ? (
                      <div className="relative">
                        {/* Enhanced shimmer background overlay */}
                        <div className={`
                          absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 
                          transition-all duration-500 ease-out transform -skew-x-12 group-hover:animate-shimmer
                          ${invoice.status === 'draft' ? 'bg-gradient-to-r from-transparent via-gray-400/20 to-transparent' :
                            invoice.status === 'sent' ? 'bg-gradient-to-r from-transparent via-blue-400/20 to-transparent' :
                            invoice.status === 'approved' ? 'bg-gradient-to-r from-transparent via-green-400/20 to-transparent' :
                            invoice.status === 'overdue' ? 'bg-gradient-to-r from-transparent via-red-400/20 to-transparent' :
                            'bg-gradient-to-r from-transparent via-gray-400/20 to-transparent'}
                        `}></div>
                        
                        {/* Color-specific glow effect */}
                        <div className={`
                          absolute inset-0 rounded-full opacity-0 group-hover:opacity-60 
                          transition-all duration-500 ease-out blur-sm
                          ${invoice.status === 'draft' ? 'bg-gray-500/20' :
                            invoice.status === 'sent' ? 'bg-blue-500/20' :
                            invoice.status === 'approved' ? 'bg-green-500/20' :
                            invoice.status === 'overdue' ? 'bg-red-500/20' :
                            'bg-gray-500/20'}
                        `}></div>
                        
                        <select
                          value={invoice.status}
                          onChange={(e) => handleStatusChange(invoice.id, e.target.value as any)}
                          className={`
                            relative z-10 cursor-pointer px-2 py-1 text-xs font-medium rounded-full border 
                            transition-all duration-300 ease-out
                            hover:scale-110 hover:shadow-lg hover:-translate-y-0.5
                            focus:ring-2 focus:ring-offset-2 focus:outline-none appearance-none pr-6 min-w-20
                            bg-gray-800 dark:bg-gray-900 border-gray-600 dark:border-gray-700 text-white
                            group-hover:backdrop-blur-sm
                            ${invoice.status === 'draft' ? 'hover:bg-gray-700 dark:hover:bg-gray-800 focus:ring-gray-500 hover:border-gray-400 hover:text-gray-100' :
                              invoice.status === 'sent' ? 'hover:bg-blue-800 dark:hover:bg-blue-900 focus:ring-blue-500 hover:border-blue-400 hover:text-blue-100' :
                              invoice.status === 'approved' ? 'hover:bg-green-800 dark:hover:bg-green-900 focus:ring-green-500 hover:border-green-400 hover:text-green-100' :
                              invoice.status === 'overdue' ? 'hover:bg-red-800 dark:hover:bg-red-900 focus:ring-red-500 hover:border-red-400 hover:text-red-100' :
                              'hover:bg-gray-700 dark:hover:bg-gray-800 focus:ring-gray-500 hover:border-gray-400 hover:text-gray-100'
                            }
                          `}
                          title="Click to change status"
                        >
                          <option value="draft" className="bg-gray-800 text-gray-200">📝 Draft</option>
                          <option value="sent" className="bg-gray-800 text-blue-200">📤 Sent</option>
                          <option value="approved" className="bg-gray-800 text-green-200">✅ Approved</option>
                          <option value="paid" className="bg-gray-800 text-emerald-200">💰 Paid</option>
                          <option value="overdue" className="bg-gray-800 text-red-200">🔴 Overdue</option>
                          <option value="cancelled" className="bg-gray-800 text-orange-200">🚫 Cancelled</option>
                        </select>
                        {/* Enhanced display current status with color */}
                        <div className={`absolute inset-0 flex items-center pl-2 pointer-events-none rounded-full transition-all duration-300 ${
                          invoice.status === 'draft' ? 'text-gray-300 group-hover:text-gray-100' :
                          invoice.status === 'sent' ? 'text-blue-300 group-hover:text-blue-100' :
                          invoice.status === 'approved' ? 'text-green-300 group-hover:text-green-100' :
                          invoice.status === 'overdue' ? 'text-red-300 group-hover:text-red-100' :
                          'text-gray-300 group-hover:text-gray-100'
                        }`}>
                          <span className="text-xs font-medium capitalize pr-6 group-hover:font-semibold transition-all duration-300">
                            {invoice.status === 'draft' ? '📝 Draft' :
                             invoice.status === 'sent' ? '📤 Sent' :
                             invoice.status === 'approved' ? '✅ Approved' :
                             invoice.status === 'overdue' ? '🔴 Overdue' :
                             invoice.status}
                          </span>
                        </div>
                        {/* Enhanced dropdown arrow with animations */}
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                          <svg className={`w-2.5 h-2.5 transition-all duration-300 group-hover:scale-125 group-hover:rotate-180 ${
                            invoice.status === 'draft' ? 'text-gray-400 group-hover:text-gray-200' :
                            invoice.status === 'sent' ? 'text-blue-400 group-hover:text-blue-200' :
                            invoice.status === 'approved' ? 'text-green-400 group-hover:text-green-200' :
                            invoice.status === 'overdue' ? 'text-red-400 group-hover:text-red-200' :
                            'text-gray-400 group-hover:text-gray-200'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      // Enhanced status badges for final states with hover effects
                      <div className="relative group">
                        {/* Shimmer effect for final states */}
                        <div className={`
                          absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 
                          transition-all duration-500 ease-out transform -skew-x-12 group-hover:animate-shimmer
                          ${invoice.status === 'paid' ? 'bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent' :
                            invoice.status === 'cancelled' ? 'bg-gradient-to-r from-transparent via-orange-400/20 to-transparent' :
                            'bg-gradient-to-r from-transparent via-gray-400/20 to-transparent'}
                        `}></div>
                        
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 
                          cursor-pointer hover:scale-110 hover:shadow-lg hover:-translate-y-0.5 relative z-10 ${
                          invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40 hover:text-emerald-900 dark:hover:text-emerald-200' :
                          invoice.status === 'cancelled' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/40 hover:text-orange-900 dark:hover:text-orange-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}>
                          {invoice.status === 'paid' && (
                            <svg className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {invoice.status === 'cancelled' && (
                            <svg className="w-3 h-3 mr-1 text-orange-600 dark:text-orange-400 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="capitalize group-hover:font-bold transition-all duration-300">
                            {invoice.status === 'paid' ? '💰 Paid' : 
                             invoice.status === 'cancelled' ? '🚫 Cancelled' : 
                             invoice.status}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                
                {/* Enhanced Actions Column with Floating Effects */}
                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-0.5 items-center">
                    <button
                      onClick={() => generatePDF(invoice.id)}
                      className="relative group text-blue-600 hover:text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1.5 py-0.5 rounded text-xs 
                                transition-all duration-300 ease-out
                                hover:scale-110 hover:shadow-lg hover:-translate-y-1
                                active:scale-95 active:translate-y-0
                                floating-action-button"
                      title="Download PDF"
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 transform -skew-x-12 group-hover:animate-shimmer rounded"></div>
                      <span className="relative z-10 group-hover:font-semibold transition-all duration-300">PDF</span>
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="relative group text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-1.5 py-0.5 rounded text-xs 
                                    transition-all duration-300 ease-out
                                    hover:scale-110 hover:shadow-lg hover:-translate-y-1
                                    active:scale-95 active:translate-y-0
                                    floating-action-button"
                          title="Edit Invoice"
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 transform -skew-x-12 group-hover:animate-shimmer rounded"></div>
                          <span className="relative z-10 group-hover:font-semibold transition-all duration-300">Edit</span>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="relative group text-red-600 hover:text-red-900 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-1.5 py-0.5 rounded text-xs 
                                    transition-all duration-300 ease-out
                                    hover:scale-110 hover:shadow-lg hover:-translate-y-1
                                    active:scale-95 active:translate-y-0
                                    floating-action-button"
                          title="Delete Invoice"
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 transform -skew-x-12 group-hover:animate-shimmer rounded"></div>
                          <span className="relative z-10 group-hover:font-semibold transition-all duration-300">Del</span>
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
                    <option value="approved">Approved</option>
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
      
      {/* Enhanced CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes cardPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            50% {
              transform: scale(1.02);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
          }
          
          @keyframes shimmer {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: calc(200px + 100%) 0;
            }
          }
          
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translate3d(0,0,0);
            }
            40%, 43% {
              transform: translate3d(0, -5px, 0);
            }
            70% {
              transform: translate3d(0, -2px, 0);
            }
            90% {
              transform: translate3d(0, -1px, 0);
            }
          }
          
          .status-card {
            position: relative;
            overflow: hidden;
          }
          
          .status-card:hover {
            animation: cardPulse 0.6s ease-in-out;
          }
          
          .status-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -200px;
            width: 200px;
            height: 100%;
            background: linear-gradient(
              to right,
              transparent,
              rgba(255, 255, 255, 0.4),
              transparent
            );
            transition: left 0.5s;
          }
          
          .status-card:hover::before {
            left: 100%;
          }
          
          .status-card.active {
            animation: bounce 1s ease-in-out;
          }
        `
      }} />
      
      {/* Enhanced CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes cardPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            50% {
              transform: scale(1.02);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
          }
          
          @keyframes shimmer {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: calc(200px + 100%) 0;
            }
          }
          
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translate3d(0,0,0);
            }
            40%, 43% {
              transform: translate3d(0, -5px, 0);
            }
            70% {
              transform: translate3d(0, -2px, 0);
            }
            90% {
              transform: translate3d(0, -1px, 0);
            }
          }
          
          .status-card {
            position: relative;
            overflow: hidden;
          }
          
          .status-card:hover {
            animation: cardPulse 0.6s ease-in-out;
          }
          
          .status-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -200px;
            width: 200px;
            height: 100%;
            background: linear-gradient(
              to right,
              transparent,
              rgba(255, 255, 255, 0.4),
              transparent
            );
            transition: left 0.5s;
          }
          
          .status-card:hover::before {
            left: 100%;
          }
          
          .status-card.active {
            animation: bounce 1s ease-in-out;
          }
          
          /* Enhanced shimmer animation for status dropdowns */
          .animate-shimmer {
            animation: shimmer 1.5s ease-in-out;
          }
          
          @keyframes status-shimmer {
            0% {
              transform: translateX(-100%) skewX(-12deg);
            }
            100% {
              transform: translateX(200%) skewX(-12deg);
            }
          }
          
          /* Status dropdown hover effects */
          .status-dropdown:hover {
            animation: status-shimmer 1s ease-in-out;
          }
          
          /* Enhanced floating action button effects */
          .floating-action-button {
            position: relative;
            overflow: hidden;
            transform-origin: center;
          }
          
          .floating-action-button:hover {
            transform: translateY(-4px) scale(1.1);
            box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.08);
          }
          
          .floating-action-button:active {
            transform: translateY(0) scale(0.95);
            transition: all 0.1s ease-out;
          }
          
          @keyframes float-bounce {
            0%, 100% {
              transform: translateY(-4px) scale(1.1);
            }
            50% {
              transform: translateY(-6px) scale(1.12);
            }
          }
          
          .floating-action-button:hover {
            animation: float-bounce 0.6s ease-in-out;
          }
          
          /* Enhanced glow effects for action buttons */
          .floating-action-button::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
          }
          
          .floating-action-button:hover::after {
            opacity: 1;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
        `
      }} />
    </div>
  );
};

export default Invoices;
