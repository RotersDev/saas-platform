import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation, Link } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Globe, Save, Plus, Trash2, CheckCircle2, XCircle, Loader2, AlertCircle, ExternalLink, Code, Bell, Copy, Settings as SettingsIcon, FileText } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';

export default function DomainsSettings() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { confirm, Dialog } = useConfirm();
  const [subdomain, setSubdomain] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [cloudflareToken, setCloudflareToken] = useState('');
  const [cloudflareZoneId, setCloudflareZoneId] = useState('');
  const [showCloudflareFields, setShowCloudflareFields] = useState(false);
  const [copiedDns, setCopiedDns] = useState<string | null>(null);

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
    async (data: { domain: string; cloudflare_token?: string; cloudflare_zone_id?: string }) => {
      const response = await api.post('/api/domains', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('domains');
        setNewDomain('');
        setCloudflareToken('');
        setCloudflareZoneId('');
        setShowCloudflareFields(false);
        toast.success('Domínio adicionado com sucesso!');
      },
      onError: (error: any) => {
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
        toast.success('Domínio removido com sucesso!');
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

    const domainData: any = {
      domain: newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
    };

    if (showCloudflareFields && cloudflareToken) {
      domainData.cloudflare_token = cloudflareToken;
      if (cloudflareZoneId) {
        domainData.cloudflare_zone_id = cloudflareZoneId;
      }
    }

    addDomainMutation.mutate(domainData);
  };

  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'nerix.online';

  if (storeLoading || domainsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">Gerencie os domínios e subdomínios da sua loja</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 border rounded-xl w-fit bg-gray-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.href || (tab.id === 'domains' && location.pathname.includes('/domains'));
          return (
            <Link
              key={tab.id}
              to={tab.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-sm'
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-gray-900">Subdomínio</h3>
            <p className="text-sm text-gray-600">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subdomínio
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-32"
                  placeholder="minhaloja"
                  pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
                />
                <div className="absolute right-3">
                  <div className="inline-flex items-center border border-gray-300 bg-gray-50 text-xs font-medium rounded-md px-3 py-1.5 text-gray-700">
                    .{baseDomain}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use apenas letras minúsculas, números e hífens. Seu link será: <strong>{subdomain || 'seu-subdominio'}.{baseDomain}</strong>
              </p>
            </div>
            <button
              type="submit"
              disabled={updateSubdomainMutation.isLoading || !subdomain.trim()}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSubdomainMutation.isLoading ? 'Salvando...' : 'Alterar subdomínio'}
            </button>
          </form>
        </div>
      </div>

      {/* Domínio Customizado */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-gray-900">Domínio Customizado</h3>
            <p className="text-sm text-gray-600">
              Conecte seu próprio domínio para que os clientes acessem sua loja através dele.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddDomain();
            }}
            className="space-y-4"
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="exemplo.com"
                  className="flex h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={addDomainMutation.isLoading || !newDomain.trim()}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addDomainMutation.isLoading ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="cloudflare-config"
                checked={showCloudflareFields}
                onChange={(e) => setShowCloudflareFields(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="cloudflare-config" className="ml-2 text-sm text-gray-700">
                Configurar automaticamente via Cloudflare
              </label>
            </div>

            {showCloudflareFields && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Configuração Automática do Cloudflare</p>
                    <p className="text-xs mb-3">
                      Forneça suas credenciais do Cloudflare para configurar o DNS automaticamente.
                      Seu domínio precisa estar gerenciado pelo Cloudflare.
                    </p>
                    <a
                      href="/docs/cloudflare-setup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                    >
                      Ver guia de configuração <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token da API do Cloudflare
                  </label>
                  <input
                    type="password"
                    value={cloudflareToken}
                    onChange={(e) => setCloudflareToken(e.target.value)}
                    placeholder="Seu token da API do Cloudflare"
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Token com permissões de DNS:Edit e Zone:Read
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zone ID (Opcional)
                  </label>
                  <input
                    type="text"
                    value={cloudflareZoneId}
                    onChange={(e) => setCloudflareZoneId(e.target.value)}
                    placeholder="Deixe em branco para detectar automaticamente"
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </form>

          {/* Lista de Domínios */}
          {domains && domains.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Domínios Configurados</h4>
              {domains.map((domain: any) => {
                const dnsTarget = `${store?.subdomain || 'seu-subdominio'}.${baseDomain}`;
                return (
                  <div key={domain.id} className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{domain.domain}</span>
                            {domain.is_primary && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                Primário
                              </span>
                            )}
                            {domain.verified ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
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
                            className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
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
                            className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
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
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-1">
                              Configure o DNS do seu domínio
                            </h5>
                            <p className="text-xs text-gray-600">
                              Adicione o seguinte registro DNS no seu provedor de domínio:
                            </p>
                          </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="p-3 bg-indigo-50 border-b border-indigo-200">
                            <p className="text-xs font-medium text-indigo-900">
                              ⚠️ Importante: Copie apenas o valor da coluna "Conteúdo/Destino" (sem https://, sem http://, sem barra no final)
                            </p>
                          </div>
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Tipo</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nome/Host</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Conteúdo/Destino</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">TTL</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Copiar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* TXT Record - PRIMEIRO PASSO */}
                              <tr className="border-b border-gray-100 bg-yellow-50">
                                <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900 bg-yellow-100">TXT</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-xs text-gray-900 bg-white px-2 py-1 rounded border border-yellow-300">_cf-custom-hostname.{domain.domain}</code>
                                    <button
                                      onClick={() => copyDnsInfo(`_cf-custom-hostname.${domain.domain}`, `txt-name-${domain.id}`)}
                                      className="text-indigo-600 hover:text-indigo-700"
                                      title="Copiar nome TXT"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-xs text-gray-900 bg-white px-2 py-1 rounded border border-yellow-300">{domain.verify_token || 'Gerando...'}</code>
                                    <button
                                      onClick={() => copyDnsInfo(domain.verify_token || '', `txt-value-${domain.id}`)}
                                      className="text-indigo-600 hover:text-indigo-700"
                                      title="Copiar token TXT"
                                      disabled={!domain.verify_token}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600">Auto</td>
                                <td className="px-4 py-3 text-center">
                                  {copiedDns === `txt-value-${domain.id}` ? (
                                    <span className="text-xs text-green-600 font-medium">✓ Copiado!</span>
                                  ) : (
                                    <span className="text-xs text-yellow-600 font-medium">1º passo</span>
                                  )}
                                </td>
                              </tr>
                              {/* CNAME Records - SEGUNDO PASSO */}
                              <tr className="border-b border-gray-100">
                                <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900 bg-gray-50">CNAME</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded">@</code>
                                    <span className="text-xs text-gray-500">(ou deixe vazio)</span>
                                    <button
                                      onClick={() => copyDnsInfo('@', `dns-name-${domain.id}`)}
                                      className="text-indigo-600 hover:text-indigo-700"
                                      title="Copiar @"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded">{dnsTarget}</code>
                                    <button
                                      onClick={() => copyDnsInfo(dnsTarget, `dns-target-${domain.id}`)}
                                      className="text-indigo-600 hover:text-indigo-700"
                                      title={`Copiar ${dnsTarget}`}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600">Auto</td>
                                <td className="px-4 py-3 text-center">
                                  {copiedDns === `dns-target-${domain.id}` ? (
                                    <span className="text-xs text-green-600 font-medium">✓ Copiado!</span>
                                  ) : (
                                    <span className="text-xs text-gray-400">2º passo</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900 bg-gray-50">CNAME</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded">www</code>
                                    <button
                                      onClick={() => copyDnsInfo('www', `dns-www-name-${domain.id}`)}
                                      className="text-indigo-600 hover:text-indigo-700"
                                      title="Copiar www"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded">{dnsTarget}</code>
                                    <button
                                      onClick={() => copyDnsInfo(dnsTarget, `dns-www-target-${domain.id}`)}
                                      className="text-indigo-600 hover:text-indigo-700"
                                      title={`Copiar ${dnsTarget}`}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600">Auto</td>
                                <td className="px-4 py-3 text-center">
                                  {copiedDns === `dns-www-target-${domain.id}` ? (
                                    <span className="text-xs text-green-600 font-medium">✓ Copiado!</span>
                                  ) : (
                                    <span className="text-xs text-gray-400">2º passo</span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800 mb-2">
                            <strong>Instruções importantes:</strong>
                          </p>
                          <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
                            <li>
                              <strong>Primeiro passo - Configure o registro TXT:</strong>
                              <ul className="ml-4 mt-1 space-y-1 list-disc">
                                <li>Crie um registro TXT com o nome: <code className="bg-blue-100 px-1 rounded">_cf-custom-hostname.{domain.domain}</code></li>
                                <li>O valor deve ser exatamente: <code className="bg-blue-100 px-1 rounded font-mono">{domain.verify_token || 'Aguardando geração...'}</code></li>
                                <li>Este registro é obrigatório para verificação de propriedade do domínio.</li>
                              </ul>
                            </li>
                            <li>
                              <strong>Segundo passo - Configure os registros CNAME:</strong>
                              <ul className="ml-4 mt-1 space-y-1 list-disc">
                                <li>O símbolo <code className="bg-blue-100 px-1 rounded">@</code> representa o domínio raiz. Alguns provedores podem exigir que você deixe o campo "Nome" vazio.</li>
                                <li>O campo "Conteúdo" ou "Destino" deve conter apenas: <strong className="font-mono">{dnsTarget}</strong> (sem https:// ou http://)</li>
                                <li>Configure tanto o registro <code className="bg-blue-100 px-1 rounded">@</code> quanto o <code className="bg-blue-100 px-1 rounded">www</code></li>
                              </ul>
                            </li>
                            <li>Após configurar ambos (TXT e CNAME), aguarde alguns minutos (pode levar até 24 horas) e clique em "Verificar" para validar a configuração.</li>
                            <li>A verificação só será bem-sucedida quando <strong>ambos</strong> os registros (TXT e CNAME) estiverem configurados corretamente.</li>
                          </ol>
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

