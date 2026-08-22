export function calculateEffectiveApr(periodicRate: number, periods: number): number {
  if (periodicRate === 0) return 0;
  return Math.pow(1 + periodicRate, periods) - 1;
}

export interface CreditCardPayoffResult {
  months: number;
  totalInterest: number;
}

export function calculateCreditCardPayoff(balance: number, apr: number, monthlyPayment: number): CreditCardPayoffResult {
  if (balance <= 0) return { months: 0, totalInterest: 0 };
  
  const monthlyRate = apr / 12;
  
  if (apr > 0 && monthlyPayment <= balance * monthlyRate) {
    return { months: Infinity, totalInterest: Infinity };
  }
  
  let currentBalance = balance;
  let totalInterest = 0;
  let months = 0;
  const MAX_ITERATIONS = 1200;

  while (currentBalance > 0.005 && months < MAX_ITERATIONS) {
    const interest = currentBalance * monthlyRate;
    totalInterest += interest;
    currentBalance += interest;
    
    if (currentBalance <= monthlyPayment) {
      months++;
      currentBalance = 0;
      break;
    }
    
    currentBalance -= monthlyPayment;
    months++;
  }

  return { months, totalInterest };
}

export interface Debt {
  balance: number;
  apr: number;
  min_payment: number;
}

export interface DebtPayoffResult {
  months: number;
  totalInterest: number;
}

export function calculateDebtPayoff(debts: Debt[], extra: number, strategy: "avalanche" | "snowball"): DebtPayoffResult {
  if (debts.length === 0) return { months: 0, totalInterest: 0 };

  const activeDebts = debts.map((d, i) => ({ ...d, id: i })).filter(d => d.balance > 0);
  
  if (activeDebts.length === 0) return { months: 0, totalInterest: 0 };

  const totalMinPayment = activeDebts.reduce((sum, d) => sum + d.min_payment, 0);
  const totalMonthlyPayment = totalMinPayment + extra;

  const MAX_ITERATIONS = 1200;
  let months = 0;
  let totalInterest = 0;
  
  while (activeDebts.length > 0 && months < MAX_ITERATIONS) {
    months++;
    
    if (strategy === "avalanche") {
      activeDebts.sort((a, b) => b.apr - a.apr);
    } else {
      activeDebts.sort((a, b) => a.balance - b.balance);
    }

    let remainingPaymentAvailable = totalMonthlyPayment;

    // First apply interest and deduct min payments
    for (const debt of activeDebts) {
      const interest = debt.balance * (debt.apr / 12);
      totalInterest += interest;
      debt.balance += interest;
      
      // Ensure we at least pay min_payment on each active debt if possible
      // But if debt is smaller than min_payment, we just pay it off
      const minPay = Math.min(debt.min_payment, debt.balance);
      debt.balance -= minPay;
      remainingPaymentAvailable -= minPay;
    }

    // Now distribute any remainingPaymentAvailable to highest priority
    for (let i = 0; i < activeDebts.length; i++) {
      const debt = activeDebts[i];
      if (remainingPaymentAvailable <= 0) break;
      
      if (remainingPaymentAvailable >= debt.balance) {
        remainingPaymentAvailable -= debt.balance;
        debt.balance = 0;
      } else {
        debt.balance -= remainingPaymentAvailable;
        remainingPaymentAvailable = 0;
      }
    }

    for (let i = activeDebts.length - 1; i >= 0; i--) {
      if (activeDebts[i].balance <= 0.005) {
        activeDebts.splice(i, 1);
      }
    }
  }

  return { months, totalInterest };
}

export interface BudgetResult {
  surplus: number;
  savingsRate: number | null;
}

export function calculateBudget(income: number, fixed: number, variable: number, savings: number): BudgetResult {
  const surplus = income - fixed - variable - savings;
  const savingsRate = income > 0 ? savings / income : null;
  
  return { surplus, savingsRate };
}
