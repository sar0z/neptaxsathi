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
  MonthlyBreakdown,
  MonthlyBreakdownResult,
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
  const salarySum = input.useVariableSalary && input.monthlySalaries
    ? input.monthlySalaries.reduce((sum, val) => sum + (val || 0), 0)
    : (salary || 0);
  return Math.max(
    0,
    salarySum + (bonus || 0) + (allowance || 0) + (otherIncome || 0)
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
  const ssfSum = input.useVariableDeductions && input.monthlySSF
    ? input.monthlySSF.reduce((sum, val) => sum + (val || 0), 0)
    : (d.ssf || 0);
  const pfSum = input.useVariableDeductions && input.monthlyPF
    ? input.monthlyPF.reduce((sum, val) => sum + (val || 0), 0)
    : (d.pf || 0);
  const citSum = input.useVariableDeductions && input.monthlyCIT
    ? input.monthlyCIT.reduce((sum, val) => sum + (val || 0), 0)
    : (d.cit || 0);

  const retirementEntered =
    Math.max(0, ssfSum) +
    Math.max(0, pfSum) +
    Math.max(0, citSum);
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

// ---------- 12-Month Monthly TDS & Deductions Breakdown Calculator ----------
export function calculateMonthlyBreakdown(
  input: TaxInput,
  regime: Regime
): MonthlyBreakdownResult {
  const salaries = input.monthlySalaries || Array(12).fill(0);
  const totalSalary = salaries.reduce((a, b) => a + b, 0);

  // SSF and PF effective rates (if using default annual entries)
  const ssfRate = totalSalary > 0 ? (input.deductions.ssf || 0) / totalSalary : 0;
  const pfRate = totalSalary > 0 ? (input.deductions.pf || 0) / totalSalary : 0;

  // Monthly values for fixed annual parameters
  const monthlyCit = (input.deductions.cit || 0) / 12;
  const monthlyInsurance = (input.deductions.insurance || 0) / 12;
  const monthlyMedicalInsurance = (input.deductions.medicalInsurance || 0) / 12;
  const monthlyDonations = (input.deductions.donations || 0) / 12;

  const monthlyOtherIncome =
    (input.income.otherIncome || 0) /
    12;

  const monthNamesEn = [
    "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush",
    "Magh", "Falgun", "Chaitra", "Baishakh", "Jestha", "Ashad"
  ];

  const monthNamesNe = [
    "श्रावण", "भाद्र", "आश्विन", "कार्तिक", "मङ्सिर", "पुस",
    "माघ", "फागुन", "चैत", "वैशाख", "जेठ", "असार"
  ];

  const breakdowns: MonthlyBreakdown[] = [];
  let taxPaidCumulative = 0;

  for (let m = 0; m < 12; m++) {
    const salary = salaries[m] || 0;

    // 1. Determine monthly retirement fund contributions
    let ssfContribution = 0;
    let pfContribution = 0;
    let citContribution = 0;

    if (input.useVariableDeductions) {
      ssfContribution = (input.monthlySSF && input.monthlySSF[m]) || 0;
      pfContribution = (input.monthlyPF && input.monthlyPF[m]) || 0;
      citContribution = (input.monthlyCIT && input.monthlyCIT[m]) || 0;
    } else {
      ssfContribution = salary * ssfRate;
      pfContribution = salary * pfRate;
      citContribution = monthlyCit;
    }

    // 2. Cumulative salary & projection
    let cumulativeSalary = 0;
    for (let j = 0; j <= m; j++) {
      cumulativeSalary += salaries[j] || 0;
    }
    const remainingMonths = 11 - m;
    const projectedRemainingSalary = remainingMonths * salary;
    const projectedAnnualSalary = cumulativeSalary + projectedRemainingSalary;

    const projectedAnnualOtherIncome =
      (input.income.bonus || 0) +
      (input.income.allowance || 0) +
      (input.income.otherIncome || 0);
    const projectedAnnualIncome = projectedAnnualSalary + projectedAnnualOtherIncome;

    // 3. Cumulative retirement contributions & projection
    let cumulativeSsf = 0;
    let cumulativePf = 0;
    let cumulativeCit = 0;

    for (let j = 0; j <= m; j++) {
      if (input.useVariableDeductions) {
        cumulativeSsf += (input.monthlySSF && input.monthlySSF[j]) || 0;
        cumulativePf += (input.monthlyPF && input.monthlyPF[j]) || 0;
        cumulativeCit += (input.monthlyCIT && input.monthlyCIT[j]) || 0;
      } else {
        cumulativeSsf += (salaries[j] || 0) * ssfRate;
        cumulativePf += (salaries[j] || 0) * pfRate;
        cumulativeCit += monthlyCit;
      }
    }

    let projectedRemainingSsf = 0;
    let projectedRemainingPf = 0;
    let projectedRemainingCit = 0;

    if (input.useVariableDeductions) {
      projectedRemainingSsf = remainingMonths * ssfContribution;
      projectedRemainingPf = remainingMonths * pfContribution;
      projectedRemainingCit = remainingMonths * citContribution;
    } else {
      projectedRemainingSsf = remainingMonths * (salary * ssfRate);
      projectedRemainingPf = remainingMonths * (salary * pfRate);
      projectedRemainingCit = remainingMonths * monthlyCit;
    }

    const projectedAnnualSsf = cumulativeSsf + projectedRemainingSsf;
    const projectedAnnualPf = cumulativePf + projectedRemainingPf;
    const projectedAnnualCit = cumulativeCit + projectedRemainingCit;

    const projectedAnnualRetirement =
      projectedAnnualSsf + projectedAnnualPf + projectedAnnualCit;

    // 4. Calculate allowed deductions (based on annual projected values)
    const allowedRetirement = Math.min(
      projectedAnnualRetirement,
      projectedAnnualSalary / 3,
      500000
    );

    const allowedInsurance = Math.min(input.deductions.insurance || 0, 40000);
    const allowedMedical = Math.min(input.deductions.medicalInsurance || 0, 20000);
    const allowedDonations = input.deductions.donations || 0;

    const totalAllowedDeductions =
      allowedRetirement + allowedInsurance + allowedMedical + allowedDonations;
    const projectedAnnualTaxable = Math.max(0, projectedAnnualIncome - totalAllowedDeductions);

    // 5. Projected annual tax calculation
    let slabs =
      input.taxpayerType === "couple"
        ? regime.coupleSlabs
        : regime.individualSlabs;
    if (input.contributingSSF && slabs.length > 0) {
      slabs = slabs.map((s, i) => (i === 0 ? { ...s, rate: 0 } : s));
    }

    let remainingTaxable = projectedAnnualTaxable;
    let projectedAnnualGrossTax = 0;

    for (const slab of slabs) {
      const slabLimit = slab.limit;
      let taxableInBracket = 0;
      if (remainingTaxable > 0) {
        taxableInBracket =
          slabLimit === null ? remainingTaxable : Math.min(remainingTaxable, slabLimit);
      }
      projectedAnnualGrossTax += taxableInBracket * slab.rate;
      remainingTaxable -= taxableInBracket;
      if (slabLimit === null) break;
    }

    const femaleTaxCredit = input.isFemaleOnlyRemuneration
      ? Math.min(projectedAnnualGrossTax * 0.1, projectedAnnualGrossTax)
      : 0;
    const projectedAnnualTax = Math.max(0, projectedAnnualGrossTax - femaleTaxCredit);

    // 6. Monthly TDS calculation
    const monthsLeft = 12 - m;
    const taxDeducted = Math.max(0, (projectedAnnualTax - taxPaidCumulative) / monthsLeft);

    taxPaidCumulative += taxDeducted;

    // Cash-in-hand calculation (Gross Salary + Other Income Share - TDS - Retirement Deductions)
    const netCashInHand =
      salary +
      monthlyOtherIncome -
      taxDeducted -
      (ssfContribution + pfContribution + citContribution);

    breakdowns.push({
      monthIndex: m,
      monthNameEn: monthNamesEn[m],
      monthNameNe: monthNamesNe[m],
      salary,
      ssfContribution: round2(ssfContribution),
      pfContribution: round2(pfContribution),
      citContribution: round2(citContribution),
      otherDeductions: round2(
        monthlyInsurance + monthlyMedicalInsurance + monthlyDonations
      ),
      totalDeductions: round2(
        ssfContribution + pfContribution + citContribution
      ),
      projectedAnnualIncome: round2(projectedAnnualIncome),
      projectedAnnualAllowedDeductions: round2(totalAllowedDeductions),
      projectedAnnualTax: round2(projectedAnnualTax),
      taxDeducted: round2(taxDeducted),
      netCashInHand: round2(netCashInHand),
    });
  }

  const finalAnnualTax = breakdowns[11].projectedAnnualTax;
  const totalTaxDeducted = breakdowns.reduce((sum, b) => sum + b.taxDeducted, 0);
  const refundDue = Math.max(0, totalTaxDeducted - finalAnnualTax);

  return {
    months: breakdowns,
    yearlyActualTax: round2(finalAnnualTax),
    yearlyTaxDeducted: round2(totalTaxDeducted),
    refundDue: round2(refundDue),
  };
}
