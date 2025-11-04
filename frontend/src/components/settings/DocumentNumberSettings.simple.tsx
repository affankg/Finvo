import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

/**
 * Document Number Format Settings Component
 * 
 * Configure custom numbering for Invoices, Quotations, and Projects
 */

interface DocumentSettings {
  id?: number;
  type: 'invoice' | 'quotation' | 'project';
  prefix: string;
  current_number: number;
  padding_length: number;
  include_year: boolean;
  include_month: boolean;
  reset_rule: 'never' | 'monthly' | 'yearly';
  enabled: boolean;
}

const DocumentNumberSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoice' | 'quotation' | 'project'>('invoice');
  const [settings, setSettings] = useState<Record<string, DocumentSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<DocumentSettings>>({
    prefix: '',
    current_number: 0,
    padding_length: 3,
    include_year: false,
    include_month: false,
    reset_rule: 'never',
    enabled: false
  });

  const tabs = [
    { id: 'invoice' as const, label: 'Invoice', color: 'blue' },
    { id: 'quotation' as const, label: 'Quotation', color: 'purple' },
    { id: 'project' as const, label: 'Project', color: 'green' }
  ];

  useEffect(() => {
    fetchAllSettings();
  }, []);

  useEffect(() => {
    if (settings[activeTab]) {
      setFormData(settings[activeTab]);
    }
  }, [activeTab, settings]);

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/document-settings');
      
      if (response.data.success) {
        const settingsMap: Record<string, DocumentSettings> = {};
        response.data.data.forEach((setting: DocumentSettings) => {
          settingsMap[setting.type] = setting;
        });
        setSettings(settingsMap);
        
        if (settingsMap.invoice) {
          setFormData(settingsMap.invoice);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = (): string => {
    if (!formData) return 'Configure settings';

    const parts: string[] = [];
    if (formData.prefix) parts.push(formData.prefix);

    if (formData.include_year || formData.include_month) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');

      if (formData.include_year && formData.include_month) {
        parts.push(`${month}${year}`);
      } else if (formData.include_year) {
        parts.push(year);
      } else if (formData.include_month) {
        parts.push(month);
      }
    }

    const nextNum = (formData.current_number || 0) + 1;
    const paddedNumber = nextNum.toString().padStart(formData.padding_length || 3, '0');
    parts.push(paddedNumber);

    return parts.join('-');
  };

  const handleInputChange = (field: keyof DocumentSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.post(`/document-settings/${activeTab}`, formData);

      if (response.data.success) {
        toast.success('Settings saved successfully');
        setSettings(prev => ({ ...prev, [activeTab]: response.data.data }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Document Number Format
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure automatic numbering for invoices, quotations, and projects
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Tabs */}
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left border-l-4 transition-all ${
                activeTab === tab.id
                  ? `border-${tab.color}-600 bg-${tab.color}-50 dark:bg-${tab.color}-900/20 text-${tab.color}-700 dark:text-${tab.color}-400`
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="flex-1">
                <div className="font-medium">{tab.label}</div>
                {settings[tab.id] && (
                  <div className="text-xs mt-0.5">
                    {settings[tab.id].enabled ? (
                      <span className="text-green-600 dark:text-green-400">● Active</span>
                    ) : (
                      <span className="text-gray-400">○ Inactive</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Live Preview</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono">
              {generatePreview()}
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Enable Custom Numbering
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Activate automatic number generation for {activeTab}s
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('enabled', !formData.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prefix</label>
            <input
              type="text"
              value={formData.prefix || ''}
              onChange={(e) => handleInputChange('prefix', e.target.value.toUpperCase())}
              placeholder="e.g., INV, QUO, PRO"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
          </div>

          {/* Current Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Number</label>
            <input
              type="number"
              value={formData.current_number || 0}
              onChange={(e) => handleInputChange('current_number', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Include Date Info</label>
            <select
              value={
                formData.include_year && formData.include_month ? 'both' :
                formData.include_year ? 'year' :
                formData.include_month ? 'month' : 'none'
              }
              onChange={(e) => {
                const value = e.target.value;
                handleInputChange('include_year', value === 'year' || value === 'both');
                handleInputChange('include_month', value === 'month' || value === 'both');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">None</option>
              <option value="year">Year Only (YY)</option>
              <option value="month">Month Only (MM)</option>
              <option value="both">Month + Year (MMYY)</option>
            </select>
          </div>

          {/* Padding */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Number Padding</label>
            <select
              value={formData.padding_length || 3}
              onChange={(e) => handleInputChange('padding_length', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {[2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} digits</option>
              ))}
            </select>
          </div>

          {/* Reset Rule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reset Counter</label>
            <select
              value={formData.reset_rule || 'never'}
              onChange={(e) => handleInputChange('reset_rule', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="never">Never Reset</option>
              <option value="monthly">Reset Monthly</option>
              <option value="yearly">Reset Yearly</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentNumberSettings;
