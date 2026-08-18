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
    remoteAreaCategory: "none",
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
      education: 0,
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
  assert.equal(actual.totalDeductions, 5_000); // capped at 5% of 100k
  assert.equal(actual.taxableIncome, 95_000);
  assert.equal(actual.totalTaxYearly, 950);
}

// Test donation cap at Rs 100,000
{
  const actual = result(
    input({
      income: { salary: 3_000_000 }, // 30 Lakhs
      deductions: { donations: 200_000 },
    })
  );
  // 5% of 3M is 150k, but cap is absolute Rs 100,000
  assert.equal(actual.totalDeductions, 100_000);
  assert.equal(actual.taxableIncome, 2_900_000);
}

// Test remote area benefits
{
  const actualA = result(
    input({
      income: { salary: 500_000 },
      remoteAreaCategory: "A", // Rs 50,000 deduction
    })
  );
  assert.equal(actualA.totalDeductions, 50_000);
  assert.equal(actualA.taxableIncome, 450_000);
  assert.equal(actualA.totalTaxYearly, 4_500); // 1% of 450k

  const actualB = result(
    input({
      income: { salary: 500_000 },
      remoteAreaCategory: "B", // Rs 40,000 deduction
    })
  );
  assert.equal(actualB.totalDeductions, 40_000);
  assert.equal(actualB.taxableIncome, 460_000);

  const actualC = result(
    input({
      income: { salary: 500_000 },
      remoteAreaCategory: "C", // Rs 30,000 deduction
    })
  );
  assert.equal(actualC.totalDeductions, 30_000);
  assert.equal(actualC.taxableIncome, 470_000);

  const actualD = result(
    input({
      income: { salary: 500_000 },
      remoteAreaCategory: "D", // Rs 20,000 deduction
    })
  );
  assert.equal(actualD.totalDeductions, 20_000);
  assert.equal(actualD.taxableIncome, 480_000);

  const actualE = result(
    input({
      income: { salary: 500_000 },
      remoteAreaCategory: "E", // Rs 10,000 deduction
    })
  );
  assert.equal(actualE.totalDeductions, 10_000);
  assert.equal(actualE.taxableIncome, 490_000);
}

// Children's education tuition fee deduction tests
{
  // 1. Old regime: tuition fee gets Rs 0 allowed
  const actualOld = result(
    input({
      income: { salary: 600_000 },
      deductions: { education: 100_000 },
    }),
    oldRegime
  );
  assert.equal(actualOld.totalDeductions, 0);
  assert.equal(actualOld.taxableIncome, 600_000);
  
  // 2. New regime: 25% of tuition fees paid is lower (80k paid -> 20k allowed)
  const actualNew20k = result(
    input({
      income: { salary: 600_000 },
      deductions: { education: 80_000 },
    }),
    newRegime
  );
  assert.equal(actualNew20k.totalDeductions, 20_000);
  assert.equal(actualNew20k.taxableIncome, 580_000);
  assert.equal(actualNew20k.deductionBreakdown.find(d => d.key === "education")?.capped, false);

  // 3. New regime: Rs 25,000 cap is lower (200k paid -> 25k allowed)
  const actualNew25k = result(
    input({
      income: { salary: 600_000 },
      deductions: { education: 200_000 },
    }),
    newRegime
  );
  assert.equal(actualNew25k.totalDeductions, 25_000);
  assert.equal(actualNew25k.taxableIncome, 575_000);
  assert.equal(actualNew25k.deductionBreakdown.find(d => d.key === "education")?.capped, true);

  // 4. New regime: remaining income cap (Salary 100k - remote 50k - life 40k = 10k left)
  const actualRemainingIncome = result(
    input({
      income: { salary: 100_000 },
      remoteAreaCategory: "A", // 50k
      deductions: { insurance: 40_000, education: 80_000 }, // education 25% is 20k, but only 10k remaining
    }),
    newRegime
  );
  assert.equal(actualRemainingIncome.totalDeductions, 100_000);
  assert.equal(actualRemainingIncome.taxableIncome, 0);
  const eduBreakdown = actualRemainingIncome.deductionBreakdown.find(d => d.key === "education");
  assert.equal(eduBreakdown?.allowed, 10_000);
  assert.equal(eduBreakdown?.capped, true);

  // 5. New regime: donation cap reduction (Adjusted taxable income reduces by education deduction)
  const actualDonationCap = result(
    input({
      income: { salary: 600_000 },
      deductions: { insurance: 40_000, education: 80_000, donations: 30_000 },
    }),
    newRegime
  );
  // Adjusted taxable income = 600k - 40k (life) - 20k (education) = 540k
  // Donation cap = 5% of 540k = 27k
  // Total deductions = 40k + 20k + 27k = 87k
  assert.equal(actualDonationCap.totalDeductions, 87_000);
  assert.equal(actualDonationCap.taxableIncome, 513_000);
}

console.log("taxEngine tests passed");
