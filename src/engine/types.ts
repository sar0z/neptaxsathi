// ============================================================
// Nepal Tax Engine — Types
// ============================================================

export type TaxpayerType = "individual" | "couple";

export interface IncomeInput {
  salary: number;
  bonus: number;
  allowance: number;
  otherIncome: number;
}

export interface DeductionInput {
  ssf: number; // Social Security Fund
  pf: number; // Provident Fund
  cit: number; // Citizen Investment Trust
  insurance: number; // Life insurance premium
  medicalInsurance: number; // Medical insurance premium
  donations: number;
}

export interface TaxInput {
  fiscalYear: string;
  taxpayerType: TaxpayerType;
  contributingSSF: boolean; // makes first 1% slab become 0%
  isFemaleOnlyRemuneration: boolean; // applies 10% tax credit on slab tax
  months: number; // months used for the period (default 12)
  income: IncomeInput;
  deductions: DeductionInput;
  useVariableSalary?: boolean;
  useVariableDeductions?: boolean;
  monthlySalaries?: number[];
  monthlySSF?: number[];
  monthlyPF?: number[];
  monthlyCIT?: number[];
}

// ----- Slabs / Regime -----

export interface Slab {
  /** Width of this bracket (NOT absolute upper bound). null = unlimited top slab */
  limit: number | null;
  rate: number; // 0.10 = 10%
}

export interface Regime {
  id: string;
  name: string;
  note: string;
  /** When taxpayer is individual */
  individualSlabs: Slab[];
  /** When taxpayer is couple */
  coupleSlabs: Slab[];
}

// ----- Results -----

export interface SlabComputation {
  lower: number;
  upper: number | null;
  rate: number;
  taxableInBracket: number;
  taxInBracket: number;
}

export interface DeductionComputation {
  key: "retirement" | "lifeInsurance" | "medicalInsurance" | "donations";
  label: string;
  entered: number;
  allowed: number;
  capped: boolean;
}

export interface RegimeResult {
  regimeId: string;
  regimeName: string;
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  slabs: SlabComputation[];
  deductionBreakdown: DeductionComputation[];
  grossTaxYearly: number;
  femaleTaxCredit: number;
  totalCredits: number;
  totalTaxYearly: number;
  totalTaxMonthly: number;
  netIncomeYearly: number;
  netIncomeMonthly: number;
  effectiveRate: number;
  months: number;
}

// ----- Monthly Breakdowns -----

export interface MonthlyBreakdown {
  monthIndex: number; // 0..11
  monthNameEn: string;
  monthNameNe: string;
  salary: number;
  ssfContribution: number;
  pfContribution: number;
  citContribution: number;
  otherDeductions: number; // insurance + medical + donations divided by 12
  totalDeductions: number; // ssf + pf + cit
  projectedAnnualIncome: number;
  projectedAnnualAllowedDeductions: number;
  projectedAnnualTax: number;
  taxDeducted: number;
  netCashInHand: number;
}

export interface MonthlyBreakdownResult {
  months: MonthlyBreakdown[];
  yearlyActualTax: number;
  yearlyTaxDeducted: number;
  refundDue: number;
}
