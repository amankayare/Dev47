import { useState, useCallback } from 'react';
import { apiPost } from '@/utils/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIConversionResult {
  html_content: string;
  suggested_title: string;
  suggested_excerpt: string;
  reading_time_minutes: number;
  suggested_quick_links?: Array<{ title: string; url: string }>;
  suggested_tags?: string[];
}

interface UseAIConvertReturn {
  isConverting: boolean;
  error: string | null;
  convert: (rawText: string) => Promise<AIConversionResult | null>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// Interface Segregation: this hook owns only the AI conversion concern.
// BlogsManagement.tsx does not need to know anything about fetch state,
// error handling, or the API endpoint — it only calls `convert()`.
// ---------------------------------------------------------------------------

/**
 * useAIConvert
 *
 * Encapsulates the state and logic for calling the AI content conversion
 * endpoint. Returns a stable `convert` function plus loading/error state.
 *
 * Single Responsibility: manages only the POST /api/blogs/convert call.
 */
export function useAIConvert(): UseAIConvertReturn {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(
    async (rawText: string, customPrompt?: string): Promise<AIConversionResult | null> => {
      // Client-side guard — mirrors the server-side Marshmallow validation.
      if (!rawText.trim() || rawText.trim().length < 10) {
        setError('Content must be at least 10 characters long.');
        return null;
      }

      setIsConverting(true);
      setError(null);

      try {
        const result = await apiPost('/api/blogs/convert', {
          raw_text: rawText,
          ...(customPrompt ? { custom_system_prompt: customPrompt } : {}),
        });
        return result as AIConversionResult;
      } catch (err: any) {
        // Normalise error messages from the various HTTP error codes
        const msg: string = err?.message ?? '';
        if (msg.includes('503') || msg.toLowerCase().includes('not configured')) {
          setError('AI service is not configured on the server. Contact the administrator.');
        } else if (msg.includes('502') || msg.toLowerCase().includes('invalid response')) {
          setError('AI returned an invalid response. Please try again.');
        } else {
          setError(err.message || 'AI conversion failed. Please try again.');
        }
        return null;
      } finally {
        setIsConverting(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { isConverting, error, convert, reset };
}
