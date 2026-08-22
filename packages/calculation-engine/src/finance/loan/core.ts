export function calculatePmt(principal: number, annualRate: number, years: number, type: "repayment" | "interest-only" = "repayment"): number {
  if (annualRate === 0) {
    return type === "repayment" ? principal / (years * 12) : 0;
  }
  const r = annualRate / 12;
  const n = years * 12;
  
  if (type === "interest-only") {
    return principal * r;
  }

  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export interface AmortisationResult {
  schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
  totalInterest: number;
  payoffMonths: number;
}

export function calculateAmortisation(
  principal: number,
  annualRate: number,
  years: number,
  monthlyOverpayment: number = 0,
  lumpSum: number = 0,
  lumpMonth: number = 1
): AmortisationResult {
  const r = annualRate / 12;
  const n = years * 12;
  const pmt = calculatePmt(principal, annualRate, years, "repayment");
  
  let balance = principal;
  let totalInterest = 0;
  const schedule = [];
  
  for (let month = 1; month <= n; month++) {
    if (balance <= 0) break;

    let interest = balance * r;
    
    // Apply lump sum
    let payment = pmt + monthlyOverpayment;
    if (month === lumpMonth) {
      payment += lumpSum;
    }
    
    // Check if this payment overpays the remaining balance
    if (payment > balance + interest) {
      payment = balance + interest;
    }
    
    let principalPayment = payment - interest;
    if (annualRate === 0) {
      interest = 0;
      principalPayment = payment;
    }
    
    balance -= principalPayment;
    if (balance < 0.005) { // rounding tolerance
      balance = 0;
    }
    
    totalInterest += interest;
    
    schedule.push({
      month,
      payment,
      principal: principalPayment,
      interest,
      balance
    });
  }

  return {
    schedule,
    totalInterest,
    payoffMonths: schedule.length
  };
}
