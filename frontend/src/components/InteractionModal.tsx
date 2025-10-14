import React, { useState, useEffect } from 'react';
import { Interaction, currencyAPI, Currency } from '../services/api';
import { 
  XMarkIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (interaction: Partial<Interaction>) => Promise<void>;
  interaction: Interaction | null;
  clientId: number;
}

const InteractionModal: React.FC<InteractionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  interaction,
  clientId
}) => {
  const [formData, setFormData] = useState({
    client: clientId,
    interaction_type: 'note' as Interaction['interaction_type'],
    direction: 'outbound' as 'inbound' | 'outbound',
    subject: '',
    description: '',
    reference_number: '',
    amount: '',
    currency: 'PKR',
    status: 'pending',
    scheduled_date: '',
    completed_date: '',
  });
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrencies();
      if (interaction) {
        setFormData({
          client: interaction.client,
          interaction_type: interaction.interaction_type,
          direction: interaction.direction,
          subject: interaction.subject,
          description: interaction.description,
          reference_number: interaction.reference_number,
          amount: interaction.amount?.toString() || '',
          currency: interaction.currency || 'PKR',
          status: interaction.status,
          scheduled_date: interaction.scheduled_date ? new Date(interaction.scheduled_date).toISOString().split('T')[0] : '',
          completed_date: interaction.completed_date ? new Date(interaction.completed_date).toISOString().split('T')[0] : '',
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, interaction, clientId]);

  const loadCurrencies = async () => {
    try {
      const response = await currencyAPI.getChoices();
      setCurrencies(response.data.currencies || []);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      setCurrencies([]);
    }
  };

  const resetForm = () => {
    setFormData({
      client: clientId,
      interaction_type: 'note',
      direction: 'outbound',
      subject: '',
      description: '',
      reference_number: '',
      amount: '',
      currency: 'PKR',
      status: 'pending',
      scheduled_date: '',
      completed_date: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const dataToSend = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        scheduled_date: formData.scheduled_date || undefined,
        completed_date: formData.completed_date || undefined,
      };
      
      await onSave(dataToSend);
      toast.success(interaction ? 'Interaction updated successfully' : 'Interaction created successfully');
      onClose();
    } catch (error) {
      console.error('Error saving interaction:', error);
      toast.error('Failed to save interaction');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {interaction ? 'Edit Interaction' : 'Add New Interaction'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                required
                value={formData.interaction_type}
                onChange={(e) => setFormData({ ...formData, interaction_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
                <option value="follow_up">Follow Up</option>
                <option value="proposal">Proposal</option>
                <option value="contract">Contract</option>
                <option value="support">Support</option>
                <option value="quotation">Quotation</option>
                <option value="invoice">Invoice</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Direction *
              </label>
              <select
                required
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief subject line..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Quote #, Invoice #, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (Optional)
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="follow_up_required">Follow Up Required</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date
              </label>
              <div className="relative">
                <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {formData.status === 'completed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completed Date
                </label>
                <div className="relative">
                  <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="date"
                    value={formData.completed_date}
                    onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the interaction..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {loading ? 'Saving...' : (interaction ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InteractionModal;
