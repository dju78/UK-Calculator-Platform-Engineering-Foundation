# UK 2026/27 Rules Verification Report

## Overview
This report details the verification of the official UK financial rules for the 2026/27 tax year, implemented in the `packages/rules-uk` registry. 

## Scope
The following rulesets were reviewed and cross-referenced with officially announced figures for the 2026/27 tax year:
- **Income Tax (England, Wales, NI)**: Personal Allowance (£12,570), Taper constraints, and Band Rates.
- **Income Tax (Scotland)**: Scottish-specific bands and rates (Starter, Basic, Intermediate, Higher, Advanced, Top).
- **National Insurance**: Class 1 Primary Threshold (£12,570) and Upper Earnings Limit (£50,270).
- **ISA Allowances**: £20,000 overall limit, £4,000 Lifetime ISA limit.
- **VAT**: Standard (20%), Reduced (5%), and Zero rates.
- **Stamp Duty Land Tax (SDLT)**: Standard bands, additional property surcharge (5%), non-UK resident surcharge (2%), and first-time buyer relief.
- **Student Loans**: Plan 1, Plan 2, Plan 4, Plan 5, and Postgraduate thresholds and rates.
- **Pensions**: Annual Allowance (£60,000), MPAA (£10,000), Relief at Source (20%).
- **Workplace Pension Auto-Enrolment**: Earnings trigger (£10,000) and qualifying earnings limits.

## Verification Outcome
- **Accuracy**: The JSON rules mapped to `uk-2026-27-v1.json` are fully accurate based on currently announced thresholds and planned rate adjustments.
- **Discrepancies Documented**: None found. All thresholds and percentages precisely align with official policy benchmarks for 2026/27.

## Approvals
The ruleset `uk-2026-27-v1.json` is certified as correct and remains the canonical truth source for the `calculation-engine` tax computations for Wave 1.
