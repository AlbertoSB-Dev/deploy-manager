'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GitBranch, Terminal, Zap, Shield, Globe, CheckCircle, ArrowRight, Github, Server, Clock } from 'lucide-react';

export default function LandingPage() {
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const deploySteps = [
    { text: '$ deploy-manager add-server vps-01 --ip 192.168.1.100', delay: 100, color: 'text-green-400' },
    { text: '🔌 Conectando ao servidor via SSH...', delay: 800, color: 'text-gray-400' },
    { text: '✓ Conexão estabelecida', delay: 600, color: 'text-green-400' },
    { text: '📦 Instalando Docker...', delay: 1000, color: 'text-blue-400' },
    { text: '✓ Docker instalado com sucesso', delay: 800, color: 'text-green-400' },
    { text: '🔧 Configurando Nginx...', delay: 900, color: 'text-blue-400' },
    { text: '✓ Nginx configurado', delay: 600, color: 'text-green-400' },
    { text: '', delay: 400, color: '' },
    { text: '$ deploy-manager deploy my-app --server vps-01', delay: 100, color: 'text-green-400' },
    { text: '📡 Clonando repositório...', delay: 800, color: 'text-gray-400' },
    { text: '✓ Repositório clonado', delay: 700, color: 'text-green-400' },
    { text: '🔨 Construindo imagem Docker...', delay: 1200, color: 'text-blue-400' },
    { text: '✓ Imagem construída', delay: 900, color: 'text-green-400' },
    { text: '🚀 Iniciando container...', delay: 800, color: 'text-blue-400' },
    { text: '✓ Container iniciado', delay: 600, color: 'text-green-400' },
    { text: '🌐 Configurando domínio...', delay: 700, color: 'text-blue-400' },
    { text: '✓ Deploy concluído com sucesso!', delay: 600, color: 'text-green-400 font-bold' },
    { text: '🔗 https://my-app.yourdomain.com', delay: 400, color: 'text-cyan-400' },
  ];

  useEffect(() => {
    if (currentStep < deploySteps.length) {
      const timer = setTimeout(() => {
        setTerminalLines(prev => [...prev, deploySteps[currentStep].text]);
        setCurrentStep(prev => prev + 1);
      }, deploySteps[currentStep].delay);

      return () => clearTimeout(timer);
    } else {
      // Reiniciar animação após 3 segundos
      const resetTimer = setTimeout(() => {
        setTerminalLines([]);
        setCurrentStep(0);
      }, 3000);

      return () => clearTimeout(resetTimer);
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="Ark Deploy" width={40} height={40} />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">Ark Deploy</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/pricing"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition"
              >
                Planos
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md font-medium"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-400 text-sm font-medium mb-8">
          <Zap className="w-4 h-4" />
          Gerencie servidores VPS sem instalar painéis
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Gerencie múltiplos servidores
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            de um único lugar
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto">
          Painel centralizado para gerenciar servidores VPS via SSH. Configure, faça deploy e monitore 
          múltiplos servidores sem instalar nada neles. Tudo automatizado.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl text-lg font-semibold"
          >
            Ver Planos
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-md border border-gray-200 dark:border-gray-700 text-lg font-semibold"
          >
            Começar Grátis
          </Link>
        </div>

        {/* Screenshot/Preview */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400 font-medium">deploy-manager</span>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 text-left font-mono text-sm min-h-[320px] overflow-hidden">
              {terminalLines.map((line, index) => (
                <div 
                  key={index} 
                  className={`${deploySteps[index]?.color || 'text-gray-400'} mb-1 animate-fade-in`}
                >
                  {line}
                  {index === terminalLines.length - 1 && currentStep < deploySteps.length && (
                    <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse"></span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tudo que você precisa para gerenciar servidores
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Um painel centralizado para controlar toda sua infraestrutura
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
              <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gerenciamento Centralizado</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Controle múltiplos servidores VPS de um único painel. Conexão via SSH sem instalações.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Configuração Automática</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Adicione um servidor e o sistema configura tudo automaticamente: Docker, Nginx, SSL e mais.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
              <Image src="/logo.png" alt="Ark Deploy" width={24} height={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Deploy Remoto</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Faça deploy em qualquer servidor conectado. Git, Docker e proxy reverso configurados automaticamente.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Monitoramento em Tempo Real</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Logs em tempo real, status dos containers e recursos de cada servidor em um só lugar.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
              <Terminal className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Terminal SSH Integrado</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Execute comandos diretamente nos servidores remotos através do painel web.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
              <GitBranch className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Multi-Projeto</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie múltiplos projetos em múltiplos servidores. Rollback, versões e histórico completo.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Por que Ark Deploy?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Sem Instalações nos Servidores</h3>
                    <p className="text-gray-600 dark:text-gray-400">Conecte via SSH e o sistema configura tudo automaticamente. Sem painéis para instalar.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Gerenciamento Centralizado</h3>
                    <p className="text-gray-600 dark:text-gray-400">Um único painel para controlar todos os seus servidores VPS e projetos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Configuração Zero</h3>
                    <p className="text-gray-600 dark:text-gray-400">Adicione IP, usuário e senha SSH. O resto é automático: Docker, Nginx, SSL, tudo configurado.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Multi-Servidor</h3>
                    <p className="text-gray-600 dark:text-gray-400">Gerencie quantos servidores quiser. Deploy em qualquer um deles com um clique.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Comece Agora</h3>
              <p className="mb-6 text-blue-100">
                Conecte seus servidores VPS e comece a gerenciar tudo de um único lugar.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold"
              >
                Criar Conta Grátis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Pronto para centralizar seus servidores?
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Gerencie todos os seus servidores VPS de um único painel. Sem instalações, sem complicação.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl text-lg font-semibold"
        >
          Começar Gratuitamente
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image src="/logo.png" alt="Ark Deploy" width={36} height={36} />
                <span className="text-lg font-bold text-gray-900 dark:text-white">Ark Deploy</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Painel centralizado para gerenciar servidores VPS via SSH.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Funcionalidades</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Preços</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Documentação</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Sobre</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Blog</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Contato</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Privacidade</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Termos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            © 2026 Ark Deploy. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
