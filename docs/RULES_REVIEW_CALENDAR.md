# Rules Review Calendar

**Status:** Living document. The scheduling view of `RULES_MAINTENANCE_POLICY.md`.
**Created:** Professionalisation Phase 4, August 2026.

---

## What this document is

A maintenance schedule for a human to work through. It is **not** a claim of
automation: nothing in the platform fires these reviews on a timer, and no
process runs unattended. The review windows below are the times of year when UK
rules actually move, and the checklists are what to do when they do.

Two dates in the UK calendar are fixed in law or long-standing convention and
can be scheduled against: **6 April**, the start of the tax year, and the April
uprating of benefit and pension rates that accompanies it.

Everything else — Budgets, Autumn statements, emergency fiscal events — is
scheduled by government and announced in advance. **This calendar never
predicts a fiscal event date.** Entries below are triggered by announcement,
and the maintainer's obligation is to be watching, not to have guessed
correctly.

---

## Annual cycle

### Window 1 — Tax year preparation
**Runs from:** confirmation of the coming year's rates (usually at the autumn
fiscal event and in the HMRC and DWP publications that follow)
**Until:** 5 April

- [ ] Collect confirmed rates for the incoming tax year from Tier 1 sources
- [ ] Record source URL and date checked for every figure
- [ ] Author the incoming ruleset as a new version; retain the outgoing one
- [ ] Derive benchmark expectations independently from the new rates
- [ ] Update tax year labels, ruleset references and worked examples in content
- [ ] Refresh review dates on affected guides
- [ ] Run the full regression gate

### Window 2 — Tax year rollover
**Runs from:** 6 April
**Duration:** target completion within the first two weeks of the tax year

- [ ] Switch the active ruleset to the new year
- [ ] Verify every rule-sensitive calculator names the new tax year on the page
- [ ] Verify worked examples recompute correctly under the new ruleset
- [ ] Confirm review state for rule-sensitive content returns to `current`
- [ ] Run the full regression gate
- [ ] Publish an entry on `/updates`

### Window 3 — Benefit and pension uprating
**Runs from:** confirmation of uprating figures
**Applies from:** April, alongside the tax year rollover

- [ ] Child Benefit rates and the High Income Child Benefit Charge threshold
- [ ] State Pension rate and triple lock outcome
- [ ] Statutory payment rates
- [ ] National Minimum and Living Wage rates
- [ ] Pension allowances: annual, tapered, money purchase
- [ ] Verify against DWP and GOV.UK publications, not press summaries

### Window 4 — Autumn fiscal event
**Trigger:** government announcement of the event date. Do not assume one.

- [ ] Within five working days of the publication, review the documents against
      the annual checklist in the maintenance policy
- [ ] Classify each change: immediate / next tax year / no action
- [ ] Route immediate changes to the emergency procedure
- [ ] Route next-tax-year changes into Window 1
- [ ] Record the review, including a positive "no platform impact" finding
      where that is the outcome

### Window 5 — Spring fiscal event
**Trigger:** government announcement. Same procedure as Window 4.

Where a spring statement is presented as a forecast update with no rate
changes, the review is still performed and the nil finding recorded.

---

## Quarterly cycle

### Source link health review
**Runs:** quarterly

- [ ] Check every cited official source URL still resolves
- [ ] Check the successor page still supports the same claim where a URL has
      moved — a redirect is not proof the content survived
- [ ] Update citations and verification dates
- [ ] Mark unresolvable claims as requiring verification
- [ ] Escalate to the emergency procedure where a rule appears to have changed

### Provenance sweep
**Runs:** quarterly, alongside the link review

- [ ] List calculators whose review state has moved to `review-due`
- [ ] List calculators reporting `verification-required` and progress them
- [ ] Confirm no calculator reports a review date without a corresponding guide

---

## Annual, outside the tax cycle

### Health and clinical content review
**Runs:** annually

- [ ] Re-check NHS and NICE guidance cited by health calculators
- [ ] Confirm formulas and population thresholds still reflect current guidance
- [ ] Update or withdraw content where guidance has materially changed
- [ ] Confirm no content implies clinical review that has not taken place

### General content review
**Basis:** rolling 24-month cycle per guide, not a single annual sweep

- [ ] Re-read methodology and worked examples for continued accuracy
- [ ] Confirm assumptions and limitations still describe the model
- [ ] Refresh explanation where the platform has changed around it

### Governance page review
**Runs:** annually, or whenever the underlying position changes

- [ ] `/about`, `/editorial-policy`, `/how-we-check-our-figures`, `/contact`
- [ ] Confirm every factual claim is still true, particularly coverage figures,
      the advertising and affiliate position, and accessibility wording
- [ ] Regenerate the verification snapshot from an actual executed run and
      update its date

---

## Event-triggered reviews

| Trigger | Response time | Procedure |
| --- | --- | --- |
| Emergency fiscal statement | 5 working days | Maintenance policy §5 |
| In-year statutory rate change | 5 working days | Maintenance policy §5 |
| User report of a suspected rule error | Prioritised on receipt | Editorial corrections policy |
| Cited source withdrawn or replaced | Next quarterly sweep, or immediately if the rule appears changed | Maintenance policy §8 |
| External data provider change or outage | On detection | `FX_Operations_Runbook.md` |
| Devolved administration tax change | 5 working days | Maintenance policy §7 |

---

## Recording a review

Every review — including one that finds nothing — is recorded with:

- date performed and window or trigger;
- sources consulted, with URLs;
- figures checked;
- what changed, or an explicit nil finding;
- calculators affected;
- benchmark cases added or amended;
- regression gate outcome;
- whether a public `/updates` entry was published.

A recorded nil finding is evidence the check happened. An unrecorded review is
indistinguishable from one that was skipped.
