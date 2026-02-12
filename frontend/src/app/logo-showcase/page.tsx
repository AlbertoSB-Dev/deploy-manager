'use client';

export const dynamic = 'force-dynamic';

import { ArkLogo, ArkIcon } from '@/components/ArkLogo';
import { ArkLogoModern, ArkIconModern } from '@/components/ArkLogoModern';

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent mb-4 animate-gradient bg-[length:200%_auto]">
            Ark Deploy - Logo Showcase
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Todas as variações do logo em um só lugar
          </p>
        </div>

        {/* Logo Moderno */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Logo Moderno (Recomendado)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Com texto */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                Com Texto
              </h3>
              <div className="flex items-center justify-center">
                <ArkLogoModern size={50} showText={true} />
              </div>
            </div>

            {/* Com texto e animação */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                Com Animação
              </h3>
              <div className="flex items-center justify-center">
                <ArkLogoModern size={50} showText={true} animated={true} />
              </div>
            </div>

            {/* Apenas ícone */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                Apenas Ícone
              </h3>
              <div className="flex items-center justify-center">
                <ArkIconModern size={60} />
              </div>
            </div>
          </div>
        </section>

        {/* Logo Clássico */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Logo Clássico
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Default */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                Default
              </h3>
              <div className="flex items-center justify-center">
                <ArkLogo size={50} showText={true} variant="default" />
              </div>
            </div>

            {/* Gradient */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                Gradient
              </h3>
              <div className="flex items-center justify-center">
                <ArkLogo size={50} showText={true} variant="gradient" />
              </div>
            </div>

            {/* White */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-lg">
              <h3 className="text-sm font-semibold text-white mb-4">
                White (Fundo Escuro)
              </h3>
              <div className="flex items-center justify-center">
                <ArkLogo size={50} showText={true} variant="white" />
              </div>
            </div>
          </div>
        </section>

        {/* Tamanhos */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Diferentes Tamanhos
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex flex-wrap items-end justify-center gap-8">
              <div className="text-center">
                <ArkLogoModern size={32} showText={false} />
                <p className="text-xs text-gray-500 mt-2">32px</p>
              </div>
              <div className="text-center">
                <ArkLogoModern size={40} showText={false} />
                <p className="text-xs text-gray-500 mt-2">40px</p>
              </div>
              <div className="text-center">
                <ArkLogoModern size={50} showText={false} />
                <p className="text-xs text-gray-500 mt-2">50px</p>
              </div>
              <div className="text-center">
                <ArkLogoModern size={60} showText={false} />
                <p className="text-xs text-gray-500 mt-2">60px</p>
              </div>
              <div className="text-center">
                <ArkLogoModern size={80} showText={false} />
                <p className="text-xs text-gray-500 mt-2">80px</p>
              </div>
            </div>
          </div>
        </section>

        {/* Casos de Uso */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Casos de Uso
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                Header/Navbar
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <ArkLogoModern size={40} showText={true} />
                  <div className="flex gap-4">
                    <button className="text-sm text-gray-600 dark:text-gray-400">Menu</button>
                    <button className="text-sm text-gray-600 dark:text-gray-400">Perfil</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                Login/Register
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
                <div className="flex flex-col items-center">
                  <ArkLogoModern size={60} showText={true} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">
                    Bem-vindo de volta
                  </h2>
                </div>
              </div>
            </div>

            {/* Loading */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                Loading Screen
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                <ArkLogoModern size={80} showText={true} animated={true} />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                Footer
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <ArkLogoModern size={36} showText={true} />
                  <p className="text-xs text-gray-500">© 2026 <span className="font-semibold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">Ark Deploy</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Código de Exemplo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Como Usar
          </h2>
          
          <div className="bg-gray-900 rounded-2xl p-6 shadow-lg overflow-x-auto">
            <pre className="text-green-400 text-sm">
              <code>{`// Importar
import { ArkLogoModern } from '@/components/ArkLogoModern';

// Usar
<ArkLogoModern 
  size={40} 
  showText={true} 
  animated={false} 
/>

// Apenas ícone
import { ArkIconModern } from '@/components/ArkLogoModern';
<ArkIconModern size={32} />`}</code>
            </pre>
          </div>
        </section>

        {/* Paleta de Cores */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Paleta de Cores
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-500 rounded-xl p-6 text-white">
              <div className="font-bold mb-2">Azul</div>
              <div className="text-sm opacity-90">#3B82F6</div>
            </div>
            <div className="bg-indigo-500 rounded-xl p-6 text-white">
              <div className="font-bold mb-2">Índigo</div>
              <div className="text-sm opacity-90">#6366F1</div>
            </div>
            <div className="bg-purple-500 rounded-xl p-6 text-white">
              <div className="font-bold mb-2">Roxo</div>
              <div className="text-sm opacity-90">#8B5CF6</div>
            </div>
            <div className="bg-green-500 rounded-xl p-6 text-white">
              <div className="font-bold mb-2">Verde</div>
              <div className="text-sm opacity-90">#10B981</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
