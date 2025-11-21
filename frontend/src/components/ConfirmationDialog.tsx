import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireInput?: boolean;
  inputPlaceholder?: string;
  inputMatch?: string;
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  requireInput = false,
  inputPlaceholder = '',
  inputMatch = '',
}: ConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [isInputValid, setIsInputValid] = useState(false);

  useEffect(() => {
    if (requireInput && inputMatch) {
      setIsInputValid(inputValue.trim().toLowerCase() === inputMatch.trim().toLowerCase());
    } else if (requireInput) {
      setIsInputValid(inputValue.trim().length > 0);
    }
  }, [inputValue, requireInput, inputMatch]);

  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setIsInputValid(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (requireInput && !isInputValid) {
      return;
    }
    onConfirm();
  };

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
      borderColor: 'border-red-200',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      borderColor: 'border-yellow-200',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      borderColor: 'border-blue-200',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
      borderColor: 'border-green-200',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${config.borderColor} flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${config.iconBg}`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{message}</p>
          {requireInput && (
            <div className="mt-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  inputValue && !isInputValid ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                autoFocus
              />
              {inputValue && !isInputValid && inputMatch && (
                <p className="mt-1 text-xs text-red-600">O valor digitado não confere</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={requireInput && !isInputValid}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              requireInput && !isInputValid
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : config.confirmButton
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

