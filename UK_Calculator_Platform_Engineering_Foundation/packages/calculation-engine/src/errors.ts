export class CalculationValidationError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(issues.join("; "));
    this.name = "CalculationValidationError";
    this.issues = issues;
  }
}

export class CalculatorNotImplementedError extends Error {
  constructor(calculatorId: string) {
    super(`Calculator ${calculatorId} is specified but not implemented in this foundation build.`);
    this.name = "CalculatorNotImplementedError";
  }
}
