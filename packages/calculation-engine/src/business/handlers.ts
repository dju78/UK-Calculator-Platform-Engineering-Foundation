import { NumericInputs } from '../types.js';
import * as core from './core.js';

export function bus001Handler(inputs: NumericInputs) {
  const cost = Number(inputs.cost);
  if ('price' in inputs) {
    const price = Number(inputs.price);
    const profit = core.grossProfit(cost, price);
    const margin = core.margin(cost, price);
    const markup = core.markup(cost, price);
    return {
      outputs: {
        profit,
        margin,
        markup
      }
    };
  } else if ('target_margin' in inputs) {
    const targetMargin = Number(inputs.target_margin);
    const requiredPrice = core.requiredPriceForMargin(cost, targetMargin);
    return {
      outputs: {
        required_price: requiredPrice
      }
    };
  }
  throw new Error('Invalid inputs for Margin Calculator');
}

export function bus006Handler(inputs: NumericInputs) {
  const fixed = Number(inputs.fixed);
  const price = Number(inputs.price);
  const variable = Number(inputs.variable);
  
  try {
    const contribution = core.contributionMargin(price, variable);
    const units = core.breakEvenUnits(fixed, price, variable);
    const revenue = core.breakEvenRevenue(fixed, price, variable);
    return {
      outputs: {
        contribution,
        break_even_units: units,
        break_even_revenue: revenue
      }
    };
  } catch (e: any) {
    return {
      outputs: {
        validation: e.message
      }
    };
  }
}

export function bus008Handler(inputs: NumericInputs) {
  const original = Number(inputs.original);
  
  if ('discount' in inputs) {
    const discount = Number(inputs.discount);
    const result = core.applyDiscount(original, discount);
    return {
      outputs: {
        discount_amount: result.discountAmount,
        sale_price: result.salePrice
      }
    };
  } else if ('sale_price' in inputs) {
    const salePrice = Number(inputs.sale_price);
    const result = core.inferDiscount(original, salePrice);
    return {
      outputs: {
        discount_rate: result.discountRate,
        discount_amount: result.discountAmount
      }
    };
  }
  throw new Error('Invalid inputs for Discount Calculator');
}

