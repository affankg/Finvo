import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.100.113:8000/api';

export interface Project {
  id: number;
  name: string;
  project_number: string;
  description: string;
  client: number;
  client_name?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string;
  end_date: string | null;
  budget: string;
  currency: string;
  project_manager: number;
  project_manager_name?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectAnalytics {
  total_expenses: string;
  total_payments: string;
  outstanding_balance: string;
  profitability: string;
  expense_breakdown: Array<{
    category: string;
    amount: string;
    count: number;
  }>;
  payment_timeline: Array<{
    date: string;
    amount: string;
    type: string;
  }>;
}

export interface ProjectDashboard {
  project: Project;
  analytics: ProjectAnalytics;
  recent_activities: Array<{
    id: number;
    activity_type: string;
    amount: string;
    description: string;
    date: string;
  }>;
  team_members: Array<{
    id: number;
    user_name: string;
    role: string;
    assigned_date: string;
  }>;
  milestones: Array<{
    id: number;
    title: string;
    due_date: string;
    status: string;
    completion_percentage: number;
  }>;
}

export interface ProjectAssignment {
  id: number;
  project: number;
  user: number;
  user_name?: string;
  role: string;
  assigned_date: string;
  is_active: boolean;
}

export interface ProjectMilestone {
  id: number;
  project: number;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completion_percentage: number;
  assigned_to: number | null;
  assigned_to_name?: string;
  created_at: string;
}

export interface ProjectNote {
  id: number;
  project: number;
  title: string;
  content: string;
  note_type: 'general' | 'meeting' | 'issue' | 'decision' | 'reminder';
  is_important: boolean;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectExpenseCategory {
  id: number;
  name: string;
  description?: string;
  project: number;
  parent_category?: number;
  subcategories?: ProjectExpenseCategory[];
}

export interface ProjectExpenseList {
  id: number;
  expense_number: string;
  project: number;
  category: number;
  category_name: string;
  subcategory?: string;
  description: string;
  amount: number;
  total_amount: number;
  currency: string;
  currency_symbol?: string;
  expense_date: string;
  payment_method: 'cash' | 'cheque' | 'bank_transfer' | 'credit_card' | 'digital_wallet' | 'other';
  vendor_name?: string;
  vendor_contact?: string;
  invoice_reference?: string;
  tax_rate: number;
  tax_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  status_display?: string;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectExpenseSummary {
  total_expenses: number;
  total_pending: number;
  total_approved: number;
  total_paid: number;
  total_rejected: number;
  currency?: string;
  pending_count?: number;
  approved_count?: number;
  paid_count?: number;
  categories_breakdown: Array<{
    category_name: string;
    total_amount: number;
    count: number;
  }>;
  monthly_trends: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

class ProjectService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    console.log('ProjectService: Retrieved token:', token ? 'Token present' : 'No token found');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Projects CRUD
  async getProjects(params?: { client?: number; status?: string; search?: string }) {
    const response = await axios.get(`${API_BASE_URL}/projects/`, {
      headers: this.getAuthHeaders(),
      params
    });
    return response.data;
  }

  async getProject(id: number) {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async createProject(data: Partial<Project>) {
    console.log('ProjectService: Creating project with data:', data);
    console.log('ProjectService: API URL:', `${API_BASE_URL}/projects/`);
    console.log('ProjectService: Auth headers:', this.getAuthHeaders());
    
    try {
      const response = await axios.post(`${API_BASE_URL}/projects/`, data, {
        headers: this.getAuthHeaders(),
      });
      console.log('ProjectService: Success response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('ProjectService: Error creating project:', error);
      console.error('ProjectService: Error response:', error.response?.data);
      console.error('ProjectService: Error status:', error.response?.status);
      throw error;
    }
  }

  async updateProject(id: number, data: Partial<Project>) {
    const response = await axios.patch(`${API_BASE_URL}/projects/${id}/`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteProject(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/projects/${id}/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Project Analytics
  async getProjectAnalytics(id: number) {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}/analytics/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Project Dashboard
  async getProjectDashboard(id: number) {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}/dashboard/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Team Management
  async getProjectTeam(projectId: number) {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/team/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async addTeamMember(projectId: number, data: { user: number; role: string }) {
    const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/team/`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateTeamMember(_projectId: number, assignmentId: number, data: Partial<ProjectAssignment>) {
    const response = await axios.patch(`${API_BASE_URL}/project-assignments/${assignmentId}/`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async removeTeamMember(assignmentId: number) {
    const response = await axios.delete(`${API_BASE_URL}/project-assignments/${assignmentId}/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Milestones
  async getProjectMilestones(projectId: number) {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/milestones/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async createMilestone(projectId: number, data: Partial<ProjectMilestone>) {
    const response = await axios.post(`${API_BASE_URL}/project-milestones/`, {
      ...data,
      project: projectId
    }, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateMilestone(id: number, data: Partial<ProjectMilestone>) {
    const response = await axios.patch(`${API_BASE_URL}/project-milestones/${id}/`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteMilestone(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/project-milestones/${id}/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Notes
  async getProjectNotes(projectId: number) {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/notes/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async createNote(projectId: number, data: Partial<ProjectNote>) {
    const response = await axios.post(`${API_BASE_URL}/project-notes/`, {
      ...data,
      project: projectId
    }, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateNote(id: number, data: Partial<ProjectNote>) {
    const response = await axios.patch(`${API_BASE_URL}/project-notes/${id}/`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteNote(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/project-notes/${id}/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Project Expenses
  async getProjectExpenses(projectId: number, filters?: { 
    category?: number; 
    status?: string; 
    search?: string; 
    date_from?: string; 
    date_to?: string; 
  }) {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/expenses/`, {
      headers: this.getAuthHeaders(),
      params: filters
    });
    
    // Handle paginated response
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results;
    }
    
    // Fallback for direct array response
    return Array.isArray(response.data) ? response.data : [];
  }

  async getProjectExpenseCategories(projectId: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/expense_categories/`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.warn('Expense categories not available, returning default categories');
      // Return default categories if API endpoint doesn't exist
      return [
        { id: 1, name: 'Labor', description: 'Labor costs and wages' },
        { id: 2, name: 'Materials', description: 'Raw materials and supplies' },
        { id: 3, name: 'Equipment', description: 'Equipment rental and purchase' },
        { id: 4, name: 'Travel', description: 'Travel and transportation' },
        { id: 5, name: 'Utilities', description: 'Utilities and services' },
        { id: 6, name: 'Professional Services', description: 'Consulting and professional fees' },
        { id: 7, name: 'Office Expenses', description: 'Office supplies and expenses' },
        { id: 8, name: 'Marketing', description: 'Marketing and advertising' },
        { id: 9, name: 'Miscellaneous', description: 'Other miscellaneous expenses' }
      ];
    }
  }

  async getProjectExpenseSummary(projectId: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/expense_summary/`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.warn('Expense summary not available, returning default');
      return {
        total_expenses: 0,
        total_pending: 0,
        total_approved: 0,
        total_paid: 0,
        total_rejected: 0,
        categories_breakdown: [],
        monthly_trends: []
      };
    }
  }

  async createProjectExpense(projectId: number, data: {
    category: number;
    subcategory?: string;
    description: string;
    amount: number;
    payment_method: 'cash' | 'cheque' | 'bank_transfer' | 'credit_card' | 'digital_wallet' | 'other';
    expense_date: string;
    vendor_name?: string;
    vendor_contact?: string;
    invoice_reference?: string;
    tax_rate: number;
    notes?: string;
  }) {
    const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/expenses/`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateProjectExpense(expenseId: number, data: Partial<ProjectExpenseList>) {
    const response = await axios.patch(`${API_BASE_URL}/project-expenses/${expenseId}/`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteProjectExpense(expenseId: number) {
    const response = await axios.delete(`${API_BASE_URL}/project-expenses/${expenseId}/`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async bulkDeleteProjectExpenses(expenseIds: number[]) {
    // Delete expenses one by one since there's no bulk delete endpoint
    const deletePromises = expenseIds.map(id => this.deleteProjectExpense(id));
    return Promise.all(deletePromises);
  }

  async approveExpense(expenseId: number) {
    const response = await axios.patch(`${API_BASE_URL}/project-expenses/${expenseId}/approve/`, {}, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async rejectExpense(expenseId: number) {
    const response = await axios.patch(`${API_BASE_URL}/project-expenses/${expenseId}/reject/`, {}, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async markExpensePaid(expenseId: number) {
    const response = await axios.patch(`${API_BASE_URL}/project-expenses/${expenseId}/mark-paid/`, {}, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Financial Integration
  async getProjectFinancialActivities(projectId: number, params?: { activity_type?: string; status?: string }) {
    const response = await axios.get(`${API_BASE_URL}/financial-activities/`, {
      headers: this.getAuthHeaders(),
      params: {
        ...params,
        project: projectId
      }
    });
    return response.data;
  }

  async getProjectQuotations(projectId: number) {
    const response = await axios.get(`${API_BASE_URL}/quotations/`, {
      headers: this.getAuthHeaders(),
      params: { project: projectId }
    });
    return response.data;
  }

  async getProjectInvoices(projectId: number) {
    const response = await axios.get(`${API_BASE_URL}/invoices/`, {
      headers: this.getAuthHeaders(),
      params: { project: projectId }
    });
    return response.data;
  }
}

export default new ProjectService();
