import { useState, useEffect } from "react";
import { Flex, Box, Heading, Text, Container, Dialog, Button, Separator } from "@radix-ui/themes";
import type { TaxInput } from "./engine/types";
import { useIsDesktop } from "./hooks/useIsDesktop";

import DataEntry from "./components/DataEntry";
import Calculation from "./components/Calculation";
import Information from "./components/Information";
import DeveloperInfo from "./components/DeveloperInfo";
import { EditIcon, ChartIcon, InfoIcon, AppLogoIcon } from "./components/icons";

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

const DEFAULT_INPUT: TaxInput = {
  fiscalYear: "2082/83",
  taxpayerType: "individual",
  contributingSSF: false,
  months: 12,
  income: {
    salary: 0,
    bonus: 0,
    allowance: 0,
    otherIncome: 0,
  },
  deductions: {
    ssf: 0,
    pf: 0,
    cit: 0,
    insurance: 0,
    donations: 0,
  },
};

const TABS = ["entry", "calc", "info"] as const;
type TabKey = (typeof TABS)[number];

const NAV = [
  { key: "entry" as const, label: "Entry", Icon: EditIcon },
  { key: "calc" as const, label: "Results", Icon: ChartIcon },
  { key: "info" as const, label: "Info", Icon: InfoIcon },
];

export default function App() {
  const [input, setInput] = useState<TaxInput>(DEFAULT_INPUT);
  const [tab, setTab] = useState<TabKey>("entry");
  const [infoOpen, setInfoOpen] = useState(false);
  const [appInfoOpen, setAppInfoOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const tabIndex = TABS.indexOf(tab);

  useEffect(() => {
    if (localStorage.getItem("appInfoDismissed") !== "true") {
      setAppInfoOpen(true);
    }
  }, []);

  const handleAppInfoNeverShow = () => {
    localStorage.setItem("appInfoDismissed", "true");
    setAppInfoOpen(false);
    window.umami?.track("info-never-show-again");
  };

  const handleTabChange = (key: TabKey) => {
    setTab(key);
    window.umami?.track("tab-switch", { tab: key });
  };

  return (
    <Flex direction="column" style={{ height: "100dvh", overflow: "hidden" }}>
      {/* Top App Bar */}
      <Box
        px={{ initial: "4", lg: "6" }}
        py="3"
        style={{
          borderBottom: "1px solid var(--gray-a4)",
          background: "var(--color-panel-solid)",
          zIndex: 5,
        }}
      >
        <Flex align="center" justify="between">
          <Flex align="center" gap="3">
            <Box
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background:
                  "linear-gradient(135deg, var(--accent-9), var(--accent-10))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 2px 8px -2px var(--accent-a7)",
              }}
            >
              <Box style={{ width: 22, height: 22 }}>
                <AppLogoIcon />
              </Box>
            </Box>
            <Box style={{ lineHeight: 1.25 }}>
              <Heading size="4" as="h1" weight="bold">
                Nepal Tax Calculator
              </Heading>
              <Text size="1" color="gray">
                FY {input.fiscalYear} · Old vs New Slab
              </Text>
            </Box>
          </Flex>
          <Button
            variant="ghost"
            color="gray"
            size="3"
            onClick={() => setAppInfoOpen(true)}
            style={{
              cursor: "pointer",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <Box style={{ width: 20, height: 20 }}>
              <InfoIcon />
            </Box>
          </Button>
        </Flex>
      </Box>


      {/* Body */}
      {isDesktop ? (
        /* ===== Desktop: sidebar + main ===== */
        <Flex style={{ flex: 1, overflow: "hidden" }}>
          <Box
            style={{
              width: 440,
              flexShrink: 0,
              borderRight: "1px solid var(--gray-a4)",
              background: "var(--gray-1)",
              overflowY: "auto",
            }}
          >
            <Box p="5">
              <DataEntry input={input} setInput={setInput} />
            </Box>
          </Box>
          <Box style={{ flex: 1, overflowY: "auto" }}>
            <Container size="3" px="6" py="6">
              <Box mb="5">
                <Heading size="6" as="h2">
                  Calculation Results
                </Heading>
                <Text size="2" color="gray" as="div" mt="1">
                  Side-by-side comparison · hover the ⓘ on each card for slab
                  details.
                </Text>
              </Box>
              <Calculation input={input} />
            </Container>
          </Box>
        </Flex>
      ) : (
        /* ===== Mobile: sliding tabs + custom bottom nav ===== */
        <Flex direction="column" style={{ flex: 1, overflow: "hidden" }}>
          <Box className="slider-viewport" style={{ flex: 1 }}>
            <Box
              className="slider-track"
              style={{ transform: `translateX(-${tabIndex * 33.3333}%)` }}
            >
              <Box className="slider-slide">
                <Box p="4">
                  <DataEntry input={input} setInput={setInput} onCalculate={() => { setTab("calc"); window.umami?.track("calculate-clicked", { taxpayerType: input.taxpayerType }); }} />
                </Box>
              </Box>
              <Box className="slider-slide">
                <Box p="4">
                  <Calculation input={input} onBack={() => setTab("entry")} />
                </Box>
              </Box>
              <Box className="slider-slide">
                <Box p="4">
                  <Information />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Custom bottom nav */}
          <nav className="bottom-nav">
            {NAV.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`bottom-nav-item ${tab === key ? "active" : ""}`}
                onClick={() => handleTabChange(key)}
                aria-label={label}
              >
                <span className="bottom-nav-pill">
                  <Icon className="bottom-nav-icon" />
                </span>
                <span className="bottom-nav-label">{label}</span>
              </button>
            ))}
          </nav>
        </Flex>
      )}

      {/* Floating Info Button — desktop only */}
      {isDesktop && (
        <Box
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 100,
          }}
        >
          <Button
            size="3"
            radius="full"
            onClick={() => { setInfoOpen(true); window.umami?.track("tax-slabs-opened"); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingLeft: 16,
              paddingRight: 20,
              height: 44,
              background: "var(--color-panel-solid)",
              border: "1px solid var(--gray-a4)",
              color: "var(--gray-12)",
              boxShadow: "0 2px 16px var(--gray-a4), 0 1px 4px var(--gray-a3)",
              cursor: "pointer",
            }}
          >
            <Box style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--indigo-10)" }}>
              <InfoIcon />
            </Box>
            <Text size="2" weight="medium">Tax Slabs</Text>
          </Button>
        </Box>
      )}

      {/* Info Sidebar Dialog */}
      <Dialog.Root open={infoOpen} onOpenChange={setInfoOpen}>
        <Dialog.Content
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: "min(90vw, 400px)",
            maxWidth: "none",
            height: "100dvh",
            borderRadius: "16px 0 0 16px",
            padding: 0,
            margin: 0,
            animation: "slideInRight 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
            boxShadow: "-8px 0 32px var(--gray-a4)",
          }}
        >
          <Box style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-background)" }}>
            {/* Header */}
            <Box px="5" py="4" style={{ borderBottom: "1px solid var(--gray-a4)", background: "var(--color-background)" }}>
              <Flex align="center" justify="between">
                <Flex align="center" gap="2">
                  <Box style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--indigo-9)" }} />
                  <Text size="3" weight="bold">Tax Slabs · FY 2082/83</Text>
                </Flex>
                <Dialog.Close>
                  <Button variant="ghost" color="gray" size="2" style={{ borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>
                    ✕
                  </Button>
                </Dialog.Close>
              </Flex>
            </Box>
            {/* Scrollable content */}
            <Box px="5" py="4" style={{ flex: 1, overflowY: "auto" }}>
              <Information />
            </Box>
          </Box>
        </Dialog.Content>
      </Dialog.Root>

      {/* App Info Dialog */}
      <Dialog.Root open={appInfoOpen} onOpenChange={setAppInfoOpen}>
        <Dialog.Content style={{ maxWidth: 460, borderRadius: "var(--radius-4)", padding: 0, overflow: "hidden" }}>
          <Box style={{ background: "var(--color-panel-solid)" }}>
            {/* Header */}
            <Box px="5" py="4" style={{ borderBottom: "1px solid var(--gray-a4)" }}>
              <Flex align="center" justify="between">
                <Flex align="center" gap="3">
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, var(--accent-9), var(--accent-10))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <Box style={{ width: 18, height: 18 }}>
                      <AppLogoIcon />
                    </Box>
                  </Box>
                  <Heading size="3" weight="bold">Nepal Tax Calculator</Heading>
                </Flex>
                <Dialog.Close>
                  <Button variant="ghost" color="gray" size="2" style={{ borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>
                    ✕
                  </Button>
                </Dialog.Close>
              </Flex>
            </Box>

            {/* Scrollable details content */}
            <Box px="5" py="5" style={{ maxHeight: "70dvh", overflowY: "auto" }}>
              <Flex direction="column" gap="4">

                {/* About */}
                <Box>
                  <Text size="2" weight="bold" style={{ color: "var(--gray-12)" }}>What is this app?</Text>
                  <Text size="2" color="gray" style={{ lineHeight: 1.6, marginTop: 4, display: "block" }}>
                    Nepal Tax Calculator helps salaried employees instantly compare their tax liability under the <strong style={{ color: "var(--indigo-11)" }}>Old Slab (FY 2082/83)</strong> vs the newly proposed <strong style={{ color: "var(--teal-11)" }}>New Slab (FY 2083/84)</strong> — so you can clearly see which regime benefits you more.
                  </Text>
                </Box>

                {/* Comparison highlight */}
                <Box style={{ background: "linear-gradient(135deg, var(--indigo-2), var(--teal-2))", padding: "14px 16px", borderRadius: "var(--radius-3)", border: "1px solid var(--indigo-a3)" }}>
                  <Text size="1" weight="bold" style={{ textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--indigo-11)", display: "block", marginBottom: 10 }}>Side-by-Side Comparison</Text>
                  <Flex direction="column" gap="2">
                    <Flex align="start" gap="2">
                      <Text size="2" style={{ color: "var(--indigo-10)", fontWeight: "bold", lineHeight: 1 }}>↔</Text>
                      <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                        <Text weight="bold" style={{ color: "var(--gray-11)" }}>Old vs New Tax:</Text> See your income tax, effective rate, net income, and cash in hand for both regimes in one table.
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2">
                      <Text size="2" style={{ color: "var(--indigo-10)", fontWeight: "bold", lineHeight: 1 }}>↔</Text>
                      <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                        <Text weight="bold" style={{ color: "var(--gray-11)" }}>SSF Benefit:</Text> Contributing to SSF waives the 1% first-slab social security tax entirely.
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2">
                      <Text size="2" style={{ color: "var(--indigo-10)", fontWeight: "bold", lineHeight: 1 }}>↔</Text>
                      <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                        <Text weight="bold" style={{ color: "var(--gray-11)" }}>Deduction Caps:</Text> SSF up to ₨ 5,00,000 · CIT/PF up to ₨ 3,00,000 · Insurance up to ₨ 40,000.
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2">
                      <Text size="2" style={{ color: "var(--indigo-10)", fontWeight: "bold", lineHeight: 1 }}>↔</Text>
                      <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                        <Text weight="bold" style={{ color: "var(--gray-11)" }}>Individual & Couple:</Text> Slab thresholds automatically adjust based on taxpayer type.
                      </Text>
                    </Flex>
                  </Flex>
                </Box>

                <Separator size="4" style={{ background: "var(--gray-a3)", margin: "0" }} />

                {/* Privacy Disclaimer */}
                <Box style={{ background: "var(--gray-2)", padding: "14px 16px", borderRadius: "var(--radius-3)", border: "1px solid var(--gray-a3)" }}>
                  <Flex align="center" gap="2" style={{ marginBottom: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gray-11)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <Text size="1" weight="bold" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Privacy & Disclaimer</Text>
                  </Flex>
                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                      <strong style={{ color: "var(--gray-11)" }}>No data is stored or transmitted.</strong> All calculations run entirely in your browser. We do not collect, store, or share any of your financial information.
                    </Text>
                    <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                      This tool is for <strong style={{ color: "var(--gray-11)" }}>informational purposes only</strong> and does not constitute professional tax or financial advice. Tax laws are subject to change — consult a certified tax professional for filing.
                    </Text>
                    <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                      Figures are based on the proposed FY 2083/84 (new slab) and FY 2082/83 (old slab) and may not reflect final legislation.
                    </Text>
                  </Flex>
                </Box>

                {/* Developer Info */}
                <DeveloperInfo />

              </Flex>
            </Box>

            {/* Action Buttons */}
            <Box px="5" py="4" style={{ borderTop: "1px solid var(--gray-a4)", background: "var(--color-panel-solid)" }}>
              <Flex direction="column" gap="2">
                <Button
                  size="3"
                  color="indigo"
                  style={{ width: "100%", borderRadius: "var(--radius-3)", minHeight: 48, fontWeight: 600 }}
                  onClick={() => { setAppInfoOpen(false); window.umami?.track("info-dialog-closed"); }}
                >
                  Got it, let me calculate
                </Button>
                <Button
                  variant="ghost"
                  color="gray"
                  size="2"
                  style={{ width: "100%", borderRadius: "var(--radius-3)", minHeight: 40, color: "var(--gray-10)", fontSize: 12 }}
                  onClick={handleAppInfoNeverShow}
                >
                  Don't show this again
                </Button>
              </Flex>
            </Box>

          </Box>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}
