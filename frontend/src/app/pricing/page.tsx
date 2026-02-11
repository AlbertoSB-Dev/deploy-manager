'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Plan {
  _id: string;
  name: string;
  description: string;
  pricePerServer?: number;
  price?: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  discountTiers?: Array<{
    minServers: number;
    discountPercent: number;
  }>;
  isActive: boolean;
  isPopular: boolean;
}

export default function PricingPage() {
  const [servers, setServers] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/admin/plans');
      const activePlans = response.data.filter((p: Plan) => p.isActive);
      setPlans(activePlans);
      if (activePlans.length > 0) {
        setSelectedPlan(activePlans[0]._id);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = plans.find(p => p._id === selectedPlan);
  const pricePerServer = selectedPlanData ? (selectedPlanData.pricePerServer || selectedPlanData.price || 0) : 0;
  
  // Calcular desconto aplicável
  let discountPercent = 0;
  if (selectedPlanData?.discountTiers && selectedPlanData.discountTiers.length > 0) {
    const sortedTiers = [...selectedPlanData.discountTiers].sort((a, b) => b.minServers - a.minServers);
    for (const tier of sortedTiers) {
      if (servers >= tier.minServers) {
        discountPercent = tier.discountPercent;
        break;
      }
    }
  }
  
  const subtotal = pricePerServer * servers;
  const discount = (subtotal * discountPercent) / 100;
  const totalPrice = subtotal - discount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando planos...</p>
        </div>
      </div>
    );
  }

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
            Escolha seu plano e pague apenas pelos servidores que usar
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

            {/* Seleção de Plano */}
            <div className="mb-8">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                Escolha seu Plano
              </label>
              <div className="space-y-2">
                {plans.map((plan) => (
                  <button
                    key={plan._id}
                    onClick={() => setSelectedPlan(plan._id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPlan === plan._id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          R$ {(plan.pricePerServer || plan.price || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">por servidor/{plan.interval === 'monthly' ? 'mês' : 'ano'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Slider de Servidores */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantidade de Servidores
                </label>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {servers}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={servers}
                onChange={(e) => setServers(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>1</span>
                <span>100</span>
              </div>
            </div>

            {/* Resumo de Preço */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-6 mb-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Preço por servidor:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    R$ {pricePerServer.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Quantidade:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{servers}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    R$ {subtotal.toFixed(2)}
                  </span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <span className="text-green-700 dark:text-green-400 font-medium">Desconto {discountPercent}%:</span>
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      -R$ {discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      R$ {totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    por {selectedPlanData?.interval === 'monthly' ? 'mês' : 'ano'}
                  </p>
                </div>
              </div>

              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Informações do Plano */}
            {selectedPlanData && (
              <div className="space-y-4">
                {/* Faixas de Desconto */}
                {selectedPlanData.discountTiers && selectedPlanData.discountTiers.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-3">💰 Descontos por Quantidade:</h4>
                    <ul className="space-y-2 text-sm">
                      {[...selectedPlanData.discountTiers]
                        .sort((a, b) => a.minServers - b.minServers)
                        .map((tier, idx) => (
                          <li key={idx} className="flex items-center justify-between text-amber-800 dark:text-amber-300">
                            <span>{tier.minServers}+ servidores:</span>
                            <span className="font-semibold">{tier.discountPercent}% OFF</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recursos Inclusos:</h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Projetos ilimitados
                    </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Bancos de dados ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Armazenamento ilimitado
                  </li>
                </ul>
                </div>
              </div>
            )}
          </div>

          {/* Recursos Inclusos */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recursos Inclusos</h3>
            {selectedPlanData && (
              <div className="space-y-3">
                {selectedPlanData.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
