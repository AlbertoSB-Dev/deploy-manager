'use client';

import { X, Terminal } from 'lucide-react';
import LiveLogsViewer from './LiveLogsViewer';

interface ProjectLogsModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export default function ProjectLogsModal({ projectId, projectName, onClose }: ProjectLogsModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Logs em Tempo Real</h2>
              <p className="text-sm text-gray-300 mt-1">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Logs Viewer */}
        <div className="flex-1 overflow-hidden">
          <LiveLogsViewer 
            projectId={projectId} 
            projectName={projectName}
          />
        </div>
      </div>
    </div>
  );
}
