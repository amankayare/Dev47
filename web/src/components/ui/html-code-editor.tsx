import React from 'react';
import { Label } from '@/components/ui/label';

interface HtmlCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  rows?: number;
}

export function HtmlCodeEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your HTML content here...", 
  label,
  required = false,
  rows = 12 
}: HtmlCodeEditorProps) {

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          className="w-full p-4 border border-border rounded-lg bg-background font-mono text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[300px]"
          style={{
            tabSize: 2,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}
        />
        
        {/* Optional: Add line numbers or syntax highlighting in the future */}
        <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          HTMLBlog Management
        </div>
      </div>
      
      <div className="text-xs p-2 text-muted-foreground">
        Enter raw HTML content. It will be rendered as-is on the blog page.
      </div>
    </div>
  );
}
