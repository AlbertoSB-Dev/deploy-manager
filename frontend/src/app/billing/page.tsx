'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  DollarSign,
  FileText,
  RefreshCw,
  Shield,
  Server,
  Crown,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Payment {
  _id: string;
  planId?: {
    name: string;
  };
  amount: number;
  status: string;
  paymentMethod: string;
  description: string;
  assasInvoiceUrl?: string;
  dueDate?: string;
  paymentDate?: string;
  serversCount?: number;
  metadata?: {
    changeType?: string;
  };
  createdAt: string;
}

interface PendingInvoice extends Payment {
  dueDate: string;
  assasInvoiceUrl: string;
}

interface SubscriptionDetails {
  subscription: {
    planId?: {
      _id: string;
      name: string;
      price: number;
    };
    status: string;
    startDate: string;
    endDate: string;
    serversCount: number;
    autoRenew: boolean;
  };
  daysRemaining: number;
  lastPayment?: Payment;
  nextPayment?: Payment;
}

export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRenewLoading, setAutoRenewLoading] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyRes, detailsRes, pendingRes] = await Promise.all([
        api.get('/billing/history'),
        api.get('/billing/subscription-details'),
        api.get('/billing/pending-invoices'),
      ]);
      setPayments(historyRes.data.data);
      setSubscriptionDetails(detailsRes.data.data);
      setPendingInvoices(pendingRes.data.data);
    } catch (error: any) {
      toast.error('Erro ao carregar dados de cobrança');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRenew = async () => {
    if (!subscriptionDetails) return;

    try {
      setAutoRenewLoading(true);
      const newValue = !subscriptionDetails.subscription.autoRenew;
      
      await api.put('/billing/auto-renew', { autoRenew: newValue });
      
      toast.success(
        newValue
          ? 'Renovação automática ativada'
          : 'Renovação automática desativada'
      );
      
      // Atualizar estado local
      setSubscriptionDetails({
        ...subscriptionDetails,
        subscription: {
          ...subscriptionDetails.subscription,
          autoRenew: newValue,
        },
      });
    } catch (error: any) {
      toast.error('Erro ao atualizar renovação automática');
      console.error(error);
    } finally {
      setAutoRenewLoading(false);
    }
  };

  const generateNewInvoice = async (paymentId: string) => {
    try {
      setGeneratingInvoice(paymentId);
      const res = await api.post(`/billing/generate-new-invoice/${paymentId}`);
      toast.success('Nova via gerada com sucesso!');
      
      // Abrir fatura em nova aba
      if (res.data.data.invoiceUrl) {
        window.open(res.data.data.invoiceUrl, '_blank');
      }
      
      // Recarregar dados
      loadData();
    } catch (error: any) {
      toast.error('Erro ao gerar nova via');
      console.error(error);
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      confirmed: { color: 'green', icon: <CheckCircle className="w-4 h-4" />, text: 'Confirmado' },
      received: { color: 'green', icon: <CheckCircle className="w-4 h-4" />, text: 'Recebido' },
      pending: { color: 'yellow', icon: <Clock className="w-4 h-4" />, text: 'Pendente' },
      overdue: { color: 'red', icon: <AlertTriangle className="w-4 h-4" />, text: 'Vencido' },
      cancelled: { color: 'gray', icon: <XCircle className="w-4 h-4" />, text: 'Cancelado' },
      refunded: { color: 'blue', icon: <RefreshCw className="w-4 h-4" />, text: 'Reembolsado' },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${badge.color}-100 dark:bg-${badge.color}-900/20 text-${badge.color}-700 dark:text-${badge.color}-400`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4" />;
      case 'BOLETO':
        return <FileText className="w-4 h-4" />;
      case 'PIX':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!subscriptionDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Você não possui uma assinatura ativa</p>
          <button
            onClick={() => router.push('/pricing')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Ver Planos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/profile')}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Cobrança & Pagamentos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerencie sua assinatura e histórico de pagamentos
              </p>
            </div>
          </div>
        </div>

        {/* Detalhes da Assinatura */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">
                    {subscriptionDetails.subscription.planId?.name || 'Plano Atual'}
                  </h2>
                </div>
                <p className="text-blue-100">
                  {subscriptionDetails.subscription.serversCount} servidor(es) • 
                  {subscriptionDetails.daysRemaining > 0 
                    ? ` ${subscriptionDetails.daysRemaining} dias restantes`
                    : ' Expirado'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Status</p>
                <p className="text-2xl font-bold">
                  {subscriptionDetails.subscription.status === 'active' ? 'Ativa' : 
                   subscriptionDetails.subscription.status === 'trial' ? 'Trial' : 'Inativa'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Informações da Assinatura */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Data de Início</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(subscriptionDetails.subscription.startDate)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Próxima Renovação</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(subscriptionDetails.subscription.endDate)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Server className="w-4 h-4" />
                  <span className="text-sm">Servidores</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {subscriptionDetails.subscription.serversCount}
                </p>
              </div>
            </div>

            {/* Renovação Automática */}
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Renovação Automática
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {subscriptionDetails.subscription.autoRenew
                      ? 'Sua assinatura será renovada automaticamente'
                      : 'Sua assinatura não será renovada automaticamente'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleAutoRenew}
                disabled={autoRenewLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  subscriptionDetails.subscription.autoRenew
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                } ${autoRenewLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    subscriptionDetails.subscription.autoRenew ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Próximo Pagamento */}
            {subscriptionDetails.nextPayment && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                      Próximo Pagamento
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vencimento: {formatDate(subscriptionDetails.nextPayment.dueDate!)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(subscriptionDetails.nextPayment.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Faturas Pendentes (PIX/Boleto) */}
        {pendingInvoices.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-xl shadow-sm border-2 border-orange-300 dark:border-orange-700 overflow-hidden">
            <div className="p-6 border-b border-orange-200 dark:border-orange-800 bg-orange-100 dark:bg-orange-900/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Faturas Pendentes
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Você tem {pendingInvoices.length} fatura(s) aguardando pagamento
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {pendingInvoices.map((invoice) => {
                const daysUntilDue = Math.ceil(
                  (new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const isOverdue = daysUntilDue < 0;
                const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;

                return (
                  <div
                    key={invoice._id}
                    className={`p-4 rounded-lg border-2 ${
                      isOverdue
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700'
                        : isUrgent
                        ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-300 dark:border-orange-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getPaymentMethodIcon(invoice.paymentMethod)}
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {invoice.description}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Valor</p>
                            <p className="font-bold text-lg text-gray-900 dark:text-white">
                              {formatCurrency(invoice.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Vencimento</p>
                            <p className={`font-semibold ${
                              isOverdue ? 'text-red-600 dark:text-red-400' :
                              isUrgent ? 'text-orange-600 dark:text-orange-400' :
                              'text-gray-900 dark:text-white'
                            }`}>
                              {formatDate(invoice.dueDate)}
                              {isOverdue && ' (Vencido)'}
                              {isUrgent && ` (${daysUntilDue} dias)`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <a
                          href={invoice.assasInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium text-center whitespace-nowrap"
                        >
                          {invoice.paymentMethod === 'PIX' ? '📱 Pagar com PIX' : '📄 Ver Boleto'}
                        </a>
                        <button
                          onClick={() => generateNewInvoice(invoice._id)}
                          disabled={generatingInvoice === invoice._id}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-sm disabled:opacity-50"
                        >
                          {generatingInvoice === invoice._id ? 'Gerando...' : '🔄 Nova Via'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Histórico de Pagamentos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Histórico de Pagamentos
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Últimas {payments.length} transações
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhum pagamento registrado ainda
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(payment.createdAt)}
                        </div>
                        {payment.paymentDate && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Pago em {formatDate(payment.paymentDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.description}
                        </div>
                        {payment.planId && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.planId.name} • {payment.serversCount} servidor(es)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span>
                            {payment.paymentMethod === 'CREDIT_CARD' ? 'Cartão' :
                             payment.paymentMethod === 'BOLETO' ? 'Boleto' :
                             payment.paymentMethod === 'PIX' ? 'PIX' : 'Manual'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {payment.assasInvoiceUrl && (
                          <a
                            href={payment.assasInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Fatura
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Informações Importantes */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Informações Importantes
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Todos os pagamentos são processados de forma segura através do Assas</li>
                <li>• Você pode desativar a renovação automática a qualquer momento</li>
                <li>• Ao desativar a renovação, sua assinatura permanecerá ativa até o fim do período pago</li>
                <li>• Faturas e recibos ficam disponíveis para download por 12 meses</li>
                <li>• Em caso de dúvidas, entre em contato com nosso suporte</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
