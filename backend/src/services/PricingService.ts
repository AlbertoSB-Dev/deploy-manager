import { IPlan } from '../models/Plan';

export interface PricingCalculation {
  pricePerServer: number;
  quantity: number;
  discountPercent: number;
  subtotal: number;
  discount: number;
  total: number;
}

export class PricingService {
  /**
   * Calcula o preço total com desconto por quantidade
   */
  static calculatePrice(plan: IPlan, quantity: number): PricingCalculation {
    // Encontrar a faixa de desconto aplicável
    let discountPercent = 0;

    if (plan.discountTiers && plan.discountTiers.length > 0) {
      // Ordenar as faixas por minServers em ordem decrescente
      const sortedTiers = [...plan.discountTiers].sort(
        (a, b) => b.minServers - a.minServers
      );

      // Encontrar a faixa aplicável (a maior que é <= quantity)
      for (const tier of sortedTiers) {
        if (quantity >= tier.minServers) {
          discountPercent = tier.discountPercent;
          break;
        }
      }
    }

    const subtotal = plan.pricePerServer * quantity;
    const discount = (subtotal * discountPercent) / 100;
    const total = subtotal - discount;

    return {
      pricePerServer: plan.pricePerServer,
      quantity,
      discountPercent,
      subtotal,
      discount,
      total,
    };
  }

  /**
   * Formata o cálculo de preço para exibição
   */
  static formatPricing(calculation: PricingCalculation): string {
    const { pricePerServer, quantity, discountPercent, subtotal, discount, total } = calculation;

    let result = `R$ ${pricePerServer.toFixed(2)} × ${quantity} = R$ ${subtotal.toFixed(2)}`;

    if (discountPercent > 0) {
      result += ` - ${discountPercent}% desconto (R$ ${discount.toFixed(2)}) = R$ ${total.toFixed(2)}`;
    }

    return result;
  }
}
