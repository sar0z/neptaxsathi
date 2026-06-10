import {
  TextField,
  Flex,
  Text,
  Box,
  Button,
  Select,
} from "@radix-ui/themes";
import { useState } from "react";
import type { TaxInput } from "../engine/types";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { useTranslation } from "../i18n/LanguageContext";
import Calculator from "./Calculator";
import { TaxpayerTypeSelector, SwitchRow, MoneyInputRow } from "./FormControls";
import { convertToDevanagari, formatNumberWithCommas, parseFormattedNumber } from "../utils/numberFormat";
import { CalcIcon } from "./icons";

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

export default function DataEntry({ input, setInput, onCalculate }: Props) {
  const { t, language } = useTranslation();
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
        <SectionLabel>{t('taxpayerType')}</SectionLabel>

        <Flex gap="3">
          <Box style={{ flex: 1 }}>
            <Text size="1" color="gray" as="div" mb="2">
              {t('taxpayerType')}
            </Text>
            <TaxpayerTypeSelector
              value={input.taxpayerType}
              onChange={(val) => setInput((p) => ({ ...p, taxpayerType: val }))}
              individualLabel={t('individual')}
              coupleLabel={t('couple')}
            />
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

            <MoneyInputRow label={t('bonus')} value={input.income.bonus} onChange={(v) => setIncome("bonus", v)} onCalculator={() => openCalculator('income', 'bonus')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyInputRow label={t('allowance')} value={input.income.allowance} onChange={(v) => setIncome("allowance", v)} onCalculator={() => openCalculator('income', 'allowance')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyInputRow label={t('otherIncome')} value={input.income.otherIncome} onChange={(v) => setIncome("otherIncome", v)} onCalculator={() => openCalculator('income', 'otherIncome')} suffix={t('perYear')} currency={t('currency')} language={language} />
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
            <SwitchRow
              label={t('contributingSSF')}
              description={t('ssfNote')}
              checked={input.contributingSSF}
              onCheckedChange={(v) => {
                setInput((p) => ({ ...p, contributingSSF: v }));
                if (!v) {
                  setDed("ssf", 0);
                }
              }}
            />

            <MoneyInputRow label={t('ssf')} value={input.deductions.ssf} onChange={(v) => setDed("ssf", v)} disabled={!input.contributingSSF} onCalculator={() => openCalculator('deductions', 'ssf')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyInputRow label={t('providentFund')} value={input.deductions.pf} onChange={(v) => setDed("pf", v)} onCalculator={() => openCalculator('deductions', 'pf')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyInputRow label={t('cit')} value={input.deductions.cit} onChange={(v) => setDed("cit", v)} onCalculator={() => openCalculator('deductions', 'cit')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyInputRow label={t('lifeInsurance')} value={input.deductions.insurance} onChange={(v) => setDed("insurance", v)} onCalculator={() => openCalculator('deductions', 'insurance')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyInputRow label={t('medicalInsurance')} value={input.deductions.medicalInsurance} onChange={(v) => setDed("medicalInsurance", v)} onCalculator={() => openCalculator('deductions', 'medicalInsurance')} suffix={t('perYear')} currency={t('currency')} language={language} />
            <MoneyInputRow label={t('donations')} value={input.deductions.donations} onChange={(v) => setDed("donations", v)} onCalculator={() => openCalculator('deductions', 'donations')} suffix={t('perYear')} currency={t('currency')} language={language} />

            <SwitchRow
              label={t('femaleOnlyRemuneration')}
              description={t('femaleOnlyRemunerationNote')}
              checked={input.isFemaleOnlyRemuneration}
              onCheckedChange={(v) =>
                setInput((p) => ({ ...p, isFemaleOnlyRemuneration: v }))
              }
            />
          </Flex>
        </Box>
      </Flex>

      {/* Calculate button - mobile only */}
      {!isDesktop && onCalculate && (
        <Button size="4" radius="large" onClick={onCalculate} style={{ width: "100%" }}>
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
