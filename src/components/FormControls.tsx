import React from "react";
import { Flex, Box, Text, TextField, Switch } from "@radix-ui/themes";
import { PersonIcon } from "@radix-ui/react-icons";
import { CalcIcon } from "./icons";
import { formatNumberWithCommas, parseFormattedNumber } from "../utils/numberFormat";

interface TaxpayerTypeSelectorProps {
  value: "individual" | "couple";
  onChange: (value: "individual" | "couple") => void;
  individualLabel: string;
  coupleLabel: string;
}

export function TaxpayerTypeSelector({
  value,
  onChange,
  individualLabel,
  coupleLabel,
}: TaxpayerTypeSelectorProps) {
  return (
    <Flex gap="2">
      <Box
        onClick={() => onChange("individual")}
        style={{
          flex: 1,
          padding: "12px 16px",
          borderRadius: "var(--radius-3)",
          border: value === "individual" ? "2px solid var(--indigo-9)" : "1px solid var(--gray-a3)",
          background: value === "individual" ? "var(--indigo-2)" : "var(--gray-2)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <Flex align="center" gap="2" justify="center">
          <PersonIcon
            width="18"
            height="18"
            style={{ color: value === "individual" ? "var(--indigo-11)" : "var(--gray-11)" }}
          />
          <Text
            size="2"
            weight={value === "individual" ? "bold" : "medium"}
            style={{ color: value === "individual" ? "var(--indigo-11)" : "var(--gray-11)" }}
          >
            {individualLabel}
          </Text>
        </Flex>
      </Box>
      <Box
        onClick={() => onChange("couple")}
        style={{
          flex: 1,
          padding: "12px 16px",
          borderRadius: "var(--radius-3)",
          border: value === "couple" ? "2px solid var(--indigo-9)" : "1px solid var(--gray-a3)",
          background: value === "couple" ? "var(--indigo-2)" : "var(--gray-2)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <Flex align="center" gap="2" justify="center">
          <Flex gap="-4">
            <PersonIcon
              width="18"
              height="18"
              style={{ color: value === "couple" ? "var(--indigo-11)" : "var(--gray-11)" }}
            />
            <PersonIcon
              width="18"
              height="18"
              style={{ color: value === "couple" ? "var(--indigo-11)" : "var(--gray-11)" }}
            />
          </Flex>
          <Text
            size="2"
            weight={value === "couple" ? "bold" : "medium"}
            style={{ color: value === "couple" ? "var(--indigo-11)" : "var(--gray-11)" }}
          >
            {coupleLabel}
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
}

interface SwitchRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: SwitchRowProps) {
  return (
    <Flex
      align="center"
      justify="between"
      gap="3"
      p="3"
      style={{
        background: "var(--gray-2)",
        border: "1px solid var(--gray-a3)",
        borderRadius: "var(--radius-3)",
        width: "100%",
      }}
    >
      <Box style={{ flex: 1, paddingRight: 8 }}>
        <Text as="div" size="2" weight="medium">
          {label}
        </Text>
        {description && (
          <Text as="div" size="1" color="gray" style={{ lineHeight: 1.4 }}>
            {description}
          </Text>
        )}
      </Box>
      <Switch checked={checked} size="3" onCheckedChange={onCheckedChange} style={{ cursor: "pointer" }} />
    </Flex>
  );
}

interface MoneyInputRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  onCalculator?: () => void;
  suffix?: string;
  currency?: string;
  language?: string;
  layout?: "horizontal" | "vertical";
}

export function MoneyInputRow({
  label,
  value,
  onChange,
  disabled = false,
  onCalculator,
  suffix,
  currency = "₨",
  language = "en",
  layout = "horizontal",
}: MoneyInputRowProps) {
  const inputField = (
    <TextField.Root
      type="text"
      inputMode="decimal"
      pattern="[0-9०१२३४५६७८९]*"
      min={0}
      value={formatNumberWithCommas(value, language)}
      size="3"
      radius="large"
      placeholder="0"
      onChange={(e) => onChange(parseFormattedNumber(e.target.value))}
      style={{ textAlign: "right", width: "100%" }}
      className="tnum"
      disabled={disabled}
    >
      <TextField.Slot>
        <Text size="1" color="gray">
          {currency}
        </Text>
      </TextField.Slot>
      {onCalculator && (
        <TextField.Slot side="right">
          <Box
            onClick={disabled ? undefined : onCalculator}
            style={{
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.3 : 0.6,
              display: "flex",
              alignItems: "center",
              padding: "2px 4px",
              borderRadius: "var(--radius-1)",
            }}
          >
            <CalcIcon />
          </Box>
        </TextField.Slot>
      )}
    </TextField.Root>
  );

  if (layout === "vertical") {
    return (
      <label style={{ display: "block", width: "100%" }}>
        <Flex direction="column" gap="1">
          <Text size="1" color="gray" weight="medium" style={{ opacity: disabled ? 0.5 : 1 }}>
            {label}
          </Text>
          {inputField}
        </Flex>
      </label>
    );
  }

  return (
    <label style={{ display: "block", width: "100%" }}>
      <Flex align="center" justify="between" gap="3">
        <Text size="2" color="gray" style={{ opacity: disabled ? 0.5 : 1 }}>
          {label}
        </Text>
        <Flex align="center" gap="2" style={{ flexShrink: 0 }}>
          <Box style={{ width: 200 }}>
            {inputField}
          </Box>
          {suffix && (
            <Text size="1" color="gray" style={{ opacity: disabled ? 0.5 : 0.7, whiteSpace: "nowrap" }}>
              {suffix}
            </Text>
          )}
        </Flex>
      </Flex>
    </label>
  );
}
