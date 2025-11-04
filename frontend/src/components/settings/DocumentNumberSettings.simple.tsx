import React from 'react';

/**
 * Document Number Format Settings Component (Simplified Version)
 * 
 * This is a minimal version to test the build
 */

const DocumentNumberSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Document Number Format
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure automatic numbering for invoices, quotations, and projects
        </p>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Feature coming soon! This section will allow you to configure custom document numbering.
        </p>
      </div>
    </div>
  );
};

export default DocumentNumberSettings;
