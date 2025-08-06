import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api, financialAPI } from '../services/api';

interface Quotation {
  id: number;
  number: string;
  client: number;
  client_name: string;
  date: string;
  currency: string;
  total_amount: string;
  description?: string;
  formatted_total: string;
  items: Array<{
    id: number;
    service: number;
    quantity: number;
    price: string;
    description: string;
    tax_type: string;
  }>;
}

interface CreateInvoiceFromQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const Icons = {
  X: () => <span className="text-lg">❌</span>,
  Invoice: () => <span className="text-lg">🧾</span>,
  Calendar: () => <span className="text-lg">📅</span>,
  Money: () => <span className="text-lg">💰</span>,
  Building: () => <span className="text-lg">🏢</span>,
  FileText: () => <span className="text-lg">📄</span>,
};

const CreateInvoiceFromQuotationModal: React.FC<CreateInvoiceFromQuotationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [approvedQuotations, setApprovedQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingQuotations, setFetchingQuotations] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    due_date: '',
    payment_terms: '30',
    notes: '',
    create_receivable: true,
  });

  useEffect(() => {
    if (isOpen) {
      fetchApprovedQuotations();
      // Set default due date to 30 days from now
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      setInvoiceData(prev => ({
        ...prev,
        due_date: defaultDueDate.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const fetchApprovedQuotations = async () => {
    try {
      setFetchingQuotations(true);
      const response = await financialAPI.getApprovedQuotations();
      setApprovedQuotations(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch approved quotations');
      console.error('Error fetching quotations:', error);
    } finally {
      setFetchingQuotations(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedQuotation) {
      toast.error('Please select a quotation');
      return;
    }

    if (!invoiceData.due_date) {
      toast.error('Please set a due date');
      return;
    }

    try {
      setLoading(true);

      // Use the convert_to_invoice endpoint
      const invoiceResponse = await api.post(`/quotations/${selectedQuotation.id}/convert_to_invoice/`);
      const createdInvoice = invoiceResponse.data;

      // Update invoice with custom due_date and notes if provided
      if (invoiceData.due_date || invoiceData.notes) {
        const updatePayload: any = {};
        if (invoiceData.due_date) {
          updatePayload.due_date = invoiceData.due_date;
        }
        if (invoiceData.notes.trim()) {
          updatePayload.notes = invoiceData.notes;
        }
        
        if (Object.keys(updatePayload).length > 0) {
          // Include existing items to prevent them from being cleared
          updatePayload.items = createdInvoice.items || [];
          await api.patch(`/invoices/${createdInvoice.id}/`, updatePayload);
        }
      }

      // Create financial activity for the invoice
      const activityPayload = {
        activity_type: 'income',
        client: selectedQuotation.client,
        project_quotation: selectedQuotation.id,
        project_invoice: createdInvoice.id,
        amount: parseFloat(selectedQuotation.total_amount),
        currency: selectedQuotation.currency,
        description: `Invoice ${createdInvoice.number} for Quotation ${selectedQuotation.number}`,
        transaction_date: new Date().toISOString().split('T')[0],
        due_date: invoiceData.due_date,
        status: 'pending',
        payment_method: 'bank_transfer'
      };

      await financialAPI.createActivity(activityPayload);

      // If create_receivable is enabled, it will be automatically created by the backend
      if (invoiceData.create_receivable) {
        toast.success('Invoice and receivable created successfully!');
      } else {
        toast.success('Invoice created successfully!');
      }

      onSuccess();
      onClose();
      resetForm();

    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to create invoice');
      console.error('Error creating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedQuotation(null);
    setInvoiceData({
      due_date: '',
      payment_terms: '30',
      notes: '',
      create_receivable: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Icons.Invoice />
            <span className="ml-2">Create Invoice from Quotation</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.X />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quotation Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Approved Quotation
            </label>
            
            {fetchingQuotations ? (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">Loading quotations...</p>
              </div>
            ) : approvedQuotations.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">No approved quotations available for invoicing</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {approvedQuotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    onClick={() => setSelectedQuotation(quotation)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedQuotation?.id === quotation.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Icons.FileText />
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Quotation {quotation.number}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center">
                                <Icons.Building />
                                <span className="ml-1">{quotation.client_name}</span>
                              </span>
                              <span className="flex items-center">
                                <Icons.Calendar />
                                <span className="ml-1">{new Date(quotation.date).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        {quotation.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {quotation.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                          <Icons.Money />
                          <span className="ml-1">{quotation.formatted_total}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoice Details */}
          {selectedQuotation && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Invoice Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={invoiceData.due_date}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Terms (Days)
                  </label>
                  <select
                    value={invoiceData.payment_terms}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, payment_terms: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="15">15 Days</option>
                    <option value="30">30 Days</option>
                    <option value="45">45 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Additional notes for the invoice..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="create_receivable"
                  checked={invoiceData.create_receivable}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, create_receivable: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="create_receivable" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Automatically create receivable record
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateInvoice}
            disabled={loading || !selectedQuotation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating Invoice...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceFromQuotationModal;
