import { useMemo, useState } from "react";
import { Flex, Text, Heading, Box, Button, Table, Grid, Badge } from "@radix-ui/themes";
import { ArrowDownIcon, ArrowUpIcon, Share1Icon } from "@radix-ui/react-icons";
import type { TaxInput } from "../engine/types";
import { calculateRegime, npr } from "../engine/taxEngine";
import { oldRegime, newRegime } from "../engine/scenarios";
import RegimeView from "./RegimeView";

import { useTranslation } from "../i18n/LanguageContext";
import ShareTaxDetails from "./ShareTaxDetails";

interface Props {
  input: TaxInput;
  onBack?: () => void;
}

export default function Calculation({ input, onBack: _onBack }: Props) {
  const { t, language } = useTranslation();
  const currency = t('currency');

  const [shareOpen, setShareOpen] = useState(false);
  const oldResult = useMemo(() => calculateRegime(input, oldRegime), [input]);
  const newResult = useMemo(() => calculateRegime(input, newRegime), [input]);

  const savingsYearly = oldResult.totalTaxYearly - newResult.totalTaxYearly;
  const savingsMonthly = oldResult.totalTaxMonthly - newResult.totalTaxMonthly;
  const newIsBetter = savingsYearly > 0;
  const oldIsBetter = savingsYearly < 0;
  const neutral = Math.abs(savingsYearly) < 1;
  const hasTaxableIncome = oldResult.taxableIncome > 0 || newResult.taxableIncome > 0;
  const months = input.months > 0 ? input.months : 12;
  const retirementYearly = input.deductions.ssf + input.deductions.pf + input.deductions.cit;

  const accent = neutral ? "gray" : newIsBetter ? "teal" : "indigo";

  const oldSlabsInfo: [string, string][] =
    input.taxpayerType === "couple"
      ? [
          [`${t('upTo')} 6,00,000`, "1% (0% SSF)"],
          ["6L – 8L", "10%"],
          ["8L – 11L", "20%"],
          ["11L – 20L", "30%"],
          ["20L – 50L", "36%"],
          [`${t('above')} 50L`, "39%"],
        ]
      : [
          [`${t('upTo')} 5,00,000`, "1% (0% SSF)"],
          ["5L – 7L", "10%"],
          ["7L – 10L", "20%"],
          ["10L – 20L", "30%"],
          ["20L – 50L", "36%"],
          [`${t('above')} 50L`, "39%"],
        ];

  const newSlabsInfo: [string, string][] = [
    [`${t('upTo')} 10,00,000`, "1% (0% SSF)"],
    ["10L – 15L", "10%"],
    ["15L – 25L", "20%"],
    ["25L – 40L", "27%"],
    [`${t('above')} 40L`, "29%"],
  ];

  const deductionLabel = (key: string) => {
    if (key === "retirement") return t('retirementFund');
    if (key === "lifeInsurance") return t('lifeInsurance');
    if (key === "medicalInsurance") return t('medicalInsurance');
    return t('donations');
  };

  const yearlyTableRows = [
    { label: t('grossTaxBeforeCredits'), old: oldResult.grossTaxYearly, new: newResult.grossTaxYearly },
    { label: t('taxCredits'), old: oldResult.totalCredits, new: newResult.totalCredits, isCredit: true },
    { label: t('incomeTax'), old: oldResult.totalTaxYearly, new: newResult.totalTaxYearly },
    { label: t('effectiveRate'), old: oldResult.effectiveRate * 100, new: newResult.effectiveRate * 100, isPercent: true },
    { label: t('netSalary'), old: oldResult.netIncomeYearly, new: newResult.netIncomeYearly },
    { label: t('cashInHand'), old: input.income.salary - oldResult.totalTaxYearly - retirementYearly, new: input.income.salary - newResult.totalTaxYearly - retirementYearly },
  ];

  const monthlyTableRows = [
    { label: t('monthlySalary'), old: input.income.salary / months, new: input.income.salary / months },
    { label: t('ssf'), old: input.deductions.ssf / months, new: input.deductions.ssf / months, isCredit: true },
    { label: t('providentFund'), old: input.deductions.pf / months, new: input.deductions.pf / months, isCredit: true },
    { label: t('cit'), old: input.deductions.cit / months, new: input.deductions.cit / months, isCredit: true },
    { label: t('incomeTax'), old: oldResult.totalTaxMonthly, new: newResult.totalTaxMonthly },
    { label: t('netSalary'), old: oldResult.netIncomeMonthly, new: newResult.netIncomeMonthly },
    { label: t('cashInHand'), old: (input.income.salary / months) - oldResult.totalTaxMonthly - (retirementYearly / months), new: (input.income.salary / months) - newResult.totalTaxMonthly - (retirementYearly / months) },
  ];

  const renderComparisonTable = (
    title: string,
    rows: {
      label: string;
      old: number;
      new: number;
      isCredit?: boolean;
      isPercent?: boolean;
    }[]
  ) => (
    <Box
      style={{
        background: "var(--gray-1)",
        border: "1px solid var(--gray-a4)",
        borderRadius: "var(--radius-4)",
        overflow: "hidden",
      }}
    >
      <Box px="4" py="3" style={{ background: "var(--gray-3)", borderBottom: "1px solid var(--gray-a4)" }}>
        <Text size="1" weight="bold" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
        </Text>
      </Box>
      <Table.Root variant="ghost" style={{ border: "none", width: "100%" }}>
        <Table.Header>
          <Table.Row style={{ background: "var(--gray-3)" }}>
            <Table.ColumnHeaderCell style={{ color: "var(--gray-11)", fontWeight: 600, padding: "12px 20px", fontSize: 11, letterSpacing: "0.06em", width: "40%" }}>
              {t('incomeTax').split(' ')[0]}
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "right", padding: "12px 20px", width: "30%" }}>
              <Box style={{ display: "flex", justifyContent: "flex-end" }}>
                <Box style={{ background: "var(--indigo-3)", border: "1px solid var(--indigo-a5)", borderRadius: "var(--radius-2)", padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Box style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--indigo-9)" }} />
                  <Text size="1" style={{ color: "var(--indigo-11)", fontWeight: 700, letterSpacing: "0.05em", fontSize: 11 }}>{t('oldSlab')}</Text>
                </Box>
              </Box>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "right", padding: "12px 20px", width: "30%" }}>
              <Box style={{ display: "flex", justifyContent: "flex-end" }}>
                <Box style={{ background: "var(--teal-3)", border: "1px solid var(--teal-a5)", borderRadius: "var(--radius-2)", padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Box style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal-9)" }} />
                  <Text size="1" style={{ color: "var(--teal-11)", fontWeight: 700, letterSpacing: "0.05em", fontSize: 11 }}>{t('newSlab')}</Text>
                </Box>
              </Box>
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row, i) => {
            const oldIsBetter = row.isCredit ? row.old > row.new : row.old < row.new;
            const newIsBetterRow = row.isCredit ? row.new > row.old : row.new < row.old;
            const formatValue = (val: number) => {
              if (row.isPercent) {
                const percentValue = val.toFixed(2);
                if (language === 'ne') {
                  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
                  const converted = percentValue.replace(/[0-9]/g, (digit) => devanagariDigits[parseInt(digit)]);
                  return `${converted}%`;
                }
                return `${percentValue}%`;
              }
              return npr(val, language, currency);
            };
            return (
              <Table.Row
                key={row.label}
                style={{
                  borderTop: "1px solid var(--gray-a3)",
                  background: i % 2 === 0 ? "var(--color-panel-solid)" : "var(--gray-2)",
                }}
              >
                <Table.Cell style={{ padding: "14px 20px", color: "var(--gray-11)", fontWeight: 500, fontSize: 14 }}>
                  {row.label}
                </Table.Cell>
                <Table.Cell className="tnum" style={{ textAlign: "right", padding: "14px 20px" }}>
                  <Box
                    style={{
                      display: "inline-block",
                      background: oldIsBetter ? "var(--indigo-2)" : "var(--gray-2)",
                      border: `1px solid ${oldIsBetter ? "var(--indigo-a4)" : "var(--gray-a3)"}`,
                      borderRadius: "var(--radius-2)",
                      padding: "3px 10px",
                      color: "var(--indigo-11)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {formatValue(row.old)}
                  </Box>
                </Table.Cell>
                <Table.Cell className="tnum" style={{ textAlign: "right", padding: "14px 20px" }}>
                  <Box
                    style={{
                      display: "inline-block",
                      background: newIsBetterRow ? "var(--teal-2)" : "var(--gray-2)",
                      border: `1px solid ${newIsBetterRow ? "var(--teal-a4)" : "var(--gray-a3)"}`,
                      borderRadius: "var(--radius-2)",
                      padding: "3px 10px",
                      color: "var(--teal-11)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {formatValue(row.new)}
                  </Box>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );

  return (
    <Flex direction="column" gap="4" pb="6" className="content-fade">
      <Flex justify="end">
        <Button
          size="3"
          variant="soft"
          color="indigo"
          onClick={() => {
            setShareOpen(true);
            window.umami?.track("share-preview-opened");
          }}
          style={{ cursor: "pointer" }}
        >
          <Share1Icon width="16" height="16" />
          {t("shareTaxDetails")}
        </Button>
      </Flex>

      {/* Savings hero banner */}
      <Box
        className="hero-gradient elegant-card"
        p="5"
        style={
          neutral
            ? undefined
            : {
                background: `linear-gradient(135deg, var(--${accent}-3), var(--${accent}-2))`,
                borderColor: `var(--${accent}-a5)`,
              }
        }
      >
        {neutral ? (
          <Box style={{ textAlign: "center" }}>
            <Text size="3" weight="bold" as="div" mb="2" style={{ color: "var(--gray-11)" }}>
              {t('noSavingsDifference')}
            </Text>
            <Text size="2" color="gray" as="div" style={{ lineHeight: 1.5 }}>
              {t('noSavingsMessage')}
            </Text>
          </Box>
        ) : (
          <Box style={{ position: "relative" }}>
            <Flex align="center" gap="1" mb="3">
              <Box
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: 9999,
                  background: newIsBetter ? `var(--${accent}-11)` : "var(--red-9)",
                  color: "white",
                }}
              >
                {newIsBetter ? <ArrowUpIcon width="14" height="14" /> : <ArrowDownIcon width="14" height="14" />}
              </Box>
              <Text
                size="1"
                weight="bold"
                style={{
                  color: newIsBetter ? `var(--${accent}-11)` : "var(--red-11)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {t(newIsBetter ? 'newSlabSaves' : 'oldSlabSaves', { slab: t(newIsBetter ? 'newSlabLabel' : 'oldSlabLabel') })}
              </Text>
            </Flex>

            <Flex gap="6" align="end" wrap="wrap">
              <Box>
                <Heading
                  size="8"
                  as="h2"
                  weight="bold"
                  className="tnum"
                  style={{ color: `var(--${accent}-11)`, lineHeight: 1 }}
                >
                  {npr(Math.abs(savingsYearly), language, currency)}
                </Heading>
                <Text size="1" color="gray" as="div" mt="1">
                  {t('perYear')}
                </Text>
              </Box>
              <Box>
                <Heading
                  size="6"
                  as="h3"
                  weight="bold"
                  className="tnum"
                  style={{ color: `var(--${accent}-11)`, lineHeight: 1 }}
                >
                  {npr(Math.abs(savingsMonthly), language, currency)}
                </Heading>
                <Text size="1" color="gray" as="div" mt="1">
                  {t('perMonth')}
                </Text>
              </Box>
            </Flex>
          </Box>
        )}
      </Box>

      {/* Income Summary Cards */}
      <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
        {/* Gross Salary */}
        <Box
          style={{
            background: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a4)",
            borderRadius: "var(--radius-4)",
            padding: "16px 18px",
            boxShadow: "0 1px 4px var(--gray-a2)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "var(--green-a3)",
              filter: "blur(12px)",
              pointerEvents: "none",
            }}
          />
          <Flex align="center" justify="between" mb="2">
            <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              {t('grossSalary')}
            </Text>
            <Box
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "var(--green-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M4 6l4-4 4 4M3 14h10" stroke="var(--green-11)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
          </Flex>
          <Text size="5" weight="bold" className="tnum" style={{ color: "var(--gray-12)", lineHeight: 1 }}>
            {npr(oldResult.totalIncome, language, currency)}
          </Text>
        </Box>

        {/* Allowances + Bonus + Other Incomes */}
        <Box
          style={{
            background: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a4)",
            borderRadius: "var(--radius-4)",
            padding: "16px 18px",
            boxShadow: "0 1px 4px var(--gray-a2)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "var(--blue-a3)",
              filter: "blur(12px)",
              pointerEvents: "none",
            }}
          />
          <Flex align="center" justify="between" mb="2">
            <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              {t('allowancesBonus')}
            </Text>
            <Box
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "var(--blue-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM3 6a5 5 0 1110 0A5 5 0 013 6z" stroke="var(--blue-11)" strokeWidth="1.5"/>
                <path d="M8 8v5M6 11l2 2 2-2" stroke="var(--blue-11)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
          </Flex>
          <Text size="5" weight="bold" className="tnum" style={{ color: "var(--gray-12)", lineHeight: 1 }}>
            {npr(oldResult.totalIncome - input.income.salary, language, currency)}
          </Text>
        </Box>

        {/* Deductions */}
        <Box
          style={{
            background: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a4)",
            borderRadius: "var(--radius-4)",
            padding: "16px 18px",
            boxShadow: "0 1px 4px var(--gray-a2)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "var(--red-a3)",
              filter: "blur(12px)",
              pointerEvents: "none",
            }}
          />
          <Flex align="center" justify="between" mb="2">
            <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              {t('deductionsLabel')}
            </Text>
            <Box
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "var(--red-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 14V2M4 10l4 4 4-4M3 2h10" stroke="var(--red-11)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
          </Flex>
          <Text size="5" weight="bold" className="tnum" style={{ color: "var(--red-11)", lineHeight: 1 }}>
            −{npr(oldResult.totalDeductions, language, currency)}
          </Text>
        </Box>

        {/* Net Salary */}
        <Box
          style={{
            background: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a4)",
            borderRadius: "var(--radius-4)",
            padding: "16px 18px",
            boxShadow: "0 1px 4px var(--gray-a2)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "var(--purple-a3)",
              filter: "blur(12px)",
              pointerEvents: "none",
            }}
          />
          <Flex align="center" justify="between" mb="2">
            <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              {t('netSalary')}
            </Text>
            <Box
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "var(--purple-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M4 6l4-4 4 4M3 14h10" stroke="var(--purple-11)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
          </Flex>
          <Text size="5" weight="bold" className="tnum" style={{ color: "var(--gray-12)", lineHeight: 1 }}>
            {npr(oldResult.netIncomeYearly, language, currency)}
          </Text>
        </Box>

        {/* Taxable Salary */}
        <Box
          style={{
            background: "linear-gradient(135deg, var(--indigo-3), var(--indigo-2))",
            border: "1px solid var(--indigo-a5)",
            borderRadius: "var(--radius-4)",
            padding: "16px 18px",
            boxShadow: "0 2px 8px var(--indigo-a3)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "var(--indigo-a5)",
              filter: "blur(16px)",
              pointerEvents: "none",
            }}
          />
          <Flex align="center" justify="between" mb="2">
            <Text size="1" style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--indigo-11)" }}>
              {t('taxableSalary')}
            </Text>
            <Box
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "var(--indigo-4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="10" width="3" height="4" rx="1" fill="var(--indigo-11)"/>
                <rect x="6.5" y="6" width="3" height="8" rx="1" fill="var(--indigo-11)" opacity="0.7"/>
                <rect x="11" y="2" width="3" height="12" rx="1" fill="var(--indigo-11)" opacity="0.5"/>
              </svg>
            </Box>
          </Flex>
          <Text size="5" weight="bold" className="tnum" style={{ color: "var(--indigo-12)", lineHeight: 1 }}>
            {npr(oldResult.taxableIncome, language, currency)}
          </Text>
        </Box>
      </Grid>

      <Box
        style={{
          background: "var(--gray-1)",
          border: "1px solid var(--gray-a4)",
          borderRadius: "var(--radius-4)",
          overflow: "hidden",
        }}
      >
        <Box px="4" py="3" style={{ background: "var(--gray-3)", borderBottom: "1px solid var(--gray-a4)" }}>
          <Text size="1" weight="bold" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {t('allowedDeductions')}
          </Text>
        </Box>
        <Table.Root variant="ghost" style={{ border: "none", width: "100%" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell style={{ padding: "10px 16px", color: "var(--gray-11)", fontWeight: 600 }}>
                {t('deductionsLabel')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ padding: "10px 16px", textAlign: "right", color: "var(--gray-11)", fontWeight: 600 }}>
                {t('enteredAmount')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ padding: "10px 16px", textAlign: "right", color: "var(--gray-11)", fontWeight: 600 }}>
                {t('allowedAmount')}
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {oldResult.deductionBreakdown.map((item, i) => (
              <Table.Row key={item.key} style={{ borderTop: "1px solid var(--gray-a3)", background: i % 2 === 0 ? "var(--color-panel-solid)" : "var(--gray-2)" }}>
                <Table.Cell style={{ padding: "12px 16px" }}>
                  <Flex align="center" gap="2">
                    <Text size="2" color="gray" weight="medium">{deductionLabel(item.key)}</Text>
                    {item.capped && (
                      <Badge color="amber" variant="soft" size="1" radius="full">
                        {t('capped')}
                      </Badge>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell className="tnum" style={{ padding: "12px 16px", textAlign: "right", color: "var(--gray-11)" }}>
                  {npr(item.entered, language, currency)}
                </Table.Cell>
                <Table.Cell className="tnum" style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "var(--gray-12)" }}>
                  {npr(item.allowed, language, currency)}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Comparison Tables */}
      {renderComparisonTable(`${t('shareTaxComparison')} · ${t('yearly')}`, yearlyTableRows)}
      {renderComparisonTable(`${t('shareTaxComparison')} · ${t('monthly')}`, monthlyTableRows)}

      {/* No taxable income message */}
      {!hasTaxableIncome && (
        <Box className="elegant-card" p="6" style={{ textAlign: "center" }}>
          <Text size="2" color="gray" as="div" style={{ lineHeight: 1.5 }}>
            {t('deductionsCoverIncome')}
          </Text>
          <Text size="2" color="gray" as="div" mt="1" style={{ lineHeight: 1.5 }}>
            {t('recheckSalary')}
          </Text>
        </Box>
      )}

      {/* Regime View Cards */}
      {hasTaxableIncome && (
        <Grid columns={{ initial: "1", lg: "2" }} gap="4">
          <RegimeView
            result={oldResult}
            color="indigo"
            best={oldIsBetter}
            info={{
              title: input.taxpayerType === "couple" ? t('oldSlabCouple') : t('oldSlabIndividual'),
              desc: t('oldSlabDesc'),
              slabs: oldSlabsInfo,
            }}
          />
          <RegimeView
            result={newResult}
            color="teal"
            best={newIsBetter}
            info={{
              title: t('newSlabAll'),
              desc: t('newSlabDesc'),
              slabs: newSlabsInfo,
            }}
          />
        </Grid>
      )}



      <ShareTaxDetails input={input} open={shareOpen} onOpenChange={setShareOpen} />
    </Flex>
  );
}
