import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';

// Icon components
const Icons = {
  X: () => <span className="text-lg">❌</span>,
  Plus: () => <span className="text-lg">➕</span>,
  Upload: () => <span className="text-lg">📤</span>,
  Building: () => <span className="text-lg">🏢</span>,
  Money: () => <span className="text-lg">💰</span>,
  Calendar: () => <span className="text-lg">📅</span>,
  Tag: () => <span className="text-lg">🏷️</span>,
  Document: () => <span className="text-lg">📄</span>,
  User: () => <span className="text-lg">👤</span>,
};

interface Client {
  id: number;
  name: string;
  company: string;
}

interface FinancialAccount {
  id: number;
  code: string;
  name: string;
  account_type: string;
}

interface Quotation {
  id: number;
  number: string;
  client: string;
}

interface Invoice {
  id: number;
  number: string;
  client: string;
}

interface FinancialActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editActivity?: any;
}

const FinancialActivityModal: React.FC<FinancialActivityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editActivity = null
}) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    activity_type: 'expense',
    amount: '',
    currency: 'PKR',
    client: '',
    account: '',
    description: '',
    bill_to: '',
    payment_method: 'bank_transfer',
    transaction_date: new Date().toISOString().split('T')[0],
    due_date: '',
    project_quotation: '',
    project_invoice: '',
    notes: '',
    tags: '',
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const activityTypes = [
    { value: 'receivable', label: 'Receivable', icon: '💰', description: 'Money expected from clients' },
    { value: 'payable', label: 'Payable', icon: '💳', description: 'Bills owed to vendors' },
    { value: 'expense', label: 'Expense', icon: '🧾', description: 'Business expenses' },
    { value: 'income', label: 'Income', icon: '💚', description: 'Revenue received' },
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'digital_wallet', label: 'Digital Wallet' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (editActivity) {
        setFormData({
          activity_type: editActivity.activity_type || 'expense',
          amount: editActivity.amount?.toString() || '',
          currency: editActivity.currency || 'PKR',
          client: editActivity.client || '',
          account: editActivity.account || '',
          description: editActivity.description || '',
          bill_to: editActivity.bill_to || '',
          payment_method: editActivity.payment_method || 'bank_transfer',
          transaction_date: editActivity.transaction_date || new Date().toISOString().split('T')[0],
          due_date: editActivity.due_date || '',
          project_quotation: editActivity.project_quotation || '',
          project_invoice: editActivity.project_invoice || '',
          notes: editActivity.notes || '',
          tags: editActivity.tags || '',
        });
      } else {
        // Reset form for new activity
        setFormData({
          activity_type: 'expense',
          amount: '',
          currency: 'PKR',
          client: '',
          account: '',
          description: '',
          bill_to: '',
          payment_method: 'bank_transfer',
          transaction_date: new Date().toISOString().split('T')[0],
          due_date: '',
          project_quotation: '',
          project_invoice: '',
          notes: '',
          tags: '',
        });
      }
    }
  }, [isOpen, editActivity]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [clientsRes, accountsRes, quotationsRes, invoicesRes] = await Promise.all([
        axios.get('http://192.168.100.113:8000/api/clients/', { headers }),
        axios.get('http://192.168.100.113:8000/api/financial-accounts/', { headers }),
        axios.get('http://192.168.100.113:8000/api/quotations/', { headers }),
        axios.get('http://192.168.100.113:8000/api/invoices/', { headers }),
      ]);

      setClients(clientsRes.data.results || clientsRes.data);
      setAccounts(accountsRes.data.results || accountsRes.data);
      setQuotations(quotationsRes.data.results || quotationsRes.data);
      setInvoices(invoicesRes.data.results || invoicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load form data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.amount || !formData.client || !formData.account || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        project_quotation: formData.project_quotation || null,
        project_invoice: formData.project_invoice || null,
        due_date: formData.due_date || null,
      };

      if (editActivity) {
        await axios.patch(`http://192.168.100.113:8000/api/financial-activities/${editActivity.id}/`, submitData, { headers });
        toast.success('Financial activity updated successfully');
      } else {
        await axios.post('http://192.168.100.113:8000/api/financial-activities/', submitData, { headers });
        toast.success('Financial activity created successfully');
      }

      onSubmit();
      onClose();
    } catch (error: any) {
      console.error('Error saving activity:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Failed to save financial activity';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className={`inline-block align-bottom ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full`}>
          {/* Header */}
          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} px-6 py-4 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editActivity ? 'Edit Financial Activity' : 'Add Financial Activity'}
              </h3>
              <button
                onClick={onClose}
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'} transition-colors duration-200`}
              >
                <Icons.X />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activity Type */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Activity Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {activityTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange('activity_type', type.value)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.activity_type === type.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {type.label}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {type.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Amount *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>₨</span>
                  </div>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`pl-8 w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Client */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Client *
                </label>
                <select
                  value={formData.client}
                  onChange={(e) => handleInputChange('client', e.target.value)}
                  className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Account *
                </label>
                <select
                  value={formData.account}
                  onChange={(e) => handleInputChange('account', e.target.value)}
                  className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                  required
                >
                  <option value="">Select an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bill To (for expenses/payables) */}
              {(formData.activity_type === 'expense' || formData.activity_type === 'payable') && (
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Bill To / Vendor
                  </label>
                  <input
                    type="text"
                    value={formData.bill_to}
                    onChange={(e) => handleInputChange('bill_to', e.target.value)}
                    className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                    placeholder="Vendor or supplier name"
                  />
                </div>
              )}

              {/* Transaction Date */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Transaction Date *
                </label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                  className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                  required
                />
              </div>

              {/* Due Date (for receivables/payables) */}
              {(formData.activity_type === 'receivable' || formData.activity_type === 'payable') && (
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                  />
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => handleInputChange('payment_method', e.target.value)}
                  className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Quotation */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Related Quotation
                </label>
                <select
                  value={formData.project_quotation}
                  onChange={(e) => handleInputChange('project_quotation', e.target.value)}
                  className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                >
                  <option value="">Select a quotation (optional)</option>
                  {quotations.map((quotation) => (
                    <option key={quotation.id} value={quotation.id}>
                      {quotation.number} - {quotation.client}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Invoice */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Related Invoice
                </label>
                <select
                  value={formData.project_invoice}
                  onChange={(e) => handleInputChange('project_invoice', e.target.value)}
                  className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                >
                  <option value="">Select an invoice (optional)</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.number} - {invoice.client}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                  placeholder="Describe the financial activity..."
                  required
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                  className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className={`w-full rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                  placeholder="tag1, tag2, tag3..."
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className={`mt-6 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} pt-4 flex justify-end space-x-3`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-md text-sm font-medium transition-colors duration-200`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Icons.Plus />
                    <span className="ml-2">{editActivity ? 'Update' : 'Create'} Activity</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FinancialActivityModal;
