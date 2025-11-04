import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileCheck, 
  FolderKanban, 
  Eye, 
  Save, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

/**
 * Document Number Format Settings Component
 * 
 * Purpose: Configure custom numbering for Invoices, Quotations, and Projects
 * Layout: Tabbed Vertical Form (non-card design)
 * Access: Admin only
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
  recentNumbers?: Array<{
    generated_number: string;
    assigned_at: string;
  }>;
}

interface PreviewResult {
  preview: string;
  nextSequence: number;
  willReset: boolean;
  dateToken: string | null;
}

const DocumentNumberSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoice' | 'quotation' | 'project'>('invoice');
  const [settings, setSettings] = useState<Record<string, DocumentSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState<Partial<DocumentSettings>>({});

  const tabs = [
    { id: 'invoice' as const, label: 'Invoice', icon: FileText, color: 'blue' },
    { id: 'quotation' as const, label: 'Quotation', icon: FileCheck, color: 'purple' },
    { id: 'project' as const, label: 'Project', icon: FolderKanban, color: 'green' }
  ];

  // Load all settings on mount
  useEffect(() => {
    fetchAllSettings();
  }, []);

  // Update form when tab changes
  useEffect(() => {
    if (settings[activeTab]) {
      setFormData(settings[activeTab]);
      fetchPreview(activeTab);
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
        
        // Initialize form with first tab
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

  const fetchPreview = async (type: string) => {
    try {
      const response = await api.get(`/document-settings/${type}/next`);
      if (response.data.success) {
        setPreview(response.data.data);
      } else {
        setPreview(null);
      }
    } catch (error) {
      setPreview(null);
    }
  };

  const generateLivePreview = (): string => {
    if (!formData) return 'Configure settings to see preview';

    const parts: string[] = [];

    // Add prefix
    if (formData.prefix) {
      parts.push(formData.prefix);
    }

    // Add date token
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

    // Add padded number
    const nextNum = (formData.current_number || 0) + 1;
    const paddedNumber = nextNum.toString().padStart(formData.padding_length || 3, '0');
    parts.push(paddedNumber);

    return parts.join('-');
  };

  const handleInputChange = (field: keyof DocumentSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await api.post(`/document-settings/${activeTab}`, formData);

      if (response.data.success) {
        toast.success('Settings saved successfully');
        
        // Update local state
        setSettings(prev => ({
          ...prev,
          [activeTab]: response.data.data
        }));

        // Refresh preview
        fetchPreview(activeTab);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewNext = async () => {
    await fetchPreview(activeTab);
    toast.success('Preview updated');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentTab = tabs.find(t => t.id === activeTab);
  const Icon = currentTab?.icon || FileText;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Document Number Format
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure automatic numbering for invoices, quotations, and projects
        </p>
      </div>

      {/* Two-column layout: Tabs | Form */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        
        {/* Left: Vertical Tabs */}
        <div className="space-y-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            const setting = settings[tab.id];
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 text-left
                  border-l-4 transition-all duration-200
                  ${isActive 
                    ? `border-${tab.color}-600 bg-${tab.color}-50 dark:bg-${tab.color}-900/20 text-${tab.color}-700 dark:text-${tab.color}-400`
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                <TabIcon className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-medium">{tab.label}</div>
                  {setting && (
                    <div className="text-xs mt-0.5">
                      {setting.enabled ? (
                        <span className="text-green-600 dark:text-green-400">● Active</span>
                      ) : (
                        <span className="text-gray-400">○ Inactive</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Form */}
        <div className="space-y-6">
          
          {/* Live Preview Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Live Preview
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono">
                  {generateLivePreview()}
                </div>
                {preview && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Next sequence: {preview.nextSequence}
                    {preview.willReset && (
                      <span className="ml-2 text-orange-600 dark:text-orange-400">
                        (Will reset)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            
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
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${formData.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${formData.enabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Prefix */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prefix
              </label>
              <input
                type="text"
                value={formData.prefix || ''}
                onChange={(e) => handleInputChange('prefix', e.target.value.toUpperCase())}
                placeholder="e.g., INV, QUO, PRO"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Letters, numbers, and hyphens only (max 50 characters)
              </p>
            </div>

            {/* Starting Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Number
              </label>
              <input
                type="number"
                value={formData.current_number || 0}
                onChange={(e) => handleInputChange('current_number', parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Next document will be {(formData.current_number || 0) + 1}
              </p>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Include Date Info
              </label>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">None</option>
                <option value="year">Year Only (YY)</option>
                <option value="month">Month Only (MM)</option>
                <option value="both">Month + Year (MMYY)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Add current date to document number
              </p>
            </div>

            {/* Padding Length */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number Padding
              </label>
              <select
                value={formData.padding_length || 3}
                onChange={(e) => handleInputChange('padding_length', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>
                    {num} digits ({`${'0'.repeat(num - 1)}1`})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Minimum number of digits with leading zeros
              </p>
            </div>

            {/* Reset Rule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reset Counter
              </label>
              <select
                value={formData.reset_rule || 'never'}
                onChange={(e) => handleInputChange('reset_rule', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="never">Never Reset</option>
                <option value="monthly">Reset Monthly</option>
                <option value="yearly">Reset Yearly</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                When to reset the sequence counter back to 1
              </p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handlePreviewNext}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 
                       rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 
                       bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                       transition-colors disabled:opacity-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Next
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-6 py-2 
                       bg-gradient-to-r from-blue-600 to-indigo-600 
                       hover:from-blue-700 hover:to-indigo-700 
                       text-white rounded-lg text-sm font-medium 
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>

          {/* Recent Numbers Section */}
          {formData.recentNumbers && formData.recentNumbers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Recent Numbers
                </h3>
                {showHistory ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {showHistory && (
                <div className="mt-3 space-y-2">
                  {formData.recentNumbers.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 
                               bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                    >
                      <span className="font-mono text-gray-900 dark:text-white">
                        {record.generated_number}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(record.assigned_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Alert */}
          <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Non-Destructive:</strong> Existing {activeTab}s will keep their current numbers. 
              Custom numbering only applies to new documents created after enabling this feature.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DocumentNumberSettings;
