import { useMemo, useRef, useState } from "react";
import { Box, Button, Dialog, Flex, Grid, Heading, Separator, Table, Text } from "@radix-ui/themes";
import { DownloadIcon, Share1Icon } from "@radix-ui/react-icons";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import type { TaxInput, RegimeResult } from "../engine/types";
import { calculateRegime, npr } from "../engine/taxEngine";
import { oldRegime, newRegime } from "../engine/scenarios";
import { useTranslation } from "../i18n/LanguageContext";

interface ShareTaxDetailsProps {
  input: TaxInput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  currencyFormatter: (amount: number) => string
) {
  return [
    title,
    "",
    ...rows.flatMap((row) => [
      row.label,
      `Yearly income tax: ${currencyFormatter(row.result.totalTaxYearly)}`,
      `Monthly tax: ${currencyFormatter(row.monthlyTax)}`,
      `Monthly salary: ${currencyFormatter(row.monthlySalary)}`,
      `Monthly retirement deductions: ${currencyFormatter(row.monthlyRetirement)}`,
      `Monthly cash in hand: ${currencyFormatter(row.monthlyCashInHand)}`,
      `Effective rate: ${formatPercent(row.result.effectiveRate)}`,
      "",
    ]),
  ].join("\n");
}

function PrintableLayout({
  input,
  summaries,
}: {
  input: TaxInput;
  summaries: RegimeShareSummary[];
}) {
  const { t, language } = useTranslation();
  const currency = t("currency");
  const months = safeMonths(input.months);

  const yearlyComparisonRows = [
    {
      label: t("incomeTax"),
      old: summaries[0].result.totalTaxYearly,
      new: summaries[1].result.totalTaxYearly,
    },
    {
      label: t("taxableSalary"),
      old: summaries[0].result.taxableIncome,
      new: summaries[1].result.taxableIncome,
    },
  ];

  const monthlyComparisonRows = [
    {
      label: t("monthlySalary"),
      old: input.income.salary / months,
      new: input.income.salary / months,
    },
    {
      label: t("ssf"),
      old: input.deductions.ssf / months,
      new: input.deductions.ssf / months,
    },
    {
      label: t("providentFund"),
      old: input.deductions.pf / months,
      new: input.deductions.pf / months,
    },
    {
      label: t("cit"),
      old: input.deductions.cit / months,
      new: input.deductions.cit / months,
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
  ];

  return (
    <Box className="share-sheet">
      <Flex justify="between" align="start" gap="4" className="share-header">
        <Box>
          <Text size="1" weight="bold" color="gray" className="share-eyebrow">
            {t("fy")} {t("oldFiscalYear")} / {t("newFiscalYear")}
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
            {input.taxpayerType === "couple" ? t("couple") : t("individual")} · {months} {t("month")}
          </Text>
        </Box>
      </Flex>

      <Grid columns={{ initial: "1", sm: "2" }} gap="3" mt="4">
        {summaries.map((summary) => (
          <Box key={summary.result.regimeId} className={`share-regime share-regime-${summary.color}`}>
            <Text size="1" weight="bold" className="share-eyebrow">
              {summary.label}
            </Text>
            <Text size="6" weight="bold" className="tnum share-main-number" as="div" style={{ marginBottom: 0 }}>
              {npr(summary.monthlyCashInHand, language, currency)}
            </Text>
            <Text size="1" color="gray" as="div" style={{ marginTop: 8 }}>
              {t("cashInHand")} ({t("monthly")})
            </Text>
            <Separator size="4" my="3" />
            <Flex justify="between" gap="3">
              <Box>
                <Text size="1" color="gray" as="div">
                  {t("monthlyTax")}
                </Text>
                <Text size="2" weight="bold" className="tnum">
                  {npr(summary.monthlyTax, language, currency)}
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

      <Box className="share-section" mt="4">
        <Text size="2" weight="bold" as="div" mb="3">
          {t("shareTaxComparison")} · {t("yearly")}
        </Text>
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
      </Box>

      <Box className="share-section" mt="3">
        <Text size="2" weight="bold" as="div" mb="3">
          {t("shareTaxComparison")} · {t("monthly")}
        </Text>
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
      </Box>

      <Text size="1" color="gray" as="div" mt="4" style={{ lineHeight: 1.5 }}>
        {t("informationalOnly")}
      </Text>
    </Box>
  );
}

export default function ShareTaxDetails({ input, open, onOpenChange }: ShareTaxDetailsProps) {
  const { t, language } = useTranslation();
  const currency = t("currency");
  const printRef = useRef<HTMLDivElement>(null);
  const oldResult = useMemo(() => calculateRegime(input, oldRegime), [input]);
  const newResult = useMemo(() => calculateRegime(input, newRegime), [input]);
  const months = safeMonths(input.months);
  const monthlySalary = input.income.salary / months;
  const monthlyRetirement =
    (input.deductions.ssf + input.deductions.pf + input.deductions.cit) / months;

  const summaries: RegimeShareSummary[] = [
    {
      label: t("oldSlab"),
      result: oldResult,
      monthlyTax: oldResult.totalTaxMonthly,
      monthlySalary,
      monthlyRetirement,
      monthlyCashInHand: monthlySalary - oldResult.totalTaxMonthly - monthlyRetirement,
      color: "indigo",
    },
    {
      label: t("newSlab"),
      result: newResult,
      monthlyTax: newResult.totalTaxMonthly,
      monthlySalary,
      monthlyRetirement,
      monthlyCashInHand: monthlySalary - newResult.totalTaxMonthly - monthlyRetirement,
      color: "teal",
    },
  ];

  const handleShare = async () => {
    const text = plainTextSummary(t("sharePreviewTitle"), summaries, (amount) =>
      npr(amount, language, currency)
    );

    try {
      if (navigator.share) {
        await navigator.share({
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
      // Capture the element as canvas with high quality
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 860,
        imageTimeout: 5000,
        removeContainer: true,
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          window.umami?.track("tax-details-image-error");
          setIsGeneratingImage(false);
          return;
        }

        // Generate filename with date
        const date = new Date().toISOString().split("T")[0];
        const taxpayerType = input.taxpayerType === "couple" ? "Couple" : "Individual";
        const filename = `Nepal_Tax_Report_${taxpayerType}_${date}.png`;

        // Create file for sharing
        const file = new File([blob], filename, { type: "image/png" });

        try {
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: t("sharePreviewTitle"),
            });
            window.umami?.track("tax-details-image-shared");
          } else {
            // Fallback: download the image
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
      // Capture the element as canvas with high quality
      // html2canvas-pro natively supports modern color functions (color(), oklch(), lab())
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 860,
        imageTimeout: 5000,
        removeContainer: true,
      });

      // Calculate PDF dimensions (A4 size)
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > pageHeight ? "portrait" : "portrait",
        unit: "mm",
        format: "a4",
      });

      // Add image to PDF
      const imgData = canvas.toDataURL("image/png");
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with date
      const date = new Date().toISOString().split("T")[0];
      const taxpayerType = input.taxpayerType === "couple" ? "Couple" : "Individual";
      const filename = `Nepal_Tax_Report_${taxpayerType}_${date}.pdf`;

      // Download the PDF
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
                x
              </Button>
            </Dialog.Close>
          </Flex>
        </Box>

        <Box p="4" style={{ maxHeight: "70dvh", overflowY: "auto", background: "var(--gray-2)" }}>
          <Box ref={printRef}>
            <PrintableLayout input={input} summaries={summaries} />
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
              {navigator.share ? t("shareNow") : t("copyShareText")}
            </Button>
          </Flex>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}
