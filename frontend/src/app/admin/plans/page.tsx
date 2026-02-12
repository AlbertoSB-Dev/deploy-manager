'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit, Trash2, Check, X, CreditCard, TrendingUp, Users, DollarSign, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Plan {
  _id: string;
  name: string;
  description: string;
  pricePerServer: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  discountTiers?: Array<{
    minServers: number;
    discountPercent: number;
  }>;
  isActive: boolean;
  isPopular: boolean;
}

export default function PlansManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const loadPlans = async () => {
    try {
      const response = await api.get('/admin/plans');
      setPlans(response.data);
    } catch (error) {
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar o plano "${name}"?`)) return;

    try {
      await api.delete(`/admin/plans/${id}`);
      toast.success('Plano deletado com sucesso!');
      loadPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar plano');
    }
  };

  const stats = {
    total: plans.length,
    active: plans.filter(p => p.isActive).length,
    popular: plans.filter(p => p.isPopular).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Gerenciar Planos
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Crie e gerencie os planos de assinatura
                </p>
              </div>
            </div>
            <button
              onClick={() => { setEditingPlan(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Novo Plano
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Planos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Planos Ativos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.active}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Planos Populares</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.popular}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {plans.length === 0 ? (
          <div className="text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Nenhum plano cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard key={plan._id} plan={plan} onEdit={() => { setEditingPlan(plan); setShowModal(true); }} onDelete={() => handleDelete(plan._id, plan.name)} />
            ))}
          </div>
        )}
      </div>

      {showModal && <PlanModal plan={editingPlan} onClose={() => { setShowModal(false); setEditingPlan(null); }} onSaved={() => { setShowModal(false); setEditingPlan(null); loadPlans(); }} />}
    </div>
  );
}

// Plan Card Component
function PlanCard({ plan, onEdit, onDelete }: any) {
  return (
    <div className={`relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border-2 transition-all hover:shadow-2xl group ${
      plan.isPopular ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200/50 dark:border-gray-700/50'
    }`}>
      {plan.isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
          <Star className="w-3 h-3 inline mr-1" />
          POPULAR
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              R$ {plan.pricePerServer}
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              /servidor/{plan.interval === 'monthly' ? 'mês' : 'ano'}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ✨ Acesso Ilimitado:
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Projetos ilimitados
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Bancos de dados ilimitados
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Armazenamento ilimitado
            </li>
          </ul>
        </div>

        <div className="space-y-2 mb-6">
          {plan.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>

        {plan.discountTiers && plan.discountTiers.length > 0 && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">
              💰 Descontos por Volume:
            </div>
            <div className="space-y-1">
              {plan.discountTiers.map((tier: any, idx: number) => (
                <div key={idx} className="text-xs text-blue-700 dark:text-blue-400">
                  {tier.minServers}+ servidores: {tier.discountPercent}% OFF
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className={`text-sm font-medium ${plan.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {plan.isActive ? '● Ativo' : '● Inativo'}
          </span>
          <div className="flex gap-2">
            <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Plan Modal Component
function PlanModal({ plan, onClose, onSaved }: any) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    pricePerServer: plan?.pricePerServer || 0,
    interval: plan?.interval || 'monthly',
    features: plan?.features || [''],
    discountTiers: plan?.discountTiers || [{ minServers: 5, discountPercent: 10 }],
    isActive: plan?.isActive ?? true,
    isPopular: plan?.isPopular || false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanedData = { ...formData, features: formData.features.filter((f: string) => f.trim() !== '') };

      if (plan) {
        await api.put(`/admin/plans/${plan._id}`, cleanedData);
        toast.success('Plano atualizado!');
      } else {
        await api.post('/admin/plans', cleanedData);
        toast.success('Plano criado!');
      }
      onSaved();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {plan ? 'Editar Plano' : 'Novo Plano'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preço/Servidor (R$)</label>
              <input type="number" value={formData.pricePerServer} onChange={(e) => setFormData({ ...formData, pricePerServer: parseFloat(e.target.value) })} required min="0" step="0.01"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Intervalo</label>
            <select value={formData.interval} onChange={(e) => setFormData({ ...formData, interval: e.target.value as 'monthly' | 'yearly' })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Funcionalidades</label>
            <div className="space-y-2">
              {formData.features.map((feature: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <input type="text" value={feature} onChange={(e) => { const newFeatures = [...formData.features]; newFeatures[index] = e.target.value; setFormData({ ...formData, features: newFeatures }); }}
                    placeholder="Ex: Deploy automático" className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  <button type="button" onClick={() => setFormData({ ...formData, features: formData.features.filter((_: string, i: number) => i !== index) })}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setFormData({ ...formData, features: [...formData.features, ''] })}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:border-blue-500 hover:text-blue-500">
                + Adicionar
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ativo</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isPopular} onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Popular</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50">
              {loading ? 'Salvando...' : plan ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
