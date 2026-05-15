import React, { useState, useRef } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface Category {
  id: number;
  name: string;
}

interface CategoryDropdownProps {
  categories: Category[];
  selectedId: number | string | '';
  onSelect: (id: number | string) => void;
  onDelete?: (id: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  selectedId,
  onSelect,
  onDelete,
  disabled,
  placeholder = 'Select category...',
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = categories.find(cat => cat.id.toString() === selectedId.toString());

  return (
    <div className="relative w-full min-w-[220px]">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'flex items-center justify-between w-full h-12 px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base font-medium shadow-sm transition-all',
          open ? 'ring-2 ring-blue-400 dark:ring-blue-500' : '',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        )}
        onClick={() => setOpen(v => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn('truncate', !selected && 'text-gray-400 dark:text-gray-500')}>{selected ? selected.name : placeholder}</span>
        <ChevronDown className="ml-2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      {open && (
        <ul
          className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl animate-fade-in"
          tabIndex={-1}
          role="listbox"
        >
          {categories.length === 0 && (
            <li className="px-4 py-3 text-gray-400 dark:text-gray-500">No categories</li>
          )}
          {categories.map(cat => (
            <li
              key={cat.id}
              className={cn(
                'flex items-center justify-between px-4 py-2 cursor-pointer group',
                selectedId.toString() === cat.id.toString() ? 'bg-blue-50 dark:bg-blue-900 font-bold text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
              )}
              onClick={() => {
                onSelect(cat.id);
                setOpen(false);
              }}
              role="option"
              aria-selected={selectedId.toString() === cat.id.toString()}
            >
              <span className="truncate flex-1">{cat.name}</span>
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-red-500 hover:text-red-700 opacity-80 group-hover:opacity-100"
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(cat.id);
                  }}
                  disabled={disabled}
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
