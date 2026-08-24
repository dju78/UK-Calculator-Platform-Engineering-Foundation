export interface AssetHolding {
  name: string;
  current_value: number;
  target_pct: number;
}

export interface RebalancingAction {
  name: string;
  current_value: number;
  current_pct: number;
  target_pct: number;
  target_value: number;
  trade_amount: number;
  action: "buy" | "sell" | "hold";
}

export interface RebalancingInputs {
  assets_json: string | AssetHolding[];
  cash_flow?: number;
  rebalance_mode?: "full" | "cash_only";
}

export interface RebalancingResult {
  current_total_value: number;
  post_rebalance_total_value: number;
  total_buys_amount: number;
  total_sells_amount: number;
  portfolio_drift_pct: number;
  rebalance_actions: RebalancingAction[];
}

export function rebalancePortfolio(inputs: RebalancingInputs): RebalancingResult {
  const rawAssets = inputs.assets_json;
  const assets: AssetHolding[] = typeof rawAssets === "string" ? JSON.parse(rawAssets) : rawAssets;
  const cashFlow = Number(inputs.cash_flow ?? 0);
  const mode = inputs.rebalance_mode ?? "full";

  const currentTotal = assets.reduce((sum, a) => sum + Number(a.current_value), 0);
  const newTotal = currentTotal + cashFlow;

  let totalDrift = 0;
  for (const a of assets) {
    const curPct = currentTotal > 0 ? (Number(a.current_value) / currentTotal) * 100 : 0;
    totalDrift += Math.abs(curPct - Number(a.target_pct));
  }
  const portfolioDriftPct = Math.round((totalDrift / 2) * 100) / 100;

  const actions: RebalancingAction[] = [];
  let totalBuys = 0;
  let totalSells = 0;

  if (mode === "full") {
    for (const a of assets) {
      const curVal = Number(a.current_value);
      const tgtPct = Number(a.target_pct);
      const tgtVal = Math.round(newTotal * (tgtPct / 100) * 100) / 100;
      const trade = Math.round((tgtVal - curVal) * 100) / 100;
      const curPct = currentTotal > 0 ? Math.round((curVal / currentTotal) * 10000) / 100 : 0;

      let actionType: "buy" | "sell" | "hold" = "hold";
      if (trade > 0.01) {
        actionType = "buy";
        totalBuys += trade;
      } else if (trade < -0.01) {
        actionType = "sell";
        totalSells += Math.abs(trade);
      }

      actions.push({
        name: a.name,
        current_value: curVal,
        current_pct: curPct,
        target_pct: tgtPct,
        target_value: tgtVal,
        trade_amount: Math.abs(trade),
        action: actionType
      });
    }
  } else {
    // Cash-only rebalancing (no selling)
    let availableCash = Math.max(0, cashFlow);
    const shortfalls = assets.map((a) => {
      const curVal = Number(a.current_value);
      const idealTarget = newTotal * (Number(a.target_pct) / 100);
      const shortfall = Math.max(0, idealTarget - curVal);
      return { ...a, curVal, shortfall };
    });

    const totalShortfall = shortfalls.reduce((sum, s) => sum + s.shortfall, 0);

    for (const s of shortfalls) {
      let allocatedBuy = 0;
      if (totalShortfall > 0 && availableCash > 0) {
        allocatedBuy = Math.min(availableCash, (s.shortfall / totalShortfall) * cashFlow);
      }
      allocatedBuy = Math.round(allocatedBuy * 100) / 100;
      totalBuys += allocatedBuy;

      const curPct = currentTotal > 0 ? Math.round((s.curVal / currentTotal) * 10000) / 100 : 0;
      actions.push({
        name: s.name,
        current_value: s.curVal,
        current_pct: curPct,
        target_pct: Number(s.target_pct),
        target_value: Math.round((s.curVal + allocatedBuy) * 100) / 100,
        trade_amount: allocatedBuy,
        action: allocatedBuy > 0 ? "buy" : "hold"
      });
    }
  }

  return {
    current_total_value: Math.round(currentTotal * 100) / 100,
    post_rebalance_total_value: Math.round(newTotal * 100) / 100,
    total_buys_amount: Math.round(totalBuys * 100) / 100,
    total_sells_amount: Math.round(totalSells * 100) / 100,
    portfolio_drift_pct: portfolioDriftPct,
    rebalance_actions: actions
  };
}
