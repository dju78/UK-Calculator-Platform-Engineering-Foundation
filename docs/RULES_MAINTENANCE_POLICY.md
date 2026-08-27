# Rules Maintenance Policy

**Status:** Living document. Supersedes nothing; complements `Annual_Tax_Year_Update_Runbook.md`, which remains the step-by-step procedure for the April rollover.
**Owner:** Platform maintainer (Jomovate).
**Created:** Professionalisation Phase 4, August 2026.

---

## 1. Purpose and scope

This policy governs how the UK Calculator Platform keeps its rule-sensitive
calculators correct as UK legislation, rates and official guidance change.

It covers:

- statutory rates, thresholds, bands and allowances;
- benefit and pension figures;
- devolved property taxes and Income Tax variations;
- the official sources those figures are evidenced against;
- the benchmark and regression obligations that any rules change must satisfy.

It does **not** cover general mathematical, scientific or conversion
calculators, whose methods do not move with legislation. Those are subject to
the periodic review cycle in §9 only.

**Scope figure.** As at the Phase 4 verification snapshot, 51 of the 253
published calculators are flagged `rulesSensitive` in the registry. That flag
is the authoritative definition of "in scope for this policy": it is set per
calculator in the registry and consumed directly by the provenance layer, so
this document and the code cannot disagree about which calculators are covered.

---

## 2. Governing principles

1. **A rules change is a deliberate change, never a side effect.** Rates live
   in versioned rule data tied to a named tax year. Editing a threshold is a
   reviewable act with its own evidence, not a number quietly adjusted inside
   a calculation.
2. **Primary sources are mandatory.** Every statutory value must be evidenced
   by a Tier 1 primary official source under the published source hierarchy.
   A secondary explainer, a search-result snippet, a press summary or an
   AI-generated answer is never sufficient evidence for a statutory figure.
3. **Expected values are derived independently.** A benchmark expectation is
   worked out from the rule itself. It is never produced by running the new
   code and recording the output — a benchmark generated from the
   implementation cannot detect an error in that implementation.
4. **Approved benchmark values are fixed.** When code and benchmark disagree,
   one of them is proved wrong. An expected value is never edited to make a
   failing test pass.
5. **Tolerances are never weakened, and tests are never deleted to go green.**
6. **If it cannot be verified, it is not published as verified.** An
   unverifiable figure is marked as requiring verification and shown that way
   on the page.

---

## 3. Annual UK tax year rollover

The largest and most predictable event. The UK tax year begins on **6 April**.

**Preparation window — from the announcement of the following year's rates
until 5 April.** Rates for the coming year are usually confirmed well in
advance, at a Budget or Autumn fiscal event and in subsequent HMRC and DWP
publications.

Work in the preparation window:

1. Collect confirmed rates for the incoming year from Tier 1 sources, and
   record the source URL and the date checked against each figure.
2. Author the incoming ruleset as a **new version** alongside the outgoing
   one. The prior year's ruleset is retained, not overwritten: historical
   figures remain reproducible, and a rollover defect can be diagnosed by
   comparison.
3. Derive benchmark expectations for the new year independently from the new
   rates, before touching engine code.
4. Update affected calculator content: the tax year named on the page, the
   ruleset the guide states its figures against, worked examples, and the
   review date.
5. Run the full regression gate (§10).

**Rollover — on or shortly after 6 April.** Switch the active ruleset. Confirm
that every rule-sensitive calculator names the new tax year, that worked
examples recompute correctly, and that the review status of rule-sensitive
content moves back to current.

**Items that must be re-checked every year, without exception:**

- Income Tax bands, rates and Personal Allowance, including the taper
- Scottish Income Tax bands and rates
- Welsh rates of Income Tax
- National Insurance thresholds and rates, employee and employer
- Dividend rates and the dividend allowance
- Capital Gains Tax rates and the annual exempt amount
- ISA and Lifetime ISA subscription limits
- Pension annual allowance, taper, money purchase annual allowance and lifetime
  allowance successor rules
- Student loan repayment thresholds and rates, by plan
- Child Benefit rates and the High Income Child Benefit Charge threshold
- National Minimum and Living Wage rates
- Statutory payment rates (sick, maternity and related)
- VAT registration and deregistration thresholds
- Corporation Tax rates, the small profits rate and marginal relief
- SDLT, LBTT and LTT bands and surcharges

---

## 4. Budgets and fiscal events

Budgets and other fiscal statements are the main source of unscheduled change.
Their dates are set by government and announced in advance; **this policy never
assumes a date**. The trigger is the announcement, not the calendar.

On a fiscal event:

1. Within five working days, review the published documents against the list in
   §3 and record which figures changed, which take effect immediately, and
   which take effect at the start of a future tax year.
2. Classify each change as **immediate**, **next tax year**, or **no action**.
3. Immediate changes follow §5. Next-tax-year changes enter the preparation
   window in §3.
4. Record the review in the review calendar, including a positive "no change
   affecting the platform" finding where that is the outcome. A recorded
   negative is evidence that the check happened.

Announcements are not implemented from press coverage. Wait for the primary
publication.

---

## 5. Emergency and mid-year changes

Some changes take effect immediately or mid-year — an in-year National
Insurance change, an emergency fiscal statement, or a correction issued by
HMRC.

Procedure:

1. **Confirm** the change and its effective date against a Tier 1 source.
2. **Assess exposure**: list every affected calculator by id, and decide
   whether the current output is materially wrong or merely imprecise.
3. **Decide on interim disclosure.** Where a fix cannot ship promptly and the
   output is materially wrong, say so on the affected pages rather than
   leaving a confidently wrong figure standing. Marking a figure as requiring
   verification is preferable to silence.
4. **Implement on an isolated branch** covering the rules change only. Rules
   corrections are not bundled with unrelated feature work; a correction must
   be reviewable and revertible on its own.
5. **Derive new benchmark expectations independently**, add regression cases
   that pin the corrected behaviour, and keep cases covering the prior year
   where the prior ruleset is retained.
6. **Run the full regression gate** (§10).
7. **Record it publicly** on `/updates`, naming the calculators affected.

The TAX-013 dividend-rate and TAX-019 Child Benefit corrections are the worked
precedents for this procedure.

---

## 6. Pensions, benefits and uprating

**Benefit uprating.** Benefit rates are normally reviewed annually and
confirmed ahead of the April uprating. Confirmed figures are collected in the
same preparation window as the tax rollover, from DWP and GOV.UK publications.

**Pension rules.** Reviewed at least annually, and on any announced change, for:

- annual allowance, tapered annual allowance and money purchase annual
  allowance;
- tax relief rates and the relief method modelled;
- the rules governing tax-free lump sums and their limits;
- State Pension age, the new State Pension rate and the triple lock outcome;
- minimum pension access age.

Pension rules change more often than their apparent stability suggests, and a
projection built on a superseded allowance is wrong in a way users cannot see.
Where a pension rule is subject to announced future change, the guide says so
rather than projecting silently under today's rule.

---

## 7. Property taxes across the UK nations

Property transaction tax is devolved and diverges materially:

| Nation | Tax | Authority |
| --- | --- | --- |
| England and Northern Ireland | Stamp Duty Land Tax (SDLT) | HMRC / GOV.UK |
| Scotland | Land and Buildings Transaction Tax (LBTT) | Revenue Scotland |
| Wales | Land Transaction Tax (LTT) | Welsh Revenue Authority |

Each is reviewed against **its own** authority. Revenue Scotland is the source
for LBTT; a GOV.UK page describing SDLT is not. Bands, additional-dwelling
surcharges, first-time-buyer relief and non-resident surcharges are checked
separately per nation, and a change in one nation never propagates to another
by assumption.

The same principle applies to Income Tax: Scottish bands and Welsh rates are
verified against Scottish and Welsh sources.

---

## 8. External data, sources and deprecation

**External data providers.** Where a calculator depends on live external data —
currently foreign exchange rates — the provider's availability, response shape
and rate limits are monitored, and failure is handled visibly rather than by
substituting a stale figure silently. See `FX_Provider_Architecture.md` and
`FX_Operations_Runbook.md`.

**Source link health.** Cited official source URLs are checked quarterly (§9).
Government pages are reorganised regularly and a dead citation undermines
every other claim on the page.

**Source deprecation.** When a cited source is withdrawn, moved or replaced:

1. Locate the successor page on the same official domain.
2. Confirm the successor still supports the same claim — a redirect is not
   proof that the content survived.
3. Update the citation and its verification date.
4. Where no successor exists, mark the claim as requiring verification and
   escalate under §5 if the underlying rule appears to have changed.

**Conflicting sources.** Legislation outranks departmental guidance, which
outranks explanatory material. Where two Tier 1 sources genuinely conflict, the
figure is treated as unresolved and marked as requiring verification until it
is settled. It is never resolved by preferring the more convenient answer.

**Health and clinical guidance.** Health calculators cite NHS or NICE guidance
and are reviewed annually. Where clinical guidance changes materially, the
affected content is updated or withdrawn. The platform does not claim clinical
review by named practitioners.

---

## 9. Periodic review cycle

| Content type | Review trigger | Basis |
| --- | --- | --- |
| Rules-sensitive calculators | Start of each UK tax year (6 April) | Figures go stale when the law changes, not on a rolling anniversary |
| General calculators and guides | Fixed 24-month cycle | Catches link rot and drifting explanation |
| Cited source URLs | Quarterly | Government pages move often |
| Health and clinical content | Annually | Clinical guidance revision cycle |
| Fiscal events | On announcement | Unscheduled by nature |

Review state is **derived**, not hand-maintained: it is computed from the
review date and ruleset recorded in the editorial content itself. A calculator
therefore cannot carry a review date for a review nobody performed, and a
review that falls due surfaces automatically rather than waiting for someone to
remember. States are `current`, `review-due`, `verification-required` and
`not-yet-reviewed`.

---

## 10. Regression gate before any rules release

Every change to statutory rules or rule-sensitive content must pass, in order:

1. Root type check and workspace build
2. Web type check
3. Full unit, content, SEO and governance suite
4. Reference benchmark suite — all cases, no skips
5. Lint
6. Web production build
7. Browser and parity suite
8. Automated accessibility scan — no new serious or critical findings

Additional requirements specific to rules work:

- Expected values derived **independently** of the implementation, with the
  derivation recorded.
- Regression cases pinning the corrected behaviour, so the same defect cannot
  return unnoticed.
- Protection diffs reviewed before release, confirming no unintended change to
  `packages/calculation-engine`, `packages/test-fixtures`, `packages/rules-uk`
  or `packages/calculator-registry`.
- A public entry on `/updates` where a published result changed.

A release that cannot satisfy this gate does not ship. Weakening a tolerance,
deleting a test or editing an approved expected value to reach green is
prohibited without exception — those are the actions that would make every
other assurance on this platform meaningless.

---

## 11. Records

Each rules review records: the date, the trigger, the sources consulted with
their URLs, the figures checked, what changed, the calculators affected, the
benchmark cases added or amended, and the outcome of the regression gate. A
review that finds no change is recorded as such.

Related documents:

- `RULES_REVIEW_CALENDAR.md` — the scheduling view of this policy
- `Annual_Tax_Year_Update_Runbook.md` — step-by-step April rollover procedure
- `UK_2026_27_Rules_Verification_Report.md` — current-year verification record
- `RULES_2026_27_CORRECTION_AUDIT.md` — the TAX-013 and TAX-019 correction record
