export function grossProfit(cost: number, price: number): number {
  return price - cost;
}

export function margin(cost: number, price: number): number {
  if (price === 0) return cost === 0 ? 0 : -Infinity;
  return (price - cost) / price;
}

export function markup(cost: number, price: number): number | null {
  if (cost === 0) return null;
  return (price - cost) / cost;
}

export function requiredPriceForMargin(cost: number, targetMargin: number): number {
  if (targetMargin >= 1) throw new Error('Target margin must be less than 100%');
  return cost / (1 - targetMargin);
}

export function contributionMargin(price: number, variableCost: number): number {
  return price - variableCost;
}

export function breakEvenUnits(fixedCost: number, price: number, variableCost: number): number {
  const cm = contributionMargin(price, variableCost);
  if (cm <= 0) throw new Error('No finite break-even');
  return Math.ceil(fixedCost / cm);
}

export function breakEvenRevenue(fixedCost: number, price: number, variableCost: number): number {
  const units = breakEvenUnits(fixedCost, price, variableCost);
  return units * price;
}

export function applyDiscount(original: number, discountRate: number): { discountAmount: number; salePrice: number } {
  const amount = original * discountRate;
  return {
    discountAmount: amount,
    salePrice: original - amount
  };
}

export function inferDiscount(original: number, salePrice: number): { discountRate: number; discountAmount: number } {
  if (original === 0) return { discountRate: 0, discountAmount: 0 };
  const amount = original - salePrice;
  return {
    discountRate: amount / original,
    discountAmount: amount
  };
}
