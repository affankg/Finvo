import axios from 'axios';

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  currency: string;
  currency_symbol?: string;
  formatted_total?: string;
  notes: string;
  created_by: number;
  created_by_name?: string;
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
  quotation?: number;
  quotation_number?: string;
  client: number;
  client_name?: string;
  date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  currency: string;
  currency_symbol?: string;
  formatted_total?: string;
  notes: string;
  created_by: number;
  created_by_name?: string;
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
  generatePDF: (id: number) =>
    api.get(`/quotations/${id}/generate_pdf/`, { responseType: 'blob' }),
  sendEmail: (id: number, email: string, message?: string) =>
    api.post(`/quotations/${id}/send_email/`, { email, message }),
  convertToInvoice: (id: number) =>
    api.post<Invoice>(`/quotations/${id}/convert_to_invoice/`),
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
  markAsPaid: (id: number) =>
    api.post(`/invoices/${id}/mark_as_paid/`),
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
  activityLogsAPI,
  interactionsAPI,
  clientAttachmentsAPI,
};
