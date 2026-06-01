import { useState, useEffect } from "react";
import { Flex, Box, Button, Text, Dialog } from "@radix-ui/themes";
import { evaluateExpression } from "../utils/math";
import { useTranslation } from "../i18n/LanguageContext";

interface CalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (value: number) => void;
  initialValue?: number;
}

export default function Calculator({ open, onOpenChange, onResult, initialValue = 0 }: CalculatorProps) {
  const { t, language } = useTranslation();
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");

  const convertToDevanagari = (str: string): string => {
    const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return str.replace(/[0-9]/g, (digit) => devanagariDigits[parseInt(digit)]);
  };

  const formatDisplay = (val: string): string => {
    if (language === 'ne') {
      if (val === "Error") return "त्रुटि";
      return convertToDevanagari(val);
    }
    return val;
  };

  const translateButtonLabel = (btn: string) => {
    if (language === 'ne') {
      const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
      return btn.replace(/[0-9]/g, (digit) => devanagariDigits[parseInt(digit)]);
    }
    return btn;
  };

  // Update display when initialValue changes or when modal opens
  useEffect(() => {
    if (open) {
      setDisplay(initialValue === 0 ? "0" : initialValue.toString());
      setExpression("");
    }
  }, [open, initialValue]);

  const handleNumber = (num: string) => {
    setDisplay((prev) => {
      if (prev === "Error") return num;
      if (prev === "0" && num !== ".") {
        return num;
      }
      if (num === "." && prev.includes(".")) {
        return prev;
      }
      return prev + num;
    });
  };

  const handleOperator = (op: string) => {
    setDisplay((prev) => {
      if (prev === "Error") return "0";
      if (expression) {
        // Evaluate the running expression before chaining
        try {
          const fullExpression = expression + prev;
          const result = evaluateExpression(fullExpression);
          if (result === Infinity || isNaN(result)) {
            setExpression("");
            return "Error";
          }
          const formatted = Number(parseFloat(result.toFixed(8)).toString());
          setExpression(formatted.toString() + " " + op + " ");
          return "0";
        } catch {
          setExpression("");
          return "Error";
        }
      }
      setExpression(prev + " " + op + " ");
      return "0";
    });
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
  };

  const handleBackspace = () => {
    setDisplay((prev) => {
      if (prev === "Error" || prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  };

  const handleEquals = () => {
    try {
      if (!expression) return;
      const fullExpression = expression + display;
      const result = evaluateExpression(fullExpression);
      
      if (result === Infinity || isNaN(result)) {
        setDisplay("Error");
      } else {
        // Format to prevent crazy float issues e.g. 0.1 + 0.2
        const formattedResult = Number(parseFloat(result.toFixed(8)).toString());
        setDisplay(formattedResult.toString());
      }
      setExpression("");
    } catch (error) {
      setDisplay("Error");
      setExpression("");
    }
  };

  const handleApply = () => {
    const value = parseFloat(display);
    if (!isNaN(value) && display !== "Error") {
      onResult(value);
      onOpenChange(false);
      handleClear();
    }
  };

  const handlePercent = () => {
    setDisplay((prev) => {
      const val = parseFloat(prev);
      if (isNaN(val)) return "Error";
      return (val / 100).toString();
    });
  };

  const handleNegate = () => {
    setDisplay((prev) => {
      if (prev === "0" || prev === "Error") return prev;
      if (prev.startsWith("-")) return prev.slice(1);
      return "-" + prev;
    });
  };

  // Keyboard Event Listener
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default backspace or slash actions if needed, but be careful
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumber(e.key);
      } else if (e.key === ".") {
        e.preventDefault();
        handleNumber(".");
      } else if (e.key === "+") {
        e.preventDefault();
        handleOperator("+");
      } else if (e.key === "-") {
        e.preventDefault();
        handleOperator("-");
      } else if (e.key === "*" || e.key.toLowerCase() === "x") {
        e.preventDefault();
        handleOperator("×");
      } else if (e.key === "/") {
        e.preventDefault();
        handleOperator("÷");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape" || e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "%") {
        e.preventDefault();
        handlePercent();
      } else if (e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleApply();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, expression, display]);

  const buttons = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  const getButtonStyle = (btn: string) => {
    if (["÷", "×", "-", "+"].includes(btn)) {
      return {
        background: "var(--indigo-3)",
        color: "var(--indigo-11)",
        border: "1px solid var(--indigo-a4)",
        hoverBg: "var(--indigo-4)",
      };
    }
    if (btn === "C") {
      return {
        background: "var(--red-3)",
        color: "var(--red-11)",
        border: "1px solid var(--red-a4)",
        hoverBg: "var(--red-4)",
      };
    }
    if (btn === "=") {
      return {
        background: "linear-gradient(135deg, var(--teal-9), var(--teal-10))",
        color: "white",
        border: "none",
        hoverBg: "var(--teal-10)",
      };
    }
    return {
      background: "var(--gray-3)",
      color: "var(--gray-12)",
      border: "1px solid var(--gray-a4)",
      hoverBg: "var(--gray-4)",
    };
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 340, padding: 0, overflow: "hidden", borderRadius: "var(--radius-4)" }}>
        <Box p="4" style={{ background: "var(--gray-1)" }}>
          {/* Header */}
          <Flex justify="between" align="center" mb="4">
            <Flex align="center" gap="2">
              <Box
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "var(--indigo-3)",
                  color: "var(--indigo-11)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 6h2M6 10h2M6 14h2M10 6h4M10 10h4M10 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </Box>
              <Text weight="bold" size="3" style={{ color: "var(--gray-12)" }}>{t('calculator')}</Text>
            </Flex>
            <Dialog.Close>
              <Button variant="ghost" color="gray" size="1" style={{ borderRadius: "50%", padding: 4 }}>
                ✕
              </Button>
            </Dialog.Close>
          </Flex>

          {/* Display */}
          <Box
            p="4"
            mb="4"
            style={{
              background: "var(--color-panel-solid)",
              border: "1px solid var(--gray-a4)",
              borderRadius: "var(--radius-3)",
              minHeight: 90,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "flex-end",
              boxShadow: "inset 0 2px 4px var(--gray-a2)",
            }}
          >
            {expression ? (
              <Text size="2" color="gray" mb="1" className="tnum" style={{ opacity: 0.8, letterSpacing: "0.05em" }}>
                {formatDisplay(expression)}
              </Text>
            ) : (
              <Box style={{ height: 18 }} />
            )}
            <Text size="7" weight="bold" className="tnum" style={{ wordBreak: "break-all", color: "var(--gray-12)", letterSpacing: "-0.02em" }}>
              {formatDisplay(display)}
            </Text>
          </Box>

          {/* Keyboard Hint */}
          <Flex justify="center" mb="3">
            <Text size="1" color="gray" style={{ fontSize: 10, opacity: 0.6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {t('keyboardEnabled')}
            </Text>
          </Flex>

          {/* Buttons */}
          <Flex direction="column" style={{ gap: 6 }}>
            {buttons.map((row, rowIndex) => (
              <Flex key={rowIndex} style={{ gap: 6 }}>
                {row.map((btn) => {
                  const style = getButtonStyle(btn);
                  const isZero = btn === "0";
                  return (
                    <button
                      key={btn}
                      style={{
                        flex: isZero ? 2 : 1,
                        height: 50,
                        background: style.background,
                        color: style.color,
                        border: style.border ?? "none",
                        fontSize: 17,
                        fontWeight: 600,
                        borderRadius: "var(--radius-3)",
                        boxShadow: "0 1px 2px var(--gray-a2)",
                        cursor: "pointer",
                        transition: "opacity 0.1s ease",
                        outline: "none",
                        padding: 0,
                        margin: 0,
                        minWidth: 0,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                      onClick={() => {
                        if (btn === "C") handleClear();
                        else if (btn === "±") handleNegate();
                        else if (btn === "%") handlePercent();
                        else if (btn === "=") handleEquals();
                        else if (["+", "-", "×", "÷"].includes(btn)) handleOperator(btn);
                        else handleNumber(btn);
                      }}
                    >
                      {translateButtonLabel(btn)}
                    </button>
                  );
                })}
              </Flex>
            ))}
          </Flex>

          {/* Action Buttons */}
          <Flex gap="3" mt="4">
            <Dialog.Close style={{ flex: 1 }}>
              <Button
                variant="soft"
                color="gray"
                size="3"
                style={{ width: "100%", borderRadius: "var(--radius-3)" }}
              >
                {t('cancel')}
              </Button>
            </Dialog.Close>
            <Button
              size="3"
              color="indigo"
              style={{ flex: 2, borderRadius: "var(--radius-3)", fontWeight: 600 }}
              onClick={handleApply}
              disabled={display === "Error"}
            >
              {t('applyValue')}
            </Button>
          </Flex>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}
