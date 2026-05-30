import {
  Flex,
  Text,
  Heading,
  Badge,
  Box,
  Table,
} from "@radix-ui/themes";
import type { RegimeResult } from "../engine/types";
import { npr, num } from "../engine/taxEngine";

const pct = (r: number) =>
  `${(r * 100).toFixed(r * 100 < 10 && r > 0 ? 1 : 0)}%`;

function rangeLabel(lower: number, upper: number | null) {
  if (upper === null) return `Above ${num(lower)}`;
  return `${num(lower)} – ${num(upper)}`;
}

export default function RegimeView({
  result,
  color,
  best,
  info,
}: {
  result: RegimeResult;
  color: "indigo" | "teal";
  best?: boolean;
  info: { title: string; desc: string; slabs: [string, string][] };
}) {
  const activeSlabs = result.slabs.filter((s) => s.taxableInBracket > 0);

  return (
    <Box
      p="5"
      style={{
        background: "var(--color-panel-solid)",
        border: `1px solid ${best ? `var(--${color}-a5)` : "var(--gray-a4)"}`,
        borderRadius: "var(--radius-4)",
        boxShadow: best ? `0 4px 12px var(--${color}-a3)` : "0 1px 4px var(--gray-a2)",
      }}
    >
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex justify="between" align="start">
          <Box>
            <Flex align="center" gap="2" mb="1">
              <Heading size="4" weight="bold" style={{ color: `var(--${color}-11)` }}>
                {result.regimeName}
              </Heading>
              {best && (
                <Badge color={color} variant="solid" radius="full" size="1">
                  Better
                </Badge>
              )}
            </Flex>
            <Text size="2" color="gray" style={{ lineHeight: 1.4 }}>
              {info.desc}
            </Text>
          </Box>
        </Flex>

        {/* Slab Breakdown */}
        {result.taxableIncome > 0 && activeSlabs.length > 0 && (
          <Box>
            <Text
              size="1"
              weight="bold"
              color="gray"
              mb="2"
              as="div"
              style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              Tax Slab Breakdown
            </Text>
            <Box
              style={{
                border: "1px solid var(--gray-a4)",
                borderRadius: "var(--radius-3)",
                overflow: "hidden",
                background: "var(--gray-1)",
              }}
            >
              <Table.Root variant="ghost" style={{ border: "none" }}>
                <Table.Header>
                  <Table.Row style={{ background: "var(--gray-3)" }}>
                    <Table.ColumnHeaderCell style={{ color: "var(--gray-11)", fontWeight: 600, padding: "12px 16px", fontSize: 12, letterSpacing: "0.05em" }}>
                      INCOME RANGE
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell style={{ textAlign: "right", color: "var(--gray-11)", fontWeight: 600, padding: "12px 16px", fontSize: 12, letterSpacing: "0.05em" }}>
                      RATE
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell style={{ textAlign: "right", color: "var(--gray-11)", fontWeight: 600, padding: "12px 16px", fontSize: 12, letterSpacing: "0.05em" }}>
                      TAX
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {activeSlabs.map((s, i) => (
                    <Table.Row
                      key={i}
                      style={{
                        borderTop: i !== 0 ? "1px solid var(--gray-a3)" : undefined,
                        background: i % 2 === 0 ? "var(--color-panel-solid)" : "var(--gray-2)",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <Table.Cell style={{ padding: "14px 16px", color: "var(--gray-12)" }}>
                        <Box>
                          <Text size="2" weight="medium">{rangeLabel(s.lower, s.upper)}</Text>
                          <Box style={{ marginTop: 4 }}>
                            <Text size="1" color="gray">
                              Taxable: <Text weight="medium" className="tnum">{num(s.taxableInBracket)}</Text>
                            </Text>
                          </Box>
                        </Box>
                      </Table.Cell>
                      <Table.Cell style={{ textAlign: "right", padding: "14px 16px" }}>
                        <Badge
                          color={color}
                          variant="soft"
                          radius="full"
                          size="2"
                          className="tnum"
                          style={{ fontWeight: 600 }}
                        >
                          {pct(s.rate)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell style={{ textAlign: "right", padding: "14px 16px", fontWeight: 600, color: `var(--${color}-11)` }} className="tnum">
                        {num(s.taxInBracket)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  {/* Total Summary Row */}
                  <Table.Row style={{ background: `var(--${color}-a2)`, borderTop: "2px solid var(--gray-a4)" }}>
                    <Table.Cell style={{ padding: "14px 16px", fontWeight: 700, color: `var(--${color}-11)` }}>
                      Total Tax
                    </Table.Cell>
                    <Table.Cell style={{ textAlign: "right", padding: "14px 16px" }}>
                      <Text size="1" weight="bold" className="tnum" style={{ color: `var(--${color}-11)` }}>
                        {(result.effectiveRate * 100).toFixed(2)}%
                      </Text>
                    </Table.Cell>
                    <Table.Cell style={{ textAlign: "right", padding: "14px 16px", fontWeight: 700, color: `var(--${color}-11)` }} className="tnum">
                      {num(result.totalTaxYearly)}
                    </Table.Cell>
                  </Table.Row>
                  {/* Monthly Tax Row */}
                  <Table.Row style={{ background: `var(--${color}-a1)` }}>
                    <Table.Cell style={{ padding: "14px 16px", fontWeight: 600, color: "var(--gray-11)" }}>
                      Monthly Tax
                    </Table.Cell>
                    <Table.Cell style={{ textAlign: "right", padding: "14px 16px" }} />
                    <Table.Cell style={{ textAlign: "right", padding: "14px 16px", fontWeight: 600, color: "var(--gray-12)" }} className="tnum">
                      {npr(result.totalTaxMonthly)}
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>
        )}
      </Flex>
    </Box>
  );
}
