import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Link, Upload } from 'lucide-react';
import FileUpload from './FileUpload';
import { ensureHttpsProtocol } from '@/utils/urlUtils';

interface ImageInputProps {
  label: string;
  currentUrl?: string;
  onUrlChange: (url: string) => void;
  onUploadSuccess: (url: string) => void;
  onDelete: () => void;
  accept?: string;
  maxSize?: number;
  uploadType: 'profile' | 'cover' | 'project' | 'certificate' | 'resume';
  placeholder?: string;
}

export default function ImageInput({
  label,
  currentUrl = '',
  onUrlChange,
  onUploadSuccess,
  onDelete,
  accept = 'image/*',
  maxSize = 5,
  uploadType,
  placeholder
}: ImageInputProps) {
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>('url');

  const handleMethodToggle = () => {
    const newMethod = inputMethod === 'url' ? 'upload' : 'url';
    setInputMethod(newMethod);
    
    // Clear current value when switching methods
    if (currentUrl) {
      onDelete();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-slate-700 dark:text-slate-200 font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMethodToggle}
            className="flex items-center gap-2 text-xs"
          >
            {inputMethod === 'url' ? (
              <>
                <Upload className="w-3 h-3" />
                Switch to Upload
              </>
            ) : (
              <>
                <Link className="w-3 h-3" />
                Switch to URL
              </>
            )}
          </Button>
        </div>
      </div>

      {inputMethod === 'url' ? (
        <div className="space-y-2">
          <Input
            value={currentUrl}
            onChange={(e) => onUrlChange(ensureHttpsProtocol(e.target.value))}
            className="border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder={placeholder || `Enter ${label.toLowerCase()} URL...`}
          />
          {currentUrl && (
            <div className="mt-2">
              <img
                src={currentUrl}
                alt={`${label} preview`}
                className="w-20 h-20 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-600"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <FileUpload
          label=""
          currentUrl={currentUrl}
          onUploadSuccess={onUploadSuccess}
          onDelete={onDelete}
          accept={accept}
          maxSize={maxSize}
          uploadType={uploadType}
        />
      )}
    </div>
  );
}
