// ============================================================
// Nepal Tax Engine — Core (pure functions)
// ============================================================

import type {
  TaxInput,
  Regime,
  Slab,
  SlabComputation,
  RegimeResult,
  DeductionComputation,
} from "./types";

// ---------- formatting ----------
export const round2 = (n: number) => Math.round(n * 100) / 100;

const convertToDevanagari = (numStr: string): string => {
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return numStr.replace(/[0-9]/g, (digit) => devanagariDigits[parseInt(digit)]);
};

export const npr = (n: number, language: string = 'en', currency: string = 'NPR') => {
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));
  const displayNum = language === 'ne' ? convertToDevanagari(formatted) : formatted;
  return `${currency} ${displayNum}`;
};

export const num = (n: number, language: string = 'en') => {
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));
  return language === 'ne' ? convertToDevanagari(formatted) : formatted;
};

// ---------- income & deductions ----------
export function totalIncome(input: TaxInput): number {
  const { salary, bonus, allowance, otherIncome } = input.income;
  return Math.max(
    0,
    (salary || 0) + (bonus || 0) + (allowance || 0) + (otherIncome || 0)
  );
}

export function totalDeductions(input: TaxInput): number {
  return calculateAllowedDeductions(totalIncome(input), input).total;
}

export function calculateAllowedDeductions(
  incomeBeforeRetirementDeduction: number,
  input: TaxInput
): { breakdown: DeductionComputation[]; total: number } {
  const d = input.deductions;
  const retirementEntered =
    Math.max(0, d.ssf || 0) +
    Math.max(0, d.pf || 0) +
    Math.max(0, d.cit || 0);
  const retirementLimit = Math.min(
    retirementEntered,
    Math.max(0, incomeBeforeRetirementDeduction) / 3,
    500_000
  );
  const lifeEntered = Math.max(0, d.insurance || 0);
  const medicalEntered = Math.max(0, d.medicalInsurance || 0);
  const donationsEntered = Math.max(0, d.donations || 0);

  const breakdown: DeductionComputation[] = [
    {
      key: "retirement",
      label: "Retirement fund",
      entered: round2(retirementEntered),
      allowed: round2(retirementLimit),
      capped: retirementLimit < retirementEntered,
    },
    {
      key: "lifeInsurance",
      label: "Life insurance",
      entered: round2(lifeEntered),
      allowed: round2(Math.min(lifeEntered, 40_000)),
      capped: lifeEntered > 40_000,
    },
    {
      key: "medicalInsurance",
      label: "Medical insurance",
      entered: round2(medicalEntered),
      allowed: round2(Math.min(medicalEntered, 20_000)),
      capped: medicalEntered > 20_000,
    },
    {
      key: "donations",
      label: "Donations",
      entered: round2(donationsEntered),
      allowed: round2(donationsEntered),
      capped: false,
    },
  ];

  return {
    breakdown,
    total: round2(breakdown.reduce((sum, item) => sum + item.allowed, 0)),
  };
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
  const { breakdown: deductionBreakdown, total: deductions } =
    calculateAllowedDeductions(income, input);
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

  const { breakdown, total: grossTax } = calculateSlabs(taxableIncome, slabs);
  const femaleTaxCredit = input.isFemaleOnlyRemuneration
    ? Math.min(grossTax * 0.1, grossTax)
    : 0;
  const totalCredits = femaleTaxCredit;
  const total = Math.max(0, grossTax - totalCredits);

  const months = input.months > 0 ? input.months : 12;
  const netYearly = income - total;

  return {
    regimeId: regime.id,
    regimeName: regime.name,
    totalIncome: round2(income),
    totalDeductions: round2(deductions),
    taxableIncome: round2(taxableIncome),
    slabs: breakdown,
    deductionBreakdown,
    grossTaxYearly: round2(grossTax),
    femaleTaxCredit: round2(femaleTaxCredit),
    totalCredits: round2(totalCredits),
    totalTaxYearly: round2(total),
    totalTaxMonthly: round2(total / months),
    netIncomeYearly: round2(netYearly),
    netIncomeMonthly: round2(netYearly / months),
    effectiveRate: income > 0 ? total / income : 0,
    months,
  };
}
