'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
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
            <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Política de Privacidade
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
              No Ark Deploy, levamos sua privacidade a sério. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você usa nossa plataforma.
            </p>
          </section>

          {/* Informações que Coletamos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Informações que Coletamos</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.1 Informações Fornecidas por Você</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de Cadastro:</strong> Nome, email, CPF/CNPJ, senha</li>
                  <li><strong>Dados de Pagamento:</strong> Informações de cartão de crédito, dados bancários (processados por nosso gateway de pagamento)</li>
                  <li><strong>Dados de Perfil:</strong> Avatar, preferências, configurações</li>
                  <li><strong>Dados de Servidores:</strong> Endereços IP, credenciais SSH, configurações de servidor</li>
                  <li><strong>Conteúdo:</strong> Código-fonte, arquivos, bancos de dados que você hospeda</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.2 Informações Coletadas Automaticamente</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de Uso:</strong> Páginas visitadas, recursos utilizados, tempo de uso</li>
                  <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional, dispositivo</li>
                  <li><strong>Cookies:</strong> Usamos cookies para manter sua sessão e melhorar a experiência</li>
                  <li><strong>Logs:</strong> Registros de atividades, erros e eventos do sistema</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.3 Informações de Terceiros</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>OAuth:</strong> Dados de perfil do Google ou GitHub quando você usa login social</li>
                  <li><strong>Gateway de Pagamento:</strong> Confirmações de pagamento do Assas</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Como Usamos suas Informações */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Como Usamos suas Informações</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p className="leading-relaxed">Usamos suas informações para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fornecer, operar e manter nossos serviços</li>
                <li>Processar pagamentos e gerenciar assinaturas</li>
                <li>Autenticar e autorizar acesso à plataforma</li>
                <li>Gerenciar e provisionar servidores</li>
                <li>Enviar notificações importantes sobre sua conta</li>
                <li>Fornecer suporte técnico e responder suas solicitações</li>
                <li>Melhorar e personalizar sua experiência</li>
                <li>Detectar e prevenir fraudes e abusos</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Enviar emails de marketing (com seu consentimento)</li>
              </ul>
            </div>
          </section>

          {/* Compartilhamento de Informações */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Compartilhamento de Informações</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p className="leading-relaxed">Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas seguintes situações:</p>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4.1 Provedores de Serviços</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Gateway de Pagamento:</strong> Assas (para processar pagamentos)</li>
                  <li><strong>Hospedagem:</strong> Provedores de infraestrutura em nuvem</li>
                  <li><strong>Email:</strong> Serviços de envio de emails transacionais</li>
                  <li><strong>Monitoramento:</strong> Ferramentas de análise e monitoramento</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4.2 Requisitos Legais</h3>
                <p className="leading-relaxed">
                  Podemos divulgar suas informações se exigido por lei, ordem judicial ou processo legal, ou para proteger nossos direitos, propriedade ou segurança.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4.3 Transferência de Negócios</h3>
                <p className="leading-relaxed">
                  Em caso de fusão, aquisição ou venda de ativos, suas informações podem ser transferidas para a nova entidade.
                </p>
              </div>
            </div>
          </section>

          {/* Segurança dos Dados */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Segurança dos Dados</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p className="leading-relaxed">Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Criptografia:</strong> Todas as comunicações são criptografadas com SSL/TLS</li>
                <li><strong>Senhas:</strong> Armazenadas com hash bcrypt</li>
                <li><strong>Credenciais SSH:</strong> Criptografadas antes de serem armazenadas</li>
                <li><strong>Acesso Restrito:</strong> Apenas pessoal autorizado tem acesso aos dados</li>
                <li><strong>Monitoramento:</strong> Sistemas de detecção de intrusão e anomalias</li>
                <li><strong>Backups:</strong> Backups regulares e criptografados</li>
                <li><strong>Auditorias:</strong> Revisões periódicas de segurança</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Apesar de nossos esforços, nenhum sistema é 100% seguro. Você é responsável por manter a confidencialidade de sua senha.
              </p>
            </div>
          </section>

          {/* Retenção de Dados */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Retenção de Dados</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p className="leading-relaxed">Mantemos suas informações pelo tempo necessário para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fornecer nossos serviços enquanto sua conta estiver ativa</li>
                <li>Cumprir obrigações legais, fiscais e contábeis</li>
                <li>Resolver disputas e fazer cumprir nossos acordos</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Após o encerramento da conta, mantemos dados essenciais por até 5 anos para fins legais e fiscais, conforme exigido pela legislação brasileira.
              </p>
            </div>
          </section>

          {/* Seus Direitos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Seus Direitos (LGPD)</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p className="leading-relaxed">De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Acesso:</strong> Solicitar cópia de seus dados pessoais</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Exclusão:</strong> Solicitar a exclusão de seus dados (com exceções legais)</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Revogação:</strong> Revogar consentimento para processamento de dados</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados</li>
                <li><strong>Informação:</strong> Saber com quem compartilhamos seus dados</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Para exercer seus direitos, entre em contato através do email: <a href="mailto:privacidade@arkdeploy.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacidade@arkdeploy.com</a>
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Cookies e Tecnologias Similares</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p className="leading-relaxed">Usamos cookies e tecnologias similares para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Cookies Essenciais:</strong> Manter sua sessão ativa e autenticação</li>
                <li><strong>Cookies de Preferências:</strong> Lembrar suas configurações e preferências</li>
                <li><strong>Cookies de Análise:</strong> Entender como você usa a plataforma</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Você pode configurar seu navegador para recusar cookies, mas isso pode afetar a funcionalidade da plataforma.
              </p>
            </div>
          </section>

          {/* Transferência Internacional */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Transferência Internacional de Dados</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Seus dados podem ser transferidos e processados em servidores localizados fora do Brasil. Garantimos que essas transferências sejam feitas de acordo com a LGPD e com medidas de segurança adequadas.
            </p>
          </section>

          {/* Menores de Idade */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Menores de Idade</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente informações de menores. Se você acredita que coletamos dados de um menor, entre em contato conosco imediatamente.
            </p>
          </section>

          {/* Links Externos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Links para Sites Externos</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Nossa plataforma pode conter links para sites de terceiros. Não somos responsáveis pelas práticas de privacidade desses sites. Recomendamos que você leia as políticas de privacidade de cada site que visitar.
            </p>
          </section>

          {/* Alterações na Política */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Alterações nesta Política</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas por email ou através da plataforma. A data da última atualização será sempre indicada no topo desta página.
            </p>
          </section>

          {/* Contato */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Contato</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p className="leading-relaxed">
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados, entre em contato:
              </p>
              <ul className="space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Email:</strong> <a href="mailto:privacidade@arkdeploy.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacidade@arkdeploy.com</a></li>
                <li><strong className="text-gray-900 dark:text-white">Suporte:</strong> <a href="mailto:suporte@arkdeploy.com" className="text-blue-600 dark:text-blue-400 hover:underline">suporte@arkdeploy.com</a></li>
              </ul>
            </div>
          </section>

          {/* Encarregado de Dados */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">14. Encarregado de Proteção de Dados (DPO)</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Nosso Encarregado de Proteção de Dados está disponível para esclarecer dúvidas sobre o tratamento de dados pessoais através do email: <a href="mailto:dpo@arkdeploy.com" className="text-blue-600 dark:text-blue-400 hover:underline">dpo@arkdeploy.com</a>
            </p>
          </section>

          {/* Compromisso */}
          <section className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Nosso Compromisso com sua Privacidade
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
              No Ark Deploy, estamos comprometidos em proteger sua privacidade e seus dados pessoais. Implementamos as melhores práticas de segurança e cumprimos rigorosamente a LGPD e outras legislações aplicáveis.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Última atualização: 12 de fevereiro de 2026
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4">
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
            Termos de Uso
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
