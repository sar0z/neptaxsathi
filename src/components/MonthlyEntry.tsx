import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Flex, Text, Heading, Box, Button, Table, Grid, Switch, TextField, Card, Badge, Dialog, Popover, Select } from "@radix-ui/themes";

import { PlusIcon, TrashIcon, ChevronDownIcon, Share1Icon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import { useIsDesktop } from "../hooks/useIsDesktop";
import Calculator from "./Calculator";

import { useTranslation } from "../i18n/LanguageContext";
import { calculateVariableTDS, npr } from "../engine/taxEngine";
import { oldRegime, newRegime } from "../engine/scenarios";
import RegimeView from "./RegimeView";
import ShareTaxDetails from "./ShareTaxDetails";

interface Props {
  onBack?: () => void;
  selectedRegime: "old" | "new";
  onRegimeChange: (r: "old" | "new") => void;
}


const MONTH_NAMES = [
  "Shrawan",
  "Bhadra",
  "Ashwin",
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

export default function MonthlyEntry({ onBack: _onBack, selectedRegime, onRegimeChange }: Props) {

  const { t, language } = useTranslation();
  const currency = t('currency');
  const isDesktop = useIsDesktop();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"config" | "deductions" | "quickfill">("config");

  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState<string | null>(null);
  const [calculatorInitialValue, setCalculatorInitialValue] = useState(0);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const openCalculator = (field: string, value: number) => {
    setCalculatorTarget(field);
    setCalculatorInitialValue(value);
    setCalculatorOpen(true);
  };

  const handleCalculatorResult = (value: number) => {
    if (calculatorTarget) {
      if (calculatorTarget === "fillBasic") {
        setFillBasic(value === 0 ? "" : value.toString());
      } else if (calculatorTarget === "fillSSF") {
        setFillSSF(value === 0 ? "" : value.toString());
      } else if (calculatorTarget === "fillPF") {
        setFillPF(value === 0 ? "" : value.toString());
      } else if (calculatorTarget === "fillCIT") {
        setFillCIT(value === 0 ? "" : value.toString());
      } else {
        setVarInput((prev) => ({ ...prev, [calculatorTarget]: value }));
      }
    }
  };

  const addMonthRow = () => {
    setVarInput((prev) => ({
      ...prev,
      monthsData: [
        ...prev.monthsData,
        {
          id: crypto.randomUUID(),
          monthName: "",
          basicSalary: 0,
          ssf: 0,
          pf: 0,
          cit: 0,
        },
      ],
    }));
  };

  const removeMonthRow = (id: string) => {
    setVarInput((prev) => ({
      ...prev,
      monthsData: prev.monthsData.filter((row) => row.id !== id),
    }));
  };

  const updateMonthName = (id: string, monthName: string) => {
    setVarInput((prev) => ({
      ...prev,
      monthsData: prev.monthsData.map((row) =>
        row.id === id ? { ...row, monthName } : row
      ),
    }));
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
      id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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

  // Run calculation for both regimes (needed for regime switching)
  const oldResult = useMemo(() => calculateVariableTDS(varInput, oldRegime), [varInput]);
  const newResult = useMemo(() => calculateVariableTDS(varInput, newRegime), [varInput]);
  const activeVarResult = selectedRegime === "old" ? oldResult : newResult;
  const activeColor: "indigo" | "teal" = selectedRegime === "old" ? "indigo" : "teal";




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
        <Flex gap="3" align="center">
          <Button
            size="2"
            variant="soft"
            color="indigo"
            onClick={() => {
              setShareOpen(true);
              window.umami?.track("share-preview-opened-variable");
            }}
            style={{ cursor: "pointer" }}
          >
            <Share1Icon width="16" height="16" />
            {t("shareTaxDetails")}
          </Button>
          <Badge color="indigo" size="2">
            Variable Income Mode
          </Badge>
        </Flex>
      </Flex>

      {/* Global Config Cards */}
      {isDesktop ? (
        <Grid columns={{ initial: "1", md: "3" }} gap="4">
          {/* Taxpayer Config */}
          <Card size="3">
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

              {/* Tax Regime Selector */}
              <Flex direction="column" gap="1" pt="2" style={{ borderTop: "1px solid var(--gray-a3)" }}>
                <Text size="1" color="gray" weight="medium" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>{t('taxRegime')}</Text>
                <Select.Root value={selectedRegime} onValueChange={(v) => onRegimeChange(v as "old" | "new")}>
                  <Select.Trigger style={{ width: "100%", cursor: "pointer", height: 40, borderRadius: "var(--radius-3)", fontWeight: 600 }} />
                  <Select.Content position="popper">
                    <Select.Item value="old">{t('oldSlabFy')}</Select.Item>
                    <Select.Item value="new">{t('newSlabFy')}</Select.Item>
                  </Select.Content>
                </Select.Root>
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
          <Card size="3">
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
          <Card size="3">
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
                    onChange={(e) => {
                      const parsed = parseFormattedNumber(e.target.value);
                      setFillBasic(parsed === 0 ? "" : parsed.toString());
                    }}
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
                    onChange={(e) => {
                      const parsed = parseFormattedNumber(e.target.value);
                      setFillSSF(parsed === 0 ? "" : parsed.toString());
                    }}
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
                    onChange={(e) => {
                      const parsed = parseFormattedNumber(e.target.value);
                      setFillPF(parsed === 0 ? "" : parsed.toString());
                    }}
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
                    onChange={(e) => {
                      const parsed = parseFormattedNumber(e.target.value);
                      setFillCIT(parsed === 0 ? "" : parsed.toString());
                    }}
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
      ) : (
        /* Mobile-Optimized Tabbed Config/Deductions Card */
        <Card size="2" style={{ background: "var(--color-panel-solid)", border: "1px solid var(--gray-a4)", borderRadius: "var(--radius-4)", boxShadow: "0 2px 8px var(--gray-a2)" }}>
          <Flex direction="column" gap="4">
            <div style={{
              position: "relative",
              display: "flex",
              background: "var(--gray-3)",
              padding: "4px",
              borderRadius: "12px",
              userSelect: "none"
            }}>
              <div style={{
                position: "absolute",
                top: 4,
                bottom: 4,
                width: "calc((100% - 8px) / 3)",
                background: "var(--color-panel-solid)",
                borderRadius: "8px",
                boxShadow: "0 1px 3px var(--gray-a4), 0 1px 2px var(--gray-a3)",
                left: settingsTab === "config" ? "4px" : settingsTab === "deductions" ? "calc(33.333% + 1.33px)" : "calc(66.666% - 1.33px)",
                transition: "left 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                zIndex: 1
              }} />
              <button
                onClick={() => setSettingsTab("config")}
                style={{
                  flex: 1,
                  position: "relative",
                  zIndex: 2,
                  background: "none",
                  border: "none",
                  padding: "8px 0",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: settingsTab === "config" ? "var(--indigo-11)" : "var(--gray-10)",
                  cursor: "pointer",
                  transition: "color 0.2s ease",
                  fontFamily: "var(--font-default)",
                  outline: "none"
                }}
              >
                {t('config')}
              </button>
              <button
                onClick={() => setSettingsTab("deductions")}
                style={{
                  flex: 1,
                  position: "relative",
                  zIndex: 2,
                  background: "none",
                  border: "none",
                  padding: "8px 0",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: settingsTab === "deductions" ? "var(--indigo-11)" : "var(--gray-10)",
                  cursor: "pointer",
                  transition: "color 0.2s ease",
                  fontFamily: "var(--font-default)",
                  outline: "none"
                }}
              >
                {t('deductionsTab')}
              </button>
              <button
                onClick={() => setSettingsTab("quickfill")}
                style={{
                  flex: 1,
                  position: "relative",
                  zIndex: 2,
                  background: "none",
                  border: "none",
                  padding: "8px 0",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: settingsTab === "quickfill" ? "var(--indigo-11)" : "var(--gray-10)",
                  cursor: "pointer",
                  transition: "color 0.2s ease",
                  fontFamily: "var(--font-default)",
                  outline: "none"
                }}
              >
                {t('quickFill')}
              </button>
            </div>

            <Box px="1" style={{ minHeight: 410 }}>
              {settingsTab === "config" && (
                <Flex direction="column" gap="4">
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

                  {/* Tax Regime Selector */}
                  <Flex direction="column" gap="1" pt="2" style={{ borderTop: "1px solid var(--gray-a3)" }}>
                    <Text size="1" color="gray" weight="medium" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>{t('taxRegime')}</Text>
                    <Select.Root value={selectedRegime} onValueChange={(v) => onRegimeChange(v as "old" | "new")}>
                      <Select.Trigger style={{ width: "100%", cursor: "pointer", height: 40, borderRadius: "var(--radius-3)", fontWeight: 600 }} />
                      <Select.Content position="popper">
                        <Select.Item value="old">{t('oldSlabFy')}</Select.Item>
                        <Select.Item value="new">{t('newSlabFy')}</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Flex>

                  <Flex align="center" justify="between" pt="2" style={{ borderTop: "1px solid var(--gray-a3)" }}>
                    <Flex direction="column" gap="1" style={{ flex: 1, paddingRight: 8 }}>
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
                        onChange={(e) => {
                          const parsed = parseFormattedNumber(e.target.value);
                          setFillBasic(parsed === 0 ? "" : parsed.toString());
                        }}
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
                        onChange={(e) => {
                          const parsed = parseFormattedNumber(e.target.value);
                          setFillSSF(parsed === 0 ? "" : parsed.toString());
                        }}
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
                        onChange={(e) => {
                          const parsed = parseFormattedNumber(e.target.value);
                          setFillPF(parsed === 0 ? "" : parsed.toString());
                        }}
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
                        onChange={(e) => {
                          const parsed = parseFormattedNumber(e.target.value);
                          setFillCIT(parsed === 0 ? "" : parsed.toString());
                        }}
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
                  <Flex gap="2" mt="2" wrap="wrap">
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
                  <Text size="1" color="gray" style={{ lineHeight: 1.4 }}>
                    {t('quickFillNote')}
                  </Text>
                </Flex>
              )}
            </Box>
          </Flex>
        </Card>
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
        <Flex justify="between" align="center" p="3" style={{ borderBottom: "1px solid var(--gray-a4)" }}>
          <Text weight="bold">{t('monthlyVariableSalaryEntry')}</Text>
          <Button size="1" onClick={addMonthRow} style={{ cursor: "pointer" }}>
            <PlusIcon width="14" height="14" style={{ marginRight: 4 }} />
            Add Month
          </Button>
        </Flex>

        {/* Desktop Table */}
        {isDesktop ? (
          <Table.Root variant="surface" style={{ minWidth: 900 }}>
            <Table.Header>
              <Table.Row style={{ background: "var(--gray-3)" }}>
                <Table.ColumnHeaderCell style={{ width: 180 }}>Month</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Basic Salary</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ opacity: varInput.contributingSSF ? 1 : 0.45 }}>
                  SSF {!varInput.contributingSSF && <Text size="1" color="gray">(disabled)</Text>}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>PF</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>CIT</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ color: `var(--${activeColor}-10)` }}>TDS</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ color: "var(--gray-10)" }}>Net Salary</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ width: 50 }}></Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {varInput.monthsData.map((row, idx) => {

                return (
                  <Table.Row key={row.id} style={{ background: idx % 2 === 0 ? "var(--color-panel-solid)" : "var(--gray-2)" }}>
                    <Table.RowHeaderCell style={{ verticalAlign: "middle" }}>
                      <TextField.Root
                        size="2"
                        value={row.monthName}
                        onChange={(e) => updateMonthName(row.id, e.target.value)}
                        placeholder="Type month name"
                        style={{ width: "100%" }}
                      />
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
                    <Table.Cell className="tnum" style={{ verticalAlign: "middle", fontWeight: 600, color: `var(--${activeColor}-11)` }}>
                      {npr(selectedRegime === "old" ? (oldResult.monthlyRows[idx]?.tds || 0) : (newResult.monthlyRows[idx]?.tds || 0), language, "")}
                    </Table.Cell>
                    <Table.Cell className="tnum" style={{ verticalAlign: "middle", color: "var(--gray-11)" }}>
                      {npr(selectedRegime === "old" ? (oldResult.monthlyRows[idx]?.netSalary || 0) : (newResult.monthlyRows[idx]?.netSalary || 0), language, "")}
                    </Table.Cell>
                    <Table.Cell style={{ verticalAlign: "middle" }}>
                      <Button
                        variant="ghost"
                        color="red"
                        size="1"
                        onClick={() => removeMonthRow(row.id)}
                        style={{ cursor: "pointer" }}
                        disabled={varInput.monthsData.length <= 1}
                      >
                        <TrashIcon width="14" height="14" />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        ) : (
          /* Mobile Accordion Cards */
          <Flex direction="column" gap="2" p="3">
            {varInput.monthsData.map((row, idx) => {
              const isOpen = openAccordionId === row.id;

              return (
                <Card key={row.id} style={{ position: "relative", overflow: "hidden" }}>
                  {/* Accordion Header - Single Line */}
                  <Flex
                    justify="between"
                    align="center"
                    p="3"
                    style={{ 
                      cursor: "pointer", 
                      minHeight: 48,
                      borderBottom: isOpen ? "1px solid var(--gray-a3)" : "none" 
                    }}
                    onClick={() => setOpenAccordionId(isOpen ? null : row.id)}
                  >
                    <Flex align="center" gap="3" style={{ flex: 1, minWidth: 0 }}>
                      <Text 
                        size="2" 
                        weight="bold" 
                        style={{ 
                          flex: 1, 
                          minWidth: 0, 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap",
                          fontFamily: row.monthName ? "var(--font-default)" : "var(--font-mono)",
                          color: row.monthName ? "var(--gray-12)" : "var(--gray-8)"
                        }}
                      >
                        {row.monthName || "(undefined)"}
                      </Text>
                      <Flex gap="3" style={{ flexShrink: 0 }}>
                        <Text size="1" color={activeColor} weight="bold" style={{ whiteSpace: "nowrap" }}>
                          TDS: {npr(selectedRegime === "old" ? (oldResult.monthlyRows[idx]?.tds || 0) : (newResult.monthlyRows[idx]?.tds || 0), language, "")}
                        </Text>
                        <Text size="1" color="gray" style={{ whiteSpace: "nowrap" }}>
                          Net: {npr(selectedRegime === "old" ? (oldResult.monthlyRows[idx]?.netSalary || 0) : (newResult.monthlyRows[idx]?.netSalary || 0), language, "")}
                        </Text>
                      </Flex>
                    </Flex>
                    <ChevronDownIcon 
                      width="16" 
                      height="16" 
                      style={{ 
                        flexShrink: 0,
                        transition: "transform 0.2s ease",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
                      }} 
                    />
                  </Flex>

                  {/* Accordion Content */}
                  <Box
                    style={{
                      maxHeight: isOpen ? "1000px" : "0",
                      overflow: "hidden",
                      transition: "max-height 0.3s ease-out, opacity 0.2s ease",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <Flex direction="column" gap="3" p="3">
                      <Flex justify="between" align="center" mb="2">
                        <Text size="1" color="gray" weight="bold">Month Details</Text>
                        <Button
                          variant="ghost"
                          color="red"
                          size="1"
                          onClick={() => removeMonthRow(row.id)}
                          style={{ cursor: "pointer" }}
                          disabled={varInput.monthsData.length <= 1}
                        >
                          <TrashIcon width="14" height="14" style={{ marginRight: 4 }} />
                          Delete
                        </Button>
                      </Flex>
                      <label>
                        <Text size="1" color="gray" mb="1" as="div">Month Name</Text>
                        <Popover.Root>
                          <Popover.Trigger>
                            <TextField.Root
                              size="2"
                              value={row.monthName}
                              onChange={(e) => updateMonthName(row.id, e.target.value)}
                              placeholder="Type or select month"
                              style={{ width: "100%" }}
                            />
                          </Popover.Trigger>
                          <Popover.Content style={{ width: 200, maxHeight: 200, overflowY: "auto" }}>
                            <Flex direction="column" gap="1">
                              {MONTH_NAMES.map((month) => (
                                <Button
                                  key={month}
                                  variant="ghost"
                                  size="1"
                                  onClick={() => updateMonthName(row.id, month)}
                                  style={{ cursor: "pointer", textAlign: "left", justifyContent: "flex-start" }}
                                >
                                  {month}
                                </Button>
                              ))}
                            </Flex>
                          </Popover.Content>
                        </Popover.Root>
                      </label>
                      <label>
                        <Text size="1" color="gray" mb="1" as="div">Basic Salary</Text>
                        <TextField.Root
                          type="number"
                          size="2"
                          value={row.basicSalary || ""}
                          onChange={(e) => updateRowField(idx, "basicSalary", parseFloat(e.target.value) || 0)}
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        <Text size="1" color="gray" mb="1" as="div">SSF</Text>
                        <TextField.Root
                          type="number"
                          size="2"
                          value={row.ssf || ""}
                          onChange={(e) => updateRowField(idx, "ssf", parseFloat(e.target.value) || 0)}
                          disabled={!varInput.contributingSSF}
                          style={{ width: "100%", opacity: varInput.contributingSSF ? 1 : 0.45 }}
                        />
                      </label>
                      <label>
                        <Text size="1" color="gray" mb="1" as="div">PF</Text>
                        <TextField.Root
                          type="number"
                          size="2"
                          value={row.pf || ""}
                          onChange={(e) => updateRowField(idx, "pf", parseFloat(e.target.value) || 0)}
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        <Text size="1" color="gray" mb="1" as="div">CIT</Text>
                        <TextField.Root
                          type="number"
                          size="2"
                          value={row.cit || ""}
                          onChange={(e) => updateRowField(idx, "cit", parseFloat(e.target.value) || 0)}
                          style={{ width: "100%" }}
                        />
                      </label>
                      <Box style={{ borderTop: "1px solid var(--gray-a3)", paddingTop: 12 }}>
                        <Flex direction="column" gap="2">
                          <Flex justify="between">
                            <Text size="1" color={activeColor} weight="bold">TDS</Text>
                            <Text size="1" color={activeColor} weight="bold">{npr(selectedRegime === "old" ? (oldResult.monthlyRows[idx]?.tds || 0) : (newResult.monthlyRows[idx]?.tds || 0), language, "")}</Text>
                          </Flex>
                          <Flex justify="between">
                            <Text size="1" color="gray">Net Salary</Text>
                            <Text size="1" color="gray">{npr(selectedRegime === "old" ? (oldResult.monthlyRows[idx]?.netSalary || 0) : (newResult.monthlyRows[idx]?.netSalary || 0), language, "")}</Text>
                          </Flex>
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                </Card>
              );
            })}
          </Flex>
        )}
      </Box>


      {/* Summary Cards — single active regime */}
      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        <Card size="3" style={{ borderColor: `var(--${activeColor}-8)` }}>
          <Flex direction="column" gap="3">
            <Flex align="center" justify="between">
              <Heading size="4" color={activeColor}>
                {selectedRegime === "old" ? t('oldRegimeName') : t('newRegimeName')}
              </Heading>
              <Badge color={activeColor}>{selectedRegime === "old" ? t('oldSlabFy') : t('newSlabFy')}</Badge>
            </Flex>
            <Grid columns="2" gap="3">
              <Box>
                <Text size="1" color="gray">Total Gross Income</Text>
                <Text size="3" weight="bold">{npr(activeVarResult.totalGrossIncome, language, currency)}</Text>
              </Box>
              <Box>
                <Text size="1" color="gray">Total Deductions</Text>
                <Text size="3" weight="bold">{npr(activeVarResult.totalDeductions, language, currency)}</Text>
              </Box>
              <Box>
                <Text size="1" color="gray">Taxable Income</Text>
                <Text size="3" weight="bold">{npr(activeVarResult.taxableIncome, language, currency)}</Text>
              </Box>
              <Box>
                <Text size="1" color="gray">Total Annual TDS</Text>
                <Text size="3" weight="bold" color={activeColor}>{npr(activeVarResult.totalTax, language, currency)}</Text>
              </Box>
            </Grid>
          </Flex>
        </Card>
      </Grid>

      {/* Tax Slab Breakdown for selected regime */}
      <Heading size="5" mt="4">Tax Slab Breakdown (Annual)</Heading>
      <RegimeView
        result={activeVarResult.regimeResult}
        color={activeColor}
        best={true}
        info={selectedRegime === "old" ? {
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
        } : {
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
          <MixerHorizontalIcon width="24" height="24" />
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
              <div style={{
                position: "relative",
                display: "flex",
                background: "var(--gray-3)",
                padding: "4px",
                borderRadius: "12px",
                userSelect: "none"
              }}>
                <div style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  width: "calc((100% - 8px) / 3)",
                  background: "var(--color-panel-solid)",
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px var(--gray-a4), 0 1px 2px var(--gray-a3)",
                  left: settingsTab === "config" ? "4px" : settingsTab === "deductions" ? "calc(33.333% + 1.33px)" : "calc(66.666% - 1.33px)",
                  transition: "left 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  zIndex: 1
                }} />
                <button
                  onClick={() => setSettingsTab("config")}
                  style={{
                    flex: 1,
                    position: "relative",
                    zIndex: 2,
                    background: "none",
                    border: "none",
                    padding: "8px 0",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: settingsTab === "config" ? "var(--indigo-11)" : "var(--gray-10)",
                    cursor: "pointer",
                    transition: "color 0.2s ease",
                    fontFamily: "var(--font-default)",
                    outline: "none"
                  }}
                >
                  {t('config')}
                </button>
                <button
                  onClick={() => setSettingsTab("deductions")}
                  style={{
                    flex: 1,
                    position: "relative",
                    zIndex: 2,
                    background: "none",
                    border: "none",
                    padding: "8px 0",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: settingsTab === "deductions" ? "var(--indigo-11)" : "var(--gray-10)",
                    cursor: "pointer",
                    transition: "color 0.2s ease",
                    fontFamily: "var(--font-default)",
                    outline: "none"
                  }}
                >
                  {t('deductionsTab')}
                </button>
                <button
                  onClick={() => setSettingsTab("quickfill")}
                  style={{
                    flex: 1,
                    position: "relative",
                    zIndex: 2,
                    background: "none",
                    border: "none",
                    padding: "8px 0",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: settingsTab === "quickfill" ? "var(--indigo-11)" : "var(--gray-10)",
                    cursor: "pointer",
                    transition: "color 0.2s ease",
                    fontFamily: "var(--font-default)",
                    outline: "none"
                  }}
                >
                  {t('quickFill')}
                </button>
              </div>
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

                  {/* Tax Regime Selector */}
                  <Flex direction="column" gap="1" pt="2" style={{ borderTop: "1px solid var(--gray-a3)" }}>
                    <Text size="1" color="gray" weight="medium" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>{t('taxRegime')}</Text>
                    <Select.Root value={selectedRegime} onValueChange={(v) => onRegimeChange(v as "old" | "new")}>
                      <Select.Trigger style={{ width: "100%", cursor: "pointer", height: 44, borderRadius: "var(--radius-3)", fontWeight: 600 }} />
                      <Select.Content position="popper">
                        <Select.Item value="old">{t('oldSlabFy')}</Select.Item>
                        <Select.Item value="new">{t('newSlabFy')}</Select.Item>
                      </Select.Content>
                    </Select.Root>
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
                        onChange={(e) => {
                          const parsed = parseFormattedNumber(e.target.value);
                          setFillBasic(parsed === 0 ? "" : parsed.toString());
                        }}
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
                        onChange={(e) => {
                          const parsed = parseFormattedNumber(e.target.value);
                          setFillSSF(parsed === 0 ? "" : parsed.toString());
                        }}
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
                        onChange={(e) => {
                          const parsed = parseFormattedNumber(e.target.value);
                          setFillPF(parsed === 0 ? "" : parsed.toString());
                        }}
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
                        onChange={(e) => {
                          const parsed = parseFormattedNumber(e.target.value);
                          setFillCIT(parsed === 0 ? "" : parsed.toString());
                        }}
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

      <ShareTaxDetails
        variableInput={varInput}
        open={shareOpen}
        onOpenChange={setShareOpen}
        comparisonEnabled={false}
        selectedRegime={selectedRegime}
      />

    </Flex>
  );
}
