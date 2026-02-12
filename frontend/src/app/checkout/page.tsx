'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Zap, Lock } from 'lucide-react';
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
}

interface CreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const planId = searchParams.get('planId');
  const servers = parseInt(searchParams.get('servers') || '1');
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [billingType, setBillingType] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('CREDIT_CARD');
  const [creditCard, setCreditCard] = useState<CreditCard>({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  });

  useEffect(() => {
    if (!planId) {
      toast.error('Plano não selecionado');
      router.push('/pricing');
      return;
    }
    loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    try {
      const response = await api.get('/plans');
      const selectedPlan = response.data.find((p: Plan) => p._id === planId);
      if (!selectedPlan) {
        toast.error('Plano não encontrado');
        router.push('/pricing');
        return;
      }
      setPlan(selectedPlan);
    } catch (error) {
      console.error('Erro ao carregar plano:', error);
      toast.error('Erro ao carregar plano');
      router.push('/pricing');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!plan) return { subtotal: 0, discount: 0, total: 0 };
    
    const pricePerServer = plan.pricePerServer || plan.price || 0;
    const subtotal = pricePerServer * servers;
    
    let discountPercent = 0;
    if (plan.discountTiers && plan.discountTiers.length > 0) {
      const sortedTiers = [...plan.discountTiers].sort((a, b) => b.minServers - a.minServers);
      for (const tier of sortedTiers) {
        if (servers >= tier.minServers) {
          discountPercent = tier.discountPercent;
          break;
        }
      }
    }
    
    const discount = (subtotal * discountPercent) / 100;
    const total = subtotal - discount;
    
    return { subtotal, discount, total, discountPercent };
  };

  const handleCardChange = (field: keyof CreditCard, value: string) => {
    let formattedValue = value;
    
    if (field === 'number') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
    } else if (field === 'expiryMonth') {
      formattedValue = value.replace(/\D/g, '').slice(0, 2);
    } else if (field === 'expiryYear') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (field === 'ccv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCreditCard(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plan) return;
    
    // Validações
    if (billingType === 'CREDIT_CARD') {
      if (!creditCard.holderName || !creditCard.number || !creditCard.expiryMonth || !creditCard.expiryYear || !creditCard.ccv) {
        toast.error('Preencha todos os dados do cartão');
        return;
      }
      
      if (creditCard.number.length !== 16) {
        toast.error('Número do cartão inválido');
        return;
      }
      
      if (creditCard.ccv.length < 3) {
        toast.error('CVV inválido');
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      const { total } = calculatePrice();
      
      const response = await api.post('/payments/subscribe', {
        planId: plan._id,
        billingType,
        creditCard: billingType === 'CREDIT_CARD' ? creditCard : undefined,
        servers,
        price: total, // Enviar preço calculado para validação no backend
      });
      
      toast.success('Assinatura criada com sucesso!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      toast.error(error.response?.data?.error || 'Erro ao processar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Plano não encontrado</p>
          <Link href="/pricing" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Voltar para Preços
          </Link>
        </div>
      </div>
    );
  }

  const { subtotal, discount, total, discountPercent } = calculatePrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/pricing" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar para Preços
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Resumo do Pedido - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Resumo do Pedido</h2>
              
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Plano</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantidade</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{servers} servidor{servers > 1 ? 'es' : ''}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Período</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {plan.interval === 'monthly' ? 'Mensal' : 'Anual'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Preço/servidor:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    R$ {(plan.pricePerServer || plan.price || 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
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
                
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-3">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300 flex gap-2">
                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Pagamento seguro com Assas</p>
              </div>
            </div>
          </div>

          {/* Formulário de Pagamento */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Informações de Pagamento</h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Tipo de Pagamento */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-4">
                    Método de Pagamento
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['CREDIT_CARD', 'PIX', 'BOLETO'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBillingType(type)}
                        className={`p-4 rounded-lg border-2 transition-all text-center font-medium ${
                          billingType === type
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {type === 'CREDIT_CARD' ? '💳 Cartão' : type === 'PIX' ? '📱 PIX' : '📄 Boleto'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dados do Cartão */}
                {billingType === 'CREDIT_CARD' && (
                  <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Nome do Titular
                      </label>
                      <input
                        type="text"
                        value={creditCard.holderName}
                        onChange={(e) => handleCardChange('holderName', e.target.value)}
                        placeholder="João Silva"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        value={creditCard.number}
                        onChange={(e) => handleCardChange('number', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength={16}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                          Mês
                        </label>
                        <input
                          type="text"
                          value={creditCard.expiryMonth}
                          onChange={(e) => handleCardChange('expiryMonth', e.target.value)}
                          placeholder="MM"
                          maxLength={2}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                          Ano
                        </label>
                        <input
                          type="text"
                          value={creditCard.expiryYear}
                          onChange={(e) => handleCardChange('expiryYear', e.target.value)}
                          placeholder="YYYY"
                          maxLength={4}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={creditCard.ccv}
                          onChange={(e) => handleCardChange('ccv', e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {billingType === 'PIX' && (
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                    <p className="text-blue-700 dark:text-blue-300">
                      Você será redirecionado para completar o pagamento via PIX após confirmar o pedido.
                    </p>
                  </div>
                )}

                {billingType === 'BOLETO' && (
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                    <p className="text-blue-700 dark:text-blue-300">
                      Você receberá o boleto por email após confirmar o pedido.
                    </p>
                  </div>
                )}

                {/* Botão de Envio */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirmar Pagamento
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Ao confirmar, você concorda com nossos Termos de Serviço e Política de Privacidade
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
