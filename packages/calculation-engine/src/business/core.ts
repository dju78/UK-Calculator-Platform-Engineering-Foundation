export function grossProfit(cost: number, price: number): number {
  if (cost < 0 || price < 0 || isNaN(cost) || isNaN(price) || !isFinite(cost) || !isFinite(price)) throw new Error('Invalid inputs');
  return price - cost;
}

export function margin(cost: number, price: number): number {
  if (cost < 0 || price < 0 || isNaN(cost) || isNaN(price) || !isFinite(cost) || !isFinite(price)) throw new Error('Invalid inputs');
  if (price === 0) throw new Error('Invalid denominator: selling price cannot be zero');
  return (price - cost) / price;
}

export function markup(cost: number, price: number): number | null {
  if (cost < 0 || price < 0 || isNaN(cost) || isNaN(price) || !isFinite(cost) || !isFinite(price)) throw new Error('Invalid inputs');
  if (cost === 0) return null;
  return (price - cost) / cost;
}

export function requiredPriceForMargin(cost: number, targetMargin: number): number {
  if (cost < 0 || isNaN(cost) || !isFinite(cost) || isNaN(targetMargin) || !isFinite(targetMargin)) throw new Error('Invalid inputs');
  if (targetMargin >= 1) throw new Error('Target margin must be less than 100%');
  return cost / (1 - targetMargin);
}

export function contributionMargin(price: number, variableCost: number): number {
  if (price < 0 || variableCost < 0 || isNaN(price) || isNaN(variableCost) || !isFinite(price) || !isFinite(variableCost)) throw new Error('Invalid inputs');
  return price - variableCost;
}

export function breakEvenUnits(fixedCost: number, price: number, variableCost: number): number {
  if (fixedCost < 0 || isNaN(fixedCost) || !isFinite(fixedCost)) throw new Error('Invalid inputs');
  const cm = contributionMargin(price, variableCost);
  if (cm <= 0) throw new Error('No finite break-even');
  return Math.ceil(fixedCost / cm);
}

export function breakEvenRevenue(fixedCost: number, price: number, variableCost: number): number {
  const units = breakEvenUnits(fixedCost, price, variableCost);
  return units * price;
}

export function applyDiscount(original: number, discountRate: number): { discountAmount: number; salePrice: number } {
  if (original < 0 || isNaN(original) || !isFinite(original) || isNaN(discountRate) || !isFinite(discountRate)) throw new Error('Invalid inputs');
  if (discountRate < 0 || discountRate > 1) throw new Error('Discount rate must be between 0 and 1');
  const amount = original * discountRate;
  return {
    discountAmount: amount,
    salePrice: original - amount
  };
}

export function inferDiscount(original: number, salePrice: number): { discountRate: number; discountAmount: number } {
  if (original < 0 || salePrice < 0 || isNaN(original) || isNaN(salePrice) || !isFinite(original) || !isFinite(salePrice)) throw new Error('Invalid inputs');
  if (original === 0) throw new Error('Cannot infer discount when original price is zero');
  const amount = original - salePrice;
  return {
    discountRate: amount / original,
    discountAmount: amount
  };
}
