import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from './button';
import { Label } from './label';
import { Trash2, Upload, FileText, Eye, Download } from 'lucide-react';

interface ResumeUploadProps {
  label?: string;
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  onDelete?: () => void;
  maxSize?: number; // in MB
  disabled?: boolean;
}

interface UploadResponse {
  url: string;
  filename: string;
  message: string;
}

export default function ResumeUpload({
  label = "Resume",
  currentUrl = '',
  onUploadSuccess,
  onDelete,
  maxSize = 5,
  disabled = false
}: ResumeUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resume/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPreview(data.url);
      onUploadSuccess(data.url);
    },
    onError: (error) => {
      console.error('Resume upload failed:', error);
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (!pdfFile) {
      alert('Please upload a PDF file');
      return;
    }

    if (pdfFile.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    uploadMutation.mutate(pdfFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDelete = () => {
    if (preview.startsWith('/static/uploads/')) {
      // If it's an uploaded file, call delete API
      const filename = preview.split('/').pop();
      if (filename) {
        const token = localStorage.getItem('token');
        fetch(`/api/resume/delete/${filename}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    }
    
    // Clear preview and call onDelete callback
    setPreview("");
    if (onDelete) {
      onDelete();
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getDisplayName = (url: string) => {
    if (url.includes('/static/uploads/')) {
      const filename = url.split('/').pop() || '';
      // Extract original name by removing the UUID prefix
      const parts = filename.split('_');
      if (parts.length > 1) {
        return parts.slice(1).join('_'); // Remove the "resume_uuid" part
      }
      return filename;
    }
    return url.split('/').pop() || 'Resume';
  };

  return (
    <div className="space-y-4">
      <Label className="text-slate-700 dark:text-slate-200 font-medium">
        {label}
      </Label>

      {/* Current Resume Preview */}
      {preview && (
        <div className="border-2 border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-gray-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {getDisplayName(preview)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">PDF Document</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => window.open(preview, '_blank')}
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-3 py-2"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDelete}
                className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-3 py-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploadMutation.isPending}
        />

        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-600 dark:text-slate-300 mb-2">
          Drag and drop your resume here, or{' '}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling to parent div
              openFileDialog();
            }}
            disabled={disabled || uploadMutation.isPending}
            className="text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          PDF only (max {maxSize}MB)
        </p>

        {uploadMutation.isPending && (
          <div className="mt-4">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Uploading resume...
            </p>
          </div>
        )}

        {uploadMutation.error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">
              {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Upload failed'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
