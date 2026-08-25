export interface MonteCarloInputs {
  initial_investment: number;
  annual_contribution?: number;
  annual_withdrawal?: number;
  expected_return_pct: number;
  volatility_pct: number;
  horizon_years: number;
  simulations_count?: number;
  target_wealth?: number;
  seed?: number;
}

export interface MonteCarloResult {
  median_terminal_wealth: number;
  percentile_10th: number;
  percentile_25th: number;
  percentile_75th: number;
  percentile_90th: number;
  probability_of_reaching_target_pct: number;
  probability_of_ruin_pct: number;
  expected_mean_wealth: number;
}

// Linear Congruential Generator for deterministic seeded randomness
class SeededRandom {
  private state: number;
  constructor(seed: number = 123456789) {
    this.state = seed;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }
  // Box-Muller transform for standard normal random variables
  nextGaussian(): number {
    let u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

export function simulateMonteCarlo(inputs: MonteCarloInputs): MonteCarloResult {
  const initial = Number(inputs.initial_investment);
  const contribution = Number(inputs.annual_contribution ?? 0);
  const withdrawal = Number(inputs.annual_withdrawal ?? 0);
  const mu = Number(inputs.expected_return_pct) / 100;
  const sigma = Math.max(0.0001, Number(inputs.volatility_pct) / 100);
  const years = Math.max(1, Number(inputs.horizon_years));
  const simCount = Math.min(5000, Math.max(100, Number(inputs.simulations_count ?? 1000)));
  const target = Number(inputs.target_wealth ?? 0);

  const rng = new SeededRandom(inputs.seed ?? 123456789);
  const terminalBalances: number[] = [];
  let successCount = 0;
  let ruinCount = 0;
  let sumTerminal = 0;

  for (let s = 0; s < simCount; s++) {
    let balance = initial;
    let ruined = false;

    for (let y = 1; y <= years; y++) {
      const z = rng.nextGaussian();
      const annualReturn = Math.exp((mu - 0.5 * sigma * sigma) + sigma * z) - 1;

      balance = balance * (1 + annualReturn) + contribution - withdrawal;
      if (balance <= 0) {
        balance = 0;
        ruined = true;
        break;
      }
    }

    terminalBalances.push(balance);
    sumTerminal += balance;
    if (ruined) ruinCount++;
    if (balance >= target && target > 0) successCount++;
  }

  terminalBalances.sort((a, b) => a - b);

  function getPercentile(p: number): number {
    const idx = (p / 100) * (terminalBalances.length - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    const weight = idx - low;
    return terminalBalances[low] * (1 - weight) + terminalBalances[high] * weight;
  }

  const probSuccess = target > 0 ? (successCount / simCount) * 100 : (1 - ruinCount / simCount) * 100;
  const probRuin = (ruinCount / simCount) * 100;

  return {
    median_terminal_wealth: Math.round(getPercentile(50) * 100) / 100,
    percentile_10th: Math.round(getPercentile(10) * 100) / 100,
    percentile_25th: Math.round(getPercentile(25) * 100) / 100,
    percentile_75th: Math.round(getPercentile(75) * 100) / 100,
    percentile_90th: Math.round(getPercentile(90) * 100) / 100,
    probability_of_reaching_target_pct: Math.round(probSuccess * 10) / 10,
    probability_of_ruin_pct: Math.round(probRuin * 10) / 10,
    expected_mean_wealth: Math.round((sumTerminal / simCount) * 100) / 100
  };
}
