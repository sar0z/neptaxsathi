import { Flex, Box, Text } from "@radix-ui/themes";
import { useTranslation } from "../i18n/LanguageContext";

export default function DeveloperInfo() {
  const { t } = useTranslation();
  return (
    <Box
      style={{
        background: "linear-gradient(135deg, var(--gray-2), var(--gray-3))",
        padding: "14px 16px",
        borderRadius: "var(--radius-3)",
        border: "1px solid var(--gray-a4)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtly glowing background accent */}
      <Box
        style={{
          position: "absolute",
          right: "-20px",
          top: "-20px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--indigo-a3) 0%, transparent 70%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      <Flex align="center" gap="3">
        {/* Avatar badge */}
        <Box
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--indigo-8), var(--teal-8))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: 14,
            boxShadow: "0 2px 8px var(--indigo-a4)",
            border: "2px solid var(--color-background)",
          }}
        >
          SJ
        </Box>
        <Box>
          <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
            {t('developedBy')}
          </Text>
          <Text size="2" weight="bold" style={{ color: "var(--gray-12)" }}>
            Saugat Jonchhen
          </Text>
          <a href="mailto:saugat.john09@gmail.com" style={{ textDecoration: "none" }}>
            <Text
              size="1"
              style={{
                color: "var(--indigo-11)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 1,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              saugat.john09@gmail.com
            </Text>
          </a>
        </Box>
      </Flex>
    </Box>
  );
}
