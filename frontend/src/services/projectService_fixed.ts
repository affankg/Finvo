import { api, projectsAPI } from './api';

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
  project_manager: number;
  project_manager_name?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  source_quotation_id?: number;
  source_quotation_number?: string;
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

class ProjectService {
  async getProjects(params?: { client?: number; status?: string; search?: string }) {
    const response = await projectsAPI.getAll(params);
    return response.data;
  }

  async getDashboardProjects() {
    try {
      const response = await projectsAPI.getDashboard();
      return response.data;
    } catch (error) {
      console.error('ProjectService: Error fetching dashboard projects:', error);
      throw error;
    }
  }

  async getProject(id: number) {
    const response = await projectsAPI.getById(id);
    return response.data;
  }

  async createProject(data: Partial<Project>) {
    try {
      const response = await projectsAPI.create(data as any);
      return response.data;
    } catch (error: any) {
      console.error('ProjectService: Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id: number, data: Partial<Project>) {
    const response = await projectsAPI.update(id, data);
    return response.data;
  }

  async deleteProject(id: number) {
    const response = await projectsAPI.delete(id);
    return response.data;
  }

  async getProjectDashboard(id: number): Promise<any> {
    try {
      const response = await api.get(`/projects/${id}/dashboard/`);
      
      // Validate the response structure
      if (!response.data) {
        throw new Error('No data received from API');
      }
      
      if (!response.data.project) {
        throw new Error('Invalid response format: missing project data');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('ProjectService: Error fetching dashboard:', error);
      throw error;
    }
  }

  async getProjectAnalytics(id: number): Promise<ProjectAnalytics> {
    const response = await api.get(`/projects/${id}/analytics/`);
    return response.data;
  }

  async createProjectFromQuotation(quotationId: number): Promise<Project> {
    const response = await api.post('/projects/from_quotation/', { quotation_id: quotationId });
    return response.data;
  }
}

const projectService = new ProjectService();
export default projectService;
