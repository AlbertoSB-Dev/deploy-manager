'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ServiceItem from './ServiceItem';

interface ServiceSectionProps {
  title: string;
  icon: string;
  count: number;
  items: any[];
  type: 'project' | 'database' | 'wordpress';
  onDataUpdate?: () => void;
}

export default function ServiceSection({
  title,
  icon,
  count,
  items,
  type,
  onDataUpdate,
}: ServiceSectionProps) {
  const [expanded, setExpanded] = useState(true);

  if (count === 0) {
    return null; // Não mostrar seção vazia
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header da Seção */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
          <span className="text-lg">{icon}</span>
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
            {count}
          </span>
        </div>
      </button>

      {/* Lista de Itens */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {items.map((item, index) => (
            <div key={item._id}>
              <ServiceItem
                item={item}
                type={type}
                onDataUpdate={onDataUpdate}
              />
              {index < items.length - 1 && (
                <div className="border-t border-gray-100 dark:border-gray-700/50" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
