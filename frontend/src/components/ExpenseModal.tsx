import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { financialAPI } from '../services/api';
import { DEFAULT_CURRENCY } from '../utils/currency';

interface ExpenseCategory {
  id: number;
  name: string;
  account_type: string;
}

interface ExpenseFormData {
  amount: number;
  description: string;
  category: string;
  vendor: string;
  receipt_number: string;
  transaction_date: string;
  payment_method: string;
  notes: string;
  tags: string;
  // Enhanced project tracking
  project_number: string;
  invoice_number: string;
  expense_category: string;
  cost_center: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense?: any;
  mode?: 'create' | 'edit' | 'view';
}

const Icons = {
  X: () => <span className="text-lg">❌</span>,
  Receipt: () => <span className="text-lg">🧾</span>,
  Calendar: () => <span className="text-lg">📅</span>,
  Building: () => <span className="text-lg">🏢</span>,
  Tag: () => <span className="text-lg">🏷️</span>,
  Upload: () => <span className="text-lg">📤</span>,
  CreditCard: () => <span className="text-lg">💳</span>,
  FileText: () => <span className="text-lg">📄</span>,
};

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expense,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: 0,
    description: '',
    category: '',
    vendor: '',
    receipt_number: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    notes: '',
    tags: '',
    // Enhanced project tracking
    project_number: '',
    invoice_number: '',
    expense_category: '',
    cost_center: '',
  });
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (expense && mode !== 'create') {
        setFormData({
          amount: expense.amount || 0,
          description: expense.description || '',
          category: expense.account || '',
          vendor: expense.bill_to || '',
          receipt_number: expense.reference_number || '',
          transaction_date: expense.transaction_date || new Date().toISOString().split('T')[0],
          payment_method: expense.payment_method || 'bank_transfer',
          notes: expense.notes || '',
          tags: expense.tags || '',
          project_number: expense.project_number || '',
          invoice_number: expense.invoice_number || '',
          expense_category: expense.expense_category || '',
          cost_center: expense.cost_center || '',
        });
      }
    }
  }, [isOpen, expense, mode]);

  const fetchCategories = async () => {
    try {
      const response = await financialAPI.getAccounts({ account_type: 'expense' });
      setCategories(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      setLoading(true);

      const expensePayload = {
        activity_type: 'expense',
        amount: formData.amount,
        description: formData.description,
        account: parseInt(formData.category),
        bill_to: formData.vendor,
        reference_number: formData.receipt_number,
        transaction_date: formData.transaction_date,
        payment_method: formData.payment_method,
        notes: formData.notes,
        tags: formData.tags,
        status: 'pending',
        currency: DEFAULT_CURRENCY,
        // Enhanced project tracking
        project_number: formData.project_number,
        invoice_number: formData.invoice_number,
        expense_category: formData.expense_category,
        cost_center: formData.cost_center,
      };

      if (mode === 'create') {
        const response = await financialAPI.createActivity(expensePayload);
        
        // Upload attachments if any
        if (attachments.length > 0) {
          await uploadAttachments(response.data.id);
        }
        
        toast.success('Expense created successfully');
      } else if (mode === 'edit' && expense) {
        await financialAPI.updateActivity(expense.id, expensePayload);
        
        // Upload new attachments if any
        if (attachments.length > 0) {
          await uploadAttachments(expense.id);
        }
        
        toast.success('Expense updated successfully');
      }

      onSuccess();
      onClose();
      resetForm();

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAttachments = async (activityId: number) => {
    for (const file of attachments) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('activity', activityId.toString());
      formData.append('name', file.name);

      try {
        await financialAPI.uploadAttachment(formData);
      } catch (error) {
        console.error('Error uploading attachment:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) added`);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      amount: 0,
      description: '',
      category: '',
      vendor: '',
      receipt_number: '',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      notes: '',
      tags: '',
      project_number: '',
      invoice_number: '',
      expense_category: '',
      cost_center: '',
    });
    setAttachments([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Icons.Receipt />
            <span className="ml-2">
              {mode === 'create' ? 'Add' : mode === 'edit' ? 'Edit' : 'View'} Expense
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor/Supplier
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="Enter vendor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receipt/Reference Number
              </label>
              <input
                type="text"
                value={formData.receipt_number}
                onChange={(e) => setFormData(prev => ({ ...prev, receipt_number: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="Receipt or reference number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="credit_card">Credit Card</option>
                <option value="digital_wallet">Digital Wallet</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={mode === 'view'}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Describe the expense..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              disabled={mode === 'view'}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Additional notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              disabled={mode === 'view'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="e.g., travel, office supplies, client meeting"
            />
          </div>

          {/* Project Tracking Section */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Icons.Building />
              <span className="ml-2">Project Tracking</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Number
                </label>
                <input
                  type="text"
                  value={formData.project_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_number: e.target.value }))}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="e.g., PRJ-2025-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="e.g., INV-2025-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expense Category
                </label>
                <input
                  type="text"
                  value={formData.expense_category}
                  onChange={(e) => setFormData(prev => ({ ...prev, expense_category: e.target.value }))}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="e.g., Materials, Labor, Travel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cost Center
                </label>
                <input
                  type="text"
                  value={formData.cost_center}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_center: e.target.value }))}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="e.g., Engineering, Operations"
                />
              </div>
            </div>
          </div>

          {/* File Attachments */}
          {mode !== 'view' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attachments (Receipts, Invoices, etc.)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="text-center">
                  <Icons.Upload />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Click to upload receipts or supporting documents
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="expense-attachments"
                  />
                  <label
                    htmlFor="expense-attachments"
                    className="mt-2 inline-block px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                  >
                    Choose Files
                  </label>
                </div>
                
                {attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Files:
                    </h4>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                            <Icons.FileText />
                            <span className="ml-2">{file.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : mode === 'create' ? 'Add Expense' : 'Update Expense'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
