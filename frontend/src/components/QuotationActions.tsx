import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useQuotationToProject from '../hooks/useQuotationToProject';
import { Project } from '../services/projectService_fixed';

interface QuotationActionsProps {
  quotationId: number;
  quotationNumber: string;
  quotationStatus: string;
  onQuotationUpdate?: (updatedQuotation: any) => void;
  onProjectCreated?: (project: Project) => void;
  showCreateProjectOption?: boolean;
  className?: string;
}

const QuotationActions: React.FC<QuotationActionsProps> = ({
  quotationId,
  quotationNumber,
  quotationStatus,
  onQuotationUpdate,
  onProjectCreated,
  showCreateProjectOption = true,
  className = ''
}) => {
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [autoCreateProject, setAutoCreateProject] = useState(true);
  
  const {
    isCreatingProject,
    lastCreatedProject,
    approveAndCreateProject,
    createProjectFromQuotation
  } = useQuotationToProject();

  const handleApproveQuotation = async () => {
    try {
      const result = await approveAndCreateProject(quotationId, autoCreateProject);
      
      // Call callbacks if provided
      if (onQuotationUpdate) {
        onQuotationUpdate(result.quotation);
      }
      
      if (result.project && onProjectCreated) {
        onProjectCreated(result.project);
      }
      
      setShowConfirmDialog(false);
      
      // Navigate to the created project if one was created
      if (result.project) {
        setTimeout(() => {
          navigate(`/projects/${result.project!.id}`);
        }, 2000); // Delay to show the success message
      }
      
    } catch (error) {
      console.error('Failed to approve quotation:', error);
    }
  };

  const handleCreateProjectOnly = async () => {
    try {
      const project = await createProjectFromQuotation(quotationId);
      
      if (onProjectCreated) {
        onProjectCreated(project);
      }
      
      // Navigate to the created project
      setTimeout(() => {
        navigate(`/projects/${project.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  // Don't show actions for already processed quotations
  if (quotationStatus === 'converted' || quotationStatus === 'rejected') {
    return null;
  }

  return (
    <div className={`quotation-actions ${className}`}>
      {quotationStatus === 'pending' && (
        <button
          onClick={() => setShowConfirmDialog(true)}
          disabled={isCreatingProject}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreatingProject ? 'Processing...' : 'Approve Quotation'}
        </button>
      )}

      {quotationStatus === 'approved' && showCreateProjectOption && (
        <button
          onClick={handleCreateProjectOnly}
          disabled={isCreatingProject}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreatingProject ? 'Creating Project...' : 'Create Project'}
        </button>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Approve Quotation {quotationNumber}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You are about to approve this quotation. What would you like to do next?
            </p>
            
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoCreateProject}
                  onChange={(e) => setAutoCreateProject(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Automatically create a new project from this quotation
                </span>
              </label>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveQuotation}
                disabled={isCreatingProject}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isCreatingProject ? 'Processing...' : 'Approve & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success notification for created project */}
      {lastCreatedProject && (
        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
          ✅ Project "{lastCreatedProject.name}" created successfully!
        </div>
      )}
    </div>
  );
};

export default QuotationActions;
