import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Link, Upload, FileText, Eye } from 'lucide-react';
import ResumeUpload from './ResumeUpload';

interface ResumeInputProps {
  label: string;
  currentUrl?: string;
  onUrlChange: (url: string) => void;
  onUploadSuccess: (url: string) => void;
  onDelete: () => void;
  maxSize?: number;
  placeholder?: string;
}

export default function ResumeInput({
  label,
  currentUrl = '',
  onUrlChange,
  onUploadSuccess,
  onDelete,
  maxSize = 5,
  placeholder
}: ResumeInputProps) {
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>('url');

  const handleMethodToggle = () => {
    const newMethod = inputMethod === 'url' ? 'upload' : 'url';
    setInputMethod(newMethod);
    
    // Clear current value when switching methods
    if (currentUrl) {
      onDelete();
    }
  };

  const getDisplayName = (url: string) => {
    if (url.includes('/static/uploads/')) {
      const filename = url.split('/').pop() || '';
      const parts = filename.split('_');
      if (parts.length > 1) {
        return parts.slice(1).join('_');
      }
      return filename;
    }
    
    // For external URLs, extract filename or create a meaningful display name
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      
      if (filename && filename.includes('.')) {
        return filename;
      }
      
      // If no filename, use domain + truncated path
      const domain = urlObj.hostname.replace('www.', '');
      const truncatedPath = pathname.length > 20 ? pathname.substring(0, 17) + '...' : pathname;
      return `${domain}${truncatedPath}`;
    } catch {
      // If URL parsing fails, truncate the original URL
      return url.length > 30 ? url.substring(0, 27) + '...' : url;
    }
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname + urlObj.search;
      
      const availableLength = maxLength - domain.length - 8; // 8 for "https://" + "..."
      if (availableLength > 10) {
        const truncatedPath = path.length > availableLength ? 
          path.substring(0, availableLength - 3) + '...' : path;
        return `https://${domain}${truncatedPath}`;
      }
    } catch {
      // Fallback for invalid URLs
    }
    
    return url.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Label className="text-slate-700 dark:text-slate-200 font-medium">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleMethodToggle}
          className="flex items-center justify-center gap-2 text-xs w-fit self-start sm:self-auto"
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

      {inputMethod === 'url' ? (
        <div className="space-y-2">
          <Input
            value={currentUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            className="border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full min-w-0"
            placeholder={placeholder || `Enter ${label.toLowerCase()} URL...`}
            title={currentUrl} // Show full URL on hover
          />
          {currentUrl && (
            <div className="mt-3 p-3 sm:p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate mb-1">
                      {getDisplayName(currentUrl)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 break-all sm:truncate" title={currentUrl}>
                      {truncateUrl(currentUrl, 60)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(currentUrl, '_blank')}
                    className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-3 py-2 flex-1 sm:flex-none"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 px-3 py-2 flex-1 sm:flex-none"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <ResumeUpload
          label=""
          currentUrl={currentUrl}
          onUploadSuccess={onUploadSuccess}
          onDelete={onDelete}
          maxSize={maxSize}
        />
      )}
    </div>
  );
}
