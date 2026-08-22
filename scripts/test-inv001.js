const tests = [
  { start: 10000, monthly: 500, return: 0.06, fee: 0.0025, years: 20, expected: 250615.54 },
  { start: 10000, monthly: 500, return: 0.06, fee: 0, years: 20, expected: 258790.67 },
  { start: 50000, monthly: 0, return: 0.05, fee: 0.005, years: 10, expected: 77462.91 }
];

function tryFormulas() {
  for (const t of tests) {
    console.log(`\nTest expected: ${t.expected}`);
    let M = (1 + t.return) * (1 - t.fee);
    let m = Math.pow(M, 1/12) - 1;
    let b23 = t.start;
    for (let i = 1; i <= t.years * 12; i++) {
      b23 *= (1 + m);
      b23 += t.monthly;
    }
    console.log(`23: ${b23.toFixed(2)}`);
    
    // what if fee is only applied on the growth? no, (1+return)*(1-fee) is standard.
  }
}
tryFormulas();
