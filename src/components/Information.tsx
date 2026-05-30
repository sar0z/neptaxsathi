import { Flex, Text, Box, Badge } from "@radix-ui/themes";
import DeveloperInfo from "./DeveloperInfo";

type SlabRow = [string, string, string]; // [from, to, rate]

function SlabTable({ rows, color }: { rows: SlabRow[]; color: "indigo" | "teal" }) {
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
        <Text size="1" style={{ flex: 1, color: `var(--${color}-11)`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Income Range</Text>
        <Text size="1" style={{ width: 56, textAlign: "right", color: `var(--${color}-11)`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rate</Text>
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

const OLD_IND: SlabRow[] = [
  ["Up to", "₨ 5,00,000", "1%"],
  ["₨ 5,00,001", "₨ 7,00,000", "10%"],
  ["₨ 7,00,001", "₨ 10,00,000", "20%"],
  ["₨ 10,00,001", "₨ 20,00,000", "30%"],
  ["₨ 20,00,001", "₨ 50,00,000", "36%"],
  ["Above", "₨ 50,00,000", "39%"],
];

const OLD_COUPLE: SlabRow[] = [
  ["Up to", "₨ 6,00,000", "1%"],
  ["₨ 6,00,001", "₨ 8,00,000", "10%"],
  ["₨ 8,00,001", "₨ 11,00,000", "20%"],
  ["₨ 11,00,001", "₨ 20,00,000", "30%"],
  ["₨ 20,00,001", "₨ 50,00,000", "36%"],
  ["Above", "₨ 50,00,000", "39%"],
];

const NEW_BOTH: SlabRow[] = [
  ["Up to", "₨ 10,00,000", "1%"],
  ["₨ 10,00,001", "₨ 15,00,000", "10%"],
  ["₨ 15,00,001", "₨ 25,00,000", "20%"],
  ["₨ 25,00,001", "₨ 40,00,000", "27%"],
  ["Above", "₨ 40,00,000", "29%"],
];

export default function Information() {
  return (
    <Flex direction="column" gap="5">

      {/* Old Slab */}
      <Section title="Old Slab · FY 2082/83" color="indigo">
        <Box p="3" pb="2">
          <Text size="1" style={{ textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, color: "var(--gray-10)", display: "block", marginBottom: 8 }}>Individual</Text>
          <SlabTable color="indigo" rows={OLD_IND} />
        </Box>
        <Box style={{ height: 1, background: "var(--indigo-a3)", margin: "0 12px" }} />
        <Box p="3" pt="2" pb="2">
          <Text size="1" style={{ textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, color: "var(--gray-10)", display: "block", marginBottom: 8 }}>Couple</Text>
          <SlabTable color="indigo" rows={OLD_COUPLE} />
        </Box>
      </Section>

      {/* New Slab */}
      <Section title="New Slab · FY 2083/84" color="teal">
        <Box p="3" pb="2">
          <SlabTable color="teal" rows={NEW_BOTH} />
        </Box>
      </Section>

      {/* SSF Note */}
      <Flex gap="3" p="3" align="start" style={{ background: "var(--amber-2)", border: "1px solid var(--amber-a4)", borderRadius: "var(--radius-3)" }}>
        <Box style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>💡</Box>
        <Box>
          <Text size="2" weight="bold" style={{ color: "var(--amber-11)" }}>SSF Contribution</Text>
          <Text size="1" color="gray" style={{ lineHeight: 1.5, marginTop: 2, display: "block" }}>
            The first slab (1%) is a Social Security Tax. Contributing to SSF reduces it to 0%.
          </Text>
        </Box>
      </Flex>

      <DeveloperInfo />
    </Flex>
  );
}
