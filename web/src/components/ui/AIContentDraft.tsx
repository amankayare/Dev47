import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Upload, X, Loader2, FileText } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AIContentDraftProps {
  /** Whether the parent is currently waiting for the AI response. */
  isConverting: boolean;
  /**
   * Called when the user clicks "Convert to HTML".
   * The parent (via useAIConvert) is responsible for the actual API call.
   * Single Responsibility: this component only captures input and emits events.
   */
  onConvert: (rawText: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AIContentDraft
 *
 * Pure UI component — no API calls, no global state.
 * Owns the draft textarea and file-upload interaction only.
 *
 * Single Responsibility: capture draft text or .md/.txt file, then
 * notify the parent via onConvert(). All async/fetch logic lives in
 * the useAIConvert hook consumed by the parent.
 */
export function AIContentDraft({ isConverting, onConvert }: AIContentDraftProps) {
  const [draft, setDraft] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // File upload handler
  // -------------------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(md|txt)$/i)) {
      alert('Please upload a .md or .txt file only.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setDraft(ev.target?.result as string ?? '');
      setFileName(file.name);
    };
    reader.readAsText(file);

    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleClear = () => {
    setDraft('');
    setFileName(null);
  };

  const isOverLimit = draft.length > 50_000;
  const isEmpty = !draft.trim();
  const isDisabled = isConverting || isEmpty || isOverLimit;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Draft Content
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
            (plain text or markdown)
          </span>
        </Label>

        <div className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Upload button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isConverting}
            className="text-xs gap-1.5 h-8 border-dashed"
          >
            <Upload className="w-3 h-3" />
            Upload .md / .txt
          </Button>

          {/* Clear button — shown only when there is content */}
          {!isEmpty && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isConverting}
              className="text-xs gap-1 h-8 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* File name badge */}
      {fileName && (
        <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
          <FileText className="w-3 h-3" />
          <span>{fileName}</span>
        </div>
      )}

      {/* Draft textarea */}
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={10}
        disabled={isConverting}
        placeholder={
          `Paste your notes or markdown here…\n\n` +
          `# My Blog Title\n\n` +
          `Introduction paragraph...\n\n` +
          `## Section 1\n\n` +
          `- Point one\n` +
          `- Point two\n\n` +
          `\`\`\`python\nprint("Hello, World!")\n\`\`\``
        }
        className="font-mono text-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl resize-y bg-gray-50 dark:bg-gray-800 focus:border-purple-400 dark:focus:border-purple-500 transition-colors"
      />

      {/* Character counter */}
      <div className="flex justify-between text-xs">
        <span className={isOverLimit ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}>
          {draft.length.toLocaleString()} / 50,000 characters
        </span>
        {isOverLimit && (
          <span className="text-red-500 font-medium">
            Content exceeds the 50,000 character limit.
          </span>
        )}
      </div>

      {/* Convert button */}
      <Button
        type="button"
        onClick={() => onConvert(draft)}
        disabled={isDisabled}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 border-0 h-11"
      >
        {isConverting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Converting with AI…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            ✨ Convert to HTML
          </>
        )}
      </Button>
    </div>
  );
}
