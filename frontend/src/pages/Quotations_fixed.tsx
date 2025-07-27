import { useState, useEffect } from 'react';
import { quotationsAPI, clientsAPI, servicesAPI, Quotation, Client, Service } from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface QuotationItem {
  service_id: number;
  quantity: number;
  price: number;
  description: string;
}

const Quotations = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    validity: 30,
    notes: '',
    items: [] as QuotationItem[],
  });

  const canEdit = user?.role === 'admin' || user?.role === 'sales';

  useEffect(() => {
    fetchQuotations();
    fetchClients();
    fetchServices();
  }, [searchTerm]);

  const fetchQuotations = async () => {
    try {
      const response = await quotationsAPI.getAll(searchTerm || undefined);
      setQuotations(response.data);
    } catch (error) {
      toast.error('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to fetch clients');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to fetch services');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      const quotationData = {
        client: parseInt(formData.client_id),
        date: formData.date,
        validity: formData.validity,
        notes: formData.notes,
        items: formData.items.map(item => ({
          service: item.service_id,
          quantity: item.quantity,
          price: item.price,
          description: item.description,
        })),
      };

      if (editingQuotation) {
        await quotationsAPI.update(editingQuotation.id, quotationData);
        toast.success('Quotation updated successfully');
      } else {
        await quotationsAPI.create(quotationData);
        toast.success('Quotation created successfully');
      }
      setIsModalOpen(false);
      setEditingQuotation(null);
      resetForm();
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to save quotation');
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      date: new Date().toISOString().split('T')[0],
      validity: 30,
      notes: '',
      items: [],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { service_id: 0, quantity: 1, price: 0, description: '' }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-populate price when service is selected
    if (field === 'service_id') {
      const service = services.find(s => s.id === parseInt(value));
      if (service) {
        updatedItems[index].price = service.price;
      }
    }
    
    setFormData({ ...formData, items: updatedItems });
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setFormData({
      client_id: quotation.client.id.toString(),
      date: quotation.date,
      validity: quotation.validity,
      notes: quotation.notes,
      items: quotation.items?.map(item => ({
        service_id: item.service.id,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        description: item.description,
      })) || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await quotationsAPI.delete(id);
        toast.success('Quotation deleted successfully');
        fetchQuotations();
      } catch (error) {
        toast.error('Failed to delete quotation');
      }
    }
  };

  const convertToInvoice = async (id: number) => {
    if (window.confirm('Convert this quotation to an invoice?')) {
      try {
        await quotationsAPI.convertToInvoice(id);
        toast.success('Quotation converted to invoice successfully');
        fetchQuotations();
      } catch (error) {
        toast.error('Failed to convert quotation');
      }
    }
  };

  const generatePDF = async (id: number) => {
    try {
      const response = await quotationsAPI.generatePDF(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const openModal = () => {
    setEditingQuotation(null);
    resetForm();
    setIsModalOpen(true);
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quotations</h1>
        {canEdit && (
          <button
            onClick={openModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <span>+</span>
            <span>Create Quotation</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search quotations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Quotations Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Validity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {quotations.map((quotation) => (
              <tr key={quotation.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {quotation.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {quotation.client.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(quotation.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  ${quotation.total?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {quotation.validity} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => generatePDF(quotation.id)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                  >
                    PDF
                  </button>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => handleEdit(quotation)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => convertToInvoice(quotation.id)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400"
                      >
                        Convert
                      </button>
                      <button
                        onClick={() => handleDelete(quotation.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {quotations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No quotations found.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl m-4 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                    Validity (days)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.validity}
                    onChange={(e) => setFormData({ ...formData, validity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
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
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
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
                    <div className="text-right mt-2">
                      <span className="text-sm font-medium">Total: ${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                
                {formData.items.length > 0 && (
                  <div className="text-right text-lg font-bold text-gray-900 dark:text-white">
                    Grand Total: ${getTotalAmount().toFixed(2)}
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
                  {editingQuotation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotations;
