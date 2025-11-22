import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isLoading?: boolean;
}

export default function CreateTemplateModal({ isOpen, onClose, onConfirm, isLoading = false }: CreateTemplateModalProps) {
  const { theme: currentTheme } = useThemeStore();
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTemplateName('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (templateName.trim()) {
      onConfirm(templateName.trim());
      setTemplateName('');
    }
  };

  if (!isOpen) return null;

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
        <div className={`flex items-center justify-between p-6 border-b ${
          currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${
            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Criar Novo Template
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
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label htmlFor="templateName" className={`block text-sm font-medium mb-2 ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'
            }`}>
              Nome do Template
            </label>
            <input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ex: Template Personalizado"
              autoFocus
              disabled={isLoading}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                currentTheme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              maxLength={255}
            />
            <p className={`text-xs mt-2 ${
              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Escolha um nome descritivo para o seu template
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !templateName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Criando...' : 'Criar Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

