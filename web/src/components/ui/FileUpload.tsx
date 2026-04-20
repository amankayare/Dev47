import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Eye, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface FileUploadProps {
  label?: string;
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  onDelete?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  uploadType?: 'profile' | 'cover' | 'project' | 'certificate' | 'resume'; // Updated to include resume
}

interface UploadResponse {
  url: string;
  filename: string;
  message: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label = "Upload File",
  currentUrl = "",
  onUploadSuccess,
  onDelete,
  accept = "image/*",
  maxSize = 5,
  disabled = false,
  uploadType = 'profile',
}) => {
  const [preview, setPreview] = useState<string>(currentUrl);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/upload/${uploadType}`, {
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
    onError: (error: Error) => {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (filename: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/upload/delete/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      return response.json();
    },
    onSuccess: () => {
      setPreview("");
      if (onDelete) {
        onDelete();
      }
    },
    onError: (error: Error) => {
      console.error('Delete error:', error);
      alert(`Delete failed: ${error.message}`);
    },
  });

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'File must be an image';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDeleteFile = () => {
    if (preview && preview.includes('/static/uploads/')) {
      const filename = preview.split('/').pop();
      if (filename) {
        deleteMutation.mutate(filename);
      }
    } else {
      // If it's an external URL, just clear it
      setPreview("");
      if (onDelete) {
        onDelete();
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Label className="text-slate-700 dark:text-slate-200 font-medium">
        {label}
      </Label>

      {/* Current Image Preview */}
      {preview && (
        <div className="relative border-2 border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-gray-700">
          <img
            src={preview}
            alt="Profile preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => window.open(preview, '_blank')}
              className="bg-white/80 hover:bg-white/90"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteFile}
              disabled={deleteMutation.isPending}
              className="bg-red-500/80 hover:bg-red-500/90"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-600 dark:text-slate-300 mb-2">
          Drag and drop your image here, or{' '}
          <button
            type="button"
            onClick={openFileDialog}
            disabled={disabled || uploadMutation.isPending}
            className="text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          PNG, JPG, JPEG, GIF, WEBP (max {maxSize}MB)
        </p>

        {uploadMutation.isPending && (
          <div className="mt-4">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Uploading...
            </p>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploadMutation.isPending}
      />
    </div>
  );
};

export default FileUpload;
