import { useState, useCallback } from 'react';
import ConfirmationDialog, { ConfirmationType } from '../components/ConfirmationDialog';

interface ConfirmOptions {
  title?: string;
  message: string;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  requireInput?: boolean;
  inputPlaceholder?: string;
  inputMatch?: string;
}

export function useConfirm() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmationType;
    confirmText: string;
    cancelText: string;
    requireInput?: boolean;
    inputPlaceholder?: string;
    inputMatch?: string;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    title: 'Confirmar ação',
    message: '',
    type: 'warning',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    requireInput: false,
    inputPlaceholder: '',
    inputMatch: '',
    resolve: null,
  });

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          isOpen: true,
          title: options.title || 'Confirmar ação',
          message: options.message,
          type: options.type || 'warning',
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          requireInput: options.requireInput || false,
          inputPlaceholder: options.inputPlaceholder || '',
          inputMatch: options.inputMatch || '',
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialogState.resolve]);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialogState.resolve]);

  const Dialog = (
    <ConfirmationDialog
      isOpen={dialogState.isOpen}
      title={dialogState.title}
      message={dialogState.message}
      type={dialogState.type}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      requireInput={dialogState.requireInput}
      inputPlaceholder={dialogState.inputPlaceholder}
      inputMatch={dialogState.inputMatch}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, Dialog };
}

