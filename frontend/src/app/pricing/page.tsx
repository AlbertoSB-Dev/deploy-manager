'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Zap } from 'lucide-react';

export default function PricingPage() {
  const [servers, setServers] = useState(1);
  const [projects, setProjects] = useState(3);

  // Preços base
  const pricePerServer = 5.00; // R$ 5 por servidor
  const pricePerProject = 2.00; // R$ 2 por projeto
  const basePrice = 9.90; // Taxa base

  // Calcular preço total
  const totalPrice = basePrice + (servers * pricePerServer) + (projects * pricePerProject);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Ark Deploy</span>
            </Link>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Título */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Planos Flexíveis
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Escolha exatamente o que você precisa. Pague apenas pelo que usar.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Calculadora de Preço */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Monte seu Plano
              </h2>
            </div>

            {/* Slider de Servidores */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Servidores VPS
                </label>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {servers}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={servers}
                onChange={(e) => setServers(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>1</span>
                <span>50</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                R$ {pricePerServer.toFixed(2)} por servidor
              </p>
            </div>

            {/* Slider de Projetos */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Projetos
                </label>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {projects}
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="100"
                value={projects}
                onChange={(e) => setProjects(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>3</span>
                <span>100</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                R$ {pricePerProject.toFixed(2)} por projeto
              </p>
            </div>

            {/* Resumo do Preço */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Taxa base</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    R$ {basePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {servers} servidor{servers !== 1 ? 'es' : ''} × R$ {pricePerServer.toFixed(2)}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    R$ {(servers * pricePerServer).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {projects} projeto{projects !== 1 ? 's' : ''} × R$ {pricePerProject.toFixed(2)}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    R$ {(projects * pricePerProject).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total por mês
                </span>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    R$ {totalPrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    por mês
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/register"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Teste grátis por 14 dias. Cancele quando quiser.
            </p>
          </div>

          {/* Recursos Incluídos */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Tudo Incluído no Seu Plano
            </h3>

            <div className="space-y-4">
              {[
                'Deploy automático via Git',
                'Configuração automática de Nginx',
                'Instalação de bancos de dados (MongoDB, MySQL, PostgreSQL, Redis)',
                'Monitoramento de recursos (CPU, RAM, Disco)',
                'Múltiplos ambientes (dev, staging, prod)',
                'Logs em tempo real',
                'Gerenciamento via SSH',
                'Backup automático de configurações',
                'Suporte técnico',
                'Painel de controle intuitivo',
                'Atualizações do sistema',
                'Gerenciamento de containers Docker',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                💡 Dica: Economize com Planos Anuais
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pague anualmente e ganhe <strong>2 meses grátis</strong>! Entre em contato para planos empresariais personalizados.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Perguntas Frequentes
          </h3>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Posso mudar meu plano depois?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Sim! Você pode aumentar ou diminuir servidores e projetos a qualquer momento. As mudanças são aplicadas imediatamente.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Como funciona o período de teste?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                14 dias grátis, sem cartão de crédito. Teste todas as funcionalidades sem compromisso.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Preciso ter meu próprio servidor?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Sim, você conecta seus próprios servidores VPS (DigitalOcean, AWS, Contabo, etc). Nós gerenciamos eles para você.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Há taxa de setup ou cancelamento?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Não! Sem taxas ocultas. Cancele quando quiser, sem multas ou burocracias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
