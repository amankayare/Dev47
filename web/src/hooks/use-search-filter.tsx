// hooks/useSearchFilter.ts
import { useMemo } from "react";

export function useSearchFilter<T>(
  data: T[],
  query: string,
  keysToSearch: (keyof T)[],
  nestedArrayKey?: keyof T
) {
  const filtered = useMemo(() => {
    if (!query || query.trim() === "") return data;
    
    const q = query.toLowerCase();
    return data.filter((item) => {
      // Check main keys
      const match = keysToSearch.some((key) => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(q);
        }
        if (typeof value === 'number') {
          return value.toString().includes(q);
        }
        return false;
      });

      if (!match && nestedArrayKey) {
        const nested = item[nestedArrayKey];
        if (Array.isArray(nested)) {
          return nested.some((entry) => {
            if (typeof entry === 'string') {
              return entry.toLowerCase().includes(q);
            }
            if (typeof entry === 'object' && entry !== null) {
              // Handle objects like tags with name property
              const name = (entry as any).name;
              if (typeof name === 'string') {
                return name.toLowerCase().includes(q);
              }
            }
            return false;
          });
        }
      }

      return match;
    });
  }, [query, data, keysToSearch, nestedArrayKey]);

  return filtered;
}
