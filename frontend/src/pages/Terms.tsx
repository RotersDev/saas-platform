import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Background com degradê de baixo para cima e bolinhas azuis destacadas */}
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Termos de Uso</h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ao acessar e usar a plataforma Nerix, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com alguma parte destes termos, não deve usar nosso serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrição do Serviço</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                A Nerix é uma plataforma SaaS (Software as a Service) que permite aos usuários criar e gerenciar lojas online para vender produtos e serviços digitais. Nossos serviços incluem, mas não se limitam a:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Criação e personalização de lojas online</li>
                <li>Processamento de pagamentos</li>
                <li>Gerenciamento de produtos e estoque</li>
                <li>Gestão de pedidos e clientes</li>
                <li>Ferramentas de marketing e análise</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Conta de Usuário</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Para usar nossos serviços, você precisa criar uma conta. Você é responsável por:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Todas as atividades que ocorrem sob sua conta</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                <li>Fornecer informações precisas e atualizadas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Uso Aceitável</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Você concorda em NÃO usar a plataforma para:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Atividades ilegais ou não autorizadas</li>
                <li>Vender produtos ou serviços proibidos por lei</li>
                <li>Violar direitos de propriedade intelectual</li>
                <li>Transmitir vírus, malware ou código malicioso</li>
                <li>Realizar atividades fraudulentas ou enganosas</li>
                <li>Interferir ou interromper o funcionamento da plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Pagamentos e Taxas</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                A Nerix pode cobrar taxas pelos serviços prestados. Todas as taxas serão claramente comunicadas antes da contratação. Você é responsável por:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Pagar todas as taxas aplicáveis em dia</li>
                <li>Manter informações de pagamento atualizadas</li>
                <li>Entender que as taxas podem ser alteradas com aviso prévio</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriedade Intelectual</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Todo o conteúdo da plataforma, incluindo design, código, logotipos e textos, é propriedade da Nerix e está protegido por leis de direitos autorais. Você não pode copiar, modificar ou distribuir nosso conteúdo sem autorização prévia.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitação de Responsabilidade</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                A Nerix não se responsabiliza por:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Perdas ou danos resultantes do uso ou incapacidade de usar a plataforma</li>
                <li>Interrupções temporárias do serviço</li>
                <li>Conteúdo ou ações de terceiros</li>
                <li>Decisões tomadas com base em informações fornecidas pela plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modificações dos Termos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Reservamos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas com antecedência. O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Rescisão</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Podemos suspender ou encerrar sua conta a qualquer momento, com ou sem aviso prévio, se você violar estes termos ou se houver suspeita de atividade fraudulenta.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contato</h2>
              <p className="text-gray-700 leading-relaxed">
                Para questões sobre estes termos, entre em contato conosco através do email de suporte disponível na plataforma.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

