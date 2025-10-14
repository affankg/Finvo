import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsAPI, interactionsAPI, clientAttachmentsAPI, Client, ClientSummary, Interaction, ClientAttachment } from '../services/api';
import InteractionModal from '../components/InteractionModal';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  GlobeAltIcon,
  TagIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  DocumentIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [summary, setSummary] = useState<ClientSummary | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [attachments, setAttachments] = useState<ClientAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'interactions' | 'attachments' | 'analytics'>('overview');
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const clientId = parseInt(id!);
      
      console.log('Loading client data for ID:', clientId);
      
      const [clientResponse, summaryResponse, interactionsResponse, attachmentsResponse] = await Promise.all([
        clientsAPI.getById(clientId),
        clientsAPI.getSummary(clientId),
        interactionsAPI.getByClient(clientId),
        clientAttachmentsAPI.getByClient(clientId)
      ]);

      console.log('API responses:', {
        client: clientResponse.data,
        summary: summaryResponse.data,
        interactions: interactionsResponse.data,
        attachments: attachmentsResponse.data
      });

      setClient(clientResponse.data);
      setSummary(summaryResponse.data);
      setInteractions(interactionsResponse.data.results || []);
      setAttachments(attachmentsResponse.data || []);
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Failed to load client information');
      // Set empty arrays as fallbacks
      setInteractions([]);
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'lead': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case 'quotation': return 'bg-blue-100 text-blue-800';
      case 'invoice': return 'bg-green-100 text-green-800';
      case 'call': return 'bg-purple-100 text-purple-800';
      case 'meeting': return 'bg-indigo-100 text-indigo-800';
      case 'email': return 'bg-yellow-100 text-yellow-800';
      case 'note': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | string | undefined, currencyCode: string = 'PKR') => {
    if (!amount) return 'Rs0.00';
    
    // Map currency codes to symbols
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'PKR': 'Rs',
      'CNY': '¥',
      'EUR': '€',
      'GBP': '£'
    };
    
    const symbol = currencySymbols[currencyCode] || 'Rs';
    const numAmount = Number(amount);
    
    return `${symbol}${numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleSaveInteraction = async (interactionData: Partial<Interaction>) => {
    try {
      const dataWithClient = {
        ...interactionData,
        client: parseInt(id!), // Ensure client ID is included
      };
      
      if (selectedInteraction) {
        await interactionsAPI.update(selectedInteraction.id, dataWithClient);
      } else {
        await interactionsAPI.create(dataWithClient);
      }
      await loadClientData(); // Reload all data
      setShowInteractionModal(false);
      setSelectedInteraction(null);
    } catch (error) {
      console.error('Error saving interaction:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const clientId = parseInt(id!);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('description', `Uploaded file: ${file.name}`);

      try {
        await clientAttachmentsAPI.upload(clientId, formData);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    // Clear the input and reload attachments
    event.target.value = '';
    loadClientData();
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (confirm('Are you sure you want to delete this attachment?')) {
      try {
        await clientAttachmentsAPI.delete(attachmentId);
        toast.success('Attachment deleted successfully');
        loadClientData();
      } catch (error) {
        console.error('Error deleting attachment:', error);
        toast.error('Failed to delete attachment');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!client || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h2>
          <button
            onClick={() => navigate('/clients')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/clients')}
                className="mr-4 p-2 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{client.company}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(client.status)}`}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
              <button
                onClick={() => navigate('/clients')}
                className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 text-white font-bold py-2 px-4 rounded flex items-center transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Client
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 dark:border-gray-700 mt-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: UserIcon },
              { key: 'interactions', label: 'Interactions', icon: DocumentTextIcon },
              { key: 'attachments', label: 'Attachments', icon: DocumentIcon },
              { key: 'analytics', label: 'Analytics', icon: ChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Client Information */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Client Information</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Person</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{client.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{client.company || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{client.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{client.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{client.address}</p>
                      </div>
                    </div>

                    {client.website && (
                      <div className="flex items-center">
                        <GlobeAltIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</p>
                          <a 
                            href={client.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            {client.website}
                          </a>
                        </div>
                      </div>
                    )}

                    {client.industry && (
                      <div className="flex items-center">
                        <TagIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Industry</p>
                          <p className="text-sm text-gray-900">{client.industry}</p>
                        </div>
                      </div>
                    )}

                    {client.source && (
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Source</p>
                          <p className="text-sm text-gray-900">{client.source}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {client.tags && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {client.tags.split(',').map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {client.notes && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">{client.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Statistics</h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Interactions</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{summary.statistics.total_interactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Quotations</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{summary.statistics.total_quotations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Invoices</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{summary.statistics.total_invoices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Quoted Amount</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(summary.statistics.total_quoted_amount, 'PKR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Invoiced Amount</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(summary.statistics.total_invoiced_amount, 'PKR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Pending Invoices</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{summary.statistics.pending_invoices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Paid Invoices</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{summary.statistics.paid_invoices}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {(summary?.recent_interactions || []).slice(0, 5).map((interaction) => (
                      <div key={interaction.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full mr-3 ${getInteractionTypeColor(interaction.interaction_type)}`}>
                            {interaction.interaction_type}
                          </span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{interaction.subject}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(interaction.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {(!summary?.recent_interactions || summary.recent_interactions.length === 0) && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent interactions</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Interactions</h3>
              <button
                onClick={() => {
                  setSelectedInteraction(null);
                  setShowInteractionModal(true);
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Interaction
              </button>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(interactions || []).map((interaction) => (
                    <tr key={interaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getInteractionTypeColor(interaction.interaction_type)}`}>
                          {interaction.interaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{interaction.subject}</div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">{interaction.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          interaction.direction === 'inbound' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {interaction.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {interaction.formatted_amount || (interaction.amount ? 
                          `${interaction.currency_symbol || interaction.currency} ${Number(interaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : '-')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{interaction.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(interaction.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedInteraction(interaction);
                            setShowInteractionModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this interaction?')) {
                              try {
                                await interactionsAPI.delete(interaction.id);
                                toast.success('Interaction deleted successfully');
                                loadClientData();
                              } catch (error) {
                                toast.error('Failed to delete interaction');
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!interactions || interactions.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No interactions found. Click "Add Interaction" to create the first one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Attachments</h3>
              <div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center cursor-pointer"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Upload Files
                </label>
              </div>
            </div>
            <div className="px-6 py-4">
              {(!attachments || attachments.length === 0) ? (
                <p className="text-gray-500 text-center py-8">No attachments found</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(attachments || []).map((attachment) => (
                    <div key={attachment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <DocumentIcon className="h-8 w-8 text-gray-400" />
                        <button 
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete attachment"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1 truncate" title={attachment.name}>
                        {attachment.name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{attachment.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{attachment.file_type}</span>
                        <span>{(attachment.file_size / 1024).toFixed(1)} KB</span>
                      </div>
                      {attachment.file_url && (
                        <div className="mt-2">
                          <a
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Download
                          </a>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-400">
                        Uploaded by {attachment.uploaded_by_details?.username || 'Unknown'} on{' '}
                        {new Date(attachment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Financial Overview</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-8 w-8 text-blue-500 dark:text-blue-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Quoted</p>
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(summary.statistics.total_quoted_amount, 'PKR')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-8 w-8 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Invoiced</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(summary.statistics.total_invoiced_amount, 'PKR')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Documents</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-3">
                  {(summary?.recent_quotations || []).slice(0, 3).map((quotation) => (
                    <div key={quotation.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Quotation #{quotation.number}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{formatCurrency(quotation.total_amount, quotation.currency)}</p>
                      </div>
                      <span className="text-xs text-blue-500">
                        {new Date(quotation.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {(summary?.recent_invoices || []).slice(0, 3).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-900">Invoice #{invoice.number}</p>
                        <p className="text-xs text-green-600">{formatCurrency(invoice.total_amount, invoice.currency)}</p>
                      </div>
                      <span className="text-xs text-green-500">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {(!summary?.recent_quotations?.length && !summary?.recent_invoices?.length) && (
                    <p className="text-gray-500 text-center py-4">No recent documents</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interaction Modal */}
      <InteractionModal
        isOpen={showInteractionModal}
        onClose={() => {
          setShowInteractionModal(false);
          setSelectedInteraction(null);
        }}
        onSave={handleSaveInteraction}
        interaction={selectedInteraction}
        clientId={parseInt(id!)}
      />
    </div>
  );
};

export default ClientProfile;
