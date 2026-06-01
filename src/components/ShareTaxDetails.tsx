import { useMemo, useRef } from "react";
import { Box, Button, Dialog, Flex, Grid, Heading, Separator, Table, Text } from "@radix-ui/themes";
import { DownloadIcon, Share1Icon } from "@radix-ui/react-icons";
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
            <Text size="6" weight="bold" className="tnum share-main-number" as="div">
              {npr(summary.monthlyCashInHand, language, currency)}
            </Text>
            <Text size="1" color="gray" as="div">
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

  const handlePrint = () => {
    const markup = printRef.current?.innerHTML;
    if (!markup) return;

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.visibility = "hidden";

    const cleanup = () => {
      setTimeout(() => {
        printFrame.remove();
      }, 500);
    };

    printFrame.onload = () => {
      const frameWindow = printFrame.contentWindow;
      if (!frameWindow) {
        cleanup();
        return;
      }

      frameWindow.onafterprint = cleanup;
      frameWindow.focus();
      frameWindow.print();
      window.umami?.track("tax-details-pdf-opened");
    };

    printFrame.srcdoc = `
      <!doctype html>
      <html>
        <head>
          <title>${t("sharePreviewTitle")}</title>
          <style>
            body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
            .share-sheet { max-width: 760px; margin: 0 auto; padding: 28px; background: #fff; }
            .share-header, .rt-Flex { display: flex; justify-content: space-between; gap: 16px; }
            .rt-Grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .share-regime, .share-section { border: 1px solid #d7dee8; border-radius: 12px; padding: 16px; background: #fff; }
            .share-regime-indigo { border-color: #b7c7ff; background: #f5f7ff; }
            .share-regime-teal { border-color: #9fd8cf; background: #f0fdfa; }
            .share-eyebrow { text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-size: 11px; }
            .share-main-number { font-size: 30px; margin: 8px 0 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th, td { padding: 10px 8px; border-top: 1px solid #e2e8f0; }
            th { color: #475569; text-align: left; }
            .tnum { font-variant-numeric: tabular-nums; }
            @media print { body { background: #fff; } .share-sheet { padding: 0; } }
          </style>
        </head>
        <body>${markup}</body>
      </html>
    `;
    document.body.appendChild(printFrame);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 860, padding: 0, overflow: "hidden" }}>
        <Box px="5" py="4" style={{ borderBottom: "1px solid var(--gray-a4)" }}>
          <Flex align="center" justify="between" gap="3">
            <Box>
              <Dialog.Title>
                <Heading size="4">{t("shareDialogTitle")}</Heading>
              </Dialog.Title>
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
            <Button variant="soft" color="gray" onClick={handlePrint} style={{ cursor: "pointer" }}>
              <DownloadIcon width="16" height="16" />
              {t("downloadPdf")}
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
