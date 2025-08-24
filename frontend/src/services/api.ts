import axios from 'axios';
import config from '../config/config';

// API Base URL - Use config for centralized URL management
const API_BASE_URL = config.API_BASE_URL;

// Create axios instance with base URL and optimized settings
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  // Enable request/response compression
  decompress: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await api.post('/auth/refresh/', {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          return api(original);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Financial API endpoints
export const financialAPI = {
  // Dashboard
  getDashboardInsights: () => api.get('/financial-dashboard/'),
  
  // Financial Activities
  getActivities: (params?: any) => api.get('/financial-activities/', { params }),
  getActivity: (id: number) => api.get(`/financial-activities/${id}/`),
  createActivity: (data: any) => api.post('/financial-activities/', data),
  updateActivity: (id: number, data: any) => api.patch(`/financial-activities/${id}/`, data),
  deleteActivity: (id: number) => api.delete(`/financial-activities/${id}/`),
  approveActivity: (id: number) => api.post(`/financial-activities/${id}/approve/`),
  rejectActivity: (id: number, reason: string) => api.post(`/financial-activities/${id}/reject/`, { reason }),
  markAsPaid: (id: number) => api.post(`/financial-activities/${id}/mark_paid/`),
  getActivitiesSummary: () => api.get('/financial-activities/summary/'),
  
  // Financial Accounts
  getAccounts: (params?: any) => api.get('/financial-accounts/', { params }),
  getAccount: (id: number) => api.get(`/financial-accounts/${id}/`),
  createAccount: (data: any) => api.post('/financial-accounts/', data),
  updateAccount: (id: number, data: any) => api.patch(`/financial-accounts/${id}/`, data),
  deleteAccount: (id: number) => api.delete(`/financial-accounts/${id}/`),
  getAccountsHierarchy: () => api.get('/financial-accounts/hierarchy/'),
  
  // Financial Attachments
  getAttachments: (params?: any) => api.get('/financial-attachments/', { params }),
  uploadAttachment: (data: FormData) => api.post('/financial-attachments/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAttachment: (id: number) => api.delete(`/financial-attachments/${id}/`),
  
  // Reports
  getBalanceSheet: (params?: any) => api.get('/balance-sheet/', { params }),
  exportReport: (params: any) => api.get('/export-financial-report/', { 
    params,
    responseType: 'blob'
  }),
  
  // Audit Logs
  getAuditLogs: (params?: any) => api.get('/financial-audit-logs/', { params }),
  
  // Additional API functions for enhanced features
  getApprovedQuotations: () => api.get('/approved-quotations/'),
};

// Types
export interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'prospect' | 'lead';
  tags: string;
  notes: string;
  website: string;
  industry: string;
  source: string;
  assigned_to: number | null;
  assigned_to_details?: User;
  created_at: string;
  updated_at: string;
  total_quotations: number;
  total_invoices: number;
  total_amount_quoted: number;
  total_amount_invoiced: number;
  last_interaction_date: string | null;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  created_at: string;
  updated_at: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface CurrencyResponse {
  currencies: Currency[];
  default: string;
}

export interface QuotationItem {
  id?: number;
  service: number;
  service_name?: string;
  quantity: number;
  price: string;
  description: string;
  tax_type?: string;
  subtotal?: string;
  tax_amount?: string;
  total?: string;
}

export interface Quotation {
  id: number;
  number: string;
  client: number;
  client_name?: string;
  date: string;
  validity: number;
  status: 'draft' | 'sent' | 'pending' | 'approved' | 'rejected' | 'converted' | 'expired';
  currency: string;
  currency_symbol?: string;
  formatted_total?: string;
  notes: string;
  purchase_requisition?: string;
  created_by: number;
  created_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  items: QuotationItem[];
  total_amount?: string;
  subtotal_amount?: string;
  total_tax_amount?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: number;
  service: number;
  service_name?: string;
  quantity: number;
  price: string;
  description: string;
  tax_type?: string;
  subtotal?: string;
  tax_amount?: string;
  total?: string;
}

export interface Invoice {
  id: number;
  number: string;
  po_number?: string;
  quotation?: number;
  quotation_number?: string;
  client: number;
  client_name?: string;
  date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  currency: string;
  currency_symbol?: string;
  formatted_total?: string;
  notes: string;
  created_by: number;
  created_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  items: InvoiceItem[];
  total_amount?: string;
  subtotal_amount?: string;
  total_tax_amount?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

export interface FinancialActivity {
  id: number;
  reference_number: string;
  activity_type: 'receivable' | 'payable' | 'expense' | 'income';
  amount: number;
  currency: string;
  client: number;
  client_details?: Client;
  client_name?: string;
  account_name?: string;
  project_quotation?: number;
  project_invoice?: number;
  account: number;
  // Enhanced project tracking fields for expenses
  project_number?: string;
  invoice_number?: string;
  expense_category?: string;
  cost_center?: string;
  description: string;
  bill_to?: string;
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'digital_wallet' | 'crypto' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'overdue' | 'cancelled';
  transaction_date: string;
  due_date?: string;
  paid_date?: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  tags?: string;
  is_recurring: boolean;
  recurring_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  created_by: number;
  created_at: string;
  updated_at: string;
  currency_symbol?: string;
  formatted_amount?: string;
  is_overdue?: boolean;
}

export interface ActivityLog {
  id: number;
  user: number;
  user_name?: string;
  action: string;
  content_type: string;
  object_id: number;
  description: string;
  created_at: string;
}

export interface Interaction {
  id: number;
  client: number;
  client_details?: Client;
  interaction_type: 'quotation' | 'invoice' | 'call' | 'meeting' | 'email' | 'note' | 'follow_up' | 'proposal' | 'contract' | 'support';
  direction: 'inbound' | 'outbound';
  subject: string;
  description: string;
  reference_number: string;
  amount?: number;
  currency: string;
  currency_symbol?: string;
  formatted_amount?: string;
  status: string;
  scheduled_date?: string;
  completed_date?: string;
  created_by: number;
  created_by_details?: User;
  created_at: string;
  updated_at: string;
  quotation?: number;
  quotation_details?: {
    id: number;
    number: string;
    total_amount: string;
  };
  invoice?: number;
  invoice_details?: {
    id: number;
    number: string;
    total_amount: string;
  };
}

export interface ClientAttachment {
  id: number;
  client: number;
  name: string;
  description: string;
  file: string;
  file_url?: string;
  file_type: string;
  file_size: number;
  uploaded_by: number;
  uploaded_by_details?: User;
  created_at: string;
}

export interface ClientSummary {
  client: Client;
  statistics: {
    total_interactions: number;
    total_quotations: number;
    total_invoices: number;
    total_quoted_amount: number;
    total_invoiced_amount: number;
    pending_invoices: number;
    paid_invoices: number;
  };
  recent_interactions: Interaction[];
  recent_quotations: Quotation[];
  recent_invoices: Invoice[];
}

// Pagination interface
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardStats {
  total_clients: number;
  total_quotations: number;
  total_invoices: number;
  pending_invoices: number;
  paid_invoices: number;
  monthly_quotations: number;
  monthly_invoices: number;
}

// Financial Chart Data Interfaces
export interface InvoicePaymentData {
  month: string;
  invoices: number;
  payments: number;
}

export interface ClientReceivablesData {
  client: string;
  amount: number;
}

export interface InvoiceStatusData {
  status: string;
  count: number;
  amount: number;
}

export interface ReceivablesAgingData {
  client: string;
  days_0_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
}

export interface FinancialChartsResponse {
  invoice_payments: InvoicePaymentData[];
  client_receivables: ClientReceivablesData[];
  invoice_status: InvoiceStatusData[];
  receivables_aging: ReceivablesAgingData[];
  filters_applied: {
    date_from: string;
    date_to: string;
    client?: string;
    status?: string;
  };
}

export interface FinancialSummaryResponse {
  total_receivables: number;
  overdue_amount: number;
  this_month_revenue: number;
  invoice_count: number;
  paid_invoice_count: number;
  overdue_invoice_count: number;
}

// API Functions

// Auth
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login/', { username, password }),
  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),
  profile: () =>
    api.get('/auth/profile/'),
  refreshToken: (refresh: string) =>
    api.post('/auth/refresh/', { refresh }),
};

// Currency
export const currencyAPI = {
  getChoices: () =>
    api.get('/currencies/'),
};

// Dashboard
export const dashboardAPI = {
  getStats: () =>
    api.get<{ stats: DashboardStats; recent_activities: ActivityLog[] }>('/dashboard/'),
  
  // New Financial Chart Data
  getFinancialCharts: (params?: {
    date_from?: string;
    date_to?: string;
    client?: string;
    status?: string;
  }) => api.get('/financial-charts/', { params }),
  
  getFinancialSummary: () =>
    api.get('/financial-summary/'),
};

// Clients
export const clientsAPI = {
  getAll: (search?: string) =>
    api.get<PaginatedResponse<Client>>('/clients/', { params: { search } }),
  getById: (id: number) =>
    api.get<Client>(`/clients/${id}/`),
  getSummary: (id: number) =>
    api.get<ClientSummary>(`/clients/${id}/summary/`),
  create: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<Client>('/clients/', data),
  update: (id: number, data: Partial<Client>) =>
    api.patch<Client>(`/clients/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/clients/${id}/`),
  bulkDelete: (ids: number[]) =>
    api.post('/clients/bulk_delete/', { ids }),
};

// Services
export const servicesAPI = {
  getAll: (search?: string) =>
    api.get<PaginatedResponse<Service>>('/services/', { params: { search } }),
  getById: (id: number) =>
    api.get<Service>(`/services/${id}/`),
  create: (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<Service>('/services/', data),
  update: (id: number, data: Partial<Service>) =>
    api.patch<Service>(`/services/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/services/${id}/`),
  bulkDelete: (ids: number[]) =>
    api.post('/services/bulk_delete/', { ids }),
};

// Quotations
export const quotationsAPI = {
  getAll: (search?: string) =>
    api.get<PaginatedResponse<Quotation>>('/quotations/', { params: { search } }),
  getById: (id: number) =>
    api.get<Quotation>(`/quotations/${id}/`),
  create: (data: Omit<Quotation, 'id' | 'number' | 'created_at' | 'updated_at' | 'created_by'>) =>
    api.post<Quotation>('/quotations/', data),
  update: (id: number, data: Partial<Quotation>) =>
    api.patch<Quotation>(`/quotations/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/quotations/${id}/`),
  approve: (id: number) =>
    api.post(`/quotations/${id}/approve/`),
  reject: (id: number, reason?: string) =>
    api.post(`/quotations/${id}/reject/`, { reason }),
  generatePDF: (id: number) =>
    api.get(`/quotations/${id}/generate_pdf/`, { responseType: 'blob' }),
  sendEmail: (id: number, email: string, message?: string) =>
    api.post(`/quotations/${id}/send_email/`, { email, message }),
  convertToInvoice: (id: number) =>
    api.post<Invoice>(`/quotations/${id}/convert_to_invoice/`),
  bulkDelete: (ids: number[]) =>
    api.post('/quotations/bulk_delete/', { ids }),
};

// Invoices
export const invoicesAPI = {
  getAll: (search?: string, status?: string) =>
    api.get<PaginatedResponse<Invoice>>('/invoices/', { params: { search, status } }),
  getById: (id: number) =>
    api.get<Invoice>(`/invoices/${id}/`),
  create: (data: Omit<Invoice, 'id' | 'number' | 'created_at' | 'updated_at' | 'created_by'>) =>
    api.post<Invoice>('/invoices/', data),
  update: (id: number, data: Partial<Invoice>) =>
    api.patch<Invoice>(`/invoices/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/invoices/${id}/`),
  generatePDF: (id: number) =>
    api.get(`/invoices/${id}/generate_pdf/`, { responseType: 'blob' }),
  sendEmail: (id: number, email: string, message?: string) =>
    api.post(`/invoices/${id}/send_email/`, { email, message }),
  approve: (id: number) =>
    api.post(`/invoices/${id}/approve/`),
  reject: (id: number, reason?: string) =>
    api.post(`/invoices/${id}/reject/`, { reason }),
  markAsPaid: (id: number) =>
    api.post(`/invoices/${id}/mark_as_paid/`),
  bulkDelete: (ids: number[]) =>
    api.post('/invoices/bulk_delete/', { ids }),
};

// Users
export const usersAPI = {
  getAll: () =>
    api.get<PaginatedResponse<User>>('/users/'),
  getById: (id: number) =>
    api.get<User>(`/users/${id}/`),
  create: (data: Omit<User, 'id' | 'date_joined'> & { password: string }) =>
    api.post<User>('/users/', data),
  update: (id: number, data: Partial<User>) =>
    api.patch<User>(`/users/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/users/${id}/`),
  bulkDelete: (ids: number[]) =>
    api.post('/users/bulk_delete/', { ids }),
};

// Projects
export interface Project {
  id: number;
  name: string;
  project_number: string;
  description: string;
  client: number;
  client_name?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project_type: string;
  start_date: string;
  end_date: string | null;
  estimated_completion_date: string | null;
  location: string;
  budget: string;
  currency: string;
  project_manager: number | null;
  project_manager_name?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export const projectsAPI = {
  getAll: (params?: { client?: number; status?: string; search?: string }) =>
    api.get<PaginatedResponse<Project>>('/projects/', { params }),
  getById: (id: number) =>
    api.get<Project>(`/projects/${id}/`),
  create: (data: Omit<Project, 'id' | 'project_number' | 'created_at' | 'updated_at' | 'created_by'>) =>
    api.post<Project>('/projects/', data),
  update: (id: number, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/projects/${id}/`),
  getDashboard: () =>
    api.get('/projects/dashboard/'),
  bulkDelete: (ids: number[]) =>
    api.post('/projects/bulk_delete/', { ids }),
};

// Activity Logs
export const activityLogsAPI = {
  getAll: (content_type?: string) =>
    api.get<ActivityLog[]>('/activity-logs/', { params: { content_type } }),
};

// Interactions
export const interactionsAPI = {
  getAll: (params?: any) =>
    api.get<PaginatedResponse<Interaction>>('/interactions/', { params }),
  getByClient: (clientId: number, params?: any) =>
    api.get<PaginatedResponse<Interaction>>(`/clients/${clientId}/interactions/`, { params }),
  getById: (id: number) =>
    api.get<Interaction>(`/interactions/${id}/`),
  create: (data: Partial<Interaction>) =>
    api.post<Interaction>('/interactions/', data),
  update: (id: number, data: Partial<Interaction>) =>
    api.patch<Interaction>(`/interactions/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/interactions/${id}/`),
};

// Client Attachments
export const clientAttachmentsAPI = {
  getAll: () =>
    api.get<ClientAttachment[]>('/client-attachments/'),
  getByClient: (clientId: number) =>
    api.get<ClientAttachment[]>(`/clients/${clientId}/attachments/`),
  upload: (clientId: number, data: FormData) =>
    api.post<ClientAttachment>(`/clients/${clientId}/attachments/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: number) =>
    api.delete(`/client-attachments/${id}/`),
};

export default {
  authAPI,
  currencyAPI,
  dashboardAPI,
  clientsAPI,
  servicesAPI,
  quotationsAPI,
  invoicesAPI,
  usersAPI,
  projectsAPI,
  activityLogsAPI,
  interactionsAPI,
  clientAttachmentsAPI,
};
