import nodemailer from 'nodemailer';
import { IUser } from '../models/User';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailEnabled = process.env.EMAIL_ENABLED === 'true';
    
    if (!emailEnabled) {
      console.log('📧 Email desabilitado (EMAIL_ENABLED=false)');
      return;
    }

    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.warn('⚠️ Credenciais de email não configuradas');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      console.log('✅ Email service inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar email service:', error);
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.log('📧 Email não enviado (transporter não configurado)');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"Ark Deploy" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`✅ Email enviado para ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao enviar email para ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Email de boas-vindas ao trial
   */
  async sendTrialWelcome(user: IUser): Promise<boolean> {
    const daysRemaining = user.subscription?.endDate 
      ? Math.ceil((new Date(user.subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 15;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao Ark Deploy!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${user.name}</strong>,</p>
            
            <p>Sua conta foi criada com sucesso! Você tem <strong>${daysRemaining} dias de trial grátis</strong> para explorar todas as funcionalidades do Ark Deploy.</p>
            
            <div class="highlight">
              <h3>📦 O que você pode fazer no trial:</h3>
              <ul>
                <li>✅ Criar 1 servidor</li>
                <li>✅ Deploy de projetos ilimitados</li>
                <li>✅ Criar bancos de dados</li>
                <li>✅ Instalar WordPress</li>
                <li>✅ Gerenciar backups</li>
              </ul>
            </div>
            
            <p>Após o período de trial, você pode escolher um plano que melhor se adequa às suas necessidades.</p>
            
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Acessar Dashboard</a>
            
            <p>Se tiver alguma dúvida, estamos aqui para ajudar!</p>
            
            <p>Abraços,<br><strong>Equipe Ark Deploy</strong></p>
          </div>
          <div class="footer">
            <p>Ark Deploy - Seu código, salvo da tempestade</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🎉 Bem-vindo ao Ark Deploy - Trial de 15 dias!',
      html,
    });
  }

  /**
   * Email de aviso - trial expirando em 3 dias
   */
  async sendExpirationWarning(user: IUser): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Seu trial expira em 3 dias!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${user.name}</strong>,</p>
            
            <div class="warning">
              <p><strong>⚠️ Atenção:</strong> Seu período de trial do Ark Deploy expira em <strong>3 dias</strong>.</p>
            </div>
            
            <p>Após a expiração, você não poderá mais criar ou modificar recursos. Mas não se preocupe, seus projetos continuarão visíveis!</p>
            
            <p><strong>Faça upgrade agora e continue aproveitando:</strong></p>
            <ul>
              <li>✅ Servidores ilimitados</li>
              <li>✅ Deploy automático</li>
              <li>✅ Backups automáticos</li>
              <li>✅ Suporte prioritário</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL}/pricing" class="button">Ver Planos</a>
            
            <p>Não perca essa oportunidade!</p>
            
            <p>Abraços,<br><strong>Equipe Ark Deploy</strong></p>
          </div>
          <div class="footer">
            <p>Ark Deploy - Seu código, salvo da tempestade</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '⏰ Seu trial expira em 3 dias - Faça upgrade!',
      html,
    });
  }

  /**
   * Email de trial expirado
   */
  async sendExpiredNotification(user: IUser): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .alert { background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Seu trial expirou</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${user.name}</strong>,</p>
            
            <div class="alert">
              <p><strong>Seu período de trial do Ark Deploy expirou.</strong></p>
            </div>
            
            <p>Você ainda pode visualizar seus projetos, mas não pode fazer modificações até renovar sua assinatura.</p>
            
            <p><strong>Renove agora e volte a ter acesso total:</strong></p>
            <ul>
              <li>✅ Criar e editar projetos</li>
              <li>✅ Fazer deploy</li>
              <li>✅ Gerenciar servidores</li>
              <li>✅ Criar backups</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL}/pricing" class="button">Renovar Assinatura</a>
            
            <p>Estamos esperando por você!</p>
            
            <p>Abraços,<br><strong>Equipe Ark Deploy</strong></p>
          </div>
          <div class="footer">
            <p>Ark Deploy - Seu código, salvo da tempestade</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '⚠️ Seu trial expirou - Renove sua assinatura',
      html,
    });
  }

  /**
   * Email de confirmação de pagamento
   */
  async sendPaymentConfirmation(user: IUser, planName: string, amount: number): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${user.name}</strong>,</p>
            
            <div class="success">
              <p><strong>Seu pagamento foi confirmado com sucesso!</strong></p>
            </div>
            
            <div class="details">
              <h3>Detalhes da Assinatura:</h3>
              <p><strong>Plano:</strong> ${planName}</p>
              <p><strong>Valor:</strong> R$ ${amount.toFixed(2)}</p>
              <p><strong>Status:</strong> Ativo ✅</p>
            </div>
            
            <p>Sua assinatura está ativa e você tem acesso total a todas as funcionalidades do Ark Deploy!</p>
            
            <p>Obrigado por escolher o Ark Deploy!</p>
            
            <p>Abraços,<br><strong>Equipe Ark Deploy</strong></p>
          </div>
          <div class="footer">
            <p>Ark Deploy - Seu código, salvo da tempestade</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '✅ Pagamento Confirmado - Ark Deploy',
      html,
    });
  }

  /**
   * Email de pagamento atrasado
   */
  async sendPaymentOverdue(user: IUser): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Pagamento Atrasado</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${user.name}</strong>,</p>
            
            <div class="warning">
              <p><strong>Seu pagamento está atrasado.</strong></p>
            </div>
            
            <p>Para continuar usando o Ark Deploy sem interrupções, por favor regularize seu pagamento o quanto antes.</p>
            
            <p>Caso já tenha efetuado o pagamento, desconsidere este email.</p>
            
            <a href="${process.env.FRONTEND_URL}/profile" class="button">Regularizar Pagamento</a>
            
            <p>Se tiver alguma dúvida, entre em contato conosco.</p>
            
            <p>Abraços,<br><strong>Equipe Ark Deploy</strong></p>
          </div>
          <div class="footer">
            <p>Ark Deploy - Seu código, salvo da tempestade</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '⚠️ Pagamento Atrasado - Ark Deploy',
      html,
    });
  }

  /**
   * Email com fatura de renovação (PIX/Boleto)
   */
  async sendRenewalInvoice(user: IUser, planName: string, amount: number, invoiceUrl: string, dueDate: Date): Promise<boolean> {
    const dueDateFormatted = dueDate.toLocaleDateString('pt-BR');
    const amountFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .highlight { color: #667eea; font-weight: bold; font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Fatura de Renovação</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${user.name}</strong>,</p>
            
            <p>Sua assinatura do plano <strong>${planName}</strong> está próxima da renovação!</p>
            
            <div class="info-box">
              <p><strong>📋 Detalhes da Cobrança:</strong></p>
              <p>Valor: <span class="highlight">${amountFormatted}</span></p>
              <p>Vencimento: <strong>${dueDateFormatted}</strong></p>
              <p>Plano: <strong>${planName}</strong></p>
            </div>
            
            <p>Como você utiliza <strong>PIX ou Boleto</strong>, geramos uma nova cobrança para você pagar e manter sua assinatura ativa.</p>
            
            <div style="text-align: center;">
              <a href="${invoiceUrl}" class="button">
                📄 Ver Fatura e Pagar
              </a>
            </div>
            
            <div class="info-box" style="border-left-color: #f59e0b;">
              <p><strong>⚠️ Importante:</strong></p>
              <ul>
                <li>Pague até <strong>${dueDateFormatted}</strong> para manter sua assinatura ativa</li>
                <li>Após o vencimento, sua assinatura será suspensa</li>
                <li>Você pode acessar a fatura a qualquer momento na página de Cobrança</li>
              </ul>
            </div>
            
            <p>Se preferir renovação automática, considere atualizar para pagamento com cartão de crédito.</p>
            
            <p>Qualquer dúvida, estamos à disposição!</p>
            
            <p>Atenciosamente,<br><strong>Equipe Ark Deploy</strong></p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `💳 Fatura de Renovação - ${planName}`,
      html,
    });
  }
}

export default new EmailService();
