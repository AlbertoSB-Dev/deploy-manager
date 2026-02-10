'use client';

import { useParams } from 'next/navigation';
import FileManager from '@/components/FileManager';

export default function FilesPage() {
  const params = useParams();
  const serverId = params.serverId as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <FileManager serverId={serverId} />
    </div>
  );
}
