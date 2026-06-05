import assert from "node:assert/strict";
import { calculateRegime } from "../src/engine/taxEngine";
import { oldRegime, newRegime } from "../src/engine/scenarios";
import type { TaxInput } from "../src/engine/types";

type TaxInputOverrides = Omit<Partial<TaxInput>, "income" | "deductions"> & {
  income?: Partial<TaxInput["income"]>;
  deductions?: Partial<TaxInput["deductions"]>;
};

const input = (overrides: TaxInputOverrides = {}): TaxInput => {
  const { income, deductions, ...rest } = overrides;

  return {
    fiscalYear: "2082/83",
    taxpayerType: "individual",
    contributingSSF: false,
    isFemaleOnlyRemuneration: false,
    months: 12,
    ...rest,
    income: {
      salary: 0,
      bonus: 0,
      allowance: 0,
      otherIncome: 0,
      ...income,
    },
    deductions: {
      ssf: 0,
      pf: 0,
      cit: 0,
      insurance: 0,
      medicalInsurance: 0,
      donations: 0,
      ...deductions,
    },
  };
};

const result = (taxInput: TaxInput, regime = oldRegime) =>
  calculateRegime(taxInput, regime);

assert.equal(
  result(input({ income: { salary: 500_000 } })).grossTaxYearly,
  5_000,
  "old individual first slab stays 500k at 1%"
);

assert.equal(
  result(input({ taxpayerType: "couple", income: { salary: 600_000 } }))
    .grossTaxYearly,
  6_000,
  "old couple first slab stays 600k at 1%"
);

assert.equal(
  result(input({ income: { salary: 1_000_000 } }), newRegime).grossTaxYearly,
  10_000,
  "new slab first band stays 10L at 1%"
);

assert.equal(
  result(input({ contributingSSF: true, income: { salary: 500_000 } }))
    .grossTaxYearly,
  0,
  "SSF contribution zeroes the first 1% slab"
);

{
  const actual = result(
    input({
      income: { salary: 900_000 },
      deductions: { ssf: 300_000, pf: 200_000, cit: 100_000 },
    })
  );
  assert.equal(actual.totalDeductions, 300_000);
  assert.equal(actual.taxableIncome, 600_000);
  assert.equal(actual.totalTaxYearly, 15_000);
}

{
  const actual = result(
    input({
      income: { salary: 600_000 },
      deductions: { insurance: 100_000 },
    })
  );
  assert.equal(actual.totalDeductions, 40_000);
  assert.equal(actual.taxableIncome, 560_000);
  assert.equal(actual.totalTaxYearly, 11_000);
}

{
  const actual = result(
    input({
      income: { salary: 600_000 },
      deductions: { medicalInsurance: 100_000 },
    })
  );
  assert.equal(actual.totalDeductions, 20_000);
  assert.equal(actual.taxableIncome, 580_000);
  assert.equal(actual.totalTaxYearly, 13_000);
}

{
  const actual = result(
    input({
      income: { salary: 700_000 },
      isFemaleOnlyRemuneration: true,
    })
  );
  assert.equal(actual.grossTaxYearly, 25_000);
  assert.equal(actual.femaleTaxCredit, 2_500);
  assert.equal(actual.totalTaxYearly, 22_500);
}

{
  const actual = result(
    input({
      income: { salary: 700_000 },
      isFemaleOnlyRemuneration: true,
    }),
    newRegime
  );
  assert.equal(actual.grossTaxYearly, 7_000);
  assert.equal(actual.femaleTaxCredit, 700);
  assert.equal(actual.totalTaxYearly, 6_300);
}

{
  const actual = result(
    input({
      income: { salary: 100_000 },
      deductions: { donations: 200_000 },
    })
  );
  assert.equal(actual.taxableIncome, 0);
  assert.equal(actual.totalTaxYearly, 0);
}

console.log("taxEngine tests passed");

// ============================================================
// Variable Salary Mode Tests
// ============================================================
import { calculateMonthlyBreakdown } from "../src/engine/taxEngine";

// Test: totalIncome sums monthly salaries correctly when useVariableSalary is true
{
  const monthlySalaries = Array(12).fill(100_000); // 12 x 100k = 1,200,000
  const varInput = input({
    useVariableSalary: true,
    monthlySalaries,
    income: { salary: 0, bonus: 0, allowance: 0, otherIncome: 0 },
  } as any);
  const r = result(varInput);
  assert.equal(r.totalIncome, 1_200_000, "variable salary: totalIncome should sum monthlySalaries");
}

// Test: Monthly breakdown outputs exactly 12 months
{
  const monthlySalaries = Array(12).fill(80_000);
  const varInput = input({ useVariableSalary: true, monthlySalaries } as any);
  const bd = calculateMonthlyBreakdown(varInput as any, oldRegime);
  assert.equal(bd.months.length, 12, "monthly breakdown should have exactly 12 months");
}

// Test: Uniform salary — all monthly TDS should be equal
{
  const monthlySalaries = Array(12).fill(100_000);
  const varInput = input({ useVariableSalary: true, monthlySalaries } as any);
  const bd = calculateMonthlyBreakdown(varInput as any, oldRegime);
  const allEqual = bd.months.every((m) => Math.abs(m.taxDeducted - bd.months[0].taxDeducted) < 1);
  assert.ok(allEqual, "uniform salary: all monthly TDS should be approximately equal");
}

// Test: Raise in Magh (month index 6) → TDS from Magh onwards should be >= TDS in Shrawan
{
  const salaries = Array(12).fill(100_000);
  salaries[6] = 150_000;  // Magh raise
  salaries[7] = 150_000;
  salaries[8] = 150_000;
  salaries[9] = 150_000;
  salaries[10] = 150_000;
  salaries[11] = 150_000;
  const varInput = input({ useVariableSalary: true, monthlySalaries: salaries } as any);
  const bd = calculateMonthlyBreakdown(varInput as any, oldRegime);
  const tdsBeforeRaise = bd.months[5].taxDeducted; // Poush (last month before raise)
  const tdsAtRaise = bd.months[6].taxDeducted;     // Magh (first month with raise)
  assert.ok(
    tdsAtRaise >= tdsBeforeRaise,
    `TDS at raise (${tdsAtRaise}) should be >= TDS before raise (${tdsBeforeRaise})`
  );
}

// Test: Sum of monthly TDS approximately equals final projected annual tax
{
  const monthlySalaries = Array(12).fill(120_000);
  const varInput = input({ useVariableSalary: true, monthlySalaries } as any);
  const bd = calculateMonthlyBreakdown(varInput as any, oldRegime);
  const totalTds = bd.yearlyTaxDeducted;
  const annualTax = bd.yearlyActualTax;
  assert.ok(
    Math.abs(totalTds - annualTax) < 2,
    `Total TDS (${totalTds}) should approximate annual tax (${annualTax})`
  );
}

// Test: Bonus and allowance are excluded from monthly netCashInHand calculation in 12-month mode
{
  const monthlySalaries = Array(12).fill(100_000);
  const inputWithoutBonus = input({
    useVariableSalary: true,
    monthlySalaries,
    income: { salary: 0, bonus: 0, allowance: 0, otherIncome: 0 }
  } as any);
  const inputWithBonus = input({
    useVariableSalary: true,
    monthlySalaries,
    income: { salary: 0, bonus: 120_000, allowance: 60_000, otherIncome: 0 }
  } as any);

  const bdWithout = calculateMonthlyBreakdown(inputWithoutBonus as any, oldRegime);
  const bdWith = calculateMonthlyBreakdown(inputWithBonus as any, oldRegime);

  for (let m = 0; m < 12; m++) {
    const cashDiff = bdWithout.months[m].netCashInHand - bdWith.months[m].netCashInHand;
    const taxDiff = bdWith.months[m].taxDeducted - bdWithout.months[m].taxDeducted;
    assert.ok(
      Math.abs(cashDiff - taxDiff) < 1,
      `Month ${m}: Cash difference (${cashDiff}) should match tax difference (${taxDiff})`
    );
  }
}

console.log("variable salary tests passed");

