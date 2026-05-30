import {
  TextField,
  Switch,
  Flex,
  Text,
  Box,
  Button,
  Select,
} from "@radix-ui/themes";
import { PersonIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import type { TaxInput } from "../engine/types";
import { useIsDesktop } from "../hooks/useIsDesktop";
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

function formatNumberWithCommas(value: number): string {
  if (value === 0) return "";
  return value.toLocaleString("en-IN");
}

function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  // Remove commas and convert to number
  const parsed = parseInt(value.replace(/,/g, ""), 10);
  return isNaN(parsed) ? 0 : parsed;
}

const CalcIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 5h1M5 8h1M5 11h1M8 5h3M8 8h3M8 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function MoneyRow({
  label,
  value,
  onChange,
  disabled = false,
  onCalculator,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  onCalculator?: () => void;
}) {
  return (
    <label>
      <Flex align="center" justify="between" gap="3">
        <Text size="2" color="gray" style={{ opacity: disabled ? 0.5 : 1 }}>
          {label}
        </Text>
        <Box style={{ width: 200, flexShrink: 0 }}>
          <TextField.Root
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            min={0}
            value={formatNumberWithCommas(value)}
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
                ₨
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
      </Flex>
    </label>
  );
}

export default function DataEntry({ input, setInput, onCalculate }: Props) {
  const setIncome = (k: keyof typeof input.income, v: number) =>
    setInput((p) => ({ ...p, income: { ...p.income, [k]: v } }));
  const setDed = (k: keyof typeof input.deductions, v: number) =>
    setInput((p) => ({ ...p, deductions: { ...p.deductions, [k]: v } }));
  const isDesktop = useIsDesktop();

  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState<{
    field: keyof typeof input.income | keyof typeof input.deductions;
    section: 'income' | 'deductions';
  } | null>(null);
  const [calculatorInitialValue, setCalculatorInitialValue] = useState(0);

  const setMonthlySalary = (monthly: number) => {
    const yearly = monthly * input.months;
    setInput((p) => ({ ...p, income: { ...p.income, salary: yearly } }));
  };

  const setYearlySalary = (yearly: number) => {
    setInput((p) => ({ ...p, income: { ...p.income, salary: yearly } }));
  };

  const openCalculator = (section: 'income' | 'deductions', field: keyof typeof input.income | keyof typeof input.deductions, explicitValue?: number) => {
    setCalculatorTarget({ section, field });
    const value = explicitValue !== undefined
      ? explicitValue
      : section === 'income'
        ? input.income[field as keyof typeof input.income]
        : input.deductions[field as keyof typeof input.deductions];
    setCalculatorInitialValue(value);
    setCalculatorOpen(true);
  };

  const handleCalculatorResult = (value: number) => {
    if (calculatorTarget) {
      if (calculatorTarget.section === 'income') {
        setIncome(calculatorTarget.field as keyof typeof input.income, value);
      } else {
        setDed(calculatorTarget.field as keyof typeof input.deductions, value);
      }
    }
  };

  const monthlySalary = input.income.salary / input.months;

  return (
    <Flex direction="column" gap="5" pb="6" className="content-fade">
      {/* Configuration */}
      <Flex direction="column" gap="3">
        <SectionLabel>Configuration</SectionLabel>

        <Flex gap="3">
          <Box style={{ flex: 1 }}>
            <Text size="1" color="gray" as="div" mb="2">
              Taxpayer
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
                    Individual
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
                    Couple
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Flex>

      {/* Income */}
      <Flex direction="column" gap="3">
        <SectionLabel>Income</SectionLabel>
        <Box
          p="4"
          style={{
            background: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a4)",
            borderRadius: "var(--radius-4)",
          }}
        >
          <Flex direction="column" gap="3">
            {/* Monthly Salary */}
            <label>
              <Flex align="center" justify="between" gap="3">
                <Text size="2" color="gray">
                  Monthly Salary
                </Text>
                <Box style={{ width: 200, flexShrink: 0 }}>
                  <TextField.Root
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    min={0}
                    value={formatNumberWithCommas(monthlySalary)}
                    size="3"
                    radius="large"
                    placeholder="0"
                    onChange={(e) => setMonthlySalary(parseFormattedNumber(e.target.value))}
                    style={{ textAlign: "right" }}
                    className="tnum"
                  >
                    <TextField.Slot>
                      <Text size="1" color="gray">₨</Text>
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
                Months
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
                        {m} {m === 12 ? "(Full Year)" : m === 1 ? "month" : "months"}
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
                  Yearly Salary
                </Text>
                <Box style={{ width: 200, flexShrink: 0 }}>
                  <TextField.Root
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    min={0}
                    value={formatNumberWithCommas(input.income.salary)}
                    size="3"
                    radius="large"
                    placeholder="0"
                    onChange={(e) => setYearlySalary(parseFormattedNumber(e.target.value))}
                    style={{ textAlign: "right" }}
                    className="tnum"
                  >
                    <TextField.Slot>
                      <Text size="1" color="gray">₨</Text>
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

            <MoneyRow label="Bonus" value={input.income.bonus} onChange={(v) => setIncome("bonus", v)} onCalculator={() => openCalculator('income', 'bonus')} />
            <MoneyRow label="Allowance" value={input.income.allowance} onChange={(v) => setIncome("allowance", v)} onCalculator={() => openCalculator('income', 'allowance')} />
            <MoneyRow label="Other income" value={input.income.otherIncome} onChange={(v) => setIncome("otherIncome", v)} onCalculator={() => openCalculator('income', 'otherIncome')} />
          </Flex>
        </Box>
      </Flex>

      {/* Deductions */}
      <Flex direction="column" gap="3">
        <SectionLabel>Deductions · Annual</SectionLabel>
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
                    Contributing to SSF
                  </Text>
                  <Text as="div" size="1" color="gray">
                    Makes first 1% slab 0%
                  </Text>
                </Box>
                <Switch
                  checked={input.contributingSSF}
                  size="3"
                  onCheckedChange={(v) => {
                    setInput((p) => ({ ...p, contributingSSF: v }));
                    if (!v) {
                      setDed("ssf", 0);
                    }
                  }}
                />
              </label>
            </Flex>

            <MoneyRow label="SSF" value={input.deductions.ssf} onChange={(v) => setDed("ssf", v)} disabled={!input.contributingSSF} onCalculator={() => openCalculator('deductions', 'ssf')} />
            <MoneyRow label="Provident Fund" value={input.deductions.pf} onChange={(v) => setDed("pf", v)} onCalculator={() => openCalculator('deductions', 'pf')} />
            <MoneyRow label="CIT" value={input.deductions.cit} onChange={(v) => setDed("cit", v)} onCalculator={() => openCalculator('deductions', 'cit')} />
            <MoneyRow label="Life Insurance" value={input.deductions.insurance} onChange={(v) => setDed("insurance", v)} onCalculator={() => openCalculator('deductions', 'insurance')} />
            <MoneyRow label="Donations" value={input.deductions.donations} onChange={(v) => setDed("donations", v)} onCalculator={() => openCalculator('deductions', 'donations')} />
          </Flex>
        </Box>
      </Flex>

      {/* Calculate button - mobile only */}
      {!isDesktop && onCalculate && (
        <Button size="4" radius="large" onClick={onCalculate} style={{ width: "100%" }}>
          Calculate
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
