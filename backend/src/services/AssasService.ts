import axios, { AxiosInstance } from 'axios';
import SystemSettings from '../models/SystemSettings';

interface CreateSubscriptionParams {
  customerId: string;
  planId: string;
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
}

interface CreateCustomerParams {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface AssasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
}

interface AssasSubscription {
  id: string;
  customerId: string;
  planId: string;
  status: string;
  nextDueDate: string;
  endDate?: string;
}

export class AssasService {
  private client: AxiosInstance | null = null;
  private apiKey: string = '';
  private baseURL = 'https://api.assas.com.br/v3';

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      const settings = await SystemSettings.findOne();
      this.apiKey = settings?.assasApiKey || process.env.ASSAS_API_KEY || '';

      if (!this.apiKey) {
        console.warn('⚠️  ASSAS_API_KEY não configurada');
      }

      this.client = axios.create({
        baseURL: this.baseURL,
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao inicializar AssasService:', error);
      // Fallback para env
      this.apiKey = process.env.ASSAS_API_KEY || '';
      this.client = axios.create({
        baseURL: this.baseURL,
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  private async ensureClient() {
    if (!this.client) {
      await this.initializeClient();
    }
  }

  /**
   * Criar cliente no Assas
   */
  async createCustomer(params: CreateCustomerParams): Promise<AssasCustomer> {
    try {
      await this.ensureClient();
      if (!this.client) throw new Error('Cliente Assas não inicializado');

      const response = await this.client.post('/customers', {
        name: params.name,
        email: params.email,
        cpfCnpj: params.cpfCnpj,
        phone: params.phone,
        mobilePhone: params.mobilePhone,
        address: params.address,
        addressNumber: params.addressNumber,
        complement: params.complement,
        province: params.province,
        city: params.city,
        state: params.state,
        postalCode: params.postalCode,
      });

      console.log('✅ Cliente criado no Assas:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar cliente no Assas:', error.response?.data || error.message);
      throw new Error(`Erro ao criar cliente: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
    }
  }

  /**
   * Obter cliente do Assas
   */
  async getCustomer(customerId: string): Promise<AssasCustomer> {
    try {
      await this.ensureClient();
      if (!this.client) throw new Error('Cliente Assas não inicializado');

      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao obter cliente:', error.response?.data || error.message);
      throw new Error(`Erro ao obter cliente: ${error.message}`);
    }
  }

  /**
   * Criar plano no Assas
   */
  async createPlan(name: string, value: number, interval: 'MONTHLY' | 'YEARLY', description?: string) {
    try {
      await this.ensureClient();
      if (!this.client) throw new Error('Cliente Assas não inicializado');

      const response = await this.client.post('/plans', {
        name,
        value,
        interval,
        description,
      });

      console.log('✅ Plano criado no Assas:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar plano:', error.response?.data || error.message);
      throw new Error(`Erro ao criar plano: ${error.message}`);
    }
  }

  /**
   * Criar assinatura (subscription)
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<AssasSubscription> {
    try {
      await this.ensureClient();
      if (!this.client) throw new Error('Cliente Assas não inicializado');

      const payload: any = {
        customerId: params.customerId,
        planId: params.planId,
        billingType: params.billingType,
      };

      // Se for cartão de crédito, adicionar dados do cartão
      if (params.billingType === 'CREDIT_CARD' && params.creditCard) {
        payload.creditCard = params.creditCard;
      }

      const response = await this.client.post('/subscriptions', payload);

      console.log('✅ Assinatura criada no Assas:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao criar assinatura: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
    }
  }

  /**
   * Obter assinatura
   */
  async getSubscription(subscriptionId: string): Promise<AssasSubscription> {
    try {
      await this.ensureClient();
      if (!this.client) throw new Error('Cliente Assas não inicializado');

      const response = await this.client.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao obter assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao obter assinatura: ${error.message}`);
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.ensureClient();
      if (!this.client) throw new Error('Cliente Assas não inicializado');

      await this.client.delete(`/subscriptions/${subscriptionId}`);
      console.log('✅ Assinatura cancelada:', subscriptionId);
    } catch (error: any) {
      console.error('❌ Erro ao cancelar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao cancelar assinatura: ${error.message}`);
    }
  }

  /**
   * Criar cobrança única (invoice)
   */
  async createInvoice(
    customerId: string, 
    value: number, 
    description: string, 
    dueDate: string,
    billingType: 'BOLETO' | 'PIX' = 'BOLETO'
  ) {
    try {
      await this.ensureClient();
      if (!this.client) throw new Error('Cliente Assas não inicializado');

      const paymentData: any = {
        customer: customerId,
        billingType,
        value,
        description,
        dueDate,
      };

      // Se for PIX, configurar desconto para incentivar pagamento rápido
      if (billingType === 'PIX') {
        paymentData.discount = {
          value: value * 0.02, // 2% de desconto
          dueDateLimitDays: 0, // Válido apenas no dia
        };
      }

      const response = await this.client.post('/payments', paymentData);

      console.log(`✅ Cobrança ${billingType} criada no Assas:`, response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar cobrança:', error.response?.data || error.message);
      throw new Error(`Erro ao criar cobrança: ${error.message}`);
    }
  }

  /**
   * Validar assinatura do webhook
   */
  validateWebhookSignature(
    signature: string | undefined,
    webhookToken: string | undefined,
    payload: any
  ): boolean {
    if (!signature || !webhookToken) {
      console.warn('⚠️ Webhook sem assinatura ou token não configurado');
      return false;
    }

    try {
      // Assas envia a assinatura no header 'asaas-access-token'
      // Validar se o token corresponde ao configurado
      return signature === webhookToken;
    } catch (error) {
      console.error('Erro ao validar assinatura do webhook:', error);
      return false;
    }
  }

  /**
   * Webhook - Processar eventos do Assas
   */
  processWebhook(event: any) {
    const { event: eventType, data } = event;

    switch (eventType) {
      case 'subscription_created':
        console.log('📝 Assinatura criada:', data.id);
        return { type: 'subscription_created', data };

      case 'subscription_activated':
        console.log('✅ Assinatura ativada:', data.id);
        return { type: 'subscription_activated', data };

      case 'subscription_cancelled':
        console.log('❌ Assinatura cancelada:', data.id);
        return { type: 'subscription_cancelled', data };

      case 'subscription_suspended':
        console.log('⏸️  Assinatura suspensa:', data.id);
        return { type: 'subscription_suspended', data };

      case 'payment_created':
        console.log('💳 Pagamento criado:', data.id);
        return { type: 'payment_created', data };

      case 'payment_confirmed':
        console.log('✅ Pagamento confirmado:', data.id);
        return { type: 'payment_confirmed', data };

      case 'payment_received':
        console.log('💰 Pagamento recebido:', data.id);
        return { type: 'payment_received', data };

      case 'payment_overdue':
        console.log('⚠️  Pagamento vencido:', data.id);
        return { type: 'payment_overdue', data };

      case 'payment_deleted':
        console.log('🗑️  Pagamento deletado:', data.id);
        return { type: 'payment_deleted', data };

      default:
        console.log('❓ Evento desconhecido:', eventType);
        return { type: 'unknown', data };
    }
  }
}

export default new AssasService();
