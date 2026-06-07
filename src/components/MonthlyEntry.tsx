import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Flex, Text, Heading, Box, Button, Table, Grid, Switch, TextField, Card, Badge, Dialog } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";
import { useIsDesktop } from "../hooks/useIsDesktop";
import Calculator from "./Calculator";

import { useTranslation } from "../i18n/LanguageContext";
import { calculateVariableTDS, npr } from "../engine/taxEngine";
import { oldRegime, newRegime } from "../engine/scenarios";
import RegimeView from "./RegimeView";

interface Props {
  onBack?: () => void;
}

const MONTH_NAMES = [
  "Shrawan",
  "Bhadra",
  "Ashwin (Dashain)",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
  "Baishakh",
  "Jestha",
  "Ashadh"
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      size="1"
      weight="bold"
      color="gray"
      style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}
    >
      {children}
    </Text>
  );
}

function convertToDevanagari(numStr: string): string {
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return numStr.replace(/[0-9]/g, (digit) => devanagariDigits[parseInt(digit)]);
}

function formatNumberWithCommas(value: number, language: string = 'en'): string {
  if (value === 0) return "";
  const formatted = value.toLocaleString("en-IN");
  if (language === 'ne') {
    return convertToDevanagari(formatted);
  }
  return formatted;
}

function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  const devanagariToWestern: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  const westernValue = value.replace(/[०१२३४५६७८९]/g, (digit) => devanagariToWestern[digit]);
  const parsed = parseInt(westernValue.replace(/,/g, ""), 10);
  return isNaN(parsed) ? 0 : parsed;
}

const CalcIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 5h1M5 8h1M5 11h1M8 5h3M8 8h3M8 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function MonthlyEntry({ onBack: _onBack }: Props) {
  const { t, language } = useTranslation();
  const currency = t('currency');
  const isDesktop = useIsDesktop();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"config" | "deductions" | "quickfill">("config");

  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState<string | null>(null);
  const [calculatorInitialValue, setCalculatorInitialValue] = useState(0);

  const openCalculator = (field: string, value: number) => {
    setCalculatorTarget(field);
    setCalculatorInitialValue(value);
    setCalculatorOpen(true);
  };

  const handleCalculatorResult = (value: number) => {
    if (calculatorTarget) {
      setVarInput((prev) => ({ ...prev, [calculatorTarget]: value }));
    }
  };

  const [varInput, setVarInput] = useState(() => ({
    fiscalYear: "2082/83",
    taxpayerType: "individual" as "individual" | "couple",
    contributingSSF: false,
    isFemaleOnlyRemuneration: false,
    annualAllowance: 0,
    annualBonus: 0,
    otherIncome: 0,
    insurance: 0,
    medicalInsurance: 0,
    donations: 0,
    monthsData: MONTH_NAMES.map((m) => ({
      monthName: m,
      basicSalary: 0,
      ssf: 0,
      pf: 0,
      cit: 0,
    })),
  }));

  // Quick fill inputs
  const [fillBasic, setFillBasic] = useState("");
  const [fillSSF, setFillSSF] = useState("");
  const [fillPF, setFillPF] = useState("");
  const [fillCIT, setFillCIT] = useState("");

  const handleQuickFill = () => {
    const basic = parseFloat(fillBasic) || 0;
    const ssf = parseFloat(fillSSF) || 0;
    const pf = parseFloat(fillPF) || 0;
    const cit = parseFloat(fillCIT) || 0;

    setVarInput((prev) => ({
      ...prev,
      monthsData: prev.monthsData.map((row) => ({
        ...row,
        basicSalary: basic || row.basicSalary,
        ssf: ssf || row.ssf,
        pf: pf || row.pf,
        cit: cit || row.cit,
      })),
    }));
  };

  const handleAutoCalcSSF = () => {
    setVarInput((prev) => ({
      ...prev,
      monthsData: prev.monthsData.map((row) => {
        const calculatedSSF = prev.contributingSSF ? Math.round(row.basicSalary * 0.11) : 0;
        const calculatedPF = Math.round(row.basicSalary * 0.10);
        return {
          ...row,
          ssf: calculatedSSF,
          pf: calculatedPF,
        };
      }),
    }));
  };

  const handleClearAll = () => {
    setVarInput((prev) => ({
      ...prev,
      annualAllowance: 0,
      annualBonus: 0,
      monthsData: MONTH_NAMES.map((m) => ({
        monthName: m,
        basicSalary: 0,
        ssf: 0,
        pf: 0,
        cit: 0,
      })),
    }));
    setFillBasic("");
    setFillSSF("");
    setFillPF("");
    setFillCIT("");
  };

  const handleResetFillFields = () => {
    setFillBasic("");
    setFillSSF("");
    setFillPF("");
    setFillCIT("");
  };

  // Run calculation for both regimes
  const oldResult = useMemo(() => calculateVariableTDS(varInput, oldRegime), [varInput]);
  const newResult = useMemo(() => calculateVariableTDS(varInput, newRegime), [varInput]);

  const savingsYearly = oldResult.totalTax - newResult.totalTax;
  const newIsBetter = savingsYearly > 0;
  const oldIsBetter = savingsYearly < 0;
  const neutral = Math.abs(savingsYearly) < 1;
  const accent = neutral ? "gray" : newIsBetter ? "teal" : "indigo";

  const updateRowField = (index: number, field: keyof typeof varInput.monthsData[0], val: number) => {
    setVarInput((prev) => {
      const updated = [...prev.monthsData];
      updated[index] = {
        ...updated[index],
        [field]: val,
      };
      // If SSF contribution is checked, auto-calculate SSF when basic salary changes
      if (field === "basicSalary" && prev.contributingSSF) {
        updated[index].ssf = Math.round(val * 0.11);
      }
      return { ...prev, monthsData: updated };
    });
  };

  return (
    <Flex direction="column" gap="5" pb="8" className="content-fade">
      {/* Header Info */}
      <Flex align="center" gap="3" justify="between" wrap="wrap">
        <Heading size="6">12-Month Variable Salary Entry</Heading>
        <Badge color="indigo" size="2">
          Variable Income Mode
        </Badge>
      </Flex>

      {/* Global Config Cards - Desktop Only */}
      {isDesktop && (
        <Grid columns={{ initial: "1", md: "3" }} gap="4">
        {/* Taxpayer Config */}
        <Card p="4">
          <Flex direction="column" gap="3">
            <SectionLabel>{t('taxpayerType')}</SectionLabel>
            <Flex gap="2">
              <Box
                onClick={() => setVarInput((p) => ({ ...p, taxpayerType: "individual" }))}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-3)",
                  border: varInput.taxpayerType === "individual" ? "2px solid var(--indigo-9)" : "1px solid var(--gray-a3)",
                  background: varInput.taxpayerType === "individual" ? "var(--indigo-2)" : "var(--gray-2)",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <Text size="2" weight="bold">{t('individual')}</Text>
              </Box>
              <Box
                onClick={() => setVarInput((p) => ({ ...p, taxpayerType: "couple" }))}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-3)",
                  border: varInput.taxpayerType === "couple" ? "2px solid var(--indigo-9)" : "1px solid var(--gray-a3)",
                  background: varInput.taxpayerType === "couple" ? "var(--indigo-2)" : "var(--gray-2)",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <Text size="2" weight="bold">{t('couple')}</Text>
              </Box>
            </Flex>

            <Flex align="center" justify="between" mt="2" pt="2" style={{ borderTop: "1px solid var(--gray-a3)" }}>
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">{t('contributingSSF')}</Text>
                <Text size="1" color="gray">{t('ssfNote')}</Text>
              </Flex>
              <Switch
                checked={varInput.contributingSSF}
                onCheckedChange={(v) => setVarInput((p) => {
                  const updated = { ...p, contributingSSF: v };
                  if (!v) {
                    updated.monthsData = p.monthsData.map((row) => ({ ...row, ssf: 0 }));
                  }
                  return updated;
                })}
              />
            </Flex>

            <Flex align="center" justify="between" pt="2" style={{ borderTop: "1px solid var(--gray-a3)" }}>
              <Box>
                <Text size="2" weight="medium">{t('femaleOnlyRemuneration')}</Text>
              </Box>
              <Switch
                checked={varInput.isFemaleOnlyRemuneration}
                onCheckedChange={(v) => setVarInput((p) => ({ ...p, isFemaleOnlyRemuneration: v }))}
              />
            </Flex>
          </Flex>
        </Card>

        {/* Annual Deductions */}
        <Card p="4">
          <Flex direction="column" gap="3">
            <SectionLabel>Annual Income & Deductions</SectionLabel>
            <Flex direction="column" gap="3">
              <label>
                <Text size="1" color="gray" mb="1" as="div">Annual Allowances</Text>
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9०१२३४५६७८९]*"
                  min={0}
                  value={formatNumberWithCommas(varInput.annualAllowance, language)}
                  size="3"
                  radius="large"
                  placeholder="0"
                  onChange={(e) => setVarInput((p) => ({ ...p, annualAllowance: parseFormattedNumber(e.target.value) }))}
                  style={{ textAlign: "right" }}
                  className="tnum"
                >
                  <TextField.Slot>
                    <Text size="1" color="gray">{currency}</Text>
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    <Box
                      onClick={() => openCalculator("annualAllowance", varInput.annualAllowance)}
                      style={{
                        cursor: "pointer",
                        opacity: 0.6,
                        display: "flex",
                        alignItems: "center",
                        padding: "2px 4px",
                        borderRadius: "var(--radius-1)",
                      }}
                    >
                      <CalcIcon />
                    </Box>
                  </TextField.Slot>
                </TextField.Root>
              </label>
              <label>
                <Text size="1" color="gray" mb="1" as="div">Annual Bonus / OT</Text>
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9०१२३४५६७८९]*"
                  min={0}
                  value={formatNumberWithCommas(varInput.annualBonus, language)}
                  size="3"
                  radius="large"
                  placeholder="0"
                  onChange={(e) => setVarInput((p) => ({ ...p, annualBonus: parseFormattedNumber(e.target.value) }))}
                  style={{ textAlign: "right" }}
                  className="tnum"
                >
                  <TextField.Slot>
                    <Text size="1" color="gray">{currency}</Text>
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    <Box
                      onClick={() => openCalculator("annualBonus", varInput.annualBonus)}
                      style={{
                        cursor: "pointer",
                        opacity: 0.6,
                        display: "flex",
                        alignItems: "center",
                        padding: "2px 4px",
                        borderRadius: "var(--radius-1)",
                      }}
                    >
                      <CalcIcon />
                    </Box>
                  </TextField.Slot>
                </TextField.Root>
              </label>
              <label>
                <Text size="1" color="gray" mb="1" as="div">Life Insurance Premium</Text>
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9०१२३४५६७८९]*"
                  min={0}
                  value={formatNumberWithCommas(varInput.insurance, language)}
                  size="3"
                  radius="large"
                  placeholder="0"
                  onChange={(e) => setVarInput((p) => ({ ...p, insurance: parseFormattedNumber(e.target.value) }))}
                  style={{ textAlign: "right" }}
                  className="tnum"
                >
                  <TextField.Slot>
                    <Text size="1" color="gray">{currency}</Text>
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    <Box
                      onClick={() => openCalculator("insurance", varInput.insurance)}
                      style={{
                        cursor: "pointer",
                        opacity: 0.6,
                        display: "flex",
                        alignItems: "center",
                        padding: "2px 4px",
                        borderRadius: "var(--radius-1)",
                      }}
                    >
                      <CalcIcon />
                    </Box>
                  </TextField.Slot>
                </TextField.Root>
              </label>
              <label>
                <Text size="1" color="gray" mb="1" as="div">Medical Insurance Premium</Text>
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9०१२३४५६७८९]*"
                  min={0}
                  value={formatNumberWithCommas(varInput.medicalInsurance, language)}
                  size="3"
                  radius="large"
                  placeholder="0"
                  onChange={(e) => setVarInput((p) => ({ ...p, medicalInsurance: parseFormattedNumber(e.target.value) }))}
                  style={{ textAlign: "right" }}
                  className="tnum"
                >
                  <TextField.Slot>
                    <Text size="1" color="gray">{currency}</Text>
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    <Box
                      onClick={() => openCalculator("medicalInsurance", varInput.medicalInsurance)}
                      style={{
                        cursor: "pointer",
                        opacity: 0.6,
                        display: "flex",
                        alignItems: "center",
                        padding: "2px 4px",
                        borderRadius: "var(--radius-1)",
                      }}
                    >
                      <CalcIcon />
                    </Box>
                  </TextField.Slot>
                </TextField.Root>
              </label>
              <label>
                <Text size="1" color="gray" mb="1" as="div">Donations</Text>
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9०१२३४५६७८९]*"
                  min={0}
                  value={formatNumberWithCommas(varInput.donations, language)}
                  size="3"
                  radius="large"
                  placeholder="0"
                  onChange={(e) => setVarInput((p) => ({ ...p, donations: parseFormattedNumber(e.target.value) }))}
                  style={{ textAlign: "right" }}
                  className="tnum"
                >
                  <TextField.Slot>
                    <Text size="1" color="gray">{currency}</Text>
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    <Box
                      onClick={() => openCalculator("donations", varInput.donations)}
                      style={{
                        cursor: "pointer",
                        opacity: 0.6,
                        display: "flex",
                        alignItems: "center",
                        padding: "2px 4px",
                        borderRadius: "var(--radius-1)",
                      }}
                    >
                      <CalcIcon />
                    </Box>
                  </TextField.Slot>
                </TextField.Root>
              </label>
            </Flex>
          </Flex>
        </Card>

        {/* Quick Fill Actions */}
        <Card p="4">
          <Flex direction="column" gap="3">
            <SectionLabel>{t('quickFillHelpers')}</SectionLabel>
            <Flex direction="column" gap="3">
              <label>
                <Text size="1" color="gray" mb="1" as="div">{t('basicSalary')}</Text>
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9०१२३४५६७८९]*"
                  value={formatNumberWithCommas(parseFloat(fillBasic) || 0, language)}
                  size="3"
                  radius="large"
                  onChange={(e) => setFillBasic(e.target.value)}
                  style={{ textAlign: "right" }}
                  className="tnum"
                >
                  <TextField.Slot>
                    <Text size="1" color="gray">{currency}</Text>
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    <Box
                      onClick={() => openCalculator("fillBasic", parseFloat(fillBasic) || 0)}
                      style={{
                        cursor: "pointer",
                        opacity: 0.6,
                        display: "flex",
                        alignItems: "center",
                        padding: "2px 4px",
                        borderRadius: "var(--radius-1)",
                      }}
                    >
                      <CalcIcon />
                    </Box>
                  </TextField.Slot>
                </TextField.Root>
              </label>
              <label>
                <Text size="1" color="gray" mb="1" as="div">{t('ssf')}</Text>
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9०१२३४५६७८९]*"
                  value={formatNumberWithCommas(parseFloat(fillSSF) || 0, language)}
                  size="3"
                  radius="large"
                  disabled={!varInput.contributingSSF}
                  style={{ opacity: varInput.contributingSSF ? 1 : 0.45, textAlign: "right" }}
                  className="tnum"
                  onChange={(e) => setFillSSF(e.target.value)}
                >
                  <TextField.Slot>
                    <Text size="1" color="gray">{currency}</Text>
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    <Box
                      onClick={() => openCalculator("fillSSF", parseFloat(fillSSF) || 0)}
                      style={{
                        cursor: varInput.contributingSSF ? "pointer" : "not-allowed",
                        opacity: varInput.contributingSSF ? 0.6 : 0.3,
                        display: "flex",
                        alignItems: "center",
                        padding: "2px 4px",
                        borderRadius: "var(--radius-1)",
                      }}
                    >
                      <CalcIcon />
                    </Box>
                  </TextField.Slot>
                </TextField.Root>
              </label>
              <label>
                <Text size="1" color="gray" mb="1" as="div">{t('providentFund')}</Text>
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9०१२३४५६७८९]*"
                  value={formatNumberWithCommas(parseFloat(fillPF) || 0, language)}
                  size="3"
                  radius="large"
                  onChange={(e) => setFillPF(e.target.value)}
                  style={{ textAlign: "right" }}
                  className="tnum"
                >
                  <TextField.Slot>
                    <Text size="1" color="gray">{currency}</Text>
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    <Box
                      onClick={() => openCalculator("fillPF", parseFloat(fillPF) || 0)}
                      style={{
                        cursor: "pointer",
                        opacity: 0.6,
                        display: "flex",
                        alignItems: "center",
                        padding: "2px 4px",
                        borderRadius: "var(--radius-1)",
                      }}
                    >
                      <CalcIcon />
                    </Box>
                  </TextField.Slot>
                </TextField.Root>
              </label>
              <label>
                <Text size="1" color="gray" mb="1" as="div">{t('cit')}</Text>
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9०१२३४५६७८९]*"
                  value={formatNumberWithCommas(parseFloat(fillCIT) || 0, language)}
                  size="3"
                  radius="large"
                  onChange={(e) => setFillCIT(e.target.value)}
                  style={{ textAlign: "right" }}
                  className="tnum"
                >
                  <TextField.Slot>
                    <Text size="1" color="gray">{currency}</Text>
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    <Box
                      onClick={() => openCalculator("fillCIT", parseFloat(fillCIT) || 0)}
                      style={{
                        cursor: "pointer",
                        opacity: 0.6,
                        display: "flex",
                        alignItems: "center",
                        padding: "2px 4px",
                        borderRadius: "var(--radius-1)",
                      }}
                    >
                      <CalcIcon />
                    </Box>
                  </TextField.Slot>
                </TextField.Root>
              </label>
            </Flex>
            <Flex gap="2" wrap="wrap">
              <Button style={{ flex: 1, cursor: "pointer", minWidth: 100 }} onClick={handleQuickFill} variant="solid">
                {t('applyFill')}
              </Button>
              <Button style={{ flex: 1, cursor: "pointer", minWidth: 100 }} onClick={handleAutoCalcSSF} variant="outline">
                {t('autoSsfpf')}
              </Button>
            </Flex>
            <Flex gap="2" wrap="wrap">
              <Button style={{ flex: 1, cursor: "pointer", minWidth: 100 }} onClick={handleResetFillFields} variant="ghost" color="gray">
                {t('resetFields')}
              </Button>
              <Button style={{ flex: 1, cursor: "pointer", minWidth: 100 }} onClick={handleClearAll} variant="ghost" color="red">
                {t('clearAllData')}
              </Button>
            </Flex>
            <Text size="1" color="gray">
              {t('quickFillNote')}
            </Text>
          </Flex>
        </Card>
      </Grid>
      )}

      {/* Main Tabular Input */}
      <Box
        style={{
          background: "var(--color-panel-solid)",
          border: "1px solid var(--gray-a4)",
          borderRadius: "var(--radius-4)",
          overflowX: "auto",
        }}
      >
        <Table.Root variant="surface" style={{ minWidth: 900 }}>
          <Table.Header>
            <Table.Row style={{ background: "var(--gray-3)" }}>
              <Table.ColumnHeaderCell style={{ width: 140 }}>Month</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Basic Salary</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ opacity: varInput.contributingSSF ? 1 : 0.45 }}>
                SSF {!varInput.contributingSSF && <Text size="1" color="gray">(disabled)</Text>}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>PF</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>CIT</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ color: "var(--indigo-10)" }}>TDS (Old/New)</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ color: "var(--teal-10)" }}>Net Salary (Old/New)</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {varInput.monthsData.map((row, idx) => {
              const oldRowResult = oldResult.monthlyRows[idx];
              const newRowResult = newResult.monthlyRows[idx];

              return (
                <Table.Row key={row.monthName} style={{ background: idx % 2 === 0 ? "var(--color-panel-solid)" : "var(--gray-2)" }}>
                  <Table.RowHeaderCell style={{ verticalAlign: "middle" }}>
                    <Text weight="bold">{row.monthName}</Text>
                  </Table.RowHeaderCell>
                  <Table.Cell>
                    <TextField.Root
                      type="number"
                      size="2"
                      value={row.basicSalary || ""}
                      onChange={(e) => updateRowField(idx, "basicSalary", parseFloat(e.target.value) || 0)}
                      style={{ width: "100%" }}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <TextField.Root
                      type="number"
                      size="2"
                      value={row.ssf || ""}
                      onChange={(e) => updateRowField(idx, "ssf", parseFloat(e.target.value) || 0)}
                      disabled={!varInput.contributingSSF}
                      style={{ width: "100%", opacity: varInput.contributingSSF ? 1 : 0.45 }}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <TextField.Root
                      type="number"
                      size="2"
                      value={row.pf || ""}
                      onChange={(e) => updateRowField(idx, "pf", parseFloat(e.target.value) || 0)}
                      style={{ width: "100%" }}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <TextField.Root
                      type="number"
                      size="2"
                      value={row.cit || ""}
                      onChange={(e) => updateRowField(idx, "cit", parseFloat(e.target.value) || 0)}
                      style={{ width: "100%" }}
                    />
                  </Table.Cell>
                  <Table.Cell style={{ verticalAlign: "middle" }}>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="indigo" weight="bold">
                        Old: {npr(oldRowResult?.tds || 0, language, "")}
                      </Text>
                      <Text size="1" color="teal" weight="bold">
                        New: {npr(newRowResult?.tds || 0, language, "")}
                      </Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell style={{ verticalAlign: "middle" }}>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">
                        Old: {npr(oldRowResult?.netSalary || 0, language, "")}
                      </Text>
                      <Text size="1" color="gray">
                        New: {npr(newRowResult?.netSalary || 0, language, "")}
                      </Text>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Savings Hero Banner */}
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
            <Text size="2" color="gray" as="div">
              Both regimes result in the same tax amount.
            </Text>
          </Box>
        ) : (
          <Box>
            <Flex align="center" gap="1" mb="2">
              <Text
                size="1"
                weight="bold"
                style={{
                  color: newIsBetter ? `var(--${accent}-11)` : "var(--red-11)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {newIsBetter ? "New Slab Saves You" : "Old Slab Saves You"}
              </Text>
            </Flex>
            <Heading size="8" as="h2" weight="bold" className="tnum" style={{ color: `var(--${accent}-11)`, lineHeight: 1 }}>
              {npr(Math.abs(savingsYearly), language, currency)}
            </Heading>
            <Text size="1" color="gray" as="div" mt="1">
              per year under the preferred regime
            </Text>
          </Box>
        )}
      </Box>

      {/* Allowed Deductions Table */}
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
            Allowed Deductions
          </Text>
        </Box>
        <Table.Root variant="ghost" style={{ border: "none", width: "100%" }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell style={{ padding: "10px 16px", color: "var(--gray-11)", fontWeight: 600 }}>
                Deduction
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ padding: "10px 16px", textAlign: "right", color: "var(--gray-11)", fontWeight: 600 }}>
                Entered Amount
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ padding: "10px 16px", textAlign: "right", color: "var(--gray-11)", fontWeight: 600 }}>
                Allowed Amount
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {oldResult.regimeResult.deductionBreakdown.map((item, i) => {
              const labelMap: Record<string, string> = {
                retirement: "Retirement Fund (SSF + PF + CIT)",
                lifeInsurance: "Life Insurance Premium",
                medicalInsurance: "Medical Insurance Premium",
                donations: "Donations",
              };
              return (
                <Table.Row key={item.key} style={{ borderTop: "1px solid var(--gray-a3)", background: i % 2 === 0 ? "var(--color-panel-solid)" : "var(--gray-2)" }}>
                  <Table.Cell style={{ padding: "12px 16px" }}>
                    <Flex align="center" gap="2">
                      <Text size="2" color="gray" weight="medium">{labelMap[item.key] ?? item.key}</Text>
                      {item.capped && (
                        <Badge color="amber" variant="soft" size="1" radius="full">
                          Capped
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
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Side-by-Side Comparison Summary */}
      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        {/* Old Regime Result Card */}
        <Card p="4" style={{ borderColor: oldIsBetter ? "var(--indigo-8)" : "transparent" }}>
          <Flex direction="column" gap="3">
            <Flex align="center" justify="between">
              <Heading size="4" color="indigo">
                {t('oldRegimeName')}
              </Heading>
              {oldIsBetter && <Badge color="indigo">Better</Badge>}
            </Flex>
            <Grid columns="2" gap="3">
              <Box>
                <Text size="1" color="gray">Total Gross Income</Text>
                <Text size="3" weight="bold">{npr(oldResult.totalGrossIncome, language, currency)}</Text>
              </Box>
              <Box>
                <Text size="1" color="gray">Total Deductions</Text>
                <Text size="3" weight="bold">{npr(oldResult.totalDeductions, language, currency)}</Text>
              </Box>
              <Box>
                <Text size="1" color="gray">Taxable Income</Text>
                <Text size="3" weight="bold">{npr(oldResult.taxableIncome, language, currency)}</Text>
              </Box>
              <Box>
                <Text size="1" color="gray">Total Annual TDS</Text>
                <Text size="3" weight="bold" color="indigo">{npr(oldResult.totalTax, language, currency)}</Text>
              </Box>
            </Grid>
          </Flex>
        </Card>

        {/* New Regime Result Card */}
        <Card p="4" style={{ borderColor: newIsBetter ? "var(--teal-8)" : "transparent" }}>
          <Flex direction="column" gap="3">
            <Flex align="center" justify="between">
              <Heading size="4" color="teal">
                {t('newRegimeName')}
              </Heading>
              {newIsBetter && <Badge color="teal">Better</Badge>}
            </Flex>
            <Grid columns="2" gap="3">
              <Box>
                <Text size="1" color="gray">Total Gross Income</Text>
                <Text size="3" weight="bold">{npr(newResult.totalGrossIncome, language, currency)}</Text>
              </Box>
              <Box>
                <Text size="1" color="gray">Total Deductions</Text>
                <Text size="3" weight="bold">{npr(newResult.totalDeductions, language, currency)}</Text>
              </Box>
              <Box>
                <Text size="1" color="gray">Taxable Income</Text>
                <Text size="3" weight="bold">{npr(newResult.taxableIncome, language, currency)}</Text>
              </Box>
              <Box>
                <Text size="1" color="gray">Total Annual TDS</Text>
                <Text size="3" weight="bold" color="teal">{npr(newResult.totalTax, language, currency)}</Text>
              </Box>
            </Grid>
          </Flex>
        </Card>
      </Grid>

      {/* Tax Slab Breakdown for both regimes */}
      <Heading size="5" mt="4">Tax Slab Breakdowns (Annual)</Heading>
      <Grid columns={{ initial: "1", lg: "2" }} gap="4">
        <RegimeView
          result={oldResult.regimeResult}
          color="indigo"
          best={oldIsBetter}
          info={{
            title: varInput.taxpayerType === "couple" ? t('oldSlabCouple') : t('oldSlabIndividual'),
            desc: t('oldSlabDesc'),
            slabs: varInput.taxpayerType === "couple"
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
              ],
          }}
        />

        <RegimeView
          result={newResult.regimeResult}
          color="teal"
          best={newIsBetter}
          info={{
            title: t('newSlabAll'),
            desc: t('newSlabDesc'),
            slabs: [
              [`${t('upTo')} 10,00,000`, "1% (0% SSF)"],
              ["10L – 15L", "10%"],
              ["15L – 25L", "20%"],
              ["25L – 40L", "27%"],
              [`${t('above')} 40L`, "29%"],
            ],
          }}
        />
      </Grid>

      {/* Mobile Floating Action Button */}
      {!isDesktop && !settingsOpen && typeof document !== "undefined" && createPortal(
        <Button
          onClick={() => setSettingsOpen(true)}
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--indigo-9)",
            color: "white",
            boxShadow: "0 4px 12px var(--indigo-a7)",
            cursor: "pointer",
            zIndex: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PlusIcon width="24" height="24" />
        </Button>,
        document.body
      )}

      {/* Mobile Settings Dialog */}
      <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Dialog.Content
          className="settings-bottom-sheet"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            top: "auto",
            borderRadius: "16px 16px 0 0",
            padding: 0,
            margin: 0,
            minHeight: "75dvh",
            maxHeight: "75dvh",
            zIndex: 100,
            animation: settingsOpen ? "slideInUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)" : "slideOutDown 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <Flex direction="column" style={{ height: "100%" }}>
            {/* Header with tabs */}
            <Box px="4" py="3" style={{ borderBottom: "1px solid var(--gray-a4)", background: "var(--color-panel-solid)" }}>
              <Flex justify="between" align="center" mb="3">
                <Text size="4" weight="bold">{t('settings')}</Text>
                <Dialog.Close>
                  <Button variant="ghost" color="gray" size="2" style={{ cursor: "pointer" }}>✕</Button>
                </Dialog.Close>
              </Flex>
              <Flex gap="2">
                <Button
                  variant={settingsTab === "config" ? "solid" : "ghost"}
                  color={settingsTab === "config" ? "indigo" : "gray"}
                  size="1"
                  onClick={() => setSettingsTab("config")}
                  style={{ flex: 1, cursor: "pointer" }}
                >
                  {t('config')}
                </Button>
                <Button
                  variant={settingsTab === "deductions" ? "solid" : "ghost"}
                  color={settingsTab === "deductions" ? "indigo" : "gray"}
                  size="1"
                  onClick={() => setSettingsTab("deductions")}
                  style={{ flex: 1, cursor: "pointer" }}
                >
                  {t('deductionsTab')}
                </Button>
                <Button
                  variant={settingsTab === "quickfill" ? "solid" : "ghost"}
                  color={settingsTab === "quickfill" ? "indigo" : "gray"}
                  size="1"
                  onClick={() => setSettingsTab("quickfill")}
                  style={{ flex: 1, cursor: "pointer" }}
                >
                  {t('quickFill')}
                </Button>
              </Flex>
            </Box>

            {/* Content */}
            <Box p="4" style={{ flex: 1, overflowY: "auto" }}>
              {settingsTab === "config" && (
                <Flex direction="column" gap="4">
                  <SectionLabel>{t('taxpayerType')}</SectionLabel>
                  <Flex gap="2">
                    <Box
                      onClick={() => setVarInput((p) => ({ ...p, taxpayerType: "individual" }))}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: "var(--radius-3)",
                        border: varInput.taxpayerType === "individual" ? "2px solid var(--indigo-9)" : "1px solid var(--gray-a3)",
                        background: varInput.taxpayerType === "individual" ? "var(--indigo-2)" : "var(--gray-2)",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <Text size="2" weight="bold">{t('individual')}</Text>
                    </Box>
                    <Box
                      onClick={() => setVarInput((p) => ({ ...p, taxpayerType: "couple" }))}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: "var(--radius-3)",
                        border: varInput.taxpayerType === "couple" ? "2px solid var(--indigo-9)" : "1px solid var(--gray-a3)",
                        background: varInput.taxpayerType === "couple" ? "var(--indigo-2)" : "var(--gray-2)",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <Text size="2" weight="bold">{t('couple')}</Text>
                    </Box>
                  </Flex>

                  <Flex align="center" justify="between" pt="2" style={{ borderTop: "1px solid var(--gray-a3)" }}>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">{t('contributingSSF')}</Text>
                      <Text size="1" color="gray">{t('ssfNote')}</Text>
                    </Flex>
                    <Switch
                      checked={varInput.contributingSSF}
                      onCheckedChange={(v) => setVarInput((p) => {
                        const updated = { ...p, contributingSSF: v };
                        if (!v) {
                          updated.monthsData = p.monthsData.map((row) => ({ ...row, ssf: 0 }));
                        }
                        return updated;
                      })}
                    />
                  </Flex>

                  <Flex align="center" justify="between" pt="2" style={{ borderTop: "1px solid var(--gray-a3)" }}>
                    <Box>
                      <Text size="2" weight="medium">{t('femaleOnlyRemuneration')}</Text>
                    </Box>
                    <Switch
                      checked={varInput.isFemaleOnlyRemuneration}
                      onCheckedChange={(v) => setVarInput((p) => ({ ...p, isFemaleOnlyRemuneration: v }))}
                    />
                  </Flex>
                </Flex>
              )}

              {settingsTab === "deductions" && (
                <Flex direction="column" gap="3">
                  <SectionLabel>{t('annualIncomeDeductions')}</SectionLabel>
                  <Flex direction="column" gap="3">
                    <label>
                      <Text size="1" color="gray" mb="1" as="div">{t('annualAllowances')}</Text>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        min={0}
                        value={formatNumberWithCommas(varInput.annualAllowance, language)}
                        size="3"
                        radius="large"
                        placeholder="0"
                        onChange={(e) => setVarInput((p) => ({ ...p, annualAllowance: parseFormattedNumber(e.target.value) }))}
                        style={{ textAlign: "right" }}
                        className="tnum"
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{currency}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator("annualAllowance", varInput.annualAllowance)}
                            style={{
                              cursor: "pointer",
                              opacity: 0.6,
                              display: "flex",
                              alignItems: "center",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-1)",
                            }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </label>
                    <label>
                      <Text size="1" color="gray" mb="1" as="div">{t('annualBonusOt')}</Text>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        min={0}
                        value={formatNumberWithCommas(varInput.annualBonus, language)}
                        size="3"
                        radius="large"
                        placeholder="0"
                        onChange={(e) => setVarInput((p) => ({ ...p, annualBonus: parseFormattedNumber(e.target.value) }))}
                        style={{ textAlign: "right" }}
                        className="tnum"
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{currency}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator("annualBonus", varInput.annualBonus)}
                            style={{
                              cursor: "pointer",
                              opacity: 0.6,
                              display: "flex",
                              alignItems: "center",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-1)",
                            }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </label>
                    <label>
                      <Text size="1" color="gray" mb="1" as="div">{t('lifeInsurancePremium')}</Text>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        min={0}
                        value={formatNumberWithCommas(varInput.insurance, language)}
                        size="3"
                        radius="large"
                        placeholder="0"
                        onChange={(e) => setVarInput((p) => ({ ...p, insurance: parseFormattedNumber(e.target.value) }))}
                        style={{ textAlign: "right" }}
                        className="tnum"
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{currency}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator("insurance", varInput.insurance)}
                            style={{
                              cursor: "pointer",
                              opacity: 0.6,
                              display: "flex",
                              alignItems: "center",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-1)",
                            }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </label>
                    <label>
                      <Text size="1" color="gray" mb="1" as="div">{t('medicalInsurancePremium')}</Text>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        min={0}
                        value={formatNumberWithCommas(varInput.medicalInsurance, language)}
                        size="3"
                        radius="large"
                        placeholder="0"
                        onChange={(e) => setVarInput((p) => ({ ...p, medicalInsurance: parseFormattedNumber(e.target.value) }))}
                        style={{ textAlign: "right" }}
                        className="tnum"
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{currency}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator("medicalInsurance", varInput.medicalInsurance)}
                            style={{
                              cursor: "pointer",
                              opacity: 0.6,
                              display: "flex",
                              alignItems: "center",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-1)",
                            }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </label>
                    <label>
                      <Text size="1" color="gray" mb="1" as="div">Donations</Text>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        min={0}
                        value={formatNumberWithCommas(varInput.donations, language)}
                        size="3"
                        radius="large"
                        placeholder="0"
                        onChange={(e) => setVarInput((p) => ({ ...p, donations: parseFormattedNumber(e.target.value) }))}
                        style={{ textAlign: "right" }}
                        className="tnum"
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{currency}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator("donations", varInput.donations)}
                            style={{
                              cursor: "pointer",
                              opacity: 0.6,
                              display: "flex",
                              alignItems: "center",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-1)",
                            }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </label>
                  </Flex>
                </Flex>
              )}

              {settingsTab === "quickfill" && (
                <Flex direction="column" gap="3">
                  <SectionLabel>{t('quickFillHelpers')}</SectionLabel>
                  <Flex direction="column" gap="3">
                    <label>
                      <Text size="1" color="gray" mb="1" as="div">{t('basicSalary')}</Text>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        value={formatNumberWithCommas(parseFloat(fillBasic) || 0, language)}
                        size="3"
                        radius="large"
                        onChange={(e) => setFillBasic(e.target.value)}
                        style={{ textAlign: "right" }}
                        className="tnum"
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{currency}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator("fillBasic", parseFloat(fillBasic) || 0)}
                            style={{
                              cursor: "pointer",
                              opacity: 0.6,
                              display: "flex",
                              alignItems: "center",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-1)",
                            }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </label>
                    <label>
                      <Text size="1" color="gray" mb="1" as="div">{t('ssf')}</Text>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        value={formatNumberWithCommas(parseFloat(fillSSF) || 0, language)}
                        size="3"
                        radius="large"
                        disabled={!varInput.contributingSSF}
                        style={{ opacity: varInput.contributingSSF ? 1 : 0.45, textAlign: "right" }}
                        className="tnum"
                        onChange={(e) => setFillSSF(e.target.value)}
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{currency}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator("fillSSF", parseFloat(fillSSF) || 0)}
                            style={{
                              cursor: varInput.contributingSSF ? "pointer" : "not-allowed",
                              opacity: varInput.contributingSSF ? 0.6 : 0.3,
                              display: "flex",
                              alignItems: "center",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-1)",
                            }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </label>
                    <label>
                      <Text size="1" color="gray" mb="1" as="div">{t('providentFund')}</Text>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        value={formatNumberWithCommas(parseFloat(fillPF) || 0, language)}
                        size="3"
                        radius="large"
                        onChange={(e) => setFillPF(e.target.value)}
                        style={{ textAlign: "right" }}
                        className="tnum"
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{currency}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator("fillPF", parseFloat(fillPF) || 0)}
                            style={{
                              cursor: "pointer",
                              opacity: 0.6,
                              display: "flex",
                              alignItems: "center",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-1)",
                            }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </label>
                    <label>
                      <Text size="1" color="gray" mb="1" as="div">{t('cit')}</Text>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        value={formatNumberWithCommas(parseFloat(fillCIT) || 0, language)}
                        size="3"
                        radius="large"
                        onChange={(e) => setFillCIT(e.target.value)}
                        style={{ textAlign: "right" }}
                        className="tnum"
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{currency}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator("fillCIT", parseFloat(fillCIT) || 0)}
                            style={{
                              cursor: "pointer",
                              opacity: 0.6,
                              display: "flex",
                              alignItems: "center",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-1)",
                            }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </label>
                  </Flex>
                  <Flex gap="2" wrap="wrap">
                    <Button style={{ flex: 1, cursor: "pointer", minWidth: 100 }} onClick={handleQuickFill} variant="solid">
                      {t('applyFill')}
                    </Button>
                    <Button style={{ flex: 1, cursor: "pointer", minWidth: 100 }} onClick={handleAutoCalcSSF} variant="outline">
                      {t('autoSsfpf')}
                    </Button>
                  </Flex>
                  <Flex gap="2" wrap="wrap">
                    <Button style={{ flex: 1, cursor: "pointer", minWidth: 100 }} onClick={handleResetFillFields} variant="ghost" color="gray">
                      {t('resetFields')}
                    </Button>
                    <Button style={{ flex: 1, cursor: "pointer", minWidth: 100 }} onClick={handleClearAll} variant="ghost" color="red">
                      {t('clearAllData')}
                    </Button>
                  </Flex>
                  <Text size="1" color="gray">
                    {t('quickFillNote')}
                  </Text>
                </Flex>
              )}
            </Box>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Calculator Dialog */}
      <Calculator
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        initialValue={calculatorInitialValue}
        onResult={handleCalculatorResult}
      />
    </Flex>
  );
}
