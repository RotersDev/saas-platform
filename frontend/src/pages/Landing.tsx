import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Store, TrendingUp, Users, Zap, ArrowRight, LogIn, UserPlus, LogOut,
  Shield, CreditCard, Globe, Sparkles, Lock, Rocket, CheckCircle2,
  BarChart3, Clock, Star, Target, Layers,
  FileText, Settings, Filter, Download
} from 'lucide-react';

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();
  const { login, register, logout, isAuthenticated, user } = useAuthStore();
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0, 0]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Redirecionar usuários logados para o dashboard apenas se não estiverem interagindo com modais
    if (isAuthenticated && user && !showLogin && !showRegister) {
      if (user.store_id) {
        navigate('/store', { replace: true });
        return;
      }
      // Se for master_admin, não redireciona automaticamente (ele pode acessar diretamente /admin)
    }

    // Animação dos números
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const statsTargets = [150, 2000, 5000, 5];
    const increments = statsTargets.map(target => target / steps);

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setAnimatedStats(prev =>
        prev.map((val, idx) => {
          const newVal = val + increments[idx];
          return newVal >= statsTargets[idx] ? statsTargets[idx] : newVal;
        })
      );

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats(statsTargets);
      }
    }, interval);

    // Scroll effect
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isAuthenticated, user, navigate, showLogin, showRegister]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(loginData.email, loginData.password);
      const currentUser = useAuthStore.getState().user;

      // Fechar o modal antes de redirecionar
      setShowLogin(false);

      // Limpar os dados do formulário
      setLoginData({ email: '', password: '' });

      // Redirecionar para o domínio principal do SaaS se estiver em domínio customizado
      const saasDomain = import.meta.env.VITE_SAAS_DOMAIN || 'xenaparcerias.online';
      if (window.location.hostname !== saasDomain && !window.location.hostname.includes('localhost')) {
        // Redirecionar baseado no tipo de usuário
        if (currentUser?.store_id) {
          window.location.href = `https://${saasDomain}/store`;
        } else {
          window.location.href = `https://${saasDomain}/create-store`;
        }
        return;
      }

      // Redirecionar baseado no tipo de usuário
      // NÃO redirecionar master_admin para /admin automaticamente
      // O acesso ao /admin deve ser manual (digitando a URL)
      if (currentUser?.store_id) {
        navigate('/store');
      } else {
        navigate('/create-store');
      }

      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      // Não redirecionar em caso de erro, apenas mostrar mensagem
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao fazer login';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(registerData.username, registerData.email, registerData.password);
      toast.success('Conta criada com sucesso!');
      setShowRegister(false);

      // Redirecionar para o domínio principal do SaaS se estiver em domínio customizado
      const saasDomain = import.meta.env.VITE_SAAS_DOMAIN || 'xenaparcerias.online';
      if (window.location.hostname !== saasDomain && !window.location.hostname.includes('localhost')) {
        window.location.href = `https://${saasDomain}/create-store`;
        return;
      }

      navigate('/create-store');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Lojas Ativas', value: `${Math.floor(animatedStats[0])}+`, icon: Store },
    { label: 'Vendas Mensais', value: `R$ ${Math.floor(animatedStats[1] / 1000)}K+`, icon: TrendingUp },
    { label: 'Usuários', value: `${Math.floor(animatedStats[2] / 1000)}K+`, icon: Users },
    { label: 'Tempo Médio', value: `< ${Math.floor(animatedStats[3])}min`, icon: Zap },
  ];

  const features = [
    {
      icon: Rocket,
      title: 'Setup em Minutos',
      description: 'Crie sua loja em menos de 5 minutos. Sem complicação, sem código.',
      color: 'bg-blue-500',
    },
    {
      icon: Shield,
      title: '100% Seguro',
      description: 'Segurança de ponta a ponta. Seus dados e dos seus clientes protegidos.',
      color: 'bg-green-500',
    },
    {
      icon: CreditCard,
      title: 'Pagamentos Integrados',
      description: 'PIX, Mercado Pago e Pushin Pay. Receba pagamentos instantaneamente.',
      color: 'bg-blue-500',
    },
    {
      icon: Globe,
      title: 'Domínio Próprio',
      description: 'Use seu próprio domínio ou subdomínio personalizado.',
      color: 'bg-indigo-500',
    },
    {
      icon: Sparkles,
      title: 'Sem Documentação',
      description: 'Não precisa de CNPJ, identidade ou documentos. Comece agora mesmo.',
      color: 'bg-blue-500',
    },
    {
      icon: Lock,
      title: 'Privacidade Total',
      description: 'Seus dados são seus. Não compartilhamos informações com terceiros.',
      color: 'bg-red-500',
    },
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Empreendedora Digital',
      avatar: 'MS',
      rating: 5,
      text: 'A Nerix revolucionou meu negócio! Em poucos dias consegui criar uma loja completa e começar a vender meus produtos digitais. A interface é muito intuitiva.',
    },
    {
      name: 'João Santos',
      role: 'Criador de Conteúdo',
      avatar: 'JS',
      rating: 5,
      text: 'Plataforma incrível! O sistema de pagamentos é muito confiável e nunca tive problemas. Recomendo para qualquer pessoa que queira vender online.',
    },
    {
      name: 'Ana Costa',
      role: 'Coach Online',
      avatar: 'AC',
      rating: 5,
      text: 'A facilidade de uso da Nerix é impressionante. Em menos de 1 hora configurei toda minha loja e comecei a receber vendas. Excelente suporte também!',
    },
    {
      name: 'Carlos Oliveira',
      role: 'Desenvolvedor',
      avatar: 'CO',
      rating: 5,
      text: 'Como desenvolvedor, posso dizer que a Nerix tem uma API muito bem estruturada. A integração foi simples e o sistema é muito estável.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Meteors Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="pointer-events-none absolute size-0.5 rotate-[215deg] animate-meteor rounded-full bg-zinc-500 shadow-[0_0_0_1px_#ffffff10] z-[-1]"
            style={{
              top: '-5px',
              left: `calc(-50% + ${Math.random() * 2000}px)`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          >
            <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-zinc-500 to-transparent"></div>
          </span>
        ))}
      </div>

      {/* Header */}
      <header className={`relative z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Nerix</h1>
            <div className="flex space-x-4 items-center">
              {isAuthenticated ? (
                <>
                  {user?.store_id ? (
                    <a
                      href="/store"
                      className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all"
                    >
                      Minha Loja
                    </a>
                  ) : (
                    <button
                      onClick={() => navigate('/create-store')}
                      className="bg-white text-blue-900 px-6 py-2 rounded-lg hover:bg-white/90 font-semibold transition-all transform hover:scale-105 shadow-lg"
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
                    className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all inline-flex items-center"
                    title="Sair"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setShowRegister(false);
                    }}
                    className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all inline-flex items-center"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </button>
                  <button
                    onClick={() => {
                      setShowRegister(true);
                      setShowLogin(false);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold transition-all transform hover:scale-105 shadow-lg inline-flex items-center"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Conta
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-28 w-full flex flex-col items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-white/90 text-sm font-medium">Sem burocracia • Sem documentos • Comece agora</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              Crie sua loja online grátis com a{' '}
            </span>
            <span className="relative inline-block">
              <span className="sr-only">Nerix</span>
              <span className="relative animate-aurora bg-[length:200%_auto] bg-clip-text text-transparent"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #FF0080, #7928CA, #0070F3, #38bdf8, #FF0080)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animationDuration: '10s'
                    }}>
                Nerix
              </span>
            </span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-white/80 mb-4 max-w-3xl mx-auto leading-relaxed">
            A Nerix permite vender produtos e serviços digitais com um painel fácil de usar, ideal para qualquer tipo de loja.
          </p>
          <p className="text-base md:text-lg text-white/70 mb-12 max-w-2xl mx-auto">
            <strong className="text-white">Não precisa de CNPJ, identidade ou documentos.</strong> Crie, personalize e comece a vender.
            <br />
            Tudo pronto de ponta a ponta. Segurança de ponta a ponta.
          </p>

          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowRegister(true);
                  setShowLogin(false);
                }}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 h-12 px-8 text-base group shadow-lg"
              >
                Começar agora de graça
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          )}

          {/* Preview Image Section */}
          <div className="container max-w-screen-xl relative mt-16">
            <div className="absolute w-full h-1/3 scale-125 bg-primary/20 blur-3xl pointer-events-none z-[-1]"></div>
            <div className="absolute size-full z-10 bg-gradient-to-b from-transparent to-slate-950"></div>
            <div className="w-full relative border-2 border-white/20 rounded-lg overflow-hidden shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <Store className="w-24 h-24 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40 text-sm">Preview da plataforma</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 bg-white/5 backdrop-blur-md border-y border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tudo que você precisa
        </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Uma plataforma completa para vender produtos digitais sem complicação
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all transform hover:scale-105 hover:shadow-2xl"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 mb-4">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sales Management Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-3">
              Gestão de Vendas
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white">
              Gerenciamento de vendas simples e completo
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Acompanhe pedidos, filtre períodos, exporte dados e gere relatórios claros para tomar decisões rápidas.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            {[
              { icon: FileText, title: 'Visão de pedidos', desc: 'Tabela com status, método de pagamento, valor e cliente.' },
              { icon: Clock, title: 'Filtros por período', desc: 'Selecione hoje, últimos 7/30 dias ou intervalo personalizado.' },
              { icon: Filter, title: 'Segmentações rápidas', desc: 'Filtre por status, gateway, produto e origem.' },
              { icon: Download, title: 'Exportação de dados', desc: 'Exporte CSV/Excel para integrar com seu BI ou contabilidade.' },
              { icon: BarChart3, title: 'Relatórios de desempenho', desc: 'Receita, ticket médio, conversão e chargebacks por período.' },
              { icon: Target, title: 'Análises por categoria', desc: 'Entenda os produtos que mais vendem e seus canais mais eficazes.' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="rounded-lg border bg-white/5 backdrop-blur-md border-white/20 p-6">
                  <div className="size-10 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-white/80 text-base leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Anti-Fraud Section */}
      <section className="relative z-10 py-20">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-4">
              Anti‑fraude
            </div>
            <h2 className="text-4xl font-bold mb-3 text-white">Controle de risco, direto ao ponto</h2>
            <p className="text-white/70 max-w-3xl mx-auto">
              Nosso sistema é objetivo: você pode bloquear bancos que não deseja aceitar e banir clientes por IP ou e‑mail. Simples, transparente e sob seu controle.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-10 items-stretch">
            <div className="grid gap-4 content-start">
              {[
                { icon: Layers, title: 'Bloqueio por banco', desc: 'Escolha quais bancos/provedores você aceita. Bloqueie os que não deseja processar.' },
                { icon: Globe, title: 'Banir por IP', desc: 'Crie uma lista de IPs banidos para impedir novas tentativas do mesmo endereço.' },
                { icon: Lock, title: 'Banir por e-mail', desc: 'Bloqueie clientes pelo e-mail para evitar novas compras indesejadas.' },
                { icon: Settings, title: 'Regras simples e claras', desc: 'Habilite/desabilite regras a qualquer momento. Controle total sobre suas configurações.' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="rounded-lg border bg-white/5 backdrop-blur-md border-white/20 p-5">
                    <div className="flex items-start gap-4">
                      <div className="size-10 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-white text-base">{item.title}</h4>
                        <p className="text-white/80 text-base leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg border bg-white/5 backdrop-blur-md border-white/20 p-6 relative overflow-hidden">
              <div className="text-center mb-4">
                <Shield className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                <h4 className="text-lg font-semibold text-white">Exemplo de bloqueio</h4>
                <p className="text-sm text-white/70">Como as regras funcionam na prática</p>
              </div>
              <div className="space-y-3">
                {[
                  { type: 'Banco XYZ bloqueado', date: 'Adicionado em 15/01/2024', status: 'Bloqueado', bgClass: 'bg-red-500/5', borderClass: 'border-red-500/20', iconColor: 'text-red-400', Icon: Lock },
                  { type: 'IP 123.45.67.89 banido', date: 'Tentativas: 5 em 1h', status: 'Regra ativa', bgClass: 'bg-orange-500/5', borderClass: 'border-orange-500/20', iconColor: 'text-orange-400', Icon: Globe },
                  { type: 'email@exemplo.com banido', date: 'Chargebacks: 3', status: 'Aplicado', bgClass: 'bg-blue-500/5', borderClass: 'border-blue-500/20', iconColor: 'text-blue-400', Icon: Lock },
                  { type: 'Banco ABC liberado', date: 'Taxa de aprovação: 98%', status: 'Liberado', bgClass: 'bg-green-500/5', borderClass: 'border-green-500/20', iconColor: 'text-green-400', Icon: CheckCircle2 },
                ].map((item, idx) => {
                  const Icon = item.Icon;
                  const buttonClass = item.status === 'Bloqueado'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                    : item.status === 'Liberado'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                    : item.status === 'Regra ativa'
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30';

                  return (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-md ${item.bgClass} ${item.borderClass} border`}>
                      <div className="flex items-center gap-3">
                        <div className={item.iconColor}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-base font-medium text-white">{item.type}</div>
                          <div className="text-sm text-white/70">{item.date}</div>
                        </div>
                      </div>
                      <button className={`inline-flex items-center rounded-full border px-3 py-1 font-semibold text-sm transition-colors ${buttonClass}`}>
                        {item.status}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-4">
            Depoimentos
          </div>
          <h2 className="text-4xl font-bold mb-4 text-white">O que nossos clientes dizem</h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Mais de 10.000 empreendedores confiam na Nerix para vender seus produtos digitais
          </p>
        </div>
        <div className="relative">
          <div className="group flex overflow-hidden p-2 gap-4 flex-row animate-marquee">
            {[...testimonials, ...testimonials].map((testimonial, idx) => (
              <div key={idx} className="rounded-lg border bg-white/5 backdrop-blur-md border-white/20 w-[350px] p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg flex-shrink-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-sm text-white/60">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/70 leading-relaxed">"{testimonial.text}"</p>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 bg-gradient-to-r from-blue-600 to-blue-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Crie sua conta agora e comece a vender produtos digitais hoje mesmo.
            <br />
            <strong>Sem documentos. Sem burocracia. Apenas venda.</strong>
          </p>
          {!isAuthenticated && (
            <button
              onClick={() => {
                setShowRegister(true);
                setShowLogin(false);
              }}
              className="bg-white text-blue-900 px-10 py-5 rounded-xl text-xl font-bold hover:bg-white/90 transition-all transform hover:scale-105 shadow-2xl inline-flex items-center space-x-2"
            >
              <span>Criar Conta Grátis</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 border-t border-white/10 py-12">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4">Nerix</h3>
              <p className="text-white/70 text-sm mb-4">
                A plataforma SaaS mais simples para vender produtos digitais.
                Sem documentos, sem burocracia, apenas venda.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Documentação</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Nerix. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Termos</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Entrar</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Sua senha"
                />
              </div>

              <div className="text-right mb-4">
                <a
                  href="/forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowLogin(false);
                    navigate('/forgot-password');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Esqueceu a senha?
                </a>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-semibold"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Não tem conta?{' '}
                <button
                  onClick={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Criar conta
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Criar Conta</h2>
              <button
                onClick={() => setShowRegister(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-gray-500">(3-20 caracteres)</span> *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">@</span>
                  <input
                    type="text"
                    required
                    value={registerData.username}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      setRegisterData({ ...registerData, username: value });
                    }}
                    maxLength={20}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="jproters"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Apenas letras, números e underscore (_)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  required
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-semibold"
                >
                  {loading ? 'Criando...' : 'Criar Conta'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Já tem conta?{' '}
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Entrar
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

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
