import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface BulkDeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  entityType: string;
  loading?: boolean;
}

const BulkDeleteConfirmation: React.FC<BulkDeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  entityType,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Confirm Bulk Delete
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete {selectedCount} {entityType}? This action cannot be undone.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-md"
          >
            {loading ? 'Deleting...' : `Delete ${selectedCount} ${entityType}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteConfirmation;
