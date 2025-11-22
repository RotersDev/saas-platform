import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet, AlertCircle } from 'lucide-react';

export default function WalletTerms() {
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
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Termos da Carteira Digital</h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">Importante</p>
                  <p className="text-sm text-blue-700">
                    A carteira digital da Nerix é um sistema de créditos interno da plataforma. Não é uma conta bancária ou instituição financeira regulamentada.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Definição da Carteira</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                A Carteira Digital Nerix é um sistema de créditos virtuais que permite aos usuários armazenar saldo proveniente de vendas realizadas na plataforma. Este saldo pode ser utilizado para:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Solicitar saques para contas bancárias</li>
                <li>Pagar taxas e serviços da plataforma</li>
                <li>Realizar compras dentro do ecossistema Nerix (quando aplicável)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Créditos na Carteira</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2.1. Acúmulo de Créditos</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Os créditos são adicionados à sua carteira quando:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Um pedido é pago e aprovado</li>
                    <li>O valor líquido (após taxas) é creditado automaticamente</li>
                    <li>Você recebe um reembolso ou estorno</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2.2. Taxas e Deduções</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    As seguintes taxas podem ser deduzidas do valor bruto antes do crédito:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Taxa de processamento de pagamento (conforme gateway utilizado)</li>
                    <li>Taxa de plataforma (se aplicável ao seu plano)</li>
                    <li>Impostos e taxas governamentais quando aplicáveis</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Saques</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1. Processo de Saque</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Para solicitar um saque:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Você deve ter saldo disponível na carteira</li>
                    <li>Deve fornecer dados bancários válidos e completos</li>
                    <li>O valor mínimo de saque é definido pela plataforma</li>
                    <li>A solicitação será analisada e processada conforme nossos procedimentos</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.2. Prazos de Processamento</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Os saques são processados em até 5 dias úteis após aprovação. Prazos podem variar conforme:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Método de pagamento escolhido</li>
                    <li>Instituição financeira receptora</li>
                    <li>Verificações de segurança necessárias</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.3. Taxas de Saque</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Podem ser aplicadas taxas de processamento de saque, que serão informadas no momento da solicitação.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Limites e Restrições</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                A Nerix se reserva o direito de:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Estabelecer limites mínimos e máximos de saque</li>
                <li>Solicitar documentação adicional para verificação</li>
                <li>Rejeitar saques em caso de suspeita de fraude ou violação de termos</li>
                <li>Congelar temporariamente a carteira para investigação</li>
                <li>Aplicar restrições baseadas em histórico de transações</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Segurança e Proteção</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Implementamos medidas de segurança para proteger sua carteira:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Criptografia de dados financeiros</li>
                <li>Autenticação de dois fatores (quando disponível)</li>
                <li>Monitoramento de transações suspeitas</li>
                <li>Registros detalhados de todas as operações</li>
                <li>Notificações por e-mail para todas as transações</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Responsabilidades do Usuário</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Você é responsável por:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Manter suas credenciais de acesso seguras</li>
                <li>Fornecer informações bancárias corretas e atualizadas</li>
                <li>Notificar imediatamente sobre qualquer atividade suspeita</li>
                <li>Verificar regularmente o saldo e histórico de transações</li>
                <li>Compreender e cumprir todas as taxas aplicáveis</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Reembolsos e Estornos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Em caso de reembolso ou estorno:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>O valor será debitado da sua carteira</li>
                <li>Se não houver saldo suficiente, a diferença será registrada como débito</li>
                <li>Você precisará quitar o débito antes de solicitar novos saques</li>
                <li>Taxas de processamento não são reembolsáveis</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Inatividade da Carteira</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Se sua conta permanecer inativa por um período prolongado (conforme definido em nossos termos gerais), podemos:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Notificar você sobre o saldo disponível</li>
                <li>Solicitar que você solicite um saque ou reative a conta</li>
                <li>Aplicar taxas de manutenção (se aplicável)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disputas e Reclamações</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Para disputas relacionadas à carteira:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Entre em contato com nosso suporte imediatamente</li>
                <li>Forneça todas as informações relevantes sobre a transação</li>
                <li>Mantenha registros de todas as comunicações</li>
                <li>Investigaremos todas as reclamações de boa fé</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Alterações nos Termos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Podemos modificar estes termos da carteira a qualquer momento. Alterações significativas serão comunicadas com antecedência. O uso continuado da carteira após as modificações constitui aceitação dos novos termos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Isenção de Responsabilidade</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                A Nerix não se responsabiliza por:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Atrasos em saques causados por instituições financeiras terceirizadas</li>
                <li>Perdas resultantes de informações bancárias incorretas fornecidas pelo usuário</li>
                <li>Problemas técnicos temporários que possam afetar o acesso à carteira</li>
                <li>Flutuações cambiais (quando aplicável)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contato</h2>
              <p className="text-gray-700 leading-relaxed">
                Para questões sobre a carteira digital, entre em contato com nosso suporte através do email disponível na plataforma.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

