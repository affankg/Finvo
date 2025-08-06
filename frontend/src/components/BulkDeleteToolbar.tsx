import React from 'react';
import { TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface BulkDeleteToolbarProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  loading?: boolean;
  entityType: string; // e.g., "clients", "quotations", "invoices", "users"
}

const BulkDeleteToolbar: React.FC<BulkDeleteToolbarProps> = ({
  selectedCount,
  onDeleteSelected,
  onClearSelection,
  loading = false,
  entityType
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-indigo-100">
              {selectedCount} {entityType} selected
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onClearSelection}
            className="text-sm text-slate-600 dark:text-gray-400 hover:text-indigo-700 dark:hover:text-gray-200 flex items-center space-x-1 font-medium transition-colors duration-200"
            disabled={loading}
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Clear selection</span>
          </button>
          
          <button
            onClick={onDeleteSelected}
            disabled={loading}
            className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 disabled:from-rose-300 disabled:to-red-400 text-white px-4 py-2 rounded-md font-semibold flex items-center space-x-2 text-sm transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <TrashIcon className="h-4 w-4" />
            <span>{loading ? 'Deleting...' : `Delete Selected`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteToolbar;
