import React, { useState, useMemo } from "react";
import { Flex, Text, Heading, Box, Button, Table, Grid, Switch, TextField, Card, Badge, Dialog, Popover, Select } from "@radix-ui/themes";

import { PlusIcon, TrashIcon, ChevronDownIcon, Share1Icon } from "@radix-ui/react-icons";
import { useIsDesktop } from "../hooks/useIsDesktop";
import Calculator from "./Calculator";

import { useTranslation } from "../i18n/LanguageContext";
import { calculateVariableTDS, npr } from "../engine/taxEngine";
import { oldRegime, newRegime } from "../engine/scenarios";
import RegimeView from "./RegimeView";
import ShareTaxDetails from "./ShareTaxDetails";
import type { VarInputState } from "../App";
import { TaxpayerTypeSelector, SwitchRow, MoneyInputRow } from "./FormControls";

interface Props {
  onBack?: () => void;
  selectedRegime: "old" | "new";
  onRegimeChange: (r: "old" | "new") => void;
  varInput: VarInputState;
  setVarInput: React.Dispatch<React.SetStateAction<VarInputState>>;
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

/* Helper tab content components to remove duplication */

interface ConfigTabContentProps {
  varInput: VarInputState;
  setVarInput: React.Dispatch<React.SetStateAction<VarInputState>>;
  selectedRegime: "old" | "new";
  onRegimeChange: (r: "old" | "new") => void;
  t: (key: string) => string;
}

function ConfigTabContent({
  varInput,
  setVarInput,
  selectedRegime,
  onRegimeChange,
  t,
}: ConfigTabContentProps) {
  return (
    <Flex direction="column" gap="4">
      <SectionLabel>{t('taxpayerType')}</SectionLabel>
      <TaxpayerTypeSelector
        value={varInput.taxpayerType}
        onChange={(val) => setVarInput((p) => ({ ...p, taxpayerType: val }))}
        individualLabel={t('individual')}
        coupleLabel={t('couple')}
      />

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

      <SwitchRow
        label={t('contributingSSF')}
        description={t('ssfNote')}
        checked={varInput.contributingSSF}
        onCheckedChange={(v) => setVarInput((p) => {
          const updated = { ...p, contributingSSF: v };
          if (!v) {
            updated.monthsData = p.monthsData.map((row) => ({ ...row, ssf: 0 }));
          }
          return updated;
        })}
      />

      <SwitchRow
        label={t('femaleOnlyRemuneration')}
        description={t('femaleOnlyRemunerationNote')}
        checked={varInput.isFemaleOnlyRemuneration}
        onCheckedChange={(v) => setVarInput((p) => ({ ...p, isFemaleOnlyRemuneration: v }))}
      />
    </Flex>
  );
}

interface DeductionsTabContentProps {
  varInput: VarInputState;
  setVarInput: React.Dispatch<React.SetStateAction<VarInputState>>;
  t: (key: string) => string;
  language: string;
  currency: string;
  openCalculator: (field: string, value: number) => void;
}

function DeductionsTabContent({
  varInput,
  setVarInput,
  t,
  language,
  currency,
  openCalculator,
}: DeductionsTabContentProps) {
  const setVal = (k: keyof VarInputState, v: number) => {
    setVarInput((p) => ({ ...p, [k]: v }));
  };

  return (
    <Flex direction="column" gap="3">
      <SectionLabel>{t('annualIncomeDeductions')}</SectionLabel>
      <Flex direction="column" gap="3">
        <MoneyInputRow
          label={t('annualAllowances')}
          value={varInput.annualAllowance}
          onChange={(v) => setVal("annualAllowance", v)}
          onCalculator={() => openCalculator("annualAllowance", varInput.annualAllowance)}
          currency={currency}
          language={language}
          layout="vertical"
        />
        <MoneyInputRow
          label={t('annualBonusOt')}
          value={varInput.annualBonus}
          onChange={(v) => setVal("annualBonus", v)}
          onCalculator={() => openCalculator("annualBonus", varInput.annualBonus)}
          currency={currency}
          language={language}
          layout="vertical"
        />
        <MoneyInputRow
          label={t('lifeInsurancePremium')}
          value={varInput.insurance}
          onChange={(v) => setVal("insurance", v)}
          onCalculator={() => openCalculator("insurance", varInput.insurance)}
          currency={currency}
          language={language}
          layout="vertical"
        />
        <MoneyInputRow
          label={t('medicalInsurancePremium')}
          value={varInput.medicalInsurance}
          onChange={(v) => setVal("medicalInsurance", v)}
          onCalculator={() => openCalculator("medicalInsurance", varInput.medicalInsurance)}
          currency={currency}
          language={language}
          layout="vertical"
        />
        <MoneyInputRow
          label={t('childrenEducationPremium')}
          value={varInput.education || 0}
          onChange={(v) => setVal("education", v)}
          onCalculator={() => openCalculator("education", varInput.education || 0)}
          currency={currency}
          language={language}
          layout="vertical"
        />
        <MoneyInputRow
          label={t('donations')}
          value={varInput.donations}
          onChange={(v) => setVal("donations", v)}
          onCalculator={() => openCalculator("donations", varInput.donations)}
          currency={currency}
          language={language}
          layout="vertical"
        />
        <Flex direction="column" gap="1">
          <Text size="1" color="gray" weight="medium">{t('remoteAreaCategory')}</Text>
          <Select.Root
            value={varInput.remoteAreaCategory || "none"}
            onValueChange={(v) => setVarInput((p) => ({ ...p, remoteAreaCategory: v as any }))}
          >
            <Select.Trigger style={{ width: "100%", cursor: "pointer", height: 40, borderRadius: "var(--radius-3)", fontWeight: 600 }} />
            <Select.Content position="popper">
              <Select.Item value="none">{t('none')}</Select.Item>
              <Select.Item value="A">{t('categoryA')}</Select.Item>
              <Select.Item value="B">{t('categoryB')}</Select.Item>
              <Select.Item value="C">{t('categoryC')}</Select.Item>
              <Select.Item value="D">{t('categoryD')}</Select.Item>
              <Select.Item value="E">{t('categoryE')}</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>
    </Flex>
  );
}

interface QuickFillTabContentProps {
  varInput: VarInputState;
  fillBasic: string;
  setFillBasic: (v: string) => void;
  fillSSF: string;
  setFillSSF: (v: string) => void;
  fillPF: string;
  setFillPF: (v: string) => void;
  fillCIT: string;
  setFillCIT: (v: string) => void;
  handleQuickFill: () => void;
  handleAutoCalcSSF: () => void;
  handleResetFillFields: () => void;
  handleClearAll: () => void;
  openCalculator: (field: string, value: number) => void;
  t: (key: string) => string;
  language: string;
  currency: string;
}

function QuickFillTabContent({
  varInput,
  fillBasic,
  setFillBasic,
  fillSSF,
  setFillSSF,
  fillPF,
  setFillPF,
  fillCIT,
  setFillCIT,
  handleQuickFill,
  handleAutoCalcSSF,
  handleResetFillFields,
  handleClearAll,
  openCalculator,
  t,
  language,
  currency,
}: QuickFillTabContentProps) {
  const basicVal = parseFloat(fillBasic) || 0;
  const ssfVal = parseFloat(fillSSF) || 0;
  const pfVal = parseFloat(fillPF) || 0;
  const citVal = parseFloat(fillCIT) || 0;

  return (
    <Flex direction="column" gap="3">
      <SectionLabel>{t('quickFillHelpers')}</SectionLabel>
      <Flex direction="column" gap="3">
        <MoneyInputRow
          label={t('basicSalary')}
          value={basicVal}
          onChange={(v) => setFillBasic(v === 0 ? "" : v.toString())}
          onCalculator={() => openCalculator("fillBasic", basicVal)}
          currency={currency}
          language={language}
          layout="vertical"
        />
        <MoneyInputRow
          label={t('ssf')}
          value={ssfVal}
          onChange={(v) => setFillSSF(v === 0 ? "" : v.toString())}
          disabled={!varInput.contributingSSF}
          onCalculator={() => openCalculator("fillSSF", ssfVal)}
          currency={currency}
          language={language}
          layout="vertical"
        />
        <MoneyInputRow
          label={t('providentFund')}
          value={pfVal}
          onChange={(v) => setFillPF(v === 0 ? "" : v.toString())}
          onCalculator={() => openCalculator("fillPF", pfVal)}
          currency={currency}
          language={language}
          layout="vertical"
        />
        <MoneyInputRow
          label={t('cit')}
          value={citVal}
          onChange={(v) => setFillCIT(v === 0 ? "" : v.toString())}
          onCalculator={() => openCalculator("fillCIT", citVal)}
          currency={currency}
          language={language}
          layout="vertical"
        />
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
      <Text size="1" color="gray" style={{ lineHeight: 1.4 }}>
        {t('quickFillNote')}
      </Text>
    </Flex>
  );
}

export default function MonthlyEntry({ onBack: _onBack, selectedRegime, onRegimeChange, varInput, setVarInput }: Props) {
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
            {t('variableIncomeMode')}
          </Badge>
        </Flex>
      </Flex>

      {/* Global Config Cards */}
      {isDesktop ? (
        <Grid columns={{ initial: "1", md: "3" }} gap="4">
          <Card size="3">
            <ConfigTabContent
              varInput={varInput}
              setVarInput={setVarInput}
              selectedRegime={selectedRegime}
              onRegimeChange={onRegimeChange}
              t={t}
            />
          </Card>
          <Card size="3">
            <DeductionsTabContent
              varInput={varInput}
              setVarInput={setVarInput}
              t={t}
              language={language}
              currency={currency}
              openCalculator={openCalculator}
            />
          </Card>
          <Card size="3">
            <QuickFillTabContent
              varInput={varInput}
              fillBasic={fillBasic}
              setFillBasic={setFillBasic}
              fillSSF={fillSSF}
              setFillSSF={setFillSSF}
              fillPF={fillPF}
              setFillPF={setFillPF}
              fillCIT={fillCIT}
              setFillCIT={setFillCIT}
              handleQuickFill={handleQuickFill}
              handleAutoCalcSSF={handleAutoCalcSSF}
              handleResetFillFields={handleResetFillFields}
              handleClearAll={handleClearAll}
              openCalculator={openCalculator}
              t={t}
              language={language}
              currency={currency}
            />
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
                <ConfigTabContent
                  varInput={varInput}
                  setVarInput={setVarInput}
                  selectedRegime={selectedRegime}
                  onRegimeChange={onRegimeChange}
                  t={t}
                />
              )}
              {settingsTab === "deductions" && (
                <DeductionsTabContent
                  varInput={varInput}
                  setVarInput={setVarInput}
                  t={t}
                  language={language}
                  currency={currency}
                  openCalculator={openCalculator}
                />
              )}
              {settingsTab === "quickfill" && (
                <QuickFillTabContent
                  varInput={varInput}
                  fillBasic={fillBasic}
                  setFillBasic={setFillBasic}
                  fillSSF={fillSSF}
                  setFillSSF={setFillSSF}
                  fillPF={fillPF}
                  setFillPF={setFillPF}
                  fillCIT={fillCIT}
                  setFillCIT={setFillCIT}
                  handleQuickFill={handleQuickFill}
                  handleAutoCalcSSF={handleAutoCalcSSF}
                  handleResetFillFields={handleResetFillFields}
                  handleClearAll={handleClearAll}
                  openCalculator={openCalculator}
                  t={t}
                  language={language}
                  currency={currency}
                />
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
      <Box
        style={{
          background: `linear-gradient(135deg, var(--${activeColor}-2), var(--${activeColor}-1))`,
          border: `1px solid var(--${activeColor}-a5)`,
          borderRadius: "var(--radius-4)",
          padding: "20px 24px",
          boxShadow: `0 2px 12px var(--${activeColor}-a3)`,
        }}
      >
        <Flex direction="column" gap="4">
          {/* Header row */}
          <Flex align="center" gap="2">
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: `var(--${activeColor}-9)`,
                flexShrink: 0,
              }}
            />
            <Heading size="4" color={activeColor} style={{ flex: 1 }}>
              {selectedRegime === "old" ? t('oldRegimeName') : t('newRegimeName')}
            </Heading>
            <Badge color={activeColor} variant="soft" size="1">
              FY - {selectedRegime === "old" ? "2082/83" : "2083/84"}
            </Badge>
          </Flex>

          {/* Divider */}
          <Box style={{ height: 1, background: `var(--${activeColor}-a4)` }} />

          {/* Stats row — 4 columns on desktop, 2×2 on mobile */}
          <Grid columns={{ initial: "2", sm: "4" }} gap="4">
            <Box>
              <Text size="1" color="gray" as="div" mb="1" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Total Gross Income
              </Text>
              <Text size="3" weight="bold" className="tnum" style={{ color: `var(--${activeColor}-12)` }}>
                {npr(activeVarResult.totalGrossIncome, language, currency)}
              </Text>
            </Box>
            <Box>
              <Text size="1" color="gray" as="div" mb="1" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Total Deductions
              </Text>
              <Text size="3" weight="bold" className="tnum" style={{ color: "var(--gray-11)" }}>
                {npr(activeVarResult.totalDeductions, language, currency)}
              </Text>
            </Box>
            <Box>
              <Text size="1" color="gray" as="div" mb="1" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Taxable Income
              </Text>
              <Text size="3" weight="bold" className="tnum" style={{ color: `var(--${activeColor}-12)` }}>
                {npr(activeVarResult.taxableIncome, language, currency)}
              </Text>
            </Box>
            <Box>
              <Text size="1" color="gray" as="div" mb="1" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Total Annual TDS
              </Text>
              <Text size="3" weight="bold" className="tnum" color={activeColor}>
                {npr(activeVarResult.totalTax, language, currency)}
              </Text>
            </Box>
          </Grid>
        </Flex>
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
            {activeVarResult.regimeResult.deductionBreakdown.map((item, i) => {
              const label = item.key === "retirement"
                ? t('retirementFund')
                : item.key === "remoteArea"
                  ? t('remoteAreaAllowance')
                  : item.key === "lifeInsurance"
                    ? t('lifeInsurance')
                    : item.key === "medicalInsurance"
                      ? t('medicalInsurance')
                      : t('donations');
              return (
                <Table.Row
                  key={item.key}
                  style={{
                    borderTop: "1px solid var(--gray-a3)",
                    background: i % 2 === 0 ? "var(--color-panel-solid)" : "var(--gray-2)",
                  }}
                >
                  <Table.Cell style={{ padding: "12px 16px" }}>
                    <Flex align="center" gap="2" wrap="wrap">
                      <Text size="2" color="gray" weight="medium">{label}</Text>
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
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

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
