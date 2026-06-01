import { useState, useEffect } from "react";
import { Flex, Box, Heading, Text, Container, Dialog, Button, Separator, Theme, DropdownMenu } from "@radix-ui/themes";


// SVG Flag Components
const USFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" id="flag-icons-us" viewBox="0 0 640 480">
    <path fill="#732a2eff" d="M0 0h640v480H0" />
    <path stroke="#fff" stroke-width="37" d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640" />
    <path fill="#192f5d" d="M0 0h364.8v258.5H0" />
    <marker id="us-a" markerHeight="30" markerWidth="30">
      <path fill="#fff" d="m14 0 9 27L0 10h28L5 27z" />
    </marker>
    <path fill="none" marker-mid="url(#us-a)" d="m0 0 16 11h61 61 61 61 60L47 37h61 61 60 61L16 63h61 61 61 61 60L47 89h61 61 60 61L16 115h61 61 61 61 60L47 141h61 61 60 61L16 166h61 61 61 61 60L47 192h61 61 60 61L16 218h61 61 61 61 60z" />
  </svg>


);

const NepalFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" id="flag-icons-np" viewBox="0 0 512 512">
    <defs>
      <clipPath id="np-b">
        <path fill-opacity=".7" d="M0-16h512v512H0z" />
      </clipPath>
      <clipPath id="np-a">
        <path fill-opacity=".7" d="M0 0h512v512H0z" />
      </clipPath>
    </defs>
    <g clip-path="url(#np-a)">
      <g clip-path="url(#np-b)" transform="translate(0 16)">
        <g fill-rule="evenodd">
          <path fill="#ce0000" stroke="#000063" stroke-width="13" d="M6.5 489.5h378.8L137.4 238.1l257.3.3L6.6-9.5v499z" />
          <path fill="#fff" d="m180.7 355.8-27 9 21.2 19.8-28.5-1.8 11.7 26.2-25.5-12.3.5 28.6-18.8-20.9-10.7 26.6-9.2-26.3-20.3 20.6 1.8-27.7L49 409l12.6-25-29.3.6 21.5-18.3-27.3-10.5 27-9L32.2 327l28.4 1.8L49 302.6l25.6 12.3-.5-28.6 18.8 20.9 10.7-26.6 9.1 26.3 20.4-20.6-1.9 27.7 27-11.4-12.7 25 29.4-.6-21.5 18.3zm-32.4-184.7-11.3 8.4 5.6 4.6a94 94 0 0 0 30.7-36c1.8 21.3-17.7 69-68.7 69.5a70.6 70.6 0 0 1-71.5-70.3c10 18.2 16.2 27 32 36.5l4.7-4.4-10.6-8.9 13.7-3.6-7.4-12.4 14.4 1-1.8-14.4 12.6 7.4 4-13.5 9 10.8 8.5-10.3 4.6 14 11.8-8.2-1.5 14.3 14.2-1.7-6.7 13.2z" />
        </g>
      </g>
    </g>
  </svg>
);

const CircularFlag = ({ lang }: { lang: 'en' | 'ne' }) => (
  <Box
    style={{
      width: 18,
      height: 18,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--gray-2)",
      flexShrink: 0,
    }}
  >
    <Box style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", transform: lang === 'en' ? 'scale(1.4)' : 'scale(1.1)' }}>
      {lang === 'en' ? <USFlag /> : <NepalFlag />}
    </Box>
  </Box>
);
import type { TaxInput } from "./engine/types";
import { useIsDesktop } from "./hooks/useIsDesktop";
import { useTranslation } from "./i18n/LanguageContext";

import DataEntry from "./components/DataEntry";
import Calculation from "./components/Calculation";
import Information from "./components/Information";
import DeveloperInfo from "./components/DeveloperInfo";
import { EditIcon, ChartIcon, InfoIcon, AppLogoIcon, SunIcon, MoonIcon } from "./components/icons";

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

const DEFAULT_INPUT: TaxInput = {
  fiscalYear: "2082/83",
  taxpayerType: "individual",
  contributingSSF: false,
  isFemaleOnlyRemuneration: false,
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
    medicalInsurance: 0,
    donations: 0,
  },
};

const TABS = ["entry", "calc", "info"] as const;
type TabKey = (typeof TABS)[number];

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("app-theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const { language, setLanguage, t } = useTranslation();

  const NAV = [
    { key: "entry" as const, label: t('navEntry'), Icon: EditIcon },
    { key: "calc" as const, label: t('navResults'), Icon: ChartIcon },
    { key: "info" as const, label: t('navInfo'), Icon: InfoIcon },
  ];

  const [input, setInput] = useState<TaxInput>(DEFAULT_INPUT);
  const [tab, setTab] = useState<TabKey>("entry");
  const [infoOpen, setInfoOpen] = useState(false);
  const [appInfoOpen, setAppInfoOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const tabIndex = TABS.indexOf(tab);

  // User ID generation (Removed for now)

  // Load saved data from Supabase on mount (Removed for now)

  // Auto-save to Supabase on input changes (Removed for now)

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
    <Theme appearance={theme} accentColor="indigo" grayColor="slate" radius="medium" scaling="100%">
      <Flex direction="column" style={{ height: "100dvh", overflow: "hidden", background: "var(--color-background)" }}>
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
                  {t('appTitle')}
                </Heading>
                <Text size="1" color="gray">
                  {t('appSubtitle', { fiscalYear: input.fiscalYear })}
                </Text>
              </Box>
            </Flex>
            <Flex align="center" gap="5">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button
                    variant="ghost"
                    color="gray"
                    size="2"
                    style={{
                      cursor: "pointer",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularFlag lang={language} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" size="2">
                  <DropdownMenu.Item onClick={() => setLanguage('en')} style={{ cursor: "pointer" }}>
                    <Flex align="center" gap="2" style={{ width: "100%" }}>
                      <CircularFlag lang="en" />
                      <Text>English</Text>
                    </Flex>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => setLanguage('ne')} style={{ cursor: "pointer" }}>
                    <Flex align="center" gap="2" style={{ width: "100%" }}>
                      <CircularFlag lang="ne" />
                      <Text>नेपाली</Text>
                    </Flex>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>

              <Flex align="center" gap="4">
                <Button
                  variant="ghost"
                  color="gray"
                  size="3"
                  onClick={() => {
                    const newTheme = theme === "light" ? "dark" : "light";
                    setTheme(newTheme);
                    localStorage.setItem("app-theme", newTheme);
                  }}
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
                  aria-label="Toggle dark mode"
                >
                  <Box style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {theme === "light" ? <MoonIcon style={{ width: "100%", height: "100%" }} /> : <SunIcon style={{ width: "100%", height: "100%" }} />}
                  </Box>
                </Button>

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
                  <Box style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <InfoIcon style={{ width: "100%", height: "100%" }} />
                  </Box>
                </Button>
              </Flex>
            </Flex>
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
                    {t('calculationResults')}
                  </Heading>
                  <Text size="2" color="gray" as="div" mt="1">
                    {t('resultsSubtitle')}
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
              <Text size="2" weight="medium">{t('taxSlabs')}</Text>
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
                    <Text size="3" weight="bold">{t('taxSlabs')} · {t('fy')} {t('oldFiscalYear')}</Text>
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
                    <Heading size="3" weight="bold">{t('appInfoTitle')}</Heading>
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
                    <Text size="2" weight="bold" style={{ color: "var(--gray-12)" }}>{t('whatIsThisApp')}</Text>
                    <Text size="2" color="gray" style={{ lineHeight: 1.6, marginTop: 4, display: "block" }} dangerouslySetInnerHTML={{ __html: t('appDescription', { oldFiscalYear: t('oldFiscalYear'), newFiscalYear: t('newFiscalYear') }) }} />
                  </Box>

                  {/* Comparison highlight */}
                  <Box style={{ background: "linear-gradient(135deg, var(--indigo-2), var(--teal-2))", padding: "14px 16px", borderRadius: "var(--radius-3)", border: "1px solid var(--indigo-a3)" }}>
                    <Text size="1" weight="bold" style={{ textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--indigo-11)", display: "block", marginBottom: 10 }}>{t('sideBySideComparison')}</Text>
                    <Flex direction="column" gap="2">
                      <Flex align="start" gap="2">
                        <Text size="2" style={{ color: "var(--indigo-10)", fontWeight: "bold", lineHeight: 1 }}>↔</Text>
                        <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                          <Text weight="bold" style={{ color: "var(--gray-11)" }}>{t('oldVsNewTax').split(':')[0]}:</Text> {t('oldVsNewTax').split(':')[1]}
                        </Text>
                      </Flex>
                      <Flex align="start" gap="2">
                        <Text size="2" style={{ color: "var(--indigo-10)", fontWeight: "bold", lineHeight: 1 }}>↔</Text>
                        <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                          <Text weight="bold" style={{ color: "var(--gray-11)" }}>{t('ssfBenefit').split(':')[0]}:</Text> {t('ssfBenefit').split(':')[1]}
                        </Text>
                      </Flex>
                      <Flex align="start" gap="2">
                        <Text size="2" style={{ color: "var(--indigo-10)", fontWeight: "bold", lineHeight: 1 }}>↔</Text>
                        <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                          <Text weight="bold" style={{ color: "var(--gray-11)" }}>{t('deductionCaps').split(':')[0]}:</Text> {t('deductionCaps').split(':')[1]}
                        </Text>
                      </Flex>
                      <Flex align="start" gap="2">
                        <Text size="2" style={{ color: "var(--indigo-10)", fontWeight: "bold", lineHeight: 1 }}>↔</Text>
                        <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                          <Text weight="bold" style={{ color: "var(--gray-11)" }}>{t('individualCouple').split(':')[0]}:</Text> {t('individualCouple').split(':')[1]}
                        </Text>
                      </Flex>
                    </Flex>
                  </Box>

                  <Separator size="4" style={{ background: "var(--gray-a3)", margin: "0" }} />

                  {/* Privacy Disclaimer */}
                  <Box style={{ background: "var(--gray-2)", padding: "14px 16px", borderRadius: "var(--radius-3)", border: "1px solid var(--gray-a3)" }}>
                    <Flex align="center" gap="2" style={{ marginBottom: 8 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gray-11)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <Text size="1" weight="bold" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('privacyDisclaimer')}</Text>
                    </Flex>
                    <Flex direction="column" gap="2">
                      <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                        {t('noDataStored')}
                      </Text>
                      <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                        {t('informationalOnly')}
                      </Text>
                      <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
                        {t('figuresBasedOn', { oldFiscalYear: t('oldFiscalYear'), newFiscalYear: t('newFiscalYear') })}
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
                    {t('gotIt')}
                  </Button>
                  <Button
                    variant="ghost"
                    color="gray"
                    size="2"
                    style={{ width: "100%", borderRadius: "var(--radius-3)", minHeight: 40, color: "var(--gray-10)", fontSize: 12 }}
                    onClick={handleAppInfoNeverShow}
                  >
                    {t('neverShowAgain')}
                  </Button>
                </Flex>
              </Box>

            </Box>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </Theme>
  );
}
