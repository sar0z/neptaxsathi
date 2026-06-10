import { useMemo, useRef, useState } from "react";
import { Box, Button, Dialog, Flex, Grid, Heading, Separator, Table, Text } from "@radix-ui/themes";
import { DownloadIcon, Share1Icon } from "@radix-ui/react-icons";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import type { TaxInput, RegimeResult, VariableTaxInput } from "../engine/types";
import { calculateRegime, calculateVariableTDS, npr } from "../engine/taxEngine";
import { oldRegime, newRegime } from "../engine/scenarios";
import { useTranslation } from "../i18n/LanguageContext";

interface ShareTaxDetailsProps {
  input?: TaxInput;
  variableInput?: VariableTaxInput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comparisonEnabled?: boolean;
  selectedRegime?: "old" | "new";
}


type RegimeShareSummary = {
  label: string;
  result: RegimeResult;
  monthlyTax: number;
  monthlySalary: number;
  monthlyRetirement: number;
  monthlyCashInHand: number;
  color: "indigo" | "teal";
};

const safeMonths = (months: number) => (months > 0 ? months : 12);

const formatPercent = (rate: number) => `${(rate * 100).toFixed(2)}%`;

function plainTextSummary(
  title: string,
  rows: RegimeShareSummary[],
  currencyFormatter: (amount: number) => string,
  comparisonEnabled: boolean = true,
  selectedRegimeIdx: number = 0
) {
  if (!comparisonEnabled || rows.length === 1) {
    // Single-regime text output
    const row = rows[selectedRegimeIdx] ?? rows[0];
    const lines = [
      `Tax Schedule: ${row.label}`,
      `Yearly income tax:        ${currencyFormatter(row.result.totalTaxYearly)}`,
      `Monthly tax (Avg):        ${currencyFormatter(row.monthlyTax)}`,
      `Monthly salary (Avg):     ${currencyFormatter(row.monthlySalary)}`,
      `Monthly retirement:       ${currencyFormatter(row.monthlyRetirement)}`,
      `Monthly cash in hand:     ${currencyFormatter(row.monthlyCashInHand)}`,
      `Effective rate:           ${formatPercent(row.result.effectiveRate)}`,
    ];
    return [title, "", ...lines, "", "Prepared using Nepal Tax Calculator"].join("\n");
  }

  const col1Width = 30;
  const col2Width = 16;
  const col3Width = 16;

  const padRight = (str: string, length: number) => str.padEnd(length, " ");
  const padLeft = (str: string, length: number) => str.padStart(length, " ");

  const header = `| ${padRight("Metric", col1Width)} | ${padLeft(rows[0].label, col2Width)} | ${padLeft(rows[1].label, col3Width)} |`;
  const separator = `| :${"-".repeat(col1Width - 1)} | ${"-".repeat(col2Width - 1)}: | ${"-".repeat(col3Width - 1)}: |`;

  const formatRow = (metric: string, oldVal: string, newVal: string) => {
    return `| ${padRight(metric, col1Width)} | ${padLeft(oldVal, col2Width)} | ${padLeft(newVal, col3Width)} |`;
  };

  const formattedRows = [
    formatRow("Yearly income tax", currencyFormatter(rows[0].result.totalTaxYearly), currencyFormatter(rows[1].result.totalTaxYearly)),
    formatRow("Monthly tax (Avg)", currencyFormatter(rows[0].monthlyTax), currencyFormatter(rows[1].monthlyTax)),
    formatRow("Monthly salary (Avg)", currencyFormatter(rows[0].monthlySalary), currencyFormatter(rows[1].monthlySalary)),
    formatRow("Monthly retirement deductions", currencyFormatter(rows[0].monthlyRetirement), currencyFormatter(rows[1].monthlyRetirement)),
    formatRow("Monthly cash in hand (Avg)", currencyFormatter(rows[0].monthlyCashInHand), currencyFormatter(rows[1].monthlyCashInHand)),
    formatRow("Effective rate", formatPercent(rows[0].result.effectiveRate), formatPercent(rows[1].result.effectiveRate)),
  ];

  return [
    title,
    "",
    header,
    separator,
    ...formattedRows,
    "",
    "Prepared using Nepal Tax Calculator"
  ].join("\n");
}


function PrintableLayout({
  input,
  variableInput,
  summaries,
  comparisonEnabled = true,
  selectedRegime = "old",
}: {
  input?: TaxInput;
  variableInput?: VariableTaxInput;
  summaries: RegimeShareSummary[];
  comparisonEnabled?: boolean;
  selectedRegime?: "old" | "new";
}) {
  const { t, language } = useTranslation();
  const currency = t("currency");
  const isVariable = !!variableInput;
  const months = isVariable ? variableInput!.monthsData.length : safeMonths(input!.months);

  const oldVarResult = useMemo(() => {
    if (variableInput) return calculateVariableTDS(variableInput, oldRegime);
    return null;
  }, [variableInput]);

  const newVarResult = useMemo(() => {
    if (variableInput) return calculateVariableTDS(variableInput, newRegime);
    return null;
  }, [variableInput]);

  // The active var result for single-regime variable display
  const activeVarResult = selectedRegime === "old" ? oldVarResult : newVarResult;
  const displayedSummaries = comparisonEnabled ? summaries : [summaries[selectedRegime === "old" ? 0 : 1]];
  const activeColor: "indigo" | "teal" = selectedRegime === "old" ? "indigo" : "teal";

  const yearlyComparisonRows = comparisonEnabled
    ? [
        {
          label: t("incomeTax"),
          old: isVariable ? oldVarResult!.totalTax : summaries[0].result.totalTaxYearly,
          new: isVariable ? newVarResult!.totalTax : summaries[1].result.totalTaxYearly,
        },
        {
          label: t("taxableSalary"),
          old: isVariable ? oldVarResult!.taxableIncome : summaries[0].result.taxableIncome,
          new: isVariable ? newVarResult!.taxableIncome : summaries[1].result.taxableIncome,
        },
      ]
    : [];

  const yearlySingleRows = !comparisonEnabled
    ? [
        {
          label: t("incomeTax"),
          value: isVariable ? activeVarResult!.totalTax : displayedSummaries[0].result.totalTaxYearly,
        },
        {
          label: t("taxableSalary"),
          value: isVariable ? activeVarResult!.taxableIncome : displayedSummaries[0].result.taxableIncome,
        },
      ]
    : [];

  const monthlyComparisonRows = !isVariable
    ? [
        {
          label: t("monthlySalary"),
          old: input!.income.salary / months,
          new: input!.income.salary / months,
        },
        {
          label: t("ssf"),
          old: input!.deductions.ssf / months,
          new: input!.deductions.ssf / months,
        },
        {
          label: t("providentFund"),
          old: input!.deductions.pf / months,
          new: input!.deductions.pf / months,
        },
        {
          label: t("cit"),
          old: input!.deductions.cit / months,
          new: input!.deductions.cit / months,
        },
        {
          label: t("incomeTax"),
          old: summaries[0].monthlyTax,
          new: summaries[1].monthlyTax,
        },
        {
          label: t("netSalary"),
          old: summaries[0].result.netIncomeMonthly,
          new: summaries[1].result.netIncomeMonthly,
        },
        {
          label: t("cashInHand"),
          old: summaries[0].monthlyCashInHand,
          new: summaries[1].monthlyCashInHand,
        },
      ]
    : [];

  const taxpayerType = isVariable ? variableInput!.taxpayerType : input!.taxpayerType;

  return (
    <Box className="share-sheet">
      <Flex justify="between" align="start" gap="4" className="share-header">
        <Box>
          <Text size="1" weight="bold" color="gray" className="share-eyebrow">
            {comparisonEnabled
              ? `${t("fy")} - ${t("oldFiscalYear")} / ${t("newFiscalYear")}`
              : `${t("fy")} - ${selectedRegime === "old" ? t("oldFiscalYear") : t("newFiscalYear")}`
            }
          </Text>
          <Heading size="6" as="h2" mt="1">
            {t("sharePreviewTitle")}
          </Heading>
          <Text size="2" color="gray" as="div" mt="1">
            {t("sharePreviewSubtitle")}
          </Text>
        </Box>
        <Box className="share-brand">
          <Text size="2" weight="bold">
            {t("appTitle")}
          </Text>
          <Text size="1" color="gray" as="div">
            {taxpayerType === "couple" ? t("couple") : t("individual")} · {months} {t("month")}
          </Text>
        </Box>
      </Flex>

      {/* Regime cards — single or dual */}
      {comparisonEnabled ? (
        <Grid columns={{ initial: "1", sm: "2" }} gap="3" mt="4">
          {summaries.map((summary) => (
            <Box key={summary.result.regimeId} className={`share-regime share-regime-${summary.color}`}>
              <Text size="1" weight="bold" className="share-eyebrow">
                {summary.label}
              </Text>
              <Flex align="baseline" gap="1" mt="1" wrap="nowrap">
                <Text size="2" weight="bold" color="gray" style={{ flexShrink: 0, opacity: 0.7 }}>
                  {currency}
                </Text>
                <Text size="6" weight="bold" className="tnum" as="div" style={{ lineHeight: 1, wordBreak: "break-all" }}>
                  {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(summary.monthlyCashInHand))}
                </Text>
              </Flex>
              <Text size="1" color="gray" as="div" style={{ marginTop: 6 }}>
                {t("cashInHand")} ({t("monthly")} Avg)
              </Text>
              <Separator size="4" my="3" />
              <Flex justify="between" gap="3">
                <Box>
                  <Text size="1" color="gray" as="div">
                    {t("monthlyTax")} (Avg)
                  </Text>
                  <Text size="2" weight="bold" className="tnum" style={{ wordBreak: "break-all" }}>
                    <Text size="1" color="gray" style={{ opacity: 0.7 }}>{currency} </Text>
                    {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(summary.monthlyTax))}
                  </Text>
                </Box>
                <Box style={{ textAlign: "right" }}>
                  <Text size="1" color="gray" as="div">
                    {t("effectiveRate")}
                  </Text>
                  <Text size="2" weight="bold" className="tnum">
                    {formatPercent(summary.result.effectiveRate)}
                  </Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </Grid>
      ) : (
        <Box mt="4" className={`share-regime share-regime-${activeColor}`}>
          {displayedSummaries.map((summary) => (
            <Flex key={summary.result.regimeId} align="start" justify="between" gap="4" wrap="wrap">
              <Box>
                <Text size="1" weight="bold" className="share-eyebrow">{summary.label}</Text>
                <Flex align="baseline" gap="1" mt="1" wrap="nowrap">
                  <Text size="2" weight="bold" color="gray" style={{ flexShrink: 0, opacity: 0.7 }}>{currency}</Text>
                  <Text size="6" weight="bold" className="tnum" as="div" style={{ lineHeight: 1, wordBreak: "break-all" }}>
                    {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(summary.monthlyCashInHand))}
                  </Text>
                </Flex>
                <Text size="1" color="gray" as="div" style={{ marginTop: 6 }}>{t("cashInHand")} ({t("monthly")} Avg)</Text>
              </Box>
              <Flex gap="5">
                <Box>
                  <Text size="1" color="gray" as="div">{t("monthlyTax")} (Avg)</Text>
                  <Text size="2" weight="bold" className="tnum">
                    <Text size="1" color="gray" style={{ opacity: 0.7 }}>{currency} </Text>
                    {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(summary.monthlyTax))}
                  </Text>
                </Box>
                <Box>
                  <Text size="1" color="gray" as="div">{t("effectiveRate")}</Text>
                  <Text size="2" weight="bold" className="tnum">{formatPercent(summary.result.effectiveRate)}</Text>
                </Box>
              </Flex>
            </Flex>
          ))}
        </Box>
      )}

      <Box className="share-section" mt="4">
        <Text size="2" weight="bold" as="div" mb="3">
          {t("shareTaxComparison")} · {t("yearly")}
        </Text>
        {comparisonEnabled ? (
          <Table.Root variant="ghost" className="share-table">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>{t("incomeTax")}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ textAlign: "right" }}>{t("oldSlab")}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ textAlign: "right" }}>{t("newSlab")}</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {yearlyComparisonRows.map((row) => (
                <Table.Row key={row.label}>
                  <Table.Cell>{row.label}</Table.Cell>
                  <Table.Cell className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                    {npr(row.old, language, currency)}
                  </Table.Cell>
                  <Table.Cell className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                    {npr(row.new, language, currency)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        ) : (
          <Table.Root variant="ghost" className="share-table">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>{t("incomeTax")}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ textAlign: "right" }}>
                  {selectedRegime === "old" ? t("oldSlab") : t("newSlab")}
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {yearlySingleRows.map((row) => (
                <Table.Row key={row.label}>
                  <Table.Cell>{row.label}</Table.Cell>
                  <Table.Cell className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                    {npr(row.value, language, currency)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {isVariable ? (
        <>
          {/* Variable mode: single regime table */}
          <Box className="share-section" mt="3">
            <Text size="2" weight="bold" as="div" mb="3">
              {selectedRegime === "old" ? t("oldSlab") : t("newSlab")} · {t("monthly")}
            </Text>
            <Table.Root variant="ghost" className="share-table">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>{t("month")}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ textAlign: "right" }}>{t("basicSalary")}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ textAlign: "right" }}>{t("ssf")}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ textAlign: "right" }}>{t("providentFund")}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ textAlign: "right" }}>{t("cit")}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ textAlign: "right" }}>{t("incomeTax")}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ textAlign: "right" }}>{t("netSalary")}</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {activeVarResult!.monthlyRows.map((row, idx) => (
                  <Table.Row key={idx}>
                    <Table.Cell>{row.monthName || `${idx + 1}`}</Table.Cell>
                    <Table.Cell className="tnum" style={{ textAlign: "right" }}>{npr(row.basicSalary, language, currency)}</Table.Cell>
                    <Table.Cell className="tnum" style={{ textAlign: "right" }}>{npr(row.ssf, language, currency)}</Table.Cell>
                    <Table.Cell className="tnum" style={{ textAlign: "right" }}>{npr(row.pf, language, currency)}</Table.Cell>
                    <Table.Cell className="tnum" style={{ textAlign: "right" }}>{npr(row.cit, language, currency)}</Table.Cell>
                    <Table.Cell className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>{npr(row.tds, language, currency)}</Table.Cell>
                    <Table.Cell className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>{npr(row.netSalary, language, currency)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </>
      ) : (
        <Box className="share-section" mt="3">
          <Text size="2" weight="bold" as="div" mb="3">
            {t("shareTaxComparison")} · {t("monthly")}
          </Text>
          {comparisonEnabled ? (
            <Table.Root variant="ghost" className="share-table">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>{t("incomeTax")}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ textAlign: "right" }}>{t("oldSlab")}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ textAlign: "right" }}>{t("newSlab")}</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {monthlyComparisonRows.map((row) => (
                  <Table.Row key={row.label}>
                    <Table.Cell>{row.label}</Table.Cell>
                    <Table.Cell className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                      {npr(row.old, language, currency)}
                    </Table.Cell>
                    <Table.Cell className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                      {npr(row.new, language, currency)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <Table.Root variant="ghost" className="share-table">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>{t("incomeTax")}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ textAlign: "right" }}>
                    {selectedRegime === "old" ? t("oldSlab") : t("newSlab")}
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {monthlyComparisonRows.map((row) => (
                  <Table.Row key={row.label}>
                    <Table.Cell>{row.label}</Table.Cell>
                    <Table.Cell className="tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                      {npr(selectedRegime === "old" ? row.old : row.new, language, currency)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      )}

      <Text size="1" color="gray" as="div" mt="4" style={{ lineHeight: 1.5 }}>
        {t("informationalOnly")}
      </Text>
    </Box>
  );
}

export default function ShareTaxDetails({ input, variableInput, open, onOpenChange, comparisonEnabled = true, selectedRegime = "old" }: ShareTaxDetailsProps) {

  const { t, language } = useTranslation();
  const currency = t("currency");
  const printRef = useRef<HTMLDivElement>(null);
  const isVariable = !!variableInput;

  const oldResult = useMemo(() => {
    if (isVariable && variableInput) {
      return calculateVariableTDS(variableInput, oldRegime).regimeResult;
    }
    if (input) {
      return calculateRegime(input, oldRegime);
    }
    throw new Error("Either input or variableInput must be provided");
  }, [input, isVariable, variableInput]);

  const newResult = useMemo(() => {
    if (isVariable && variableInput) {
      return calculateVariableTDS(variableInput, newRegime).regimeResult;
    }
    if (input) {
      return calculateRegime(input, newRegime);
    }
    throw new Error("Either input or variableInput must be provided");
  }, [input, isVariable, variableInput]);

  const oldVarResult = useMemo(() => {
    if (isVariable && variableInput) {
      return calculateVariableTDS(variableInput, oldRegime);
    }
    return null;
  }, [isVariable, variableInput]);

  const newVarResult = useMemo(() => {
    if (isVariable && variableInput) {
      return calculateVariableTDS(variableInput, newRegime);
    }
    return null;
  }, [isVariable, variableInput]);

  const months = isVariable
    ? variableInput!.monthsData.length
    : safeMonths(input!.months);

  const monthlySalary = isVariable
    ? oldVarResult!.totalGrossIncome / months
    : input!.income.salary / months;

  const monthlyRetirement = isVariable
    ? oldVarResult!.totalDeductions / months
    : (input!.deductions.ssf + input!.deductions.pf + input!.deductions.cit) / months;

  const summaries: RegimeShareSummary[] = [
    {
      label: t("oldSlab"),
      result: oldResult,
      monthlyTax: isVariable ? oldVarResult!.totalTax / months : oldResult.totalTaxMonthly,
      monthlySalary,
      monthlyRetirement,
      monthlyCashInHand: isVariable
        ? oldVarResult!.netTakeHome / months
        : (monthlySalary - oldResult.totalTaxMonthly - monthlyRetirement),
      color: "indigo",
    },
    {
      label: t("newSlab"),
      result: newResult,
      monthlyTax: isVariable ? newVarResult!.totalTax / months : newResult.totalTaxMonthly,
      monthlySalary,
      monthlyRetirement,
      monthlyCashInHand: isVariable
        ? newVarResult!.netTakeHome / months
        : (monthlySalary - newResult.totalTaxMonthly - monthlyRetirement),
      color: "teal",
    },
  ];

  const handleShare = async () => {
    const text = plainTextSummary(
      t("sharePreviewTitle"),
      summaries,
      (amount) => npr(amount, language, currency),
      comparisonEnabled,
      selectedRegime === "old" ? 0 : 1
    );

    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: t("sharePreviewTitle"),
          text,
        });
        window.umami?.track("tax-details-shared");
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        window.umami?.track("tax-details-copied");
      }
    } catch {
      window.umami?.track("tax-details-share-cancelled");
    }
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleShareAsImage = async () => {
    if (!printRef.current || isGeneratingImage) return;

    setIsGeneratingImage(true);
    window.umami?.track("tax-details-image-generation-started");

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 860,
        imageTimeout: 5000,
        removeContainer: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          window.umami?.track("tax-details-image-error");
          setIsGeneratingImage(false);
          return;
        }

        const date = new Date().toISOString().split("T")[0];
        const taxpayerType = (isVariable ? variableInput!.taxpayerType : input!.taxpayerType) === "couple" ? "Couple" : "Individual";
        const filename = `Nepal_Tax_Report_${taxpayerType}_${date}.png`;

        const file = new File([blob], filename, { type: "image/png" });

        try {
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: t("sharePreviewTitle"),
            });
            window.umami?.track("tax-details-image-shared");
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
            window.umami?.track("tax-details-image-downloaded");
          }
        } catch (error) {
          console.error("Error sharing image:", error);
          window.umami?.track("tax-details-image-share-cancelled");
        } finally {
          setIsGeneratingImage(false);
        }
      }, "image/png");
    } catch (error) {
      console.error("Error generating image:", error);
      window.umami?.track("tax-details-image-error");
      setIsGeneratingImage(false);
    }
  };

  const handlePrint = async () => {
    if (!printRef.current || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    window.umami?.track("tax-details-pdf-generation-started");

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 860,
        imageTimeout: 5000,
        removeContainer: true,
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > pageHeight ? "portrait" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const date = new Date().toISOString().split("T")[0];
      const taxpayerType = (isVariable ? variableInput!.taxpayerType : input!.taxpayerType) === "couple" ? "Couple" : "Individual";
      const filename = `Nepal_Tax_Report_${taxpayerType}_${date}.pdf`;

      pdf.save(filename);

      window.umami?.track("tax-details-pdf-downloaded");
    } catch (error) {
      console.error("Error generating PDF:", error);
      window.umami?.track("tax-details-pdf-error");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 860, padding: 0, overflow: "hidden" }}>
        <Box px="5" py="4" style={{ borderBottom: "1px solid var(--gray-a4)" }}>
          <Flex align="center" justify="between" gap="3">
            <Box>
              <VisuallyHidden.Root>
                <Dialog.Title>{t("shareDialogTitle")}</Dialog.Title>
              </VisuallyHidden.Root>
              <Heading size="4">{t("shareDialogTitle")}</Heading>
              <Dialog.Description>
                <Text size="2" color="gray">
                  {t("shareDialogDescription")}
                </Text>
              </Dialog.Description>
            </Box>
            <Dialog.Close>
              <Button variant="ghost" color="gray" size="2" style={{ borderRadius: 8, cursor: "pointer" }}>
                ✕
              </Button>
            </Dialog.Close>
          </Flex>
        </Box>

        <Box p="4" style={{ maxHeight: "70dvh", overflowY: "auto", background: "var(--gray-2)" }}>
          <Box ref={printRef}>
            <PrintableLayout
              input={input}
              variableInput={variableInput}
              summaries={summaries}
              comparisonEnabled={comparisonEnabled}
              selectedRegime={selectedRegime}
            />
          </Box>
        </Box>

        <Box px="5" py="4" style={{ borderTop: "1px solid var(--gray-a4)", background: "var(--color-panel-solid)" }}>
          <Flex gap="3" justify="end" wrap="wrap">
            <Button
              variant="soft"
              color="gray"
              onClick={handleShareAsImage}
              disabled={isGeneratingImage}
              style={{ cursor: isGeneratingImage ? "wait" : "pointer" }}
            >
              <Share1Icon width="16" height="16" />
              {isGeneratingImage ? t("generatingImage") : t("shareAsImage")}
            </Button>
            <Button
              variant="soft"
              color="gray"
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              style={{ cursor: isGeneratingPdf ? "wait" : "pointer" }}
            >
              <DownloadIcon width="16" height="16" />
              {isGeneratingPdf ? t("generatingPdf") : t("downloadPdf")}
            </Button>
            <Button color="indigo" onClick={handleShare} style={{ cursor: "pointer" }}>
              <Share1Icon width="16" height="16" />
              {typeof navigator !== "undefined" && (navigator as any).share ? t("shareNow") : t("copyShareText")}
            </Button>
          </Flex>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}

