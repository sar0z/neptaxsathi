import {
  TextField,
  Switch,
  Flex,
  Text,
  Box,
  Button,
  Select,
  Grid,
} from "@radix-ui/themes";
import { PersonIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import type { TaxInput } from "../engine/types";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { useTranslation } from "../i18n/LanguageContext";
import Calculator from "./Calculator";

interface Props {
  input: TaxInput;
  setInput: React.Dispatch<React.SetStateAction<TaxInput>>;
  onCalculate?: () => void;
}

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
  // Convert Devanagari digits to Western digits
  const devanagariToWestern: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  const westernValue = value.replace(/[०१२३४५६७८९]/g, (digit) => devanagariToWestern[digit]);
  // Remove commas and convert to number
  const parsed = parseInt(westernValue.replace(/,/g, ""), 10);
  return isNaN(parsed) ? 0 : parsed;
}

const CalcIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 5h1M5 8h1M5 11h1M8 5h3M8 8h3M8 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function MoneyRow({
  label,
  value,
  onChange,
  disabled = false,
  onCalculator,
  suffix,
  currency,
  language,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  onCalculator?: () => void;
  suffix?: string;
  currency?: string;
  language?: string;
}) {
  return (
    <label>
      <Flex align="center" justify="between" gap="3" wrap="wrap">
        <Text size="2" color="gray" style={{ opacity: disabled ? 0.5 : 1, minWidth: 100, flex: 1 }}>
          {label}
        </Text>
        <Flex align="center" gap="2" style={{ flexShrink: 0 }}>
          <Box style={{ width: suffix ? 180 : 200 }}>
            <TextField.Root
              type="text"
              inputMode="decimal"
              pattern="[0-9०१२३४५६७८९]*"
              min={0}
              value={formatNumberWithCommas(value, language)}
              size="3"
              radius="large"
              placeholder="0"
              onChange={(e) => onChange(parseFormattedNumber(e.target.value))}
              style={{ textAlign: "right" }}
              className="tnum"
              disabled={disabled}
            >
              <TextField.Slot>
                <Text size="1" color="gray">
                  {currency || '₨'}
                </Text>
              </TextField.Slot>
              {onCalculator && (
                <TextField.Slot side="right">
                  <Box
                    onClick={disabled ? undefined : onCalculator}
                    style={{
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.3 : 0.6,
                      display: "flex",
                      alignItems: "center",
                      padding: "2px 4px",
                      borderRadius: "var(--radius-1)",
                    }}
                  >
                    <CalcIcon />
                  </Box>
                </TextField.Slot>
              )}
            </TextField.Root>
          </Box>
          {suffix && (
            <Text size="1" color="gray" style={{ opacity: disabled ? 0.5 : 0.7, whiteSpace: "nowrap" }}>
              {suffix}
            </Text>
          )}
        </Flex>
      </Flex>
    </label>
  );
}

export default function DataEntry({ input, setInput, onCalculate }: Props) {
  const { t, language } = useTranslation();
  const setIncome = (k: keyof typeof input.income, v: number) =>
    setInput((p) => ({ ...p, income: { ...p.income, [k]: v } }));
  const setDed = (k: keyof typeof input.deductions, v: number) =>
    setInput((p) => ({ ...p, deductions: { ...p.deductions, [k]: v } }));
  const isDesktop = useIsDesktop();

  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState<{
    field: keyof typeof input.income | keyof typeof input.deductions | number;
    section: 'income' | 'deductions' | 'monthlySalaries' | 'monthlySSF' | 'monthlyPF' | 'monthlyCIT';
  } | null>(null);
  const [calculatorInitialValue, setCalculatorInitialValue] = useState(0);

  const [activeTab, setActiveTab] = useState<'salary' | 'ssf' | 'pf' | 'cit'>('salary');
  const [quickFillVal, setQuickFillVal] = useState<string>("");

  const MONTH_KEYS = [
    'shrawan', 'bhadra', 'ashwin', 'kartik', 'mangsir', 'poush',
    'magh', 'falgun', 'chaitra', 'baishakh', 'jestha', 'ashad'
  ] as const;

  const setMonthlySalary = (monthly: number) => {
    const yearly = monthly * input.months;
    setInput((p) => ({ ...p, income: { ...p.income, salary: yearly } }));
  };

  const setYearlySalary = (yearly: number) => {
    setInput((p) => ({ ...p, income: { ...p.income, salary: yearly } }));
  };

  const openCalculator = (
    section: 'income' | 'deductions' | 'monthlySalaries' | 'monthlySSF' | 'monthlyPF' | 'monthlyCIT',
    field: keyof typeof input.income | keyof typeof input.deductions | number,
    explicitValue?: number
  ) => {
    setCalculatorTarget({ section, field });
    let value = 0;
    if (explicitValue !== undefined) {
      value = explicitValue;
    } else if (section === 'income') {
      value = input.income[field as keyof typeof input.income] || 0;
    } else if (section === 'deductions') {
      value = input.deductions[field as keyof typeof input.deductions] || 0;
    } else {
      const arr = input[section as keyof TaxInput] as number[] || Array(12).fill(0);
      value = arr[field as number] || 0;
    }
    setCalculatorInitialValue(value);
    setCalculatorOpen(true);
  };

  const handleCalculatorResult = (value: number) => {
    if (calculatorTarget) {
      if (calculatorTarget.section === 'income') {
        setIncome(calculatorTarget.field as keyof typeof input.income, value);
      } else if (calculatorTarget.section === 'deductions') {
        setDed(calculatorTarget.field as keyof typeof input.deductions, value);
      } else {
        const sec = calculatorTarget.section;
        const idx = calculatorTarget.field as number;
        setInput((p) => {
          const arr = [...((p[sec as keyof TaxInput] as number[]) || Array(12).fill(0))];
          arr[idx] = value;
          return { ...p, [sec]: arr };
        });
      }
    }
  };

  const handleQuickFill = () => {
    const val = parseFormattedNumber(quickFillVal);
    if (isNaN(val)) return;

    if (activeTab === 'salary') {
      setInput((p) => ({ ...p, monthlySalaries: Array(12).fill(val) }));
    } else if (activeTab === 'ssf') {
      setInput((p) => ({ ...p, monthlySSF: Array(12).fill(val) }));
    } else if (activeTab === 'pf') {
      setInput((p) => ({ ...p, monthlyPF: Array(12).fill(val) }));
    } else if (activeTab === 'cit') {
      setInput((p) => ({ ...p, monthlyCIT: Array(12).fill(val) }));
    }
    setQuickFillVal("");
  };

  const monthlySalary = input.income.salary / input.months;

  return (
    <Flex direction="column" gap="5" pb="6" className="content-fade">
      {/* Mode Selector */}
      <Flex direction="column" gap="2">
        <Text size="1" weight="bold" color="gray" style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {t('calculatorMode')}
        </Text>
        <Grid
          columns="2"
          gap="1"
          style={{
            background: "var(--gray-2)",
            border: "1px solid var(--gray-a4)",
            borderRadius: "var(--radius-4)",
            padding: "4px",
          }}
        >
          <Box
            onClick={() => setInput((p) => ({ ...p, useVariableSalary: false }))}
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-3)",
              background: !input.useVariableSalary ? "var(--color-panel-solid)" : "transparent",
              border: !input.useVariableSalary ? "1px solid var(--indigo-a4)" : "1px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: !input.useVariableSalary ? "0 1px 4px var(--indigo-a2)" : "none",
            }}
          >
            <Flex align="center" gap="2">
              <Box style={{ flexShrink: 0, color: !input.useVariableSalary ? "var(--indigo-11)" : "var(--gray-9)" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2" width="10" height="2" rx="1" fill="currentColor" opacity="0.6" />
                  <rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor" />
                  <rect x="1" y="10" width="8" height="2" rx="1" fill="currentColor" opacity="0.4" />
                </svg>
              </Box>
              <Box>
                <Text size="2" weight="bold" style={{ color: !input.useVariableSalary ? "var(--indigo-11)" : "var(--gray-11)", lineHeight: 1.2, display: "block" }}>
                  Standard
                </Text>
                <Text size="1" color="gray" style={{ lineHeight: 1.2, display: "block", marginTop: 2 }}>
                  Constant salary
                </Text>
              </Box>
            </Flex>
          </Box>

          <Box
            onClick={() => setInput((p) => ({ ...p, useVariableSalary: true }))}
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-3)",
              background: input.useVariableSalary ? "var(--color-panel-solid)" : "transparent",
              border: input.useVariableSalary ? "1px solid var(--indigo-a4)" : "1px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: input.useVariableSalary ? "0 1px 4px var(--indigo-a2)" : "none",
            }}
          >
            <Flex align="center" gap="2">
              <Box style={{ flexShrink: 0, color: input.useVariableSalary ? "var(--indigo-11)" : "var(--gray-9)" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="10" width="2" height="3" rx="0.5" fill="currentColor" />
                  <rect x="4.5" y="7" width="2" height="6" rx="0.5" fill="currentColor" />
                  <rect x="8" y="4" width="2" height="9" rx="0.5" fill="currentColor" />
                  <rect x="11.5" y="1" width="2" height="12" rx="0.5" fill="currentColor" />
                </svg>
              </Box>
              <Box>
                <Text size="2" weight="bold" style={{ color: input.useVariableSalary ? "var(--indigo-11)" : "var(--gray-11)", lineHeight: 1.2, display: "block" }}>
                  12-Month
                </Text>
                <Text size="1" color="gray" style={{ lineHeight: 1.2, display: "block", marginTop: 2 }}>
                  Variable salary
                </Text>
              </Box>
            </Flex>
          </Box>
        </Grid>
      </Flex>

      {/* Configuration */}
      <Flex direction="column" gap="3">
        <SectionLabel>{t('taxpayerType')}</SectionLabel>

        <Flex gap="3">
          <Box style={{ flex: 1 }}>
            <Text size="1" color="gray" as="div" mb="2">
              {t('taxpayerType')}
            </Text>
            <Flex gap="2">
              <Box
                onClick={() => setInput((p) => ({ ...p, taxpayerType: "individual" }))}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-3)",
                  border: input.taxpayerType === "individual" ? "2px solid var(--indigo-9)" : "1px solid var(--gray-a3)",
                  background: input.taxpayerType === "individual" ? "var(--indigo-2)" : "var(--gray-2)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Flex align="center" gap="2" justify="center">
                  <PersonIcon width="18" height="18" style={{ color: input.taxpayerType === "individual" ? "var(--indigo-11)" : "var(--gray-11)" }} />
                  <Text size="2" weight={input.taxpayerType === "individual" ? "bold" : "medium"} style={{ color: input.taxpayerType === "individual" ? "var(--indigo-11)" : "var(--gray-11)" }}>
                    {t('individual')}
                  </Text>
                </Flex>
              </Box>
              <Box
                onClick={() => setInput((p) => ({ ...p, taxpayerType: "couple" }))}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-3)",
                  border: input.taxpayerType === "couple" ? "2px solid var(--indigo-9)" : "1px solid var(--gray-a3)",
                  background: input.taxpayerType === "couple" ? "var(--indigo-2)" : "var(--gray-2)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Flex align="center" gap="2" justify="center">
                  <Flex gap="-4">
                    <PersonIcon width="18" height="18" style={{ color: input.taxpayerType === "couple" ? "var(--indigo-11)" : "var(--gray-11)" }} />
                    <PersonIcon width="18" height="18" style={{ color: input.taxpayerType === "couple" ? "var(--indigo-11)" : "var(--gray-11)" }} />
                  </Flex>
                  <Text size="2" weight={input.taxpayerType === "couple" ? "bold" : "medium"} style={{ color: input.taxpayerType === "couple" ? "var(--indigo-11)" : "var(--gray-11)" }}>
                    {t('couple')}
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Flex>

      {/* Income */}
      <Flex direction="column" gap="3">
        <SectionLabel>{t('income')}</SectionLabel>
        <Box
          p="4"
          style={{
            background: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a4)",
            borderRadius: "var(--radius-4)",
          }}
        >
          <Flex direction="column" gap="3">
            {!input.useVariableSalary ? (
              <>
                {/* Monthly Salary */}
                <label>
                  <Flex align="center" justify="between" gap="3">
                    <Text size="2" color="gray">
                      {t('monthlySalary')}
                    </Text>
                    <Box style={{ width: 200, flexShrink: 0 }}>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        min={0}
                        value={formatNumberWithCommas(monthlySalary, language)}
                        size="3"
                        radius="large"
                        placeholder="0"
                        onChange={(e) => setMonthlySalary(parseFormattedNumber(e.target.value))}
                        style={{ textAlign: "right" }}
                        className="tnum"
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{t('currency')}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator('income', 'salary', monthlySalary)}
                            style={{ cursor: "pointer", opacity: 0.6, display: "flex", alignItems: "center", padding: "2px 4px", borderRadius: "var(--radius-1)" }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </Box>
                  </Flex>
                </label>

                {/* Months */}
                <Flex align="center" justify="between" gap="3">
                  <Text size="2" color="gray">
                    {t('months')}
                  </Text>
                  <Box style={{ width: 200, flexShrink: 0 }}>
                    <Select.Root
                      value={input.months.toString()}
                      onValueChange={(v) => setInput((p) => ({ ...p, months: Number(v) }))}
                      size="3"
                    >
                      <Select.Trigger radius="large" style={{ width: "100%", textAlign: "right" }} />
                      <Select.Content>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <Select.Item key={m} value={m.toString()}>
                            {language === 'ne' ? convertToDevanagari(m.toString()) : m.toString()} {m === 12 ? `(${t('fullYear')})` : m === 1 ? t('month') : t('months')}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Box>
                </Flex>

                <Box style={{ height: 1, background: "var(--gray-a3)", margin: "4px 0" }} />

                {/* Yearly Salary */}
                <label>
                  <Flex align="center" justify="between" gap="3">
                    <Text size="2" color="gray">
                      {t('yearlySalary')}
                    </Text>
                    <Box style={{ width: 200, flexShrink: 0 }}>
                      <TextField.Root
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9०१२३४५६७८९]*"
                        min={0}
                        value={formatNumberWithCommas(input.income.salary, language)}
                        size="3"
                        radius="large"
                        placeholder="0"
                        onChange={(e) => setYearlySalary(parseFormattedNumber(e.target.value))}
                        style={{ textAlign: "right" }}
                        className="tnum"
                      >
                        <TextField.Slot>
                          <Text size="1" color="gray">{t('currency')}</Text>
                        </TextField.Slot>
                        <TextField.Slot side="right">
                          <Box
                            onClick={() => openCalculator('income', 'salary')}
                            style={{ cursor: "pointer", opacity: 0.6, display: "flex", alignItems: "center", padding: "2px 4px", borderRadius: "var(--radius-1)" }}
                          >
                            <CalcIcon />
                          </Box>
                        </TextField.Slot>
                      </TextField.Root>
                    </Box>
                  </Flex>
                </label>
              </>
            ) : (
              <>
                {/* Tab selector for custom monthly entries */}
                {input.useVariableDeductions && (
                  <Box
                    p="1"
                    mb="3"
                    style={{
                      background: "var(--gray-2)",
                      border: "1px solid var(--gray-a4)",
                      borderRadius: "var(--radius-3)",
                    }}
                  >
                    <Flex gap="1">
                      {(['salary', 'ssf', 'pf', 'cit'] as const).map((tb) => {
                        const isActive = activeTab === tb;
                        const isDisabled = tb === 'ssf' && !input.contributingSSF;
                        return (
                          <Box
                            key={tb}
                            onClick={isDisabled ? undefined : () => {
                              setActiveTab(tb);
                              setQuickFillVal("");
                            }}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              padding: "8px 4px",
                              borderRadius: "var(--radius-2)",
                              cursor: isDisabled ? "not-allowed" : "pointer",
                              background: isActive ? "var(--color-panel-solid)" : "transparent",
                              border: isActive ? "1px solid var(--indigo-a4)" : "1px solid transparent",
                              boxShadow: isActive ? "0 1px 4px var(--indigo-a2)" : "none",
                              transition: "all 0.15s ease",
                              opacity: isDisabled ? 0.35 : 1,
                            }}
                          >
                            <Text
                              size="1"
                              weight="bold"
                              style={{
                                color: isActive ? "var(--indigo-11)" : "var(--gray-11)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                display: "block",
                                fontSize: "10px",
                              }}
                            >
                              {tb === 'salary' ? (t('salaryInputLabel') || 'Salary') : tb.toUpperCase()}
                            </Text>
                          </Box>
                        );
                      })}
                    </Flex>
                  </Box>
                )}

                <Text size="2" weight="bold" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                  {activeTab === 'salary' && (t('enterMonthlyBasicSalary') || 'Monthly Salaries')}
                  {activeTab === 'ssf' && (t('enterMonthlySsf') || 'Monthly SSF')}
                  {activeTab === 'pf' && (t('enterMonthlyPf') || 'Monthly PF')}
                  {activeTab === 'cit' && (t('enterMonthlyCit') || 'Monthly CIT')}
                </Text>

                {/* Quick Fill Base Salary */}
                <Flex gap="2" align="center" mb="2">
                  <Box style={{ flex: 1 }}>
                    <TextField.Root
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9०१२३४५६७८९]*"
                      placeholder={
                        activeTab === 'salary'
                          ? (t('quickFill') || 'Quick Fill Base Salary')
                          : `Quick Fill ${activeTab.toUpperCase()}`
                      }
                      value={quickFillVal}
                      onChange={(e) => setQuickFillVal(e.target.value)}
                      size="2"
                      radius="medium"
                      disabled={activeTab === 'ssf' && !input.contributingSSF}
                    >
                      <TextField.Slot>
                        <Text size="1" color="gray">{t('currency')}</Text>
                      </TextField.Slot>
                    </TextField.Root>
                  </Box>
                  <Button
                    size="2"
                    onClick={handleQuickFill}
                    color="indigo"
                    style={{ cursor: "pointer" }}
                    disabled={activeTab === 'ssf' && !input.contributingSSF}
                  >
                    {t('applyToAll') || 'Apply'}
                  </Button>
                </Flex>

                {/* Responsive Grid of Months */}
                <Grid columns={{ initial: "1", xs: "2" }} gap="3" mb="1">
                  {MONTH_KEYS.map((mKey, idx) => {
                    let val = 0;
                    let secName: 'monthlySalaries' | 'monthlySSF' | 'monthlyPF' | 'monthlyCIT' = 'monthlySalaries';

                    if (activeTab === 'salary') {
                      val = (input.monthlySalaries && input.monthlySalaries[idx]) || 0;
                      secName = 'monthlySalaries';
                    } else if (activeTab === 'ssf') {
                      val = (input.monthlySSF && input.monthlySSF[idx]) || 0;
                      secName = 'monthlySSF';
                    } else if (activeTab === 'pf') {
                      val = (input.monthlyPF && input.monthlyPF[idx]) || 0;
                      secName = 'monthlyPF';
                    } else if (activeTab === 'cit') {
                      val = (input.monthlyCIT && input.monthlyCIT[idx]) || 0;
                      secName = 'monthlyCIT';
                    }

                    const handleFieldChange = (n: number) => {
                      setInput((p) => {
                        const arr = [...((p[secName] as number[]) || Array(12).fill(0))];
                        arr[idx] = n;
                        return { ...p, [secName]: arr };
                      });
                    };

                    return (
                      <Flex key={mKey} align="center" justify="between" gap="2">
                        <Text size="2" color="gray" style={{ minWidth: 70 }}>
                          {t(mKey)}
                        </Text>
                        <Box style={{ flex: 1, minWidth: 80 }}>
                          <TextField.Root
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9०१२३४५६७८९]*"
                            min={0}
                            value={formatNumberWithCommas(val, language)}
                            size="2"
                            radius="medium"
                            placeholder="0"
                            onChange={(e) => handleFieldChange(parseFormattedNumber(e.target.value))}
                            style={{ textAlign: "right" }}
                            className="tnum"
                            disabled={activeTab === 'ssf' && !input.contributingSSF}
                          >
                            <TextField.Slot side="right">
                              <Box
                                onClick={(activeTab === 'ssf' && !input.contributingSSF) ? undefined : () => openCalculator(secName, idx, val)}
                                style={{
                                  cursor: (activeTab === 'ssf' && !input.contributingSSF) ? "not-allowed" : "pointer",
                                  opacity: (activeTab === 'ssf' && !input.contributingSSF) ? 0.3 : 0.6,
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "2px 4px",
                                  borderRadius: "var(--radius-1)"
                                }}
                              >
                                <CalcIcon />
                              </Box>
                            </TextField.Slot>
                          </TextField.Root>
                        </Box>
                      </Flex>
                    );
                  })}
                </Grid>
              </>
            )}

            <MoneyRow label={t('bonus')} value={input.income.bonus} onChange={(v) => setIncome("bonus", v)} onCalculator={() => openCalculator('income', 'bonus')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyRow label={t('allowance')} value={input.income.allowance} onChange={(v) => setIncome("allowance", v)} onCalculator={() => openCalculator('income', 'allowance')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyRow label={t('otherIncome')} value={input.income.otherIncome} onChange={(v) => setIncome("otherIncome", v)} onCalculator={() => openCalculator('income', 'otherIncome')} suffix={t('perYear')} currency={t('currency')} language={language} />
          </Flex>
        </Box>
      </Flex>

      {/* Deductions */}
      <Flex direction="column" gap="3">
        <SectionLabel>{t('deductions')}</SectionLabel>
        <Box
          p="4"
          style={{
            background: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a4)",
            borderRadius: "var(--radius-4)",
          }}
        >
          <Flex direction="column" gap="3">
            {/* SSF toggle */}
            <Flex
              asChild
              align="center"
              justify="between"
              gap="3"
              p="3"
              style={{
                background: "var(--gray-2)",
                border: "1px solid var(--gray-a3)",
                borderRadius: "var(--radius-3)",
              }}
            >
              <label>
                <Box>
                  <Text as="div" size="2" weight="medium">
                    {t('contributingSSF')}
                  </Text>
                  <Text as="div" size="1" color="gray">
                    {t('ssfNote')}
                  </Text>
                </Box>
                <Switch
                  checked={input.contributingSSF}
                  size="3"
                  onCheckedChange={(v) => {
                    setInput((p) => ({ ...p, contributingSSF: v }));
                    if (!v && activeTab === 'ssf') {
                      setActiveTab('salary');
                    }
                  }}
                />
              </label>
            </Flex>

            {/* Custom Monthly Deductions Toggle */}
            {input.useVariableSalary && (
              <Flex
                asChild
                align="center"
                justify="between"
                gap="3"
                p="3"
                style={{
                  background: "var(--gray-2)",
                  border: "1px solid var(--gray-a3)",
                  borderRadius: "var(--radius-3)",
                }}
              >
                <label>
                  <Box>
                    <Text as="div" size="2" weight="medium">
                      {t('variableDeductionsToggle') || 'Custom monthly deductions'}
                    </Text>
                    <Text as="div" size="1" color="gray">
                      {t('variableDeductionsToggleNote') || 'Input SSF, PF, CIT month-by-month'}
                    </Text>
                  </Box>
                  <Switch
                    checked={input.useVariableDeductions || false}
                    size="3"
                    onCheckedChange={(v) => {
                      setInput((p) => ({ ...p, useVariableDeductions: v }));
                      if (!v) {
                        setActiveTab('salary');
                      }
                    }}
                  />
                </label>
              </Flex>
            )}

            {/* SSF */}
            <MoneyRow
              label={t('ssf')}
              value={
                (input.useVariableSalary && input.useVariableDeductions)
                  ? (input.monthlySSF || Array(12).fill(0)).reduce((sum, v) => sum + (v || 0), 0)
                  : input.deductions.ssf
              }
              onChange={(v) => setDed("ssf", v)}
              disabled={(input.useVariableSalary && input.useVariableDeductions) || !input.contributingSSF}
              onCalculator={() => openCalculator('deductions', 'ssf')}
              suffix={(input.useVariableSalary && input.useVariableDeductions) ? "Total (computed)" : t('perYear')}
              currency={t('currency')}
              language={language}
            />

            {/* Provident Fund */}
            <MoneyRow
              label={t('providentFund')}
              value={
                (input.useVariableSalary && input.useVariableDeductions)
                  ? (input.monthlyPF || Array(12).fill(0)).reduce((sum, v) => sum + (v || 0), 0)
                  : input.deductions.pf
              }
              onChange={(v) => setDed("pf", v)}
              disabled={input.useVariableSalary && input.useVariableDeductions}
              onCalculator={() => openCalculator('deductions', 'pf')}
              suffix={(input.useVariableSalary && input.useVariableDeductions) ? "Total (computed)" : t('perYear')}
              currency={t('currency')}
              language={language}
            />

            {/* CIT */}
            <MoneyRow
              label={t('cit')}
              value={
                (input.useVariableSalary && input.useVariableDeductions)
                  ? (input.monthlyCIT || Array(12).fill(0)).reduce((sum, v) => sum + (v || 0), 0)
                  : input.deductions.cit
              }
              onChange={(v) => setDed("cit", v)}
              disabled={input.useVariableSalary && input.useVariableDeductions}
              onCalculator={() => openCalculator('deductions', 'cit')}
              suffix={(input.useVariableSalary && input.useVariableDeductions) ? "Total (computed)" : t('perYear')}
              currency={t('currency')}
              language={language}
            />

            <MoneyRow label={t('lifeInsurance')} value={input.deductions.insurance} onChange={(v) => setDed("insurance", v)} onCalculator={() => openCalculator('deductions', 'insurance')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyRow label={t('medicalInsurance')} value={input.deductions.medicalInsurance} onChange={(v) => setDed("medicalInsurance", v)} onCalculator={() => openCalculator('deductions', 'medicalInsurance')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyRow label={t('donations')} value={input.deductions.donations} onChange={(v) => setDed("donations", v)} onCalculator={() => openCalculator('deductions', 'donations')} suffix={t('perYear')} currency={t('currency')} language={language} />

            <Flex
              asChild
              align="center"
              justify="between"
              gap="3"
              p="3"
              style={{
                background: "var(--gray-2)",
                border: "1px solid var(--gray-a3)",
                borderRadius: "var(--radius-3)",
              }}
            >
              <label>
                <Box>
                  <Text as="div" size="2" weight="medium">
                    {t('femaleOnlyRemuneration')}
                  </Text>
                  <Text as="div" size="1" color="gray">
                    {t('femaleOnlyRemunerationNote')}
                  </Text>
                </Box>
                <Switch
                  checked={input.isFemaleOnlyRemuneration}
                  size="3"
                  onCheckedChange={(v) =>
                    setInput((p) => ({ ...p, isFemaleOnlyRemuneration: v }))
                  }
                />
              </label>
            </Flex>
          </Flex>
        </Box>
      </Flex>

      {/* Calculate button - mobile only */}
      {!isDesktop && onCalculate && (
        <Button size="4" radius="large" onClick={onCalculate} style={{ width: "100%", cursor: "pointer" }}>
          {t('calculate')}
        </Button>
      )}

      {/* Calculator Modal */}
      <Calculator
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        onResult={handleCalculatorResult}
        initialValue={calculatorInitialValue}
      />
    </Flex>
  );
}
