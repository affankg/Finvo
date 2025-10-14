import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { invoicesAPI, quotationsAPI, financialAPI } from '../services/api';

interface QuotationItem {
  id: number;
  service: number;
  service_name?: string;
  quantity: number;
  price: string;
  description: string;
  tax_type: string;
}

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
  items: QuotationItem[];
}

interface SelectedItem extends QuotationItem {
  selected: boolean;
}

interface EnhancedCreateInvoiceModalProps {
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
  Check: () => <span className="text-lg">✅</span>,
  Uncheck: () => <span className="text-lg">⬜</span>,
};

const EnhancedCreateInvoiceModal: React.FC<EnhancedCreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [approvedQuotations, setApprovedQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
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

  useEffect(() => {
    if (selectedQuotation) {
      // Initialize all items as selected when quotation changes
      setSelectedItems(selectedQuotation.items.map(item => ({
        ...item,
        selected: true
      })));
    }
  }, [selectedQuotation]);

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

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return; // Prevent negative or zero quantities
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const selectAllItems = () => {
    setSelectedItems(prev => 
      prev.map(item => ({ ...item, selected: true }))
    );
  };

  const deselectAllItems = () => {
    setSelectedItems(prev => 
      prev.map(item => ({ ...item, selected: false }))
    );
  };

  const getSelectedItemsTotal = () => {
    return selectedItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.quantity * parseFloat(item.price)), 0);
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

    const selectedItemsList = selectedItems.filter(item => item.selected);
    if (selectedItemsList.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    // Note: no separate convert payload is required when fully converting via backend

    try {
      setLoading(true);

      // Check if all items are selected (full conversion)
      const allItemsSelected = selectedItems.length === selectedItemsList.length;
      let createdInvoice: any = null;
      
      if (allItemsSelected) {
        // Use backend convert endpoint for full conversion
        console.log('Converting full quotation using backend endpoint');
        
        // Use the quotationsAPI to convert to invoice
        const convertResponse = await quotationsAPI.convertToInvoice(selectedQuotation.id);
        createdInvoice = convertResponse.data;
        
        // Update due date if different from default
        const defaultDueDate = new Date(createdInvoice.date);
        defaultDueDate.setDate(defaultDueDate.getDate() + 30);
        const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];
        
        if (invoiceData.due_date !== defaultDueDateStr) {
          // Update the invoice with custom due date and notes
          await invoicesAPI.update(createdInvoice.id, {
            due_date: invoiceData.due_date,
            notes: invoiceData.notes || createdInvoice.notes
          });
        }

        console.log('Full quotation conversion successful:', createdInvoice);
        
      } else {
        // For partial selection, create invoice without quotation reference
        console.log('Creating partial invoice (selected items only)');
        
        const invoicePayload = {
          // Don't include quotation reference for partial invoices
          client: selectedQuotation.client,
          date: new Date().toISOString().split('T')[0],
          due_date: invoiceData.due_date,
          currency: selectedQuotation.currency || 'PKR',
          notes: invoiceData.notes || `Partial invoice created from quotation ${selectedQuotation.number}`,
          status: 'draft' as const,
          items: selectedItemsList.map(item => {
            const serviceId = parseInt(item.service.toString());
            if (isNaN(serviceId)) {
              throw new Error(`Invalid service selected for item: ${item.description}`);
            }
            
            return {
              service: serviceId,
              quantity: parseInt(item.quantity.toString()) || 1,
              price: parseFloat(item.price.toString()).toFixed(2),
              description: item.description || '',
              tax_type: item.tax_type || 'none'
            };
          })
        };

        console.log('Creating partial invoice with payload:', invoicePayload);

        // Use the proper invoicesAPI.create method
        const invoiceResponse = await invoicesAPI.create(invoicePayload);
        createdInvoice = invoiceResponse.data;
        
        console.log('Partial invoice creation successful:', createdInvoice);
      }

      // Create financial activity for the invoice
      const selectedTotal = getSelectedItemsTotal();
      const activityPayload = {
        activity_type: 'income',
        client: selectedQuotation.client,
        project_quotation: selectedQuotation.id,
        project_invoice: createdInvoice.id,
        amount: selectedTotal,
        currency: selectedQuotation.currency,
        description: `Invoice ${createdInvoice.number} for selected items from Quotation ${selectedQuotation.number}`,
        transaction_date: new Date().toISOString().split('T')[0],
        due_date: invoiceData.due_date,
        status: 'pending',
        payment_method: 'bank_transfer'
      };

      await financialAPI.createActivity(activityPayload);

      toast.success('Invoice created successfully from quotation!');
      onSuccess();
      onClose();
      resetForm();

    } catch (error: any) {
      console.error('Invoice creation error:', error);
      console.error('Error response:', error.response?.data);
      
      // Extract detailed error messages
      let errorMessage = 'Failed to create invoice from quotation';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle specific validation errors
        if (errorData.quotation?.[0]?.includes('already exists')) {
          errorMessage = 'This quotation already has an invoice. Cannot create another invoice for the same quotation.';
        } else if (typeof errorData === 'object') {
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
        } else if (errorData.error || errorData.detail || errorData.message) {
          errorMessage = errorData.error || errorData.detail || errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedQuotation(null);
    setSelectedItems([]);
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Icons.Invoice />
            <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">Create Invoice from Quotation</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.X />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          {/* Quotation Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Icons.Building /> Select Approved Quotation
            </label>
            <select
              value={selectedQuotation?.id || ''}
              onChange={(e) => {
                const quotation = approvedQuotations.find(q => q.id === parseInt(e.target.value));
                setSelectedQuotation(quotation || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={fetchingQuotations}
            >
              <option value="">
                {fetchingQuotations ? 'Loading quotations...' : 'Select a quotation'}
              </option>
              {approvedQuotations.map((quotation) => (
                <option key={quotation.id} value={quotation.id}>
                  {quotation.number} - {quotation.client_name} ({quotation.formatted_total})
                </option>
              ))}
            </select>
            {approvedQuotations.length === 0 && !fetchingQuotations && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                No approved quotations available for invoicing.
              </p>
            )}
          </div>

          {/* Item Selection */}
          {selectedQuotation && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Icons.FileText /> Select Items to Include
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={selectAllItems}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllItems}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                💡 Tip: You can edit quantities for selected items. Only selected items will be included in the invoice.
              </p>
              
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-300 dark:border-gray-600">
                  <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div>Select</div>
                    <div className="col-span-2">Description</div>
                    <div>Quantity</div>
                    <div>Price</div>
                    <div>Total</div>
                    <div>Tax</div>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className={`px-4 py-3 border-b border-gray-200 dark:border-gray-600 grid grid-cols-7 gap-4 items-center ${
                        item.selected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleItemSelection(item.id)}
                          className="text-lg hover:scale-110 transition-transform"
                        >
                          {item.selected ? <Icons.Check /> : <Icons.Uncheck />}
                        </button>
                      </div>
                      <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                        {item.description}
                      </div>
                      <div className="text-sm">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                          min="1"
                          max="9999"
                          disabled={!item.selected}
                          className={`w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            item.selected 
                              ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                              : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedQuotation.currency} {parseFloat(item.price).toFixed(2)}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedQuotation.currency} {(item.quantity * parseFloat(item.price)).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.tax_type}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-t border-gray-300 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Selected Items Total:
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedQuotation.currency} {getSelectedItemsTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Details */}
          {selectedQuotation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Icons.Calendar /> Due Date
                </label>
                <input
                  type="date"
                  value={invoiceData.due_date}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Terms (days)
                </label>
                <input
                  type="number"
                  value={invoiceData.payment_terms}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, payment_terms: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="365"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedQuotation && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add any additional notes for this invoice..."
              />
            </div>
          )}

          {/* Create Receivable Option */}
          {selectedQuotation && (
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={invoiceData.create_receivable}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, create_receivable: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Create accounts receivable entry
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateInvoice}
            disabled={loading || !selectedQuotation || selectedItems.filter(item => item.selected).length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            <Icons.Invoice />
            <span>{loading ? 'Creating Invoice...' : 'Create Invoice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCreateInvoiceModal;
