'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { sftpService } from '@/services/sftpService';
import toast from 'react-hot-toast';
import { X, Upload, File, CheckCircle } from 'lucide-react';
import { formatBytes } from '@/utils/formatters';

interface FileUploaderProps {
  serverId: string;
  targetPath: string;
  onClose: () => void;
  onComplete: () => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function FileUploader({ serverId, targetPath, onClose, onComplete }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        progress: 0,
        status: 'pending' as const,
      }));
      setFiles(prev => [...prev, ...newFiles]);
    },
  });

  const uploadFiles = async () => {
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];
      
      if (uploadFile.status !== 'pending') continue;

      try {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'uploading' as const } : f
        ));

        const remotePath = targetPath === '/' 
          ? `/${uploadFile.file.name}` 
          : `${targetPath}/${uploadFile.file.name}`;

        await sftpService.uploadFile(
          serverId,
          uploadFile.file,
          remotePath,
          (progress) => {
            setFiles(prev => prev.map((f, idx) => 
              idx === i ? { ...f, progress } : f
            ));
          }
        );

        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'completed' as const, progress: 100 } : f
        ));
      } catch (error: any) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' as const, error: error.message } : f
        ));
        toast.error(`Erro ao enviar ${uploadFile.file.name}: ${error.message}`);
      }
    }

    setUploading(false);
    
    const allCompleted = files.every(f => f.status === 'completed');
    if (allCompleted) {
      toast.success('Todos os arquivos foram enviados!');
      setTimeout(() => onComplete(), 1000);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
  const uploadedSize = files.reduce((acc, f) => acc + (f.file.size * f.progress / 100), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Upload de Arquivos</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Destino: <span className="font-mono">{targetPath}</span>
            </p>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-blue-600">Solte os arquivos aqui...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-400">
                  Máximo 500 MB por arquivo
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Arquivos selecionados:</h3>
              <div className="space-y-2">
                {files.map((uploadFile, index) => (
                  <div
                    key={index}
                    className="border rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <File className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate text-sm">{uploadFile.file.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          ({formatBytes(uploadFile.file.size)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadFile.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {uploadFile.status === 'pending' && (
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {uploadFile.status !== 'pending' && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            uploadFile.status === 'error' ? 'bg-red-500' :
                            uploadFile.status === 'completed' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {uploadFile.error && (
                      <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Progress */}
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="flex justify-between text-sm mb-1">
                  <span>Total:</span>
                  <span>{formatBytes(uploadedSize)} / {formatBytes(totalSize)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={uploading}
          >
            Cancelar
          </button>
          <button
            onClick={uploadFiles}
            disabled={files.length === 0 || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Enviando...' : `Enviar ${files.length} arquivo${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
