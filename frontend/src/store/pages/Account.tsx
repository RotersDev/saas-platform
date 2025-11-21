import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Save, Camera, LogOut, User, Mail, Upload, X, Monitor, Globe, Trash2, Settings } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';

type TabType = 'profile' | 'devices';

export default function StoreAccount() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const { confirm, Dialog } = useConfirm();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  // Buscar sessões ativas
  const { data: sessions, refetch: refetchSessions, isLoading: sessionsLoading, error: sessionsError } = useQuery(
    'userSessions',
    async () => {
      try {
        const response = await api.get('/api/auth/sessions');
        console.log('[Account] Sessões recebidas:', response.data);
        return response.data || [];
      } catch (error: any) {
        console.error('[Account] Erro ao buscar sessões:', error);
        console.error('[Account] Resposta do erro:', error.response?.data);
        throw error;
      }
    },
    {
      enabled: !!user,
      staleTime: 30 * 1000,
      retry: 1,
    }
  );

  const removeSessionMutation = useMutation(
    async (sessionId: number) => {
      const response = await api.delete(`/api/auth/sessions/${sessionId}`);
      return response.data;
    },
    {
      onSuccess: (data, sessionId) => {
        refetchSessions();

        // Se foi a sessão atual que foi removida, fazer logout imediatamente
        if (data.is_current) {
          toast.success('Dispositivo desconectado. Você será deslogado...');
          setTimeout(() => {
            logout();
            navigate('/login');
            toast.info('Você foi desconectado deste dispositivo');
          }, 500);
        } else {
          toast.success('Dispositivo desconectado com sucesso!');
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao desconectar dispositivo');
      },
    }
  );

  // Buscar dados atualizados do usuário
  const { data: userData } = useQuery(
    'userProfile',
    async () => {
      const response = await api.get('/api/auth/me');
      return response.data;
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
      onSuccess: (data) => {
        if (data) {
          setUser(data);
          setProfileUsername(data.username || '');
          setProfilePictureUrl(data.profile_picture_url || '');
          if (data.profile_picture_url) {
            setProfilePicturePreview(data.profile_picture_url);
          }
        }
      },
    }
  );

  const currentUser = userData || user;

  useEffect(() => {
    if (currentUser) {
      setProfileUsername(currentUser.username || '');
      setProfilePictureUrl(currentUser.profile_picture_url || '');
      if (currentUser.profile_picture_url) {
        setProfilePicturePreview(currentUser.profile_picture_url);
      }
    }
  }, [currentUser]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem');
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    }
  };

  const removeProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setProfilePictureUrl('');
  };

  const updateProfileMutation = useMutation(
    async (data: FormData | { username: string; profile_picture_url?: string }) => {
      const isFormData = data instanceof FormData;
      const config: any = {
        headers: {},
      };

      if (!isFormData) {
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await api.put('/api/auth/profile', data, config);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setUser(data);
        queryClient.invalidateQueries('userProfile');
        toast.success('Perfil atualizado com sucesso!');

        // Atualizar preview com a URL retornada do backend
        if (data.profile_picture_url) {
          setProfilePicturePreview(data.profile_picture_url);
          setProfilePictureUrl(data.profile_picture_url);
          setProfilePictureFile(null);
        } else if (data.profile_picture_url === null || data.profile_picture_url === '') {
          if (!profilePictureFile) {
            setProfilePicturePreview(null);
            setProfilePictureUrl('');
          }
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar perfil');
      },
    }
  );

  const handleSaveProfile = () => {
    if (!profileUsername.trim() || profileUsername.length < 3) {
      toast.error('Username deve ter pelo menos 3 caracteres');
      return;
    }

    // Se há arquivo para upload, usar FormData
    if (profilePictureFile) {
      const formData = new FormData();
      formData.append('username', profileUsername.trim());
      formData.append('profile_picture', profilePictureFile);
      updateProfileMutation.mutate(formData);
    } else {
      // Se não há arquivo, enviar como JSON (pode ser remoção ou apenas username)
      const updateData: any = {
        username: profileUsername.trim(),
      };
      // Se não há preview e não há URL, significa remoção
      if (!profilePicturePreview && !profilePictureUrl) {
        updateData.profile_picture_url = '';
      } else if (profilePictureUrl) {
        // Manter URL existente se houver
        updateData.profile_picture_url = profilePictureUrl;
      }
      updateProfileMutation.mutate(updateData);
    }
  };

  const handleLogout = async () => {
    try {
      // Chamar endpoint de logout para marcar sessão como inativa
      await api.post('/api/auth/logout');
    } catch (error) {
      // Continuar mesmo se der erro no backend
      console.error('Erro ao fazer logout no backend:', error);
    }
    logout();
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Perfil', icon: User },
    { id: 'devices' as TabType, label: 'Dispositivos', icon: Monitor },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/store')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para o Painel
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Minha Conta</h1>
        <p className="text-gray-600 mt-2">Gerencie suas informações pessoais e configurações</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header com Avatar e Tabs */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 relative">
              {profilePicturePreview ? (
                <div className="relative">
                  <img
                    src={profilePicturePreview}
                    alt={currentUser?.username || 'Usuário'}
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-500"
                  />
                  <button
                    onClick={removeProfilePicture}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                    title="Remover foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-blue-500">
                  {getInitials(profileUsername || currentUser?.username || 'U')}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                @{currentUser?.username || 'usuário'}
              </h2>
              <p className="text-sm text-gray-500">{currentUser?.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 -mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Tab: Perfil */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações do Perfil
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-gray-500">(3-20 caracteres)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">@</span>
                      <input
                        type="text"
                        value={profileUsername}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setProfileUsername(value);
                        }}
                        placeholder="jproters"
                        maxLength={20}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Apenas letras, números e underscore (_)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foto de Perfil
                    </label>
                    <div className="flex items-center gap-4">
                      {profilePicturePreview && (
                        <div className="relative flex-shrink-0">
                          <img
                            src={profilePicturePreview}
                            alt="Preview"
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={removeProfilePicture}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <label
                        htmlFor="profile-picture-upload"
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        {profilePicturePreview ? 'Trocar Foto' : 'Selecionar Foto'}
                      </label>
                      <input
                        id="profile-picture-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Será convertida para WEBP e enviada para Cloudflare R2. Tamanho recomendado: 400x400px
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Email</span>
                    </div>
                    <p className="text-sm text-gray-900">{currentUser?.email}</p>
                    <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => navigate('/store')}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={!profileUsername.trim() || profileUsername.length < 3 || updateProfileMutation.isLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all font-semibold"
                >
                  {updateProfileMutation.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>

              {/* Logout */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </div>
            </div>
          )}

          {/* Tab: Dispositivos */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Dispositivos Conectados
                </h3>
                {sessionsLoading ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Carregando dispositivos...</p>
                  </div>
                ) : sessionsError ? (
                  <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600 mb-2">Erro ao carregar dispositivos</p>
                    <button
                      onClick={() => refetchSessions()}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map((session: any) => (
                      <div
                        key={session.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          session.is_current
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Monitor className="w-5 h-5 text-gray-500" />
                              <span className="font-semibold text-gray-900">
                                {session.device_info || 'Dispositivo Desconhecido'}
                              </span>
                              {session.is_current && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                                  Dispositivo Atual
                                </span>
                              )}
                            </div>
                            <div className="ml-7 space-y-1.5">
                              <div className="flex items-center gap-2 text-sm">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">IP:</span>
                                <span className="font-mono text-gray-900">{session.ip_address || 'Desconhecido'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Localização:</span>
                                <span className="text-gray-900">
                                  {(() => {
                                    // Se não tem cidade detectada, mostrar apenas IP
                                    if (!session.city || !session.city.trim() || session.city === 'Desconhecida' || session.city === 'Local') {
                                      return session.ip_address || 'IP não disponível';
                                    }

                                    // Se tem cidade, mostrar localização completa
                                    const parts: string[] = [];
                                    if (session.city && session.city.trim()) {
                                      parts.push(session.city);
                                    }
                                    if (session.region && session.region.trim() && session.region !== session.city && !parts.includes(session.region)) {
                                      parts.push(session.region);
                                    }
                                    if (session.country && session.country.trim()) {
                                      parts.push(session.country);
                                    }

                                    // Se não tem nada, mostrar apenas IP
                                    return parts.length > 0 ? parts.join(', ') : (session.ip_address || 'Localização não disponível');
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Última atividade:</span>
                                <span>
                                  {(() => {
                                    try {
                                      const dateStr = session.last_activity;

                                      if (!dateStr) {
                                        return 'N/A';
                                      }

                                      // Criar objeto Date
                                      let date: Date;

                                      if (dateStr instanceof Date) {
                                        date = dateStr;
                                      } else if (typeof dateStr === 'string') {
                                        // Sequelize retorna timestamps como "2025-11-20T21:01:00.000Z" ou "2025-11-20T21:01:00"
                                        // IMPORTANTE: Se tem Z, já está em UTC. Se não tem, pode estar em UTC ou local.
                                        // PostgreSQL armazena em UTC, então assumimos UTC se não tiver timezone
                                        let normalizedStr = dateStr.trim();

                                        // Se não tem indicador de timezone (Z ou +/-offset), adicionar Z para indicar UTC
                                        if (!normalizedStr.includes('Z') && !normalizedStr.match(/[+-]\d{2}:?\d{2}$/)) {
                                          // Adicionar Z para indicar UTC
                                          if (normalizedStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
                                            // Formato sem milissegundos: adicionar .000Z
                                            normalizedStr = normalizedStr + '.000Z';
                                          } else if (normalizedStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/)) {
                                            // Formato com milissegundos: adicionar Z
                                            normalizedStr = normalizedStr + 'Z';
                                          } else {
                                            // Tentar parsear e converter para ISO
                                            const tempDate = new Date(normalizedStr);
                                            if (!isNaN(tempDate.getTime())) {
                                              normalizedStr = tempDate.toISOString();
                                            } else {
                                              normalizedStr = normalizedStr + 'Z';
                                            }
                                          }
                                        }

                                        date = new Date(normalizedStr);
                                      } else {
                                        date = new Date(dateStr);
                                      }

                                      // Verificar se a data é válida
                                      if (isNaN(date.getTime())) {
                                        console.error('Data inválida:', dateStr);
                                        return 'Data inválida';
                                      }

                                      // Converter para horário de Brasília (UTC-3)
                                      // IMPORTANTE: toLocaleString converte corretamente de UTC para o timezone especificado
                                      // Se a data está em UTC (ex: 21:04 UTC), ao converter para Brasília (UTC-3) fica 18:04
                                      const formatted = date.toLocaleString('pt-BR', {
                                        timeZone: 'America/Sao_Paulo',
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                      });

                                      return formatted;
                                    } catch (error) {
                                      console.error('Erro ao formatar data:', error, session.last_activity);
                                      return 'Erro ao formatar';
                                    }
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (session.is_current) {
                                const confirmed = await confirm({
                                  title: 'Desconectar dispositivo',
                                  message: 'Deseja realmente desconectar este dispositivo? Você será deslogado e precisará fazer login novamente.',
                                  type: 'warning',
                                  confirmText: 'Desconectar',
                                  cancelText: 'Cancelar',
                                });
                                if (confirmed) {
                                  removeSessionMutation.mutate(session.id);
                                }
                              } else {
                                const confirmed = await confirm({
                                  title: 'Desconectar dispositivo',
                                  message: `Deseja realmente desconectar o dispositivo "${session.device_info || 'Desconhecido'}"?`,
                                  type: 'warning',
                                  confirmText: 'Desconectar',
                                  cancelText: 'Cancelar',
                                });
                                if (confirmed) {
                                  removeSessionMutation.mutate(session.id);
                                }
                              }
                            }}
                            disabled={removeSessionMutation.isLoading}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title={session.is_current ? 'Desconectar este dispositivo (você será deslogado)' : 'Desconectar dispositivo'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Nenhum dispositivo conectado</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {Dialog}
    </div>
  );
}
