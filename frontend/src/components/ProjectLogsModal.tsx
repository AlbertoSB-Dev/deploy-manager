'use client';

import { X } from 'lucide-react';
import LiveLogsViewer from './LiveLogsViewer';

interface ProjectLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    _id: string;
    name: string;
  };
}

export default function ProjectLogsModal({ isOpen, onClose, project }: ProjectLogsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Logs: {project.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Visualização em tempo real dos logs do container
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <LiveLogsViewer projectId={project._id} projectName={project.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
