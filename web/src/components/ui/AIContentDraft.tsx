import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Upload, X, Loader2, FileText, Settings2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { apiGet } from '@/utils/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AIContentDraftProps {
  /** Whether the parent is currently waiting for the AI response. */
  isConverting: boolean;
  /**
   * Called when the user clicks "Convert to HTML".
   * @param rawText      The draft content to convert.
   * @param customPrompt Optional override for the server's default system prompt.
   */
  onConvert: (rawText: string, customPrompt?: string) => void;

  // --- Controlled prompt state (lifted to parent so it survives unmount) ---
  /** Current value of the system prompt textarea (controlled). */
  customPrompt: string;
  /** Called when the user edits the system prompt. */
  onCustomPromptChange: (prompt: string) => void;
  /** Whether the default prompt has already been fetched from the server. */
  promptLoaded: boolean;
  /** Called once after the first successful fetch so the parent can persist the flag. */
  onPromptLoaded: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AIContentDraft
 *
 * Pure UI component — no global state, no direct API calls except the optional
 * one-time prompt fetch.
 *
 * Prompt editor behaviour:
 *   - Hidden by default (collapsible via a "Customize Prompt" toggle).
 *   - On first open  → fetches the server default prompt and pre-fills the textarea.
 *   - On re-open     → shows the last edited value (state is owned by the PARENT
 *                      so it survives form close/submit/reopen cycles).
 *   - "Reset" button → re-fetches the server default and overwrites any edits.
 *   - If the user leaves the prompt textarea unchanged, the server uses its own default.
 *     If the user edits it, the edited version is sent as `custom_system_prompt`.
 */
export function AIContentDraft({
  isConverting,
  onConvert,
  customPrompt,
  onCustomPromptChange,
  promptLoaded,
  onPromptLoaded,
}: AIContentDraftProps) {
  // --- Draft state (local — intentionally reset between sessions) ---
  const [draft, setDraft] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  // --- Prompt editor UI state (local — only controls visibility & loading) ---
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [promptLoadError, setPromptLoadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Fetch server default prompt
  // -------------------------------------------------------------------------
  const fetchDefaultPrompt = useCallback(async () => {
    setIsLoadingPrompt(true);
    setPromptLoadError(null);
    try {
      const res = await apiGet('/api/blogs/convert/default-prompt');
      onCustomPromptChange(res.prompt ?? '');
      onPromptLoaded();
    } catch {
      setPromptLoadError('Failed to load default prompt. You can still type your own below.');
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [onCustomPromptChange, onPromptLoaded]);

  // Toggle the prompt editor; auto-fetch on first open only.
  const handleTogglePromptEditor = async () => {
    if (!showPromptEditor && !promptLoaded) {
      await fetchDefaultPrompt();
    }
    setShowPromptEditor(prev => !prev);
  };

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

  // Only send the custom prompt if the editor was loaded (and potentially edited).
  const effectivePrompt = promptLoaded && customPrompt ? customPrompt : undefined;

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

      {/* ── Collapsible Prompt Editor ── */}
      <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Toggle button */}
        <button
          type="button"
          onClick={handleTogglePromptEditor}
          disabled={isConverting}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            Customize System Prompt
            <span className="text-gray-400 font-normal">(optional)</span>
            {/* Dot indicator when the user has an active custom prompt */}
            {promptLoaded && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Custom prompt active" />
            )}
          </span>
          {showPromptEditor
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Prompt textarea — visible when expanded */}
        {showPromptEditor && (
          <div className="px-4 pb-4 pt-1 space-y-2 bg-gray-50/50 dark:bg-gray-800/30 border-t border-dashed border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Edit the instructions sent to the AI. Your changes are remembered across sessions.
              </p>
              {/* Reset to server default */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fetchDefaultPrompt}
                disabled={isLoadingPrompt}
                className="text-xs gap-1 h-7 text-gray-400 hover:text-gray-600 shrink-0"
              >
                {isLoadingPrompt
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <RotateCcw className="w-3 h-3" />}
                Reset to default
              </Button>
            </div>

            {promptLoadError && (
              <p className="text-xs text-amber-500">{promptLoadError}</p>
            )}

            {isLoadingPrompt ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading default prompt…
              </div>
            ) : (
              <Textarea
                value={customPrompt}
                onChange={(e) => onCustomPromptChange(e.target.value)}
                rows={14}
                disabled={isConverting}
                placeholder="Type your custom system prompt here, or click 'Reset to default' to load the server default…"
                className="font-mono text-xs border-2 border-gray-200 dark:border-gray-700 rounded-xl resize-y bg-white dark:bg-gray-900 focus:border-purple-400 dark:focus:border-purple-500 transition-colors"
              />
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              ⚠️ The OUTPUT FORMAT section (JSON structure) must be preserved for the conversion to work correctly.
            </p>
          </div>
        )}
      </div>

      {/* Convert button */}
      <Button
        type="button"
        onClick={() => onConvert(draft, effectivePrompt)}
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
