import { mean } from "./descriptive.js";

export function linearRegression(x: number[], y: number[]) {
  const n = x.length;
  if (n !== y.length) throw new Error("X and Y must have the same number of observations");
  if (n < 2) throw new Error("Linear regression requires at least 2 observations");

  const xMean = mean(x);
  const yMean = mean(y);

  let num = 0;
  let den = 0;
  let sst = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    num += xDiff * yDiff;
    den += xDiff * xDiff;
    sst += yDiff * yDiff;
  }

  if (den === 0) throw new Error("Regression not possible when X has zero variance");

  const slope = num / den;
  const intercept = yMean - slope * xMean;

  let sse = 0;
  const predicted: number[] = [];
  const residuals: number[] = [];

  for (let i = 0; i < n; i++) {
    const yPred = intercept + slope * x[i];
    const residual = y[i] - yPred;
    predicted.push(yPred);
    residuals.push(residual);
    sse += residual * residual;
  }

  const ssr = sst - sse;
  const r2 = sst === 0 ? 1 : Math.max(0, Math.min(1, 1 - (sse / sst))); // Clamp floating point issues
  const r = (num >= 0 ? 1 : -1) * Math.sqrt(r2);
  
  const residual_se = n > 2 ? Math.sqrt(sse / (n - 2)) : 0;

  return {
    n,
    slope,
    intercept,
    r2,
    r,
    predicted,
    residuals,
    residual_se
  };
}
