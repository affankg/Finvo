import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import projectService, { Project } from '../services/projectService_fixed';
import { quotationsAPI } from '../services/api';

export const useQuotationToProject = () => {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [lastCreatedProject, setLastCreatedProject] = useState<Project | null>(null);
  const navigate = useNavigate();

  const createProjectFromQuotation = async (quotationId: number): Promise<Project> => {
    setIsCreatingProject(true);
    try {
      const project = await projectService.createProjectFromQuotation(quotationId);
      setLastCreatedProject(project);
      toast.success(`Project "${project.name}" created successfully!`);
      return project;
    } catch (error: any) {
      console.error('Failed to create project from quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to create project from quotation');
      throw error;
    } finally {
      setIsCreatingProject(false);
    }
  };

  const approveAndCreateProject = async (quotationId: number, autoCreateProject: boolean = true) => {
    setIsCreatingProject(true);
    try {
      // First approve the quotation using your existing API
      await quotationsAPI.approve(quotationId);
      toast.success('Quotation approved successfully');
      
      let project: Project | undefined;
      
      // Create project if requested
      if (autoCreateProject) {
        try {
          project = await projectService.createProjectFromQuotation(quotationId);
          setLastCreatedProject(project);
          toast.success(`Project "${project.name}" created successfully!`);
        } catch (projectError) {
          console.error('Failed to create project:', projectError);
          toast.error('Quotation approved but failed to create project');
        }
      }
      
      return {
        quotation: { id: quotationId, status: 'approved' },
        project
      };
      
    } catch (error: any) {
      console.error('Failed to approve quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to approve quotation');
      throw error;
    } finally {
      setIsCreatingProject(false);
    }
  };

  const navigateToProject = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  return {
    isCreatingProject,
    lastCreatedProject,
    createProjectFromQuotation,
    approveAndCreateProject,
    navigateToProject
  };
};

export default useQuotationToProject;
