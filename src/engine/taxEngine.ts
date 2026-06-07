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
  VariableTaxInput,
  MonthlyInputRow,
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

export interface MonthlyResultRow {
  monthName: string;
  basicSalary: number;
  ssf: number;
  pf: number;
  cit: number;
  tds: number;
  netSalary: number;
}

export interface VariableRegimeResult {
  monthlyRows: MonthlyResultRow[];
  totalGrossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  totalTax: number;
  netTakeHome: number;
  regimeResult: RegimeResult; // final annual projection/total regime result
}

export function calculateVariableTDS(
  input: VariableTaxInput,
  regime: Regime
): VariableRegimeResult {
  const monthsData = input.monthsData;
  const numMonths = monthsData.length;
  
  let cumulativeBasic = 0;
  let cumulativeSSF = 0;
  let cumulativePF = 0;
  let cumulativeCIT = 0;
  
  const monthlyRows: MonthlyResultRow[] = [];
  let sumTdsPaid = 0;

  for (let idx = 0; idx < numMonths; idx++) {
    const m = idx + 1;
    const row = monthsData[idx];
    
    cumulativeBasic += row.basicSalary;
    cumulativeSSF += row.ssf;
    cumulativePF += row.pf;
    cumulativeCIT += row.cit;
    
    // Project annual values based on current month's salary for the remaining months
    const remaining = 12 - m;
    const projectedSalary = cumulativeBasic + (row.basicSalary * remaining);
    
    // Allowance and bonus are annual — always use the full annual figure in projection
    const projectedAllowance = input.annualAllowance;
    const projectedBonus = input.annualBonus;
    
    const projectedSSF = cumulativeSSF + (row.ssf * remaining);
    const projectedPF = cumulativePF + (row.pf * remaining);
    const projectedCIT = cumulativeCIT + (row.cit * remaining);
    
    // Build projected annual TaxInput
    const projectedInput: TaxInput = {
      fiscalYear: input.fiscalYear,
      taxpayerType: input.taxpayerType,
      contributingSSF: input.contributingSSF,
      isFemaleOnlyRemuneration: input.isFemaleOnlyRemuneration,
      months: 12,
      income: {
        salary: projectedSalary,
        allowance: projectedAllowance,
        bonus: projectedBonus,
        otherIncome: input.otherIncome,
      },
      deductions: {
        ssf: projectedSSF,
        pf: projectedPF,
        cit: projectedCIT,
        insurance: input.insurance,
        medicalInsurance: input.medicalInsurance,
        donations: input.donations,
      }
    };
    
    // Calculate projected annual tax
    const annualRes = calculateRegime(projectedInput, regime);
    
    // Distribute remaining projected tax equally across remaining months (including current).
    // This ensures a salary increase doesn't cause a spike — the extra burden is
    // spread evenly from the month of change through to Ashadh.
    const remainingMonths = 12 - m + 1; // months left including this one
    const remainingTax = Math.max(0, annualRes.totalTaxYearly - sumTdsPaid);
    const monthlyTds = round2(remainingTax / remainingMonths);
    sumTdsPaid += monthlyTds;
    
    // Net Salary = Basic - monthly deductions (SSF, PF, CIT) - TDS
    // Bonus and allowance are not reflected in monthly take-home (paid separately/annually)
    const monthlyDeds = row.ssf + row.pf + row.cit;
    const netSalary = Math.max(0, round2(row.basicSalary - monthlyDeds - monthlyTds));
    
    monthlyRows.push({
      monthName: row.monthName,
      basicSalary: row.basicSalary,
      ssf: row.ssf,
      pf: row.pf,
      cit: row.cit,
      tds: monthlyTds,
      netSalary: netSalary,
    });
  }

  // Calculate actual annual totals from all months
  const totalGrossIncome = cumulativeBasic + input.annualAllowance + input.annualBonus + input.otherIncome;
  
  // Calculate final actual annual regime result using the sum of all monthly actuals
  const finalAnnualInput: TaxInput = {
    fiscalYear: input.fiscalYear,
    taxpayerType: input.taxpayerType,
    contributingSSF: input.contributingSSF,
    isFemaleOnlyRemuneration: input.isFemaleOnlyRemuneration,
    months: 12,
    income: {
      salary: cumulativeBasic,
      allowance: input.annualAllowance,
      bonus: input.annualBonus,
      otherIncome: input.otherIncome,
    },
    deductions: {
      ssf: cumulativeSSF,
      pf: cumulativePF,
      cit: cumulativeCIT,
      insurance: input.insurance,
      medicalInsurance: input.medicalInsurance,
      donations: input.donations,
    }
  };

  const regimeResult = calculateRegime(finalAnnualInput, regime);

  return {
    monthlyRows,
    totalGrossIncome,
    totalDeductions: regimeResult.totalDeductions,
    taxableIncome: regimeResult.taxableIncome,
    totalTax: sumTdsPaid,
    netTakeHome: totalGrossIncome - (cumulativeSSF + cumulativePF + cumulativeCIT) - sumTdsPaid,
    regimeResult,
  };
}
