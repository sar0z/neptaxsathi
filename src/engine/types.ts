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
  donations: number;
}

export interface TaxInput {
  fiscalYear: string;
  taxpayerType: TaxpayerType;
  contributingSSF: boolean; // makes first 1% slab become 0%
  months: number; // months used for the period (default 12)
  income: IncomeInput;
  deductions: DeductionInput;
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

export interface RegimeResult {
  regimeId: string;
  regimeName: string;
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  slabs: SlabComputation[];
  totalTaxYearly: number;
  totalTaxMonthly: number;
  netIncomeYearly: number;
  netIncomeMonthly: number;
  effectiveRate: number;
  months: number;
}
