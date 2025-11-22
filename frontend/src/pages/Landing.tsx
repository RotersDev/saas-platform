import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Users, Zap, ArrowRight, LogIn, UserPlus, LogOut,
  Shield, Globe, Lock, Rocket, CheckCircle2,
  BarChart3, Clock, Target, Layers,
  FileText, Settings, Filter, Download, TrendingUp
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { logout, isAuthenticated, user } = useAuthStore();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Redirecionar usuários logados para o dashboard
    if (isAuthenticated && user) {
      if (user.store_id) {
        navigate('/store', { replace: true });
        return;
      }
      // Se for master_admin, não redireciona automaticamente (ele pode acessar diretamente /admin)
    }


    // Scroll effect
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isAuthenticated, user, navigate]);


  const features = [
    {
      icon: Globe,
      title: 'Domínio Próprio',
      description: 'Use seu próprio domínio personalizado ou subdomínio gratuito. Configure DNS em minutos.',
      color: 'bg-blue-500',
    },
    {
      icon: Rocket,
      title: 'Setup Instantâneo',
      description: 'Crie sua loja em menos de 5 minutos. Interface intuitiva, sem necessidade de conhecimento técnico.',
      color: 'bg-blue-500',
    },
    {
      icon: Shield,
      title: 'Segurança Avançada',
      description: 'Proteção contra fraudes, bloqueio por IP/email, controle de risco em tempo real.',
      color: 'bg-green-500',
    },
    {
      icon: BarChart3,
      title: 'Analytics Completo',
      description: 'Dashboard com métricas detalhadas, relatórios de vendas e análises de performance.',
      color: 'bg-indigo-500',
    },
    {
      icon: Users,
      title: 'Gestão de Clientes',
      description: 'Controle total sobre seus clientes, histórico de compras e comunicação direta.',
      color: 'bg-purple-500',
    },
    {
      icon: Lock,
      title: 'Privacidade Garantida',
      description: 'Seus dados são seus. Criptografia SSL, backups automáticos e conformidade com LGPD.',
      color: 'bg-red-500',
    },
  ];


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background com degradê de baixo para cima e bolinhas azuis destacadas - igual ao resto do site */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
            linear-gradient(to top, #e2e8f0 0%, #f1f5f9 30%, #f8fafc 60%, #ffffff 100%)
          `,
          backgroundSize: '30px 30px, 100% 100%',
        }}
      />

      {/* Header */}
      <header className={`relative z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/98 backdrop-blur-md border-b-2 border-gray-300 shadow-lg' : 'bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-md'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="flex justify-between items-center">
            <img
              src="https://pub-2f45ff958477427f8cc4acf8ad69fd88.r2.dev/ChatGPT%20Image%2021%20de%20nov.%20de%202025%2C%2022_47_40.png"
              alt="Nerix"
              className="h-10 w-auto"
            />
            <div className="flex space-x-3 items-center">
              {isAuthenticated ? (
                <>
                  {user?.store_id ? (
                    <a
                      href="/store"
                      className="text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all text-sm"
                    >
                      Minha Loja
                    </a>
                  ) : (
                    <button
                      onClick={() => navigate('/create-store')}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 font-semibold transition-all transform hover:scale-105 shadow-lg text-sm"
                    >
                      Criar Loja
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      toast.success('Logout realizado com sucesso!');
                      navigate('/');
                    }}
                    className="text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all inline-flex items-center text-sm"
                    title="Sair"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all inline-flex items-center text-sm"
                  >
                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold transition-all transform hover:scale-105 shadow-lg inline-flex items-center text-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Criar Conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Design Reformulado */}
      <section className="relative z-10 py-20 md:py-32 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Conteúdo Principal */}
            <div className="text-left">
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  Plataforma SaaS Completa
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                Venda produtos digitais{' '}
                <span className="relative inline-block">
                  <span className="relative animate-aurora bg-[length:200%_auto] bg-clip-text text-transparent"
                        style={{
                          backgroundImage: 'linear-gradient(135deg, #1e40af, #3b82f6, #2563eb, #1e3a8a, #1e40af)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          animationDuration: '3s'
                        }}>
                    sem complicação
                  </span>
                </span>
                {' '}com a{' '}
                <span className="relative inline-block">
                  <span className="relative animate-aurora bg-[length:200%_auto] bg-clip-text text-transparent"
                        style={{
                          backgroundImage: 'linear-gradient(135deg, #1e40af, #3b82f6, #2563eb, #1e3a8a, #1e40af)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          animationDuration: '3s'
                        }}>
                    Nerix
                  </span>
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                Crie sua loja virtual em minutos. Sem burocracia, sem documentos. Comece a vender hoje mesmo.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium">Setup em 5 minutos</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium">100% gratuito para começar</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium">Sem necessidade de CNPJ</span>
                </div>
              </div>

              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl group"
                >
                  Criar minha loja grátis
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {/* Métricas e Gráficos Chamativos */}
            <div className="relative">
              <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-2xl">
                {/* Header do Dashboard */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Dashboard em Tempo Real</h3>
                    <p className="text-sm text-gray-600">Métricas da sua loja</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                {/* Métricas Rápidas */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">+24%</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">R$ 12.5K</div>
                    <div className="text-xs text-gray-600">Vendas hoje</div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">+18%</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">1.2K</div>
                    <div className="text-xs text-gray-600">Visitantes</div>
                  </div>
                </div>

                {/* Gráfico de Vendas */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Vendas (últimos 7 dias)</h4>
                    <span className="text-xs text-gray-500">R$ 45.2K total</span>
                  </div>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {[45, 62, 58, 71, 68, 85, 92].map((height, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:opacity-80 min-h-[20px]"
                          style={{ height: `${height}%` }}
                          title={`R$ ${height * 100}`}
                        ></div>
                        <span className="text-xs text-gray-500 font-medium">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][idx]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lista de Vendas Recentes */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Vendas Recentes</h4>
                  <div className="space-y-2">
                    {[
                      { product: 'Curso Premium', amount: 'R$ 199', time: '2min' },
                      { product: 'Template Pro', amount: 'R$ 89', time: '5min' },
                      { product: 'E-book Digital', amount: 'R$ 49', time: '8min' },
                    ].map((sale, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700 font-medium">{sale.product}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-900">{sale.amount}</span>
                          <span className="text-xs text-gray-500">{sale.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Decoração de fundo */}
              <div className="absolute -z-10 -top-4 -right-4 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -z-10 -bottom-4 -left-4 w-48 h-48 bg-indigo-200 rounded-full blur-3xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tudo que você precisa
        </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Uma plataforma completa para vender produtos digitais sem complicação
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white backdrop-blur-md border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-all transform hover:scale-105 hover:shadow-2xl"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sales Management Section */}
      <section className="relative z-10 py-20">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 mb-3">
              Gestão de Vendas
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-gray-900">
              Gerenciamento de vendas simples e completo
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Acompanhe pedidos, filtre períodos, exporte dados e gere relatórios claros para tomar decisões rápidas.
            </p>
          </div>

          {/* Primeira linha - Visão Geral */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Visão de Pedidos</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">Tabela completa com status, método de pagamento, valor e informações do cliente em tempo real.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Filtros por Período</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">Selecione hoje, últimos 7/30 dias ou defina um intervalo personalizado para análise detalhada.</p>
            </div>
          </div>

          {/* Segunda linha - Segmentação */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Segmentações Rápidas</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">Filtre por status, gateway de pagamento, produto específico e origem da venda.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Exportação de Dados</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">Exporte em CSV ou Excel para integrar com seu BI, contabilidade ou ferramentas de análise.</p>
            </div>
          </div>

          {/* Terceira linha - Relatórios */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Relatórios de Desempenho</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">Receita total, ticket médio, taxa de conversão e análise de chargebacks por período.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Análises por Categoria</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">Entenda quais produtos mais vendem e identifique os canais de venda mais eficazes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Notifications Section */}
      <section className="relative z-10 py-20">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full">
              <div className="mb-6">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 mb-4">
                  Notificações em Tempo Real
                </div>
                <h4 className="text-4xl font-bold mb-4 text-gray-900">Acompanhe suas vendas em tempo real</h4>
                <p className="text-lg text-gray-600 mb-6">
                  Receba notificações instantâneas de todas as suas vendas, novos usuários e métricas importantes da sua loja.
                </p>
              </div>
            </div>
            <div className="w-full">
              <div className="relative max-w-lg h-96 overflow-hidden rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm">
                <div className="relative h-full">
                  {/* Container com animação contínua - triplicado para loop infinito suave */}
                  <div className="absolute inset-0 flex flex-col gap-4 notification-scroll">
                    {/* Primeira sequência */}
                    {[
                      { amount: 'R$ 249,90', product: 'Curso Avançado de Marketing Digital', time: '12 minutos atrás' },
                      { amount: 'R$ 89,90', product: 'Template Premium para WordPress', time: '5 minutos atrás' },
                      { amount: 'R$ 199,00', product: 'E-book Completo de E-commerce', time: '2 minutos atrás' },
                    ].map((notification, idx) => (
                      <div
                        key={`first-${idx}`}
                        className="w-full px-4 flex-shrink-0"
                      >
                        <div className="bg-white p-5 rounded-xl flex items-center gap-4 border border-gray-200 shadow-md hover:shadow-lg transition-all hover:border-blue-300 h-24">
                          <img
                            src="https://pub-2f45ff958477427f8cc4acf8ad69fd88.r2.dev/ChatGPT%20Image%2021%20de%20nov.%20de%202025%2C%2022_47_40.png"
                            alt="Nerix"
                            className="w-14 h-14 object-contain flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-base mb-0.5">Venda aprovada</h4>
                                <p className="text-sm font-medium text-blue-600">{notification.amount}</p>
                              </div>
                              <div className="inline-flex items-center rounded-full px-3 py-1 font-medium bg-blue-50 text-blue-700 text-xs whitespace-nowrap border border-blue-200">
                                {notification.time}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 font-medium truncate">{notification.product}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Segunda sequência (duplicada para loop infinito) */}
                    {[
                      { amount: 'R$ 249,90', product: 'Curso Avançado de Marketing Digital', time: '12 minutos atrás' },
                      { amount: 'R$ 89,90', product: 'Template Premium para WordPress', time: '5 minutos atrás' },
                      { amount: 'R$ 199,00', product: 'E-book Completo de E-commerce', time: '2 minutos atrás' },
                    ].map((notification, idx) => (
                      <div
                        key={`second-${idx}`}
                        className="w-full px-4 flex-shrink-0"
                      >
                        <div className="bg-white p-5 rounded-xl flex items-center gap-4 border border-gray-200 shadow-md hover:shadow-lg transition-all hover:border-blue-300 h-24">
                          <img
                            src="https://pub-2f45ff958477427f8cc4acf8ad69fd88.r2.dev/ChatGPT%20Image%2021%20de%20nov.%20de%202025%2C%2022_47_40.png"
                            alt="Nerix"
                            className="w-14 h-14 object-contain flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-base mb-0.5">Venda aprovada</h4>
                                <p className="text-sm font-medium text-blue-600">{notification.amount}</p>
                              </div>
                              <div className="inline-flex items-center rounded-full px-3 py-1 font-medium bg-blue-50 text-blue-700 text-xs whitespace-nowrap border border-blue-200">
                                {notification.time}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 font-medium truncate">{notification.product}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Terceira sequência (para transição suave) */}
                    {[
                      { amount: 'R$ 249,90', product: 'Curso Avançado de Marketing Digital', time: '12 minutos atrás' },
                      { amount: 'R$ 89,90', product: 'Template Premium para WordPress', time: '5 minutos atrás' },
                      { amount: 'R$ 199,00', product: 'E-book Completo de E-commerce', time: '2 minutos atrás' },
                    ].map((notification, idx) => (
                      <div
                        key={`third-${idx}`}
                        className="w-full px-4 flex-shrink-0"
                      >
                        <div className="bg-white p-5 rounded-xl flex items-center gap-4 border border-gray-200 shadow-md hover:shadow-lg transition-all hover:border-blue-300 h-24">
                          <img
                            src="https://pub-2f45ff958477427f8cc4acf8ad69fd88.r2.dev/ChatGPT%20Image%2021%20de%20nov.%20de%202025%2C%2022_47_40.png"
                            alt="Nerix"
                            className="w-14 h-14 object-contain flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-base mb-0.5">Venda aprovada</h4>
                                <p className="text-sm font-medium text-blue-600">{notification.amount}</p>
                              </div>
                              <div className="inline-flex items-center rounded-full px-3 py-1 font-medium bg-blue-50 text-blue-700 text-xs whitespace-nowrap border border-blue-200">
                                {notification.time}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 font-medium truncate">{notification.product}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white to-transparent z-10"></div>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white to-transparent z-10"></div>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          .notification-scroll {
            animation: scrollDown 20s linear infinite;
          }

          @keyframes scrollDown {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(-33.333%);
            }
          }
        `}</style>
      </section>

      {/* Anti-Fraud Section - Design Reformulado */}
      <section className="relative z-10 py-20">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 mb-4">
              Anti‑fraude
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Controle de risco, direto ao ponto</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nosso sistema é objetivo: você pode bloquear bancos que não deseja aceitar e banir clientes por IP ou e‑mail. Simples, transparente e sob seu controle.
            </p>
          </div>

          {/* Grid de Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Layers, title: 'Bloqueio por banco', desc: 'Escolha quais bancos/provedores você aceita. Bloqueie os que não deseja processar.', color: 'blue' },
              { icon: Globe, title: 'Banir por IP', desc: 'Crie uma lista de IPs banidos para impedir novas tentativas do mesmo endereço.', color: 'indigo' },
              { icon: Lock, title: 'Banir por e-mail', desc: 'Bloqueie clientes pelo e-mail para evitar novas compras indesejadas.', color: 'purple' },
              { icon: Settings, title: 'Regras simples', desc: 'Habilite/desabilite regras a qualquer momento. Controle total sobre suas configurações.', color: 'pink' },
            ].map((item, idx) => {
              const Icon = item.icon;
              const colorClasses = {
                blue: 'bg-blue-50 border-blue-200 text-blue-600',
                indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
                purple: 'bg-purple-50 border-purple-200 text-purple-600',
                pink: 'bg-pink-50 border-pink-200 text-pink-600',
              };
              return (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all transform hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[item.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Métricas de Segurança */}
          <div className="rounded-2xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Shield className="w-7 h-7 text-blue-600" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Métricas de Segurança</h3>
                  <p className="text-sm text-gray-600">Proteção em tempo real da sua loja</p>
                </div>
              </div>
            </div>

            {/* Grid de Métricas */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {/* Métrica 1 - Taxa de Aprovação */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Taxa de Aprovação</span>
                </div>
                <div className="mb-2">
                  <div className="text-3xl font-bold text-gray-900">98.7%</div>
                  <div className="text-xs text-green-600 font-medium mt-1">↑ 2.3% este mês</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '98.7%' }}></div>
                </div>
              </div>

              {/* Métrica 2 - Tentativas Bloqueadas */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Bloqueios</span>
                </div>
                <div className="mb-2">
                  <div className="text-3xl font-bold text-gray-900">1,247</div>
                  <div className="text-xs text-gray-600 font-medium mt-1">Últimas 24h</div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white"></div>
                  </div>
                  <span className="text-xs text-gray-600">IPs banidos</span>
                </div>
              </div>

              {/* Métrica 3 - Tempo de Resposta */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Tempo Médio</span>
                </div>
                <div className="mb-2">
                  <div className="text-3xl font-bold text-gray-900">0.12s</div>
                  <div className="text-xs text-blue-600 font-medium mt-1">Verificação de risco</div>
                </div>
                <div className="flex items-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-full h-1.5 rounded-full bg-blue-500"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráfico de Atividade */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Atividade de Segurança (7 dias)</h4>
              <div className="flex items-end justify-between h-40 gap-3">
                {[65, 78, 82, 71, 88, 95, 92].map((height, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full h-full flex items-end">
                      <div
                        className="w-full rounded-t-lg bg-blue-600 transition-all hover:bg-blue-700 min-h-[20px]"
                        style={{ height: `${height}%` }}
                        title={`${height} eventos`}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][idx]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer - Padrão Branco com Bolinhas */}
      <footer className="relative z-10 text-gray-800 mt-16 border-t border-gray-300 bg-white/80 backdrop-blur-sm">
        {/* Background com degradê de baixo para cima e bolinhas azuis destacadas */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
              linear-gradient(to top, #e2e8f0 0%, #f1f5f9 30%, #f8fafc 60%, #ffffff 100%)
            `,
            backgroundSize: '30px 30px, 100% 100%',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Nerix</h3>
              <p className="text-sm text-gray-700 mb-4">
                A plataforma SaaS mais simples para vender produtos digitais.
                Sem documentos, sem burocracia, apenas venda.
              </p>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Recursos</a></li>
                <li><a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Preços</a></li>
                <li><a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Documentação</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Termos de Uso</Link></li>
                <li><Link to="/privacy" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Política de Privacidade</Link></li>
                <li><Link to="/wallet-terms" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Termos da Carteira</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-300 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-700 text-center md:text-left font-medium mb-4 md:mb-0">
                © {new Date().getFullYear()} Nerix. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6">
                <Link to="/terms" className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium">Termos</Link>
                <Link to="/privacy" className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium">Privacidade</Link>
                <Link to="/wallet-terms" className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium">Carteira</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals removidos - agora são páginas separadas (/login e /register) */}

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes meteor {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(-800px) translateX(-500px);
            opacity: 0;
          }
        }
        @keyframes aurora {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0;
          }
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-meteor {
          animation: meteor linear infinite;
        }
        .animate-aurora {
          animation: aurora linear infinite;
        }
        .animate-ripple {
          animation: ripple 2s ease-out infinite;
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
