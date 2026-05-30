// ============================================================
// Nepal Tax Engine — Core (pure functions)
// ============================================================

import type {
  TaxInput,
  Regime,
  Slab,
  SlabComputation,
  RegimeResult,
} from "./types";

// ---------- formatting ----------
export const round2 = (n: number) => Math.round(n * 100) / 100;

export const npr = (n: number) =>
  "NPR " +
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(n)
  );

export const num = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(n)
  );

// ---------- income & deductions ----------
export function totalIncome(input: TaxInput): number {
  const { salary, bonus, allowance, otherIncome } = input.income;
  return Math.max(
    0,
    (salary || 0) + (bonus || 0) + (allowance || 0) + (otherIncome || 0)
  );
}

export function totalDeductions(input: TaxInput): number {
  const d = input.deductions;
  const sum =
    Math.max(0, d.ssf || 0) +
    Math.max(0, d.pf || 0) +
    Math.max(0, d.cit || 0) +
    Math.max(0, d.insurance || 0) +
    Math.max(0, d.donations || 0);
  return Math.max(0, sum);
}

// ---------- progressive slab calculator ----------
export function calculateSlabs(
  taxable: number,
  slabs: Slab[]
): { breakdown: SlabComputation[]; total: number } {
  let remaining = Math.max(0, taxable);
  let lower = 0;
  let total = 0;
  const breakdown: SlabComputation[] = [];

  for (const slab of slabs) {
    const upper = slab.limit === null ? null : lower + slab.limit;
    let taxableInBracket = 0;

    if (remaining > 0) {
      taxableInBracket =
        slab.limit === null ? remaining : Math.min(remaining, slab.limit);
    }
    const taxInBracket = taxableInBracket * slab.rate;
    total += taxInBracket;
    remaining -= taxableInBracket;

    breakdown.push({
      lower,
      upper,
      rate: slab.rate,
      taxableInBracket: round2(taxableInBracket),
      taxInBracket: round2(taxInBracket),
    });

    lower = upper ?? lower;
    if (slab.limit === null) break;
  }

  return { breakdown, total: round2(total) };
}

// ---------- regime computation ----------
export function calculateRegime(
  input: TaxInput,
  regime: Regime
): RegimeResult {
  const income = totalIncome(input);
  const deductions = totalDeductions(input);
  const taxableIncome = Math.max(0, income - deductions);

  // pick slab set
  let slabs =
    input.taxpayerType === "couple"
      ? regime.coupleSlabs
      : regime.individualSlabs;

  // SSF: first 1% (social security) slab becomes 0%
  if (input.contributingSSF && slabs.length > 0) {
    slabs = slabs.map((s, i) => (i === 0 ? { ...s, rate: 0 } : s));
  }

  const { breakdown, total } = calculateSlabs(taxableIncome, slabs);

  const months = input.months > 0 ? input.months : 12;
  const netYearly = income - total;

  return {
    regimeId: regime.id,
    regimeName: regime.name,
    totalIncome: round2(income),
    totalDeductions: round2(deductions),
    taxableIncome: round2(taxableIncome),
    slabs: breakdown,
    totalTaxYearly: round2(total),
    totalTaxMonthly: round2(total / months),
    netIncomeYearly: round2(netYearly),
    netIncomeMonthly: round2(netYearly / months),
    effectiveRate: income > 0 ? total / income : 0,
    months,
  };
}
