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
