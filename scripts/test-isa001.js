const tests = [
  { start: 10000, annual_sub: 12000, return: 0.06, fee: 0.0025, years: 20, expected: 470725.78 },
  { start: 0, annual_sub: 20000, return: 0.05, fee: 0, years: 5, expected: 113022.9 },
  { start: 5000, annual_sub: 0, return: 0.05, fee: 0, years: 10, expected: 8144.47 },
  { start: 1000, annual_sub: 12000, return: 0, fee: 0, years: 2, expected: 25000.0 }
];

function tryFormulas() {
  for (const t of tests) {
    console.log(`\nTest expected: ${t.expected}`);
    let M = (1 + t.return) * (1 - t.fee);
    let m = Math.pow(M, 1/12) - 1;
    let b = t.start;
    let monthly = t.annual_sub / 12;
    for (let i = 1; i <= t.years * 12; i++) {
      b *= (1 + m);
      b += monthly;
    }
    console.log(`Monthly contrib: ${b.toFixed(2)}`);

    let b2 = t.start;
    for (let i = 1; i <= t.years; i++) {
      b2 *= M;
      b2 += t.annual_sub; // if annual contrib?
    }
    console.log(`Annual contrib: ${b2.toFixed(2)}`);
  }
}
tryFormulas();
