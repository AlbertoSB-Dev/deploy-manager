'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar para home
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Termos de Uso
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Última atualização: 12 de fevereiro de 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-8">
          
          {/* Introdução */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introdução</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Bem-vindo ao Ark Deploy. Ao acessar e usar nossa plataforma, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
            </p>
          </section>

          {/* Definições */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Definições</h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li><strong className="text-gray-900 dark:text-white">Plataforma:</strong> Refere-se ao Ark Deploy, incluindo todos os seus serviços, funcionalidades e recursos.</li>
              <li><strong className="text-gray-900 dark:text-white">Usuário:</strong> Qualquer pessoa ou entidade que cria uma conta e utiliza os serviços da plataforma.</li>
              <li><strong className="text-gray-900 dark:text-white">Serviços:</strong> Todos os recursos oferecidos pela plataforma, incluindo gerenciamento de servidores, deploy de aplicações, monitoramento e suporte.</li>
              <li><strong className="text-gray-900 dark:text-white">Conteúdo:</strong> Qualquer informação, dado, texto, software, código ou material enviado ou criado pelo usuário na plataforma.</li>
            </ul>
          </section>

          {/* Aceitação dos Termos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Aceitação dos Termos</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              Ao criar uma conta no Ark Deploy, você declara que:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Tem pelo menos 18 anos de idade ou possui autorização legal para usar nossos serviços</li>
              <li>Forneceu informações verdadeiras, precisas e completas durante o registro</li>
              <li>Manterá suas informações de conta atualizadas</li>
              <li>É responsável por manter a confidencialidade de sua senha</li>
              <li>Aceita todos os riscos de acesso não autorizado à sua conta</li>
            </ul>
          </section>

          {/* Uso da Plataforma */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Uso da Plataforma</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4.1 Uso Permitido</h3>
                <p className="leading-relaxed">
                  Você pode usar a plataforma para gerenciar servidores, fazer deploy de aplicações legítimas e utilizar os recursos disponíveis conforme sua assinatura.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4.2 Uso Proibido</h3>
                <p className="leading-relaxed mb-2">Você concorda em NÃO:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Usar a plataforma para atividades ilegais ou não autorizadas</li>
                  <li>Hospedar conteúdo que viole direitos autorais, marcas registradas ou propriedade intelectual</li>
                  <li>Distribuir malware, vírus ou qualquer código malicioso</li>
                  <li>Realizar ataques DDoS, phishing ou outras atividades maliciosas</li>
                  <li>Tentar acessar contas de outros usuários sem autorização</li>
                  <li>Fazer engenharia reversa, descompilar ou desmontar a plataforma</li>
                  <li>Usar a plataforma para enviar spam ou comunicações não solicitadas</li>
                  <li>Sobrecarregar intencionalmente a infraestrutura da plataforma</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Planos e Pagamentos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Planos e Pagamentos</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5.1 Trial Gratuito</h3>
                <p className="leading-relaxed">
                  Novos usuários recebem 15 dias de trial gratuito com acesso limitado. Após o período de trial, é necessário assinar um plano pago para continuar usando a plataforma.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5.2 Assinaturas</h3>
                <p className="leading-relaxed">
                  As assinaturas são cobradas mensalmente ou anualmente, conforme o plano escolhido. Os preços estão sujeitos a alterações mediante aviso prévio de 30 dias.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5.3 Renovação Automática</h3>
                <p className="leading-relaxed">
                  As assinaturas são renovadas automaticamente, exceto se canceladas antes da data de renovação. Você pode desativar a renovação automática a qualquer momento em seu perfil.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5.4 Reembolsos</h3>
                <p className="leading-relaxed">
                  Oferecemos reembolso total dentro de 7 dias após a primeira cobrança. Após este período, não há reembolsos para períodos não utilizados.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5.5 Cancelamento</h3>
                <p className="leading-relaxed">
                  Você pode cancelar sua assinatura a qualquer momento. O acesso aos serviços continuará até o final do período pago.
                </p>
              </div>
            </div>
          </section>

          {/* Propriedade Intelectual */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Propriedade Intelectual</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p className="leading-relaxed">
                Todo o conteúdo da plataforma, incluindo mas não limitado a textos, gráficos, logos, ícones, imagens, clipes de áudio, downloads digitais e compilações de dados, é propriedade do Ark Deploy ou de seus fornecedores de conteúdo e é protegido por leis de direitos autorais.
              </p>
              <p className="leading-relaxed">
                Você mantém todos os direitos sobre o conteúdo que envia para a plataforma. Ao enviar conteúdo, você nos concede uma licença mundial, não exclusiva e livre de royalties para usar, reproduzir e exibir esse conteúdo apenas para fornecer os serviços.
              </p>
            </div>
          </section>

          {/* Privacidade e Segurança */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Privacidade e Segurança</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Sua privacidade é importante para nós. Consulte nossa <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Política de Privacidade</Link> para entender como coletamos, usamos e protegemos suas informações pessoais.
            </p>
          </section>

          {/* Limitação de Responsabilidade */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Limitação de Responsabilidade</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p className="leading-relaxed">
                A plataforma é fornecida "como está" e "conforme disponível". Não garantimos que os serviços serão ininterruptos, seguros ou livres de erros.
              </p>
              <p className="leading-relaxed">
                Em nenhuma circunstância seremos responsáveis por danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de lucros, dados ou outras perdas intangíveis.
              </p>
              <p className="leading-relaxed">
                Nossa responsabilidade total não excederá o valor pago por você nos últimos 12 meses.
              </p>
            </div>
          </section>

          {/* Backup e Perda de Dados */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Backup e Perda de Dados</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Embora façamos backups regulares, você é responsável por manter seus próprios backups de todos os dados e conteúdos. Não nos responsabilizamos por qualquer perda de dados.
            </p>
          </section>

          {/* Suspensão e Encerramento */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Suspensão e Encerramento</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p className="leading-relaxed">
                Reservamo-nos o direito de suspender ou encerrar sua conta imediatamente, sem aviso prévio, se você violar estes termos ou se acreditarmos que seu uso representa um risco para a plataforma ou outros usuários.
              </p>
              <p className="leading-relaxed">
                Você pode encerrar sua conta a qualquer momento através das configurações de perfil.
              </p>
            </div>
          </section>

          {/* Modificações dos Termos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Modificações dos Termos</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Podemos modificar estes termos a qualquer momento. Notificaremos você sobre mudanças significativas por email ou através da plataforma. O uso continuado após as modificações constitui aceitação dos novos termos.
            </p>
          </section>

          {/* Lei Aplicável */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Lei Aplicável</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Estes termos são regidos pelas leis do Brasil. Qualquer disputa será resolvida nos tribunais competentes do Brasil.
            </p>
          </section>

          {/* Contato */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Contato</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através do email: <a href="mailto:suporte@arkdeploy.com" className="text-blue-600 dark:text-blue-400 hover:underline">suporte@arkdeploy.com</a>
            </p>
          </section>

          {/* Aceitação */}
          <section className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <p className="text-gray-900 dark:text-white font-semibold mb-2">
              Ao usar o Ark Deploy, você confirma que leu, entendeu e concorda em estar vinculado a estes Termos de Uso.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Última atualização: 12 de fevereiro de 2026
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4">
          <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
            Política de Privacidade
          </Link>
          <span className="text-gray-400">•</span>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Voltar para home
          </Link>
        </div>
      </div>
    </div>
  );
}
