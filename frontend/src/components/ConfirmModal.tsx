import { X, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'default' | 'warning' | 'danger';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  variant = 'default',
}: ConfirmModalProps) {
  const { theme: currentTheme } = useThemeStore();

  if (!isOpen) return null;

  const variantStyles = {
    default: {
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    danger: {
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-xl shadow-2xl ${
        currentTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center gap-4 p-6 border-b ${
          currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className={`p-2 rounded-lg ${
            variant === 'warning'
              ? currentTheme === 'dark' ? 'bg-yellow-900/50' : 'bg-yellow-100'
              : variant === 'danger'
              ? currentTheme === 'dark' ? 'bg-red-900/50' : 'bg-red-100'
              : currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
          }`}>
            <AlertCircle className={`w-5 h-5 ${styles.icon}`} />
          </div>
          <h2 className={`flex-1 text-xl font-semibold ${
            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`p-1 rounded-lg transition-colors ${
              currentTheme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className={`text-sm leading-relaxed ${
            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${
          currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentTheme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2 ${styles.button} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium`}
          >
            {isLoading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

