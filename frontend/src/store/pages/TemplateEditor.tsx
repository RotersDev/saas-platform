import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, FileCode, Code, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../themeStore';
import Editor from '@monaco-editor/react';

export default function StoreTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme: currentTheme } = useThemeStore();
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editorHeight, setEditorHeight] = useState(400);
  const saveTimeoutRef = useRef<number | null>(null);

  // Ajustar altura do editor baseado no tamanho da tela
  useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth < 640) {
        // Mobile: altura menor
        setEditorHeight(300);
      } else if (window.innerWidth < 1024) {
        // Tablet: altura média
        setEditorHeight(350);
      } else {
        // Desktop: altura padrão
        setEditorHeight(400);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Buscar template
  const { data: template, isLoading } = useQuery(
    ['template', id],
    async () => {
      const response = await api.get(`/api/templates/${id}`);
      return response.data;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        if (data && !hasLoaded) {
          setTemplateName(data.name || '');
          setCustomCss(data.custom_css || '');
          setCustomJs(data.custom_js || '');
          setHasLoaded(true);
        }
      },
    }
  );

  // Atualizar valores quando o template mudar (mas não resetar se já carregou)
  useEffect(() => {
    if (template && hasLoaded) {
      // Só atualizar o nome se mudou (não afeta edição de código)
      if (template.name !== templateName) {
        setTemplateName(template.name || '');
      }
      // Não atualizar CSS/JS se o usuário já está editando
      // Os valores serão atualizados apenas quando vierem do servidor após salvar
    }
  }, [template?.name]);

  // Auto-save (apenas se não for template padrão)
  useEffect(() => {
    if (!template || !id || template.is_default) return;

    // Limpar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Criar novo timeout para salvar após 2 segundos de inatividade
    saveTimeoutRef.current = window.setTimeout(() => {
      updateTemplateMutation.mutate({
        custom_css: customCss,
        custom_js: customJs,
      });
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [customCss, customJs, template, id]);

  // Verificar se é template padrão antes de usar
  const isDefaultTemplate = template?.is_default || false;

  // Mutation para atualizar template
  const updateTemplateMutation = useMutation(
    async (data: { custom_css?: string; custom_js?: string }) => {
      if (isDefaultTemplate) {
        throw new Error('Template padrão não pode ser editado');
      }
      // Garantir que strings vazias sejam enviadas como strings vazias, não undefined
      const payload: { custom_css: string; custom_js: string } = {
        custom_css: data.custom_css !== undefined ? (data.custom_css || '') : customCss,
        custom_js: data.custom_js !== undefined ? (data.custom_js || '') : customJs,
      };
      const response = await api.put(`/api/templates/${id}`, payload);
      return response.data;
    },
    {
      onSuccess: (savedData) => {
        // Atualizar os valores locais com os valores salvos
        if (savedData.custom_css !== undefined) {
          setCustomCss(savedData.custom_css || '');
        }
        if (savedData.custom_js !== undefined) {
          setCustomJs(savedData.custom_js || '');
        }
        // Invalidar queries mas manter os valores locais
        queryClient.setQueryData(['template', id], (old: any) => ({
          ...old,
          custom_css: savedData.custom_css || '',
          custom_js: savedData.custom_js || '',
        }));
        queryClient.invalidateQueries('templates');
        queryClient.invalidateQueries('shopTheme');
        // Não mostrar toast no auto-save para não incomodar
        if (saveTimeoutRef.current) {
          // Auto-save silencioso
        } else {
          toast.success('Template salvo com sucesso!');
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao salvar template');
      },
    }
  );

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    // Garantir que estamos enviando os valores atuais
    updateTemplateMutation.mutate({
      custom_css: customCss || '',
      custom_js: customJs || '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Template não encontrado</p>
        <button
          onClick={() => navigate('/store/settings#advanced')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Voltar para configurações
        </button>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate('/store/settings#advanced')}
            className={`inline-flex items-center gap-2 mb-2 ${
              currentTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className={`text-2xl sm:text-3xl font-bold break-words ${
            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {isDefaultTemplate ? 'Template Padrão' : `Editor: ${templateName}`}
          </h1>
          <p className={`mt-2 text-sm sm:text-base ${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {isDefaultTemplate
              ? 'Este é o template padrão da Nerix e não pode ser editado.'
              : 'Edite o CSS e JavaScript do seu template. As alterações são salvas automaticamente.'}
          </p>
        </div>
        {!isDefaultTemplate && (
          <button
            onClick={handleManualSave}
            disabled={updateTemplateMutation.isLoading}
            className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg text-sm sm:text-base whitespace-nowrap"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {updateTemplateMutation.isLoading ? 'Salvando...' : 'Salvar Agora'}
          </button>
        )}
      </div>

      {/* Aviso de Isolamento - apenas se não for padrão */}
      {!isDefaultTemplate && (
        <div className={`mb-6 rounded-lg border p-4 ${
          currentTheme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <div>
              <h3 className={`font-semibold mb-1 ${
                currentTheme === 'dark' ? 'text-blue-300' : 'text-blue-900'
              }`}>
                Isolamento Garantido
              </h3>
              <p className={`text-sm ${
                currentTheme === 'dark' ? 'text-blue-200' : 'text-blue-800'
              }`}>
                O código que você adicionar aqui é completamente isolado. Ele só será aplicado na sua loja pública e não afetará outras lojas, o dashboard ou o site principal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Aviso se for template padrão */}
      {isDefaultTemplate && (
        <div className={`mb-6 rounded-lg border p-4 ${
          currentTheme === 'dark' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              currentTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div>
              <h3 className={`font-semibold mb-1 ${
                currentTheme === 'dark' ? 'text-yellow-300' : 'text-yellow-900'
              }`}>
                Template Padrão
              </h3>
              <p className={`text-sm ${
                currentTheme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'
              }`}>
                Este é o template padrão da Nerix e não pode ser editado. Crie um novo template para personalizar sua loja.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* CSS Editor */}
        <div className={`rounded-xl border shadow-sm ${
          currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-3 sm:p-4 lg:p-6 border-b ${
            currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <FileCode className={`w-5 h-5 ${
                  currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${
                  currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>CSS Personalizado</h2>
                <p className={`text-sm ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Estilos customizados para sua loja</p>
              </div>
            </div>
          </div>
          <div className="p-2 sm:p-4 lg:p-6">
            <div className={`rounded-lg overflow-hidden border ${
              currentTheme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <Editor
                height={`${editorHeight}px`}
                language="css"
                value={customCss}
                onChange={(value) => setCustomCss(value || '')}
                theme={currentTheme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  readOnly: isDefaultTemplate,
                  minimap: { enabled: false },
                  fontSize: window.innerWidth < 640 ? 12 : 14,
                  lineNumbers: window.innerWidth < 640 ? 'off' : 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: window.innerWidth >= 640,
                  acceptSuggestionOnCommitCharacter: true,
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    useShadows: false,
                  },
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                }}
                loading={<div className="text-center py-8">Carregando editor...</div>}
              />
            </div>
            {!isDefaultTemplate && (
              <p className={`text-xs mt-3 ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                O CSS será aplicado apenas na sua loja pública, isolado de outras lojas.
              </p>
            )}
          </div>
        </div>

        {/* JavaScript Editor */}
        <div className={`rounded-xl border shadow-sm ${
          currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-3 sm:p-4 lg:p-6 border-b ${
            currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <Code className={`w-5 h-5 ${
                  currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${
                  currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>JavaScript Personalizado</h2>
                <p className={`text-sm ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Scripts customizados para sua loja</p>
              </div>
            </div>
          </div>
          <div className="p-2 sm:p-4 lg:p-6">
            <div className={`rounded-lg overflow-hidden border ${
              currentTheme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <Editor
                height={`${editorHeight}px`}
                language="javascript"
                value={customJs}
                onChange={(value) => setCustomJs(value || '')}
                theme={currentTheme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  readOnly: isDefaultTemplate,
                  minimap: { enabled: false },
                  fontSize: window.innerWidth < 640 ? 12 : 14,
                  lineNumbers: window.innerWidth < 640 ? 'off' : 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: window.innerWidth >= 640,
                  acceptSuggestionOnCommitCharacter: true,
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    useShadows: false,
                  },
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                }}
                loading={<div className="text-center py-8">Carregando editor...</div>}
              />
            </div>
            {!isDefaultTemplate && (
              <p className={`text-xs mt-3 ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                O JavaScript será executado apenas na sua loja pública, isolado de outras lojas e do dashboard.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status de Auto-save */}
      {updateTemplateMutation.isLoading && (
        <div className="mt-4 text-center">
          <p className={`text-sm ${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Salvando automaticamente...
          </p>
        </div>
      )}
    </div>
  );
}

