/**
 * Standing disclaimer shown on every calculator page.
 *
 * The wording is chosen per category so it names the right kind of
 * professional. A single finance-only sentence appeared on the BMI calculator
 * too, which is the wrong disclaimer for a health tool.
 *
 * Nothing here claims to be advice, and nothing claims professional or legal
 * approval that has not taken place.
 */
export function DisclaimerBanner({ category }: { category?: string } = {}) {
  const key = (category ?? "").toLowerCase();

  let body =
    "This calculator provides an estimate based on the information you enter. It is not professional advice. Always consult a qualified professional before making a decision.";

  if (key.includes("health")) {
    body =
      "This calculator provides a general estimate based on the information you enter. It is not medical advice and does not account for age, build, ethnicity, pregnancy, muscle mass or medical conditions. Speak to a GP or another qualified healthcare professional about your health.";
  } else if (key.includes("tax") || key.includes("salary")) {
    body =
      "This calculator provides an estimate based on the information you enter and published 2026/27 UK rules. It is an annual estimate, not a payslip or a tax return, and it is not tax advice. Consult a qualified tax adviser or check GOV.UK for your circumstances.";
  } else if (key.includes("pension") || key.includes("isa") || key.includes("invest")) {
    body =
      "This calculator provides an illustrative projection based on the information you enter and the assumptions shown. Investment returns are not guaranteed and past performance does not predict future results. It is not financial or investment advice; consider speaking to a regulated financial adviser.";
  } else if (key.includes("mortgage") || key.includes("property")) {
    body =
      "This calculator provides an estimate based on the information you enter. It is not a mortgage illustration, a lending decision or advice, and lenders apply their own affordability rules and stress tests. Consult a qualified mortgage adviser.";
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4" role="note">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-amber-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> {body}
          </p>
        </div>
      </div>
    </div>
  );
}
