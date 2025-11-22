import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation, Link } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Globe, Save, Plus, Trash2, CheckCircle2, XCircle, Loader2, AlertCircle, Code, Bell, Copy, Settings as SettingsIcon, FileText, ExternalLink, PlayCircle } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useThemeStore } from '../themeStore';

export default function DomainsSettings() {
  const { theme } = useThemeStore();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { confirm, Dialog } = useConfirm();
  const [subdomain, setSubdomain] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [copiedDns, setCopiedDns] = useState<string | null>(null);
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  const { data: store, isLoading: storeLoading } = useQuery('store', async () => {
    const response = await api.get('/api/stores');
    return response.data;
  }, {
    staleTime: Infinity,
  });

  const { data: domains, isLoading: domainsLoading } = useQuery('domains', async () => {
    const response = await api.get('/api/domains');
    return response.data;
  }, {
    staleTime: Infinity,
  });

  useEffect(() => {
    if (store) {
      setSubdomain(store.subdomain || '');
    }
  }, [store]);

  const updateSubdomainMutation = useMutation(
    async (subdomain: string) => {
      const response = await api.put('/api/domains/subdomain', { subdomain });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('store');
        toast.success('Subdomínio atualizado com sucesso!');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Erro ao atualizar subdomínio';
        toast.error(errorMessage);
      },
    }
  );

  const addDomainMutation = useMutation(
    async (data: { domain: string }) => {
      const response = await api.post('/api/domains', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('domains');
        setNewDomain('');
        setIsAddingDomain(false);
        toast.success('Domínio adicionado com sucesso!');
      },
      onError: (error: any) => {
        setIsAddingDomain(false);
        const errorMessage = error.response?.data?.error || 'Erro ao adicionar domínio';
        toast.error(errorMessage);
      },
    }
  );

  const removeDomainMutation = useMutation(
    async (id: number) => {
      const response = await api.delete(`/api/domains/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('domains');
        queryClient.invalidateQueries('store');
        toast.success('Domínio removido com sucesso! O site pode continuar acessível por algumas horas devido à propagação DNS.');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Erro ao remover domínio';
        toast.error(errorMessage);
      },
    }
  );

  const setPrimaryMutation = useMutation(
    async (id: number) => {
      const response = await api.put(`/api/domains/${id}/primary`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('domains');
        queryClient.invalidateQueries('store');
        toast.success('Domínio definido como primário!');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Erro ao definir domínio primário';
        toast.error(errorMessage);
      },
    }
  );

  const verifyDomainMutation = useMutation(
    async (id: number) => {
      const response = await api.post(`/api/domains/${id}/verify`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('domains');
        if (data.verified) {
          toast.success('Domínio verificado com sucesso! TXT e CNAME configurados corretamente.');
        } else {
          let message = 'Domínio ainda não está configurado corretamente.';
          if (data.txt_verified === false) {
            message = 'TXT record não encontrado ou incorreto. Configure o registro TXT primeiro.';
          } else if (data.cname_verified === false) {
            message = 'TXT verificado, mas CNAME não está configurado corretamente.';
          }
          toast.error(message);
        }
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Erro ao verificar domínio';
        toast.error(errorMessage);
      },
    }
  );

  const handleUpdateSubdomain = () => {
    if (!subdomain.trim()) {
      toast.error('Subdomínio é obrigatório');
      return;
    }
    updateSubdomainMutation.mutate(subdomain.trim().toLowerCase());
  };

    const handleAddDomain = () => {
      if (!newDomain.trim()) {
        toast.error('Domínio é obrigatório');
        return;
      }

      // Verificar se já existe um domínio
      if (domains && domains.length >= 1) {
        toast.error('Você já possui um domínio configurado. Remova o domínio existente para adicionar um novo.');
        return;
      }

      setIsAddingDomain(true);
      const domainData = {
        domain: newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
      };

      addDomainMutation.mutate(domainData);
    };

  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'nerix.online';

  if (storeLoading || domainsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
          theme === 'dark' ? 'border-blue-600' : 'border-indigo-600'
        }`}></div>
      </div>
    );
  }

  const copyDnsInfo = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDns(type);
    setTimeout(() => setCopiedDns(null), 2000);
    toast.success('Copiado para a área de transferência!');
  };

  const tabs = [
    { id: 'general', label: 'Geral', icon: SettingsIcon, href: '/store/settings#general' },
    { id: 'terms', label: 'Termos', icon: FileText, href: '/store/settings#terms' },
    { id: 'advanced', label: 'Avançado', icon: Code, href: '/store/settings#advanced' },
    { id: 'notifications', label: 'Notificações', icon: Bell, href: '/store/settings#notifications' },
    { id: 'domains', label: 'Domínios', icon: Globe, href: '/store/settings/domains' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header com título */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Configurações</h1>
        <p className={`mt-2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>Gerencie os domínios e subdomínios da sua loja</p>
      </div>

      {/* Tabs */}
      <div className={`flex flex-wrap gap-2 mb-6 p-1 border rounded-xl w-fit ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.href || (tab.id === 'domains' && location.pathname.includes('/domains'));
          return (
            <Link
              key={tab.id}
              to={tab.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-gray-700 text-blue-400 shadow-sm'
                    : 'bg-white text-blue-600 shadow-sm'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
      {/* Subdomínio */}
      <div className={`rounded-xl border shadow-sm ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="space-y-1.5">
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Subdomínio</h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Escolha o subdomínio que será usado para que os clientes acessem sua loja.
            </p>
          </div>
        </div>
        <div className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateSubdomain();
            }}
            className="space-y-4"
          >
            <div className="w-full">
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Subdomínio
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className={`flex h-11 w-full rounded-lg border bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-32 ${
                    theme === 'dark'
                      ? 'border-gray-600 text-white placeholder-gray-400'
                      : 'border-gray-300'
                  }`}
                  placeholder="minhaloja"
                  pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
                />
                <div className="absolute right-3">
                  <div className={`inline-flex items-center border text-xs font-medium rounded-md px-3 py-1.5 ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-gray-300'
                      : 'border-gray-300 bg-gray-50 text-gray-700'
                  }`}>
                    .{baseDomain}
                  </div>
                </div>
              </div>
              <p className={`text-xs mt-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Use apenas letras minúsculas, números e hífens. Seu link será: <strong className={theme === 'dark' ? 'text-white' : ''}>{subdomain || 'seu-subdominio'}.{baseDomain}</strong>
              </p>
            </div>
            <button
              type="submit"
              disabled={updateSubdomainMutation.isLoading || !subdomain.trim()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSubdomainMutation.isLoading ? 'Salvando...' : 'Alterar subdomínio'}
            </button>
          </form>
        </div>
      </div>

      {/* Domínio Customizado */}
      <div className={`rounded-xl border shadow-sm ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="space-y-1.5">
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Domínio Customizado</h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Conecte seu próprio domínio para que os clientes acessem sua loja através dele.
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddDomain();
            }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="exemplo.com"
                  disabled={isAddingDomain || addDomainMutation.isLoading || (domains && domains.length >= 1)}
                  className={`flex h-11 w-full rounded-lg border bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    theme === 'dark'
                      ? 'border-gray-600 text-white placeholder-gray-400'
                      : 'border-gray-300'
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={isAddingDomain || addDomainMutation.isLoading || !newDomain.trim() || (domains && domains.length >= 1)}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-w-[140px] h-11"
              >
                {isAddingDomain || addDomainMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </>
                )}
              </button>
            </div>

            {domains && domains.length >= 1 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Limite de domínios</p>
                    <p className="text-xs">
                      Você já possui um domínio configurado. Remova o domínio existente para adicionar um novo.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Lista de Domínios */}
          {domains && domains.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className={`text-sm font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Domínios Configurados</h4>
              {domains.map((domain: any) => {
                // Target do CNAME: sempre host.nerix.online (não o subdomain da loja)
                const dnsTarget = `host.${baseDomain}`;
                return (
                  <div key={domain.id} className="space-y-3">
                    <div className={`flex items-center justify-between p-4 border rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Globe className={`w-5 h-5 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{domain.domain}</span>
                            {domain.is_primary && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                theme === 'dark'
                                  ? 'bg-blue-900/50 text-blue-300'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                Primário
                              </span>
                            )}
                            {domain.verified ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <p className={`text-xs mt-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {domain.verified
                              ? 'Domínio verificado e ativo'
                              : 'Aguardando configuração do DNS'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!domain.verified && (
                          <button
                            onClick={() => verifyDomainMutation.mutate(domain.id)}
                            disabled={verifyDomainMutation.isLoading}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                              theme === 'dark'
                                ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700'
                                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                            }`}
                          >
                            {verifyDomainMutation.isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Verificar'
                            )}
                          </button>
                        )}
                        {!domain.is_primary && domain.verified && (
                          <button
                            onClick={() => setPrimaryMutation.mutate(domain.id)}
                            disabled={setPrimaryMutation.isLoading}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                              theme === 'dark'
                                ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700'
                                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                            }`}
                          >
                            Definir como primário
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: 'Remover domínio',
                              message: 'Tem certeza que deseja remover este domínio? Esta ação não pode ser desfeita.',
                              type: 'danger',
                              confirmText: 'Remover',
                            });
                            if (confirmed) {
                              removeDomainMutation.mutate(domain.id);
                            }
                          }}
                          disabled={removeDomainMutation.isLoading}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Instruções de DNS */}
                    {!domain.verified && (
                      <div className={`border rounded-xl p-4 sm:p-6 shadow-sm ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                      }`}>
                        <div className="mb-4">
                          <h5 className={`text-base font-semibold mb-2 flex items-center gap-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            <Globe className={`w-5 h-5 ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`} />
                            Configuração de DNS
                          </h5>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Configure os registros DNS no seu provedor de domínio conforme a tabela abaixo.
                          </p>
                        </div>

                        <div className={`border rounded-lg overflow-hidden shadow-sm mb-4 ${
                          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                          <div className={`p-3 border-b ${
                            theme === 'dark'
                              ? 'bg-blue-900/30 border-blue-800'
                              : 'bg-blue-50 border-blue-200'
                          }`}>
                            <p className={`text-xs font-medium ${
                              theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                            }`}>
                              Importante: Copie apenas o valor da coluna "Conteúdo/Destino" (sem https://, sem http://, sem barra no final)
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[600px]">
                              <thead className={`border-b ${
                                theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                              }`}>
                                <tr>
                                  <th className={`px-3 sm:px-4 py-2 text-left text-xs font-semibold ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>Tipo</th>
                                  <th className={`px-3 sm:px-4 py-2 text-left text-xs font-semibold ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>Nome/Host</th>
                                  <th className={`px-3 sm:px-4 py-2 text-left text-xs font-semibold ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>Conteúdo/Destino</th>
                                  <th className={`px-3 sm:px-4 py-2 text-left text-xs font-semibold hidden sm:table-cell ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>TTL</th>
                                  <th className={`px-3 sm:px-4 py-2 text-center text-xs font-semibold ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>Copiar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* TXT Record */}
                                <tr className={`border-b ${
                                  theme === 'dark' ? 'border-gray-700 bg-yellow-900/20' : 'border-gray-100 bg-yellow-50'
                                }`}>
                                  <td className={`px-3 sm:px-4 py-3 font-mono text-xs font-medium ${
                                    theme === 'dark' ? 'text-white bg-yellow-900/30' : 'text-gray-900 bg-yellow-100'
                                  }`}>TXT</td>
                                  <td className="px-3 sm:px-4 py-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <code className={`font-mono text-xs px-2 py-1 rounded border break-all ${
                                        theme === 'dark'
                                          ? 'text-white bg-gray-700 border-yellow-600'
                                          : 'text-gray-900 bg-white border-yellow-300'
                                      }`}>{`_cf-custom-hostname.${domain.domain}`}</code>
                                      <button
                                        onClick={() => copyDnsInfo(`_cf-custom-hostname.${domain.domain}`, `txt-name-${domain.id}`)}
                                        className={`flex-shrink-0 ${
                                          theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                        }`}
                                        title="Copiar nome TXT"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 py-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <code className={`font-mono text-xs px-2 py-1 rounded border break-all ${
                                        theme === 'dark'
                                          ? 'text-white bg-gray-700 border-yellow-600'
                                          : 'text-gray-900 bg-white border-yellow-300'
                                      }`}>{domain.verify_token || 'Gerando...'}</code>
                                      <button
                                        onClick={() => copyDnsInfo(domain.verify_token || '', `txt-value-${domain.id}`)}
                                        className={`flex-shrink-0 ${
                                          theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                        }`}
                                        title="Copiar token TXT"
                                        disabled={!domain.verify_token}
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className={`px-3 sm:px-4 py-3 text-xs hidden sm:table-cell ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>Auto</td>
                                  <td className="px-3 sm:px-4 py-3 text-center">
                                    {copiedDns === `txt-value-${domain.id}` ? (
                                      <span className="text-xs text-green-600 font-medium">Copiado</span>
                                    ) : (
                                      <span className={`text-xs ${
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                      }`}>-</span>
                                    )}
                                  </td>
                                </tr>
                                {/* CNAME Record */}
                                <tr>
                                  <td className={`px-3 sm:px-4 py-3 font-mono text-xs font-medium ${
                                    theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-900 bg-gray-50'
                                  }`}>CNAME</td>
                                  <td className="px-3 sm:px-4 py-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <code className={`font-mono text-xs px-2 py-1 rounded ${
                                        theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-900 bg-gray-100'
                                      }`}>@</code>
                                      <span className={`text-xs hidden sm:inline ${
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                      }`}>(ou deixe vazio)</span>
                                      <button
                                        onClick={() => copyDnsInfo('@', `dns-name-${domain.id}`)}
                                        className={`flex-shrink-0 ${
                                          theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                        }`}
                                        title="Copiar @"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 py-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <code className={`font-mono text-xs px-2 py-1 rounded break-all ${
                                        theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-900 bg-gray-100'
                                      }`}>{dnsTarget}</code>
                                      <button
                                        onClick={() => copyDnsInfo(dnsTarget, `dns-target-${domain.id}`)}
                                        className={`flex-shrink-0 ${
                                          theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                        }`}
                                        title={`Copiar ${dnsTarget}`}
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className={`px-3 sm:px-4 py-3 text-xs hidden sm:table-cell ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>Auto</td>
                                  <td className="px-3 sm:px-4 py-3 text-center">
                                    {copiedDns === `dns-target-${domain.id}` ? (
                                      <span className="text-xs text-green-600 font-medium">Copiado</span>
                                    ) : (
                                      <span className={`text-xs ${
                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                      }`}>-</span>
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Tutorial Link */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <PlayCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h6 className="text-sm font-semibold text-gray-900 mb-1">
                                Precisa de ajuda?
                              </h6>
                              <p className="text-xs text-gray-600 mb-3">
                                Assista ao tutorial em vídeo para configurar o DNS passo a passo.
                              </p>
                              <a
                                href={import.meta.env.VITE_DNS_TUTORIAL_URL || "https://www.youtube.com"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                              >
                                <PlayCircle className="w-4 h-4" />
                                Assistir Tutorial
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {Dialog}
    </div>
  );
}

