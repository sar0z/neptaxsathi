// ============================================================
// Nepal Income Tax Regimes — Old (2082/83) and New (2083/84)
// Slab `limit` = WIDTH of bracket (not absolute). null = unlimited.
// ============================================================

import type { Regime } from "./types";

/**
 * OLD slab (FY 2082/83)
 * Individual: 5L@1% | 2L@10% | 3L@20% | 10L@30% | 30L@36% | rest@39%
 * Couple:     6L@1% | 2L@10% | 3L@20% |  9L@30% | 30L@36% | rest@39%
 * First 1% slab is Social Security Tax → becomes 0% if contributing to SSF.
 */
export const oldRegime: Regime = {
  id: "old",
  name: "Old Slab (2082/83)",
  note: "Separate brackets for individuals and couples. First slab is 1% Social Security Tax (0% with SSF).",
  individualSlabs: [
    { limit: 500_000, rate: 0.01 },
    { limit: 200_000, rate: 0.1 },
    { limit: 300_000, rate: 0.2 },
    { limit: 1_000_000, rate: 0.3 },
    { limit: 3_000_000, rate: 0.36 },
    { limit: null, rate: 0.39 },
  ],
  coupleSlabs: [
    { limit: 600_000, rate: 0.01 },
    { limit: 200_000, rate: 0.1 },
    { limit: 300_000, rate: 0.2 },
    { limit: 900_000, rate: 0.3 },
    { limit: 3_000_000, rate: 0.36 },
    { limit: null, rate: 0.39 },
  ],
};

/**
 * NEW slab — same for individual and couple.
 * 10L@1% | 5L@10% | 10L@20% | 15L@27% | rest@29%
 */
const newSlabs = [
  { limit: 1_000_000, rate: 0.01 },
  { limit: 500_000, rate: 0.1 },
  { limit: 1_000_000, rate: 0.2 },
  { limit: 1_500_000, rate: 0.27 },
  { limit: null, rate: 0.29 },
];

export const newRegime: Regime = {
  id: "new",
  name: "New Slab",
  note: "Same brackets for individuals and couples. First slab is 1% (0% with SSF).",
  individualSlabs: [...newSlabs],
  coupleSlabs: [...newSlabs],
};

export const REGIMES: Regime[] = [oldRegime, newRegime];
