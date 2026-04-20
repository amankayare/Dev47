import { useState } from 'react';

interface UseDeleteConfirmationProps {
  onDelete: (id: number) => void;
  itemName: (item: any) => string;
  itemType: string;
}

interface DeleteConfirmationState {
  isOpen: boolean;
  item: any;
  itemId: number | null;
}

export function useDeleteConfirmation({
  onDelete,
  itemName,
  itemType,
}: UseDeleteConfirmationProps) {
  const [confirmState, setConfirmState] = useState<DeleteConfirmationState>({
    isOpen: false,
    item: null,
    itemId: null,
  });

  const openConfirmDialog = (item: any) => {
    setConfirmState({
      isOpen: true,
      item,
      itemId: item.id,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      item: null,
      itemId: null,
    });
  };

  const confirmDelete = () => {
    if (confirmState.itemId) {
      onDelete(confirmState.itemId);
    }
  };

  const getConfirmationText = () => {
    if (!confirmState.item) return '';
    const name = itemName(confirmState.item);
    return `Are you sure you want to delete ${itemType} "${name}"? This action cannot be undone.`;
  };

  const getTitle = () => `Delete ${itemType}`;

  return {
    confirmState,
    openConfirmDialog,
    closeConfirmDialog,
    confirmDelete,
    getConfirmationText,
    getTitle,
  };
}
