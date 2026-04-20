import React, { useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  rows?: number;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing...", 
  label,
  required = false,
  rows = 10 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      {/* Toolbar */}
      <div className="border border-border rounded-t-md bg-muted/50 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="px-2 py-1 text-sm border border-border rounded hover:bg-background"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="px-2 py-1 text-sm border border-border rounded hover:bg-background"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="px-2 py-1 text-sm border border-border rounded hover:bg-background"
        >
          <u>U</u>
        </button>
        <div className="w-px bg-border mx-1" />
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h1')}
          className="px-2 py-1 text-sm border border-border rounded hover:bg-background"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h2')}
          className="px-2 py-1 text-sm border border-border rounded hover:bg-background"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h3')}
          className="px-2 py-1 text-sm border border-border rounded hover:bg-background"
        >
          H3
        </button>
        <div className="w-px bg-border mx-1" />
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="px-2 py-1 text-sm border border-border rounded hover:bg-background"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="px-2 py-1 text-sm border border-border rounded hover:bg-background"
        >
          1.
        </button>
        <div className="w-px bg-border mx-1" />
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) formatText('createLink', url);
          }}
          className="px-2 py-1 text-sm border border-border rounded hover:bg-background"
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => formatText('removeFormat')}
          className="px-2 py-1 text-sm border border-border rounded hover:bg-background"
        >
          Clear
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-[200px] p-3 border border-t-0 border-border rounded-b-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rich-text-editor"
        style={{ minHeight: `${rows * 1.5}rem` }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `
      }} />
    </div>
  );
}
