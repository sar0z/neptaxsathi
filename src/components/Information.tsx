import { Flex, Text, Box, Badge } from "@radix-ui/themes";
import DeveloperInfo from "./DeveloperInfo";
import { useTranslation } from "../i18n/LanguageContext";

type SlabRow = [string, string, string]; // [from, to, rate]

function SlabTable({ rows, color, t }: { rows: SlabRow[]; color: "indigo" | "teal"; t: (key: any) => string }) {
  return (
    <Box style={{ borderRadius: "var(--radius-2)", overflow: "hidden" }}>
      {/* Table header */}
      <Flex
        px="3"
        py="2"
        style={{
          background: `var(--${color}-a3)`,
          borderBottom: `1px solid var(--${color}-a3)`,
        }}
      >
        <Text size="1" style={{ flex: 1, color: `var(--${color}-11)`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('incomeRange')}</Text>
        <Text size="1" style={{ width: 56, textAlign: "right", color: `var(--${color}-11)`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('rate')}</Text>
      </Flex>
      {/* Rows */}
      {rows.map(([from, to, rate], i) => (
        <Flex
          key={i}
          align="center"
          px="3"
          py="2"
          style={{
            background: i % 2 === 0 ? "transparent" : `var(--${color}-a1)`,
            borderBottom: i < rows.length - 1 ? `1px solid var(--${color}-a2)` : undefined,
          }}
        >
          <Flex align="center" gap="2" style={{ flex: 1, flexWrap: "wrap" }}>
            <Text size="2" className="tnum" style={{ color: "var(--gray-12)", fontWeight: 500 }}>{from}</Text>
            {to && (
              <>
                <Text size="1" color="gray">→</Text>
                <Text size="2" className="tnum" style={{ color: "var(--gray-12)", fontWeight: 500 }}>{to}</Text>
              </>
            )}
          </Flex>
          <Badge
            color={color}
            variant="soft"
            radius="full"
            size="1"
            className="tnum"
            style={{ fontWeight: 700, width: 48, justifyContent: "center" }}
          >
            {rate}
          </Badge>
        </Flex>
      ))}
    </Box>
  );
}

function Section({ title, color, children }: { title: string; color: "indigo" | "teal"; children: React.ReactNode }) {
  return (
    <Box>
      <Flex align="center" gap="2" mb="2">
        <Box style={{ width: 3, height: 14, borderRadius: 99, background: `var(--${color}-9)` }} />
        <Text size="2" weight="bold" style={{ color: `var(--${color}-11)` }}>{title}</Text>
      </Flex>
      <Box style={{ border: `1px solid var(--${color}-a4)`, borderRadius: "var(--radius-3)", overflow: "hidden" }}>
        {children}
      </Box>
    </Box>
  );
}

const convertToDevanagari = (str: string): string => {
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return str.replace(/[0-9]/g, (digit) => devanagariDigits[parseInt(digit)]);
};

const getOldInd = (currency: string, language: string = 'en', t: (key: any) => string): SlabRow[] => {
  const convert = (s: string) => language === 'ne' ? convertToDevanagari(s) : s;
  const aboveText = t('above');
  return [
    [`${currency} ${convert("0")}`, `${currency} ${convert("5,00,000")}`, convert("1%")],
    [`${currency} ${convert("5,00,001")}`, `${currency} ${convert("7,00,000")}`, convert("10%")],
    [`${currency} ${convert("7,00,001")}`, `${currency} ${convert("10,00,000")}`, convert("20%")],
    [`${currency} ${convert("10,00,001")}`, `${currency} ${convert("20,00,000")}`, convert("30%")],
    [`${currency} ${convert("20,00,001")}`, `${currency} ${convert("50,00,000")}`, convert("36%")],
    [`${currency} ${convert("50,00,001")}`,aboveText, convert("39%")],
  ];
};

const getOldCouple = (currency: string, language: string = 'en', t: (key: any) => string): SlabRow[] => {
  const convert = (s: string) => language === 'ne' ? convertToDevanagari(s) : s;
  const aboveText = t('above');
  return [
    [`${currency} ${convert("0")}`, `${currency} ${convert("6,00,000")}`, convert("1%")],
    [`${currency} ${convert("6,00,001")}`, `${currency} ${convert("8,00,000")}`, convert("10%")],
    [`${currency} ${convert("8,00,001")}`, `${currency} ${convert("11,00,000")}`, convert("20%")],
    [`${currency} ${convert("11,00,001")}`, `${currency} ${convert("20,00,000")}`, convert("30%")],
    [`${currency} ${convert("20,00,001")}`, `${currency} ${convert("50,00,000")}`, convert("36%")],
    [ `${currency} ${convert("50,00,001")}`,aboveText, convert("39%")],
  ];
};

const getNewBoth = (currency: string, language: string = 'en', t: (key: any) => string): SlabRow[] => {
  const convert = (s: string) => language === 'ne' ? convertToDevanagari(s) : s;
    const aboveText = t('above');
  return [
    [`${currency} ${convert("0")}`, `${currency} ${convert("10,00,000")}`, convert("1%")],
    [`${currency} ${convert("10,00,001")}`, `${currency} ${convert("15,00,000")}`, convert("10%")],
    [`${currency} ${convert("15,00,001")}`, `${currency} ${convert("25,00,000")}`, convert("20%")],
    [`${currency} ${convert("25,00,001")}`, `${currency} ${convert("40,00,000")}`, convert("27%")],
    [`${currency} ${convert("40,00,001")}`, aboveText, convert("29%")],
  ];
};

export default function Information() {
  const { t, language } = useTranslation();
  const currency = t('currency');
  return (
    <Flex direction="column" gap="5">

      {/* Old Slab */}
      <Section title={`${t('oldSlab')} · ${t('fy')} ${t('oldFiscalYear')}`} color="indigo">
        <Box p="3" pb="2">
          <Text size="1" style={{ textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, color: "var(--gray-10)", display: "block", marginBottom: 8 }}>{t('individualLabel')}</Text>
          <SlabTable color="indigo" rows={getOldInd(currency, language, t)} t={t} />
        </Box>
        <Box style={{ height: 1, background: "var(--indigo-a3)", margin: "0 12px" }} />
        <Box p="3" pt="2" pb="2">
          <Text size="1" style={{ textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, color: "var(--gray-10)", display: "block", marginBottom: 8 }}>{t('coupleLabel')}</Text>
          <SlabTable color="indigo" rows={getOldCouple(currency, language, t)} t={t} />
        </Box>
      </Section>

      {/* New Slab */}
      <Section title={`${t('newSlab')} · ${t('fy')} ${t('newFiscalYear')}`} color="teal">
        <Box p="3" pb="2">
          <SlabTable color="teal" rows={getNewBoth(currency, language, t)} t={t} />
        </Box>
      </Section>

      {/* SSF Note */}
      <Flex gap="3" p="3" align="start" style={{ background: "var(--amber-2)", border: "1px solid var(--amber-a4)", borderRadius: "var(--radius-3)" }}>
        <Box style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>💡</Box>
        <Box>
          <Text size="2" weight="bold" style={{ color: "var(--amber-11)" }}>{t('ssfContribution')}</Text>
          <Text size="1" color="gray" style={{ lineHeight: 1.5, marginTop: 2, display: "block" }}>
            {t('ssfContributionNote')}
          </Text>
        </Box>
      </Flex>

      <DeveloperInfo />
    </Flex>
  );
}
