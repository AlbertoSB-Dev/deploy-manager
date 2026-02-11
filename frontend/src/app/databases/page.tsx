'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import DatabaseList from '@/components/DatabaseList';

export default function DatabasesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <DatabaseList />
      </div>
    </div>
  );
}
